'use client';

import React, { useState, useRef, useCallback } from 'react';
import { emailsApi } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { Button } from './ui/Button';
import { Input, Textarea } from './ui/Input';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string;
  startTime: string;
  delayBetweenEmailsMs: string;
  hourlyLimit: string;
}

export function ComposeModal({ isOpen, onClose, onSuccess }: ComposeModalProps) {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedEmails, setParsedEmails] = useState<string[]>([]);
  const [parsingFile, setParsingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    subject: '',
    body: '',
    senderEmail: '',
    senderName: '',
    startTime: new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16),
    delayBetweenEmailsMs: '2000',
    hourlyLimit: '200',
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const updateField = useCallback((key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingFile(true);
    try {
      const result = await emailsApi.parseCSV(file);
      setParsedEmails(result.emails);
      addToast('success', `Parsed ${result.count} email address${result.count !== 1 ? 'es' : ''}`);
    } catch (err: any) {
      addToast('error', `Failed to parse file: ${err.response?.data?.error || err.message}`);
    } finally {
      setParsingFile(false);
    }
  }, [addToast]);

  const validate = (): boolean => {
    const newErrors: Partial<FormState> = {};
    if (!form.subject.trim()) newErrors.subject = 'Subject is required';
    if (!form.body.trim()) newErrors.body = 'Body is required';
    if (!form.senderEmail.trim()) newErrors.senderEmail = 'Sender email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.senderEmail)) newErrors.senderEmail = 'Invalid email address';
    if (!form.startTime) newErrors.startTime = 'Start time is required';
    if (parsedEmails.length === 0) {
      addToast('error', 'Please upload a CSV file with at least one email address');
      return false;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await emailsApi.schedule({
        recipients: parsedEmails,
        subject: form.subject,
        body: form.body,
        senderEmail: form.senderEmail,
        senderName: form.senderName || form.senderEmail,
        startTime: new Date(form.startTime).toISOString(),
        delayBetweenEmailsMs: parseInt(form.delayBetweenEmailsMs) || 2000,
        hourlyLimit: parseInt(form.hourlyLimit) || 200,
      });

      addToast('success', result.message || `${result.scheduledCount} emails scheduled!`);
      onSuccess();
      handleClose();
    } catch (err: any) {
      addToast('error', err.response?.data?.error || 'Failed to schedule emails');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setParsedEmails([]);
    setForm({
      subject: '',
      body: '',
      senderEmail: '',
      senderName: '',
      startTime: new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16),
      delayBetweenEmailsMs: '2000',
      hourlyLimit: '200',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0f0f1a] border border-white/10 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0f0f1a] border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Compose Email Campaign</h2>
            <p className="text-xs text-white/40 mt-0.5">Schedule bulk emails with BullMQ</p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-all"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Email Content */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Email Content</h3>

            <Input
              label="Subject"
              placeholder="Your email subject..."
              value={form.subject}
              onChange={(e) => updateField('subject', e.target.value)}
              error={errors.subject}
              id="compose-subject"
            />

            <Textarea
              label="Body (HTML or plain text)"
              placeholder="<p>Hello {{name}},</p><p>Your email body here...</p>"
              rows={6}
              value={form.body}
              onChange={(e) => updateField('body', e.target.value)}
              error={errors.body}
              id="compose-body"
            />
          </div>

          {/* Sender */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Sender</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Sender Email"
                type="email"
                placeholder="sender@example.com"
                value={form.senderEmail}
                onChange={(e) => updateField('senderEmail', e.target.value)}
                error={errors.senderEmail}
                id="compose-sender-email"
              />
              <Input
                label="Sender Name (optional)"
                placeholder="Company Name"
                value={form.senderName}
                onChange={(e) => updateField('senderName', e.target.value)}
                id="compose-sender-name"
              />
            </div>
          </div>

          {/* Recipients CSV */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Recipients</h3>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-white/10 hover:border-violet-500/40 rounded-xl p-6 text-center cursor-pointer transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              {parsingFile ? (
                <div className="flex flex-col items-center gap-2 text-white/50">
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm">Parsing file...</span>
                </div>
              ) : parsedEmails.length > 0 ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl mb-1">✓</div>
                  <p className="text-sm font-semibold text-emerald-400">{parsedEmails.length} emails detected</p>
                  <p className="text-xs text-white/40">Click to replace file</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-white/40 group-hover:text-white/60 transition-colors">
                  <span className="text-3xl">📎</span>
                  <p className="text-sm font-medium">Upload CSV or TXT file</p>
                  <p className="text-xs">Supports any format with email addresses</p>
                </div>
              )}
            </div>

            {parsedEmails.length > 0 && (
              <div className="bg-white/3 rounded-xl p-3 max-h-24 overflow-y-auto">
                <div className="flex flex-wrap gap-1">
                  {parsedEmails.slice(0, 10).map((email) => (
                    <span key={email} className="text-xs bg-violet-500/15 text-violet-300 px-2 py-0.5 rounded-full">
                      {email}
                    </span>
                  ))}
                  {parsedEmails.length > 10 && (
                    <span className="text-xs text-white/30 px-2 py-0.5">
                      +{parsedEmails.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Scheduling */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Scheduling</h3>

            <Input
              label="Start Time"
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => updateField('startTime', e.target.value)}
              error={errors.startTime}
              id="compose-start-time"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Delay Between Emails (ms)"
                type="number"
                min="1000"
                step="500"
                value={form.delayBetweenEmailsMs}
                onChange={(e) => updateField('delayBetweenEmailsMs', e.target.value)}
                hint="Minimum 1000ms (1 second)"
                id="compose-delay"
              />
              <Input
                label="Hourly Limit (per sender)"
                type="number"
                min="1"
                max="1000"
                value={form.hourlyLimit}
                onChange={(e) => updateField('hourlyLimit', e.target.value)}
                hint="Max emails sent per hour"
                id="compose-hourly-limit"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="text-xs text-white/30">
              {parsedEmails.length > 0
                ? `~${Math.ceil((parsedEmails.length * parseInt(form.delayBetweenEmailsMs || '2000')) / 60000)} minutes to complete`
                : 'Upload a file to estimate duration'}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" type="button" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting} disabled={parsedEmails.length === 0}>
                Schedule {parsedEmails.length > 0 ? `${parsedEmails.length} Emails` : 'Emails'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
