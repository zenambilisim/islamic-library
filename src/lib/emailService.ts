import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';

// Initialize EmailJS
if (EMAILJS_PUBLIC_KEY) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Send contact form email using EmailJS
 */
export const submitContactForm = async (formData: ContactFormData): Promise<{ success: boolean; message: string }> => {
  // Validate environment variables
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    console.error('EmailJS configuration is missing. Please check your .env file.');
    return {
      success: false,
      message: 'Email service is not configured. Please contact the administrator.'
    };
  }

  try {
    console.log('📧 Sending contact form email...', { name: formData.name, subject: formData.subject });
    
    // Prepare template parameters
    const templateParams = {
      from_name: formData.name,
      from_email: formData.email,
      subject: formData.subject,
      message: formData.message,
      to_name: 'Islamic Library Team',
      reply_to: formData.email,
    };

    // Send email
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    if (response.status === 200) {
      console.log('✅ Email sent successfully!');
      return {
        success: true,
        message: 'Your message has been sent successfully!'
      };
    } else {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return {
      success: false,
      message: 'Failed to send your message. Please try again later.'
    };
  }
};

/**
 * Check if EmailJS is configured
 */
export const isEmailJSConfigured = (): boolean => {
  return !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);
};
