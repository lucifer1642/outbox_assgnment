import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../db/logger';

interface EtherealAccount {
  user: string;
  pass: string;
  transporter: nodemailer.Transporter;
}

// Cache transporters per sender to reuse SMTP connections
const transporterCache = new Map<string, EtherealAccount>();

// Default test account (created once at startup)
let defaultAccount: EtherealAccount | null = null;

async function createEtherealAccount(): Promise<EtherealAccount> {
  // If env vars are set, use them
  if (config.ethereal.user && config.ethereal.pass) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: config.ethereal.user,
        pass: config.ethereal.pass,
      },
    });
    return { user: config.ethereal.user, pass: config.ethereal.pass, transporter };
  }

  // Auto-generate an Ethereal test account
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  logger.info('Created Ethereal test account', {
    user: testAccount.user,
    pass: testAccount.pass,
    previewUrl: 'https://ethereal.email',
  });

  return { user: testAccount.user, pass: testAccount.pass, transporter };
}

export async function initDefaultEmailAccount(): Promise<void> {
  defaultAccount = await createEtherealAccount();
}

export async function getTransporterForSender(senderEmail: string): Promise<{
  transporter: nodemailer.Transporter;
  etherealUser: string;
}> {
  if (transporterCache.has(senderEmail)) {
    const cached = transporterCache.get(senderEmail)!;
    return { transporter: cached.transporter, etherealUser: cached.user };
  }

  // Each unique sender gets its own Ethereal account
  const account = await createEtherealAccount();
  transporterCache.set(senderEmail, account);

  return { transporter: account.transporter, etherealUser: account.user };
}

export interface SendEmailOptions {
  from: string;
  fromName: string;
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  messageId: string;
  previewUrl: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { transporter, etherealUser } = await getTransporterForSender(options.from);

  const info = await transporter.sendMail({
    from: `"${options.fromName}" <${options.from}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.html.replace(/<[^>]+>/g, ''), // strip HTML for text version
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || '';

  logger.info('Email sent via Ethereal', {
    messageId: info.messageId,
    to: options.to,
    subject: options.subject,
    etherealUser,
    previewUrl,
  });

  return {
    messageId: info.messageId,
    previewUrl,
  };
}

export function getDefaultEtherealUser(): string {
  return defaultAccount?.user || '';
}
