import { NextRequest, NextResponse } from 'next/server';
import { isContactEmailConfigured, sendContactEmail } from '@/lib/contact-email-server';

const MAX_LEN = { name: 200, email: 320, subject: 200, message: 8000 };

function simpleEmailOk(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/**
 * POST /api/contact
 * Body: { name, email, subject, message } — SMTP (nodemailer) ile sunucuda gönderilir.
 */
export async function POST(request: NextRequest) {
  if (!isContactEmailConfigured()) {
    return NextResponse.json(
      { success: false, message: 'Email service is not configured.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const subject = typeof body?.subject === 'string' ? body.subject.trim() : '';
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'All fields are required.' },
        { status: 400 }
      );
    }
    if (!simpleEmailOk(email)) {
      return NextResponse.json({ success: false, message: 'Invalid email.' }, { status: 400 });
    }
    if (
      name.length > MAX_LEN.name ||
      email.length > MAX_LEN.email ||
      subject.length > MAX_LEN.subject ||
      message.length > MAX_LEN.message
    ) {
      return NextResponse.json({ success: false, message: 'Input too long.' }, { status: 400 });
    }

    const result = await sendContactEmail({ name, email, subject, message });
    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to send your message. Please try again later.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, message: 'Your message has been sent successfully!' });
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request.' }, { status: 400 });
  }
}
