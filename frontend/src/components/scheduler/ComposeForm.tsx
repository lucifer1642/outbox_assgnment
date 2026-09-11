'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { composeEmailSchema, ComposeEmailFormData } from '@/lib/validation';
import { useScheduleEmail } from '@/hooks/useScheduleEmail';
import { useToast } from '@/contexts/ToastContext';
import { emailsApi } from '@/lib/api';
import {
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Mail,
  Type,
  AlignLeft,
  Timer,
  Gauge,
  Send,
} from 'lucide-react';

interface ComposeFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ComposeForm({ onClose, onSuccess }: ComposeFormProps) {
  const { showToast } = useToast();
  const scheduleMutation = useScheduleEmail();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recipients, setRecipients] = useState<string[]>([]);
  const [csvSummary, setCsvSummary] = useState<{ total: number; valid: number; invalid: number } | null>(null);
  const [parsingCsv, setParsingCsv] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const defaultStartTime = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ComposeEmailFormData>({
    resolver: zodResolver(composeEmailSchema),
    defaultValues: {
      subject: '',
      body: '',
      senderEmail: 'test@ethereal.email',
      senderName: 'Outbox Sender',
      startTime: defaultStartTime,
      delaySeconds: 2,
      hourlyLimit: 200,
    },
  });

  /* ── File handling ─────────────────────────────────────── */

  const processFile = useCallback(async (file: File) => {
    setParsingCsv(true);
    setCsvError(null);
    setSubmitError(null);
    try {
      const res = await emailsApi.parseCSV(file);
      if (res.emails.length === 0) {
        setCsvError('Couldn\'t find any valid email addresses in this file.');
        setCsvSummary(null);
        setRecipients([]);
      } else {
        setRecipients(res.emails);
        setCsvSummary({
          total: res.count,
          valid: res.emails.length,
          invalid: res.count - res.emails.length,
        });
        showToast('success', `${res.emails.length} valid emails detected`);
      }
    } catch (err: any) {
      setCsvError(err.response?.data?.error || 'Failed to parse CSV file.');
    } finally {
      setParsingCsv(false);
    }
  }, [showToast]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  /* ── Close / Discard ───────────────────────────────────── */

  const handleClose = () => {
    if (isDirty || recipients.length > 0) {
      if (window.confirm('Discard this campaign draft?')) onClose();
    } else {
      onClose();
    }
  };

  /* ── Submit ────────────────────────────────────────────── */

  const onSubmit = (data: ComposeEmailFormData) => {
    setSubmitError(null);
    if (recipients.length === 0) {
      setSubmitError('Please upload a CSV file with at least one recipient email.');
      return;
    }

    scheduleMutation.mutate(
      {
        subject: data.subject,
        body: data.body,
        recipients,
        senderEmail: data.senderEmail,
        senderName: data.senderName,
        startTime: new Date(data.startTime).toISOString(),
        delayBetweenEmailsMs: data.delaySeconds * 1000,
        hourlyLimit: data.hourlyLimit,
      },
      {
        onSuccess: (res) => {
          showToast('success', `Campaign scheduled — ${res.scheduledCount} emails queued`);
          onSuccess();
          onClose();
        },
        onError: (err: any) => {
          setSubmitError(err.response?.data?.error || 'Failed to schedule campaign.');
        },
      }
    );
  };

  const isSubmitting = scheduleMutation.isPending;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: 'var(--panel, #0d0f12)',
          border: '1px solid var(--border, #1c2027)',
          borderRadius: '12px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.04)',
          color: 'var(--text, #e8eaed)',
          fontFamily: 'var(--font-sans)',
        }}
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 sm:p-7 space-y-5"
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div
          style={{
            borderBottom: '1px solid var(--border-soft, #15181d)',
            paddingBottom: '14px',
          }}
          className="flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-2.5">
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: 'var(--text, #e8eaed)',
                  margin: 0,
                }}
              >
                Compose new email
              </h2>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--amber, #ff9d4d)',
                  background: 'var(--amber-dim, rgba(255,157,77,.14))',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  fontWeight: 500,
                }}
              >
                BULLMQ QUEUE
              </span>
            </div>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-dim, #838a94)',
                marginTop: '4px',
                marginBottom: 0,
              }}
            >
              Schedule outbox campaign with sliding-window anti-spam protection.
            </p>
          </div>

          <button
            onClick={handleClose}
            disabled={isSubmitting}
            style={{
              background: 'var(--panel-raised, #111318)',
              border: '1px solid var(--border, #1c2027)',
              color: 'var(--text-dim, #838a94)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            className="hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Submit Error Banner ─────────────────────────── */}
        {submitError && (
          <div
            style={{
              background: 'var(--bad-dim, rgba(242,99,123,.12))',
              border: '1px solid var(--bad, #f2637b)',
              color: 'var(--bad, #f2637b)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={15} className="shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* ── Form ───────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Subject */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-faint, #4a505a)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '6px',
              }}
            >
              <Type size={12} /> Subject
            </label>
            <input
              {...register('subject')}
              disabled={isSubmitting}
              placeholder="e.g. Special Offer for Tech Founders"
              style={{
                width: '100%',
                background: 'var(--panel-raised, #111318)',
                border: '1px solid var(--border, #1c2027)',
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '13px',
                color: 'var(--text, #e8eaed)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              className="focus:border-[#ff9d4d] transition-colors"
            />
            {errors.subject && (
              <p style={{ color: 'var(--bad, #f2637b)', fontSize: '11px', marginTop: '4px' }}>
                {errors.subject.message}
              </p>
            )}
          </div>

          {/* Body */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-faint, #4a505a)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '6px',
              }}
            >
              <AlignLeft size={12} /> Email Body
            </label>
            <textarea
              {...register('body')}
              rows={4}
              disabled={isSubmitting}
              placeholder="Write your email message here…"
              style={{
                width: '100%',
                background: 'var(--panel-raised, #111318)',
                border: '1px solid var(--border, #1c2027)',
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '13px',
                color: 'var(--text, #e8eaed)',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
              className="focus:border-[#ff9d4d] transition-colors"
            />
            {errors.body && (
              <p style={{ color: 'var(--bad, #f2637b)', fontSize: '11px', marginTop: '4px' }}>
                {errors.body.message}
              </p>
            )}
          </div>

          {/* CSV Upload Dropzone */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-faint, #4a505a)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '6px',
              }}
            >
              <FileText size={12} /> Recipients
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt"
              onChange={handleFileUpload}
              disabled={isSubmitting}
              className="hidden"
            />
            <div
              onClick={() => !isSubmitting && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{
                background: isDragging ? 'var(--amber-dim, rgba(255,157,77,.14))' : 'var(--panel-raised, #111318)',
                border: isDragging ? '1px dashed var(--amber, #ff9d4d)' : '1px dashed var(--border, #1c2027)',
                borderRadius: '8px',
                padding: '20px 16px',
                textAlign: 'center',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {parsingCsv ? (
                <div style={{ color: 'var(--amber, #ff9d4d)', fontSize: '12px' }} className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Parsing recipient file…</span>
                </div>
              ) : csvError ? (
                <div style={{ color: 'var(--bad, #f2637b)', fontSize: '12px' }} className="flex items-center justify-center gap-2">
                  <AlertCircle size={15} />
                  <span>{csvError}</span>
                </div>
              ) : recipients.length > 0 ? (
                <div>
                  <div style={{ color: 'var(--good, #34d399)', fontSize: '13px', fontWeight: 600 }} className="flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>{recipients.length} valid emails detected</span>
                  </div>
                  {csvSummary && (
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-faint, #4a505a)', marginTop: '4px', marginBottom: 0 }}>
                      {csvSummary.valid} valid · {csvSummary.invalid} duplicates/invalid skipped
                    </p>
                  )}
                  <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '4px', marginBottom: 0 }}>
                    Click or drop file to replace
                  </p>
                </div>
              ) : (
                <div>
                  <Upload size={20} style={{ color: 'var(--amber, #ff9d4d)', margin: '0 auto 6px' }} />
                  <p style={{ fontSize: '12.5px', color: 'var(--text, #e8eaed)', fontWeight: 500, margin: 0 }}>
                    Drop CSV / TXT file here, or <span style={{ color: 'var(--amber, #ff9d4d)' }}>browse</span>
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-faint, #4a505a)', marginTop: '3px', marginBottom: 0 }}>
                    Accepts single column or comma-separated emails
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sender & Start Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--text-faint, #4a505a)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '6px',
                }}
              >
                <Mail size={12} /> Sender Email
              </label>
              <input
                {...register('senderEmail')}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  background: 'var(--panel-raised, #111318)',
                  border: '1px solid var(--border, #1c2027)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '13px',
                  color: 'var(--text, #e8eaed)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                className="focus:border-[#ff9d4d] transition-colors"
              />
              {errors.senderEmail && (
                <p style={{ color: 'var(--bad, #f2637b)', fontSize: '11px', marginTop: '4px' }}>
                  {errors.senderEmail.message}
                </p>
              )}
            </div>

            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--text-faint, #4a505a)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '6px',
                }}
              >
                <Clock size={12} /> Start Time
              </label>
              <input
                type="datetime-local"
                {...register('startTime')}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  background: 'var(--panel-raised, #111318)',
                  border: '1px solid var(--border, #1c2027)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '13px',
                  color: 'var(--text, #e8eaed)',
                  outline: 'none',
                  boxSizing: 'border-box',
                  colorScheme: 'dark',
                }}
                className="focus:border-[#ff9d4d] transition-colors"
              />
              {errors.startTime && (
                <p style={{ color: 'var(--bad, #f2637b)', fontSize: '11px', marginTop: '4px' }}>
                  {errors.startTime.message}
                </p>
              )}
            </div>
          </div>

          {/* Delay & Hourly Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--text-faint, #4a505a)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '6px',
                }}
              >
                <Timer size={12} /> Delay Between Sends
              </label>
              <div className="relative">
                <input
                  type="number"
                  {...register('delaySeconds', { valueAsNumber: true })}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    background: 'var(--panel-raised, #111318)',
                    border: '1px solid var(--border, #1c2027)',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    paddingRight: '64px',
                    fontSize: '13px',
                    color: 'var(--text, #e8eaed)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'var(--font-mono)',
                  }}
                  className="focus:border-[#ff9d4d] transition-colors"
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--text-faint, #4a505a)',
                  }}
                >
                  seconds
                </span>
              </div>
              {errors.delaySeconds && (
                <p style={{ color: 'var(--bad, #f2637b)', fontSize: '11px', marginTop: '4px' }}>
                  {errors.delaySeconds.message}
                </p>
              )}
            </div>

            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--text-faint, #4a505a)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '6px',
                }}
              >
                <Gauge size={12} /> Safe Hourly Limit
              </label>
              <div className="relative">
                <input
                  type="number"
                  {...register('hourlyLimit', { valueAsNumber: true })}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    background: 'var(--panel-raised, #111318)',
                    border: '1px solid var(--border, #1c2027)',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    paddingRight: '74px',
                    fontSize: '13px',
                    color: 'var(--text, #e8eaed)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'var(--font-mono)',
                  }}
                  className="focus:border-[#ff9d4d] transition-colors"
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--text-faint, #4a505a)',
                  }}
                >
                  emails/hr
                </span>
              </div>
              {errors.hourlyLimit && (
                <p style={{ color: 'var(--bad, #f2637b)', fontSize: '11px', marginTop: '4px' }}>
                  {errors.hourlyLimit.message}
                </p>
              )}
            </div>
          </div>

          {/* ── Footer Actions ─────────────────────────────── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-soft, #15181d)',
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              style={{
                background: 'var(--panel-raised, #111318)',
                border: '1px solid var(--border, #1c2027)',
                color: 'var(--text-dim, #838a94)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                transition: 'all 0.15s ease',
              }}
              className="hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: 'var(--amber, #ff9d4d)',
                border: 'none',
                color: '#14100a',
                borderRadius: '8px',
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                transition: 'all 0.15s ease',
              }}
              className="hover:brightness-105"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Scheduling…</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>Schedule Campaign</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
