import { z } from 'zod';

export const composeEmailSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  body: z.string().min(1, 'Email body is required'),
  senderEmail: z.string().email('Valid sender email required'),
  senderName: z.string().optional(),
  startTime: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date.getTime() >= Date.now() - 60000;
  }, 'Start time must be in the present or future'),
  delaySeconds: z.number().min(0, 'Delay cannot be negative'),
  hourlyLimit: z.number().min(1, 'Hourly limit must be at least 1'),
});

export type ComposeEmailFormData = z.infer<typeof composeEmailSchema>;
