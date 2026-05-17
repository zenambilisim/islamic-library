export type ContactEmailPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMessageHtml(message: string): string {
  return escapeHtml(message).replace(/\r?\n/g, '<br />');
}

export function buildContactEmailSubject(payload: ContactEmailPayload): string {
  return `[İletişim] ${payload.subject}`;
}

export function buildContactEmailText(
  payload: ContactEmailPayload,
  options?: { yahooHint?: boolean }
): string {
  return [
    'Islamic Library — İletişim Formu',
    '',
    `Ad: ${payload.name}`,
    `E-posta: ${payload.email}`,
    `Konu: ${payload.subject}`,
    '',
    'Mesaj:',
    payload.message,
    '',
    '---',
    options?.yahooHint ? 'Yanıtlamak için yukarıdaki e-posta adresini kullanın.' : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildContactEmailHtml(payload: ContactEmailPayload): string {
  const name = escapeHtml(payload.name);
  const email = escapeHtml(payload.email);
  const subject = escapeHtml(payload.subject);
  const message = formatMessageHtml(payload.message);
  const sentAt = new Date().toLocaleString('tr-TR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>İletişim Formu</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#818ff0 0%,#9333ea 100%);padding:28px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.85);">
                Islamic Library
              </p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
                Yeni iletişim mesajı
              </h1>
            </td>
          </tr>
          <!-- Meta -->
          <tr>
            <td style="padding:28px 32px 8px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:12px 16px;background-color:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Ad</p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${name}</p>
                  </td>
                </tr>
                <tr><td style="height:10px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background-color:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">E-posta</p>
                    <p style="margin:0;font-size:15px;color:#4f46e5;">
                      <a href="mailto:${email}" style="color:#4f46e5;text-decoration:none;font-weight:500;">${email}</a>
                    </p>
                  </td>
                </tr>
                <tr><td style="height:10px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background-color:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Konu</p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${subject}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Message -->
          <tr>
            <td style="padding:16px 32px 28px;">
              <p style="margin:0 0 10px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Mesaj</p>
              <div style="padding:18px 20px;background-color:#faf5ff;border-left:4px solid #9333ea;border-radius:0 10px 10px 0;font-size:15px;line-height:1.65;color:#374151;">
                ${message}
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:18px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">
                Bu e-posta <strong style="color:#374151;">islamiclibrary</strong> iletişim formundan gönderildi.
              </p>
              <p style="margin:0;font-size:11px;color:#9ca3af;">${escapeHtml(sentAt)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
