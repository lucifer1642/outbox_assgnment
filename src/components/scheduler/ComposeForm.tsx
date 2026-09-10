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
      if (window.confirm('Discard this draft?')) onClose();
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
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="glass-flagship w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 rounded-[28px]"
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Compose New Email</h2>
            <p className="text-xs text-white/40 mt-0.5">Schedule outbox campaign with BullMQ rate protection</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-xl btn-ghost flex items-center justify-center transition-all disabled:opacity-30"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Submit Error Banner ─────────────────────────── */}
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 p-3.5 rounded-xl text-xs"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: 'var(--coral)' }}
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{submitError}</span>
          </motion.div>
        )}

        {/* ── Form ───────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Subject */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-white/50 mb-1.5 uppercase font-mono tracking-wider">
              <Type size={12} /> Subject
            </label>
            <input
              {...register('subject')}
              disabled={isSubmitting}
              placeholder="e.g. Special Offer for Tech Founders"
              className="w-full glass rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus-ring transition-all disabled:opacity-40"
            />
            {errors.subject && <p className="text-xs mt-1" style={{ color: 'var(--coral)' }}>{errors.subject.message}</p>}
          </div>

          {/* Body */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-white/50 mb-1.5 uppercase font-mono tracking-wider">
              <AlignLeft size={12} /> Email Body
            </label>
            <textarea
              {...register('body')}
              rows={4}
              disabled={isSubmitting}
              placeholder="Write your email message here…"
              className="w-full glass rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus-ring transition-all disabled:opacity-40 resize-none"
            />
            {errors.body && <p className="text-xs mt-1" style={{ color: 'var(--coral)' }}>{errors.body.message}</p>}
          </div>

          {/* CSV Upload Dropzone */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-white/50 mb-1.5 uppercase font-mono tracking-wider">
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
              className={`
                relative rounded-xl p-5 text-center cursor-pointer
                border-2 border-dashed transition-all duration-200
                ${isSubmitting
                  ? 'opacity-40 cursor-not-allowed border-white/[0.04]'
                  : isDragging
                    ? 'border-violet-400/50 bg-violet-500/[0.05]'
                    : 'border-white/[0.1] hover:border-violet-400/40 glass'
                }
              `}
            >
              {parsingCsv ? (
                <div className="flex items-center justify-center gap-2.5 py-1 text-xs font-medium" style={{ color: 'var(--violet)' }}>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Parsing recipient file…</span>
                </div>
              ) : csvError ? (
                <div className="flex items-center justify-center gap-2 py-1 text-xs" style={{ color: 'var(--coral)' }}>
                  <AlertCircle size={15} />
                  <span>{csvError}</span>
                </div>
              ) : recipients.length > 0 ? (
                <div className="py-0.5">
                  <div className="flex items-center justify-center gap-2 font-semibold text-xs" style={{ color: 'var(--mint)' }}>
                    <CheckCircle2 size={15} />
                    {recipients.length} valid emails detected
                  </div>
                  {csvSummary && (
                    <p className="text-[11px] text-white/40 mt-1 font-mono">
                      {csvSummary.valid} valid · {csvSummary.invalid} duplicates/invalid skipped
                    </p>
                  )}
                  <p className="text-[10px] text-white/20 mt-1.5">Click or drop file to replace</p>
                </div>
              ) : (
                <div className="py-1">
                  <Upload size={20} className="mx-auto text-white/30 mb-1.5" />
                  <p className="text-xs font-medium text-white/70">
                    Drop CSV / TXT file here, or <span style={{ color: 'var(--violet)' }}>browse</span>
                  </p>
                  <p className="text-[11px] text-white/30 mt-0.5">Accepts single column or comma-separated emails</p>
                </div>
              )}
            </div>
          </div>

          {/* Sender & Start Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-white/50 mb-1.5 uppercase font-mono tracking-wider">
                <Mail size={12} /> Sender Email
              </label>
              <input
                {...register('senderEmail')}
                disabled={isSubmitting}
                className="w-full glass rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus-ring transition-all disabled:opacity-40"
              />
              {errors.senderEmail && <p className="text-xs mt-1" style={{ color: 'var(--coral)' }}>{errors.senderEmail.message}</p>}
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-white/50 mb-1.5 uppercase font-mono tracking-wider">
                <Clock size={12} /> Start Time
              </label>
              <input
                type="datetime-local"
                {...register('startTime')}
                disabled={isSubmitting}
                className="w-full glass rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus-ring transition-all disabled:opacity-40 [color-scheme:dark]"
              />
              {errors.startTime && <p className="text-xs mt-1" style={{ color: 'var(--coral)' }}>{errors.startTime.message}</p>}
            </div>
          </div>

          {/* Delay & Hourly Limit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-white/50 mb-1.5 uppercase font-mono tracking-wider">
                <Timer size={12} /> Delay Between Emails
              </label>
              <div className="relative">
                <input
                  type="number"
                  {...register('delaySeconds', { valueAsNumber: true })}
                  disabled={isSubmitting}
                  className="w-full glass rounded-xl px-4 py-2.5 pr-16 text-sm text-white focus:outline-none focus-ring transition-all disabled:opacity-40"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-white/30 font-mono">seconds</span>
              </div>
              {errors.delaySeconds && <p className="text-xs mt-1" style={{ color: 'var(--coral)' }}>{errors.delaySeconds.message}</p>}
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-white/50 mb-1.5 uppercase font-mono tracking-wider">
                <Gauge size={12} /> Hourly Limit
              </label>
              <div className="relative">
                <input
                  type="number"
                  {...register('hourlyLimit', { valueAsNumber: true })}
                  disabled={isSubmitting}
                  className="w-full glass rounded-xl px-4 py-2.5 pr-20 text-sm text-white focus:outline-none focus-ring transition-all disabled:opacity-40"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-white/30 font-mono">emails/hr</span>
              </div>
              {errors.hourlyLimit && <p className="text-xs mt-1" style={{ color: 'var(--coral)' }}>{errors.hourlyLimit.message}</p>}
            </div>
          </div>

          {/* ── Footer Actions ─────────────────────────────── */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="btn btn-ghost"
              style={{ padding: '8px 18px', fontSize: '13px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ padding: '8px 20px', fontSize: '13px' }}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Scheduling…
                </>
              ) : (
                'Schedule Campaign'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
