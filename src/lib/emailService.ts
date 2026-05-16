export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * İletişim formunu POST /api/contact üzerinden gönderir (SMTP / nodemailer sunucuda).
 */
export const submitContactForm = async (
  formData: ContactFormData
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = (await res.json().catch(() => null)) as {
      success?: boolean;
      message?: string;
    } | null;

    if (res.ok && data?.success) {
      return {
        success: true,
        message: typeof data.message === 'string' ? data.message : 'Your message has been sent successfully!',
      };
    }

    if (res.status === 503) {
      return {
        success: false,
        message: 'Email service is not configured. Please contact the administrator.',
      };
    }

    return {
      success: false,
      message: 'Failed to send your message. Please try again later.',
    };
  } catch (error) {
    console.error('Contact form request failed:', error);
    return {
      success: false,
      message: 'Failed to send your message. Please try again later.',
    };
  }
};
