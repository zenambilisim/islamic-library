import nodemailer from 'nodemailer';

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
  // Yahoo/Gmail vb. için kullanıcı adı varsa şifre de olmalı; auth’suz relay isteyenler SMTP_USER’ı boş bırakır.
  if (user && !pass) return false;
  if (pass && !user) return false;
  return true;
}

export type ContactEmailPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

/**
 * SMTP ile iletişim formu e-postası (yalnızca API route / sunucu).
 * SMTP_HOST, MAIL_FROM, CONTACT_MAIL_TO zorunlu; SMTP_PORT (varsayılan 587), SMTP_USER, SMTP_PASS, SMTP_SECURE isteğe bağlı.
 * SMTP_USER doluysa SMTP_PASS de gerekir (yapılandırılmış sayılması için). Yahoo vb. için MAIL_FROM ile SMTP_USER aynı hesap olmalı; 465 için SMTP_SECURE=true önerilir (port 465 ise secure yine açılır).
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
  const port = portRaw ? Number.parseInt(portRaw, 10) : 587;
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    return { ok: false, reason: 'not_configured' };
  }

  const secure = envTrim('SMTP_SECURE') === 'true' || port === 465;
  const user = envTrim('SMTP_USER');
  const pass = envTrim('SMTP_PASS');

  if (user && from && user.toLowerCase() !== from.toLowerCase()) {
    console.warn(
      'SMTP_USER ve MAIL_FROM farklı; Yahoo gibi sağlayıcılarda genelde aynı hesap adresi olmalı.'
    );
  }

  try {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure,
      ...(user ? { auth: { user, pass: pass || '' } } : {}),
    });

    await transport.verify();
    console.log('SMTP verified');

    const subjectLine = `[Contact] ${payload.subject}`;
    const text = [
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      `Subject: ${payload.subject}`,
      '',
      payload.message,
    ].join('\n');

    const fromHeader = `"Website Contact" <${from}>`;

    await transport.sendMail({
      from: fromHeader,
      sender: from,
      envelope: {
        from,
        to: [to],
      },
      to,
      replyTo: payload.email,
      subject: subjectLine,
      text,
    });
    return { ok: true };
  } catch (err) {
    console.error('Contact mail send failed:', err);
    return { ok: false, reason: 'send_failed' };
  }
}
