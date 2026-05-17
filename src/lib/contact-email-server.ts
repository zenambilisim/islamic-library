import nodemailer from 'nodemailer';
import {
  buildContactEmailHtml,
  buildContactEmailSubject,
  buildContactEmailText,
  type ContactEmailPayload,
} from './contact-email-template';

export type { ContactEmailPayload };

type SmtpTransportOptions = {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
  name?: string;
  tls?: { minVersion: 'TLSv1.2' };
};

function envTrim(name: string): string {
  const v = process.env[name];
  return typeof v === 'string' ? v.trim() : '';
}

export function isContactEmailConfigured(): boolean {
  const host = envTrim('SMTP_HOST');
  const from = envTrim('MAIL_FROM');
  const to = envTrim('CONTACT_MAIL_TO');
  const user = envTrim('SMTP_USER');
  const pass = envTrim('SMTP_PASS');
  if (!host || !from || !to) return false;
  if (user && !pass) return false;
  if (pass && !user) return false;
  return true;
}

function isYahooSmtp(host: string): boolean {
  return /yahoo/i.test(host);
}

function buildTransport(port: number, secure: boolean): SmtpTransportOptions {
  const host = envTrim('SMTP_HOST');
  const user = envTrim('SMTP_USER');
  const pass = envTrim('SMTP_PASS');

  const base: SmtpTransportOptions = {
    host,
    port,
    secure,
    ...(user ? { auth: { user, pass } } : {}),
    tls: { minVersion: 'TLSv1.2' },
  };

  if (isYahooSmtp(host)) {
    return { ...base, name: 'yahoo' };
  }
  return base;
}

async function trySend(
  transport: nodemailer.Transporter,
  mail: nodemailer.SendMailOptions
): Promise<void> {
  await transport.sendMail(mail);
}

/**
 * SMTP ile iletişim formu e-postası (yalnızca API route / sunucu).
 * Yahoo: Reply-To başka domain’e (Gmail vb.) işaret edince 550 verebilir — yanıt adresi metin gövdesinde.
 */
export async function sendContactEmail(
  payload: ContactEmailPayload
): Promise<{ ok: true } | { ok: false; reason: 'not_configured' | 'send_failed' }> {
  const host = envTrim('SMTP_HOST');
  const from = envTrim('MAIL_FROM');
  const to = envTrim('CONTACT_MAIL_TO');
  if (!host || !from || !to) {
    return { ok: false, reason: 'not_configured' };
  }

  const portRaw = envTrim('SMTP_PORT');
  const preferredPort = portRaw ? Number.parseInt(portRaw, 10) : 587;
  if (!Number.isFinite(preferredPort) || preferredPort < 1 || preferredPort > 65535) {
    return { ok: false, reason: 'not_configured' };
  }

  const yahoo = isYahooSmtp(host);
  const allowReplyTo = envTrim('SMTP_ALLOW_REPLY_TO') === 'true' && !yahoo;

  const mail: nodemailer.SendMailOptions = {
    from,
    to,
    subject: buildContactEmailSubject(payload),
    text: buildContactEmailText(payload, { yahooHint: yahoo }),
    html: buildContactEmailHtml(payload),
    ...(allowReplyTo && payload.email
      ? {
          replyTo: `"${payload.name.replace(/"/g, '')}" <${payload.email}>`,
        }
      : {}),
  };

  const attempts: { port: number; secure: boolean }[] = [
    { port: preferredPort, secure: preferredPort === 465 },
    ...(preferredPort !== 587 ? [{ port: 587, secure: false }] : []),
    ...(preferredPort !== 465 ? [{ port: 465, secure: true }] : []),
  ];

  let lastErr: unknown;
  for (const { port, secure } of attempts) {
    const transport = nodemailer.createTransport(buildTransport(port, secure));
    try {
      await trySend(transport, mail);
      transport.close();
      return { ok: true };
    } catch (err) {
      lastErr = err;
      transport.close();
      if (process.env.NODE_ENV === 'development') {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`SMTP send failed (port ${port}):`, msg);
      }
    }
  }

  console.error('Contact mail send failed:', lastErr);
  return { ok: false, reason: 'send_failed' };
}
