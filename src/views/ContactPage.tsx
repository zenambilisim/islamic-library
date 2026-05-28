'use client';

import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  MessageCircle,
  Send,
} from 'lucide-react';
import ContactHero from '@/components/contact/ContactHero';
import { submitContactForm } from '../lib/emailService';

const CONTACT_EMAIL = 'islamic.library@yahoo.com';

const inputClassName =
  'w-full rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent';

const textareaClassName =
  'w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent';

const ContactPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const result = await submitContactForm(formData);

      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: t('contact.successMessage'),
        });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setSubmitStatus({
          type: 'error',
          message: t('contact.errorMessage'),
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus({
        type: 'error',
        message: t('contact.errorMessage'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    document.getElementById('contact-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="content-layout">
        <ContactHero onBrowse={scrollToForm} />

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[minmax(0,1fr)_320px]">
          <section
            id="contact-form"
            className="rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-6 shadow-soft md:p-7"
          >
            <div className="mb-6 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                <MessageCircle size={18} strokeWidth={1.75} aria-hidden />
              </span>
              <h2 className="font-display text-[22px] font-medium tracking-tight text-ink">
                {t('contact.formTitle')}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {submitStatus.type && (
                <div
                  className={`flex items-start gap-3 rounded-[var(--radius-md)] border p-4 ${
                    submitStatus.type === 'success'
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  {submitStatus.type === 'success' ? (
                    <CheckCircle className="shrink-0 text-green-600" size={20} />
                  ) : (
                    <AlertCircle className="shrink-0 text-red-600" size={20} />
                  )}
                  <p
                    className={`text-sm ${
                      submitStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {submitStatus.message}
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="name" className="mb-2 block text-[12.5px] font-medium text-ink-muted">
                  {t('contact.nameLabel')}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className={inputClassName}
                  placeholder={t('contact.namePlaceholder')}
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-[12.5px] font-medium text-ink-muted">
                  {t('contact.emailLabel')}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={inputClassName}
                  placeholder={t('contact.emailPlaceholder')}
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-[12.5px] font-medium text-ink-muted"
                >
                  {t('contact.subjectLabel')}
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className={inputClassName}
                >
                  <option value="">{t('contact.subjectPlaceholder')}</option>
                  <option value="book-request">{t('contact.subjectBookRequest')}</option>
                  <option value="bug-report">{t('contact.subjectBugReport')}</option>
                  <option value="feature-request">{t('contact.subjectFeatureRequest')}</option>
                  <option value="general-inquiry">{t('contact.subjectGeneralInquiry')}</option>
                  <option value="collaboration">{t('contact.subjectCollaboration')}</option>
                  <option value="technical-support">{t('contact.subjectTechnicalSupport')}</option>
                  <option value="other">{t('contact.subjectOther')}</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-[12.5px] font-medium text-ink-muted"
                >
                  {t('contact.messageLabel')}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className={textareaClassName}
                  placeholder={t('contact.messagePlaceholder')}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-cream transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-6`}
              >
                <Send size={18} strokeWidth={2} />
                <span>
                  {isSubmitting ? t('contact.sendingButton') : t('contact.sendButton')}
                </span>
              </button>
            </form>
          </section>

          <aside className="space-y-[18px]">
            <div className="rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-5 shadow-soft">
              <h3 className="font-display mb-4 text-lg font-medium tracking-tight text-ink">
                {t('contact.contactInfoTitle')}
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <Mail size={16} strokeWidth={1.75} aria-hidden />
                  </span>
                  <div>
                    <p className="text-[12px] font-medium uppercase tracking-wide text-ink-muted">
                      {t('contact.emailTitle')}
                    </p>
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="text-sm text-ink transition-colors hover:text-accent"
                    >
                      {CONTACT_EMAIL}
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-5 shadow-soft">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Clock size={16} strokeWidth={1.75} aria-hidden />
                </span>
                <h3 className="font-display text-lg font-medium tracking-tight text-ink">
                  {t('contact.responseTimeTitle')}
                </h3>
              </div>
              <ul className="space-y-2 text-[13px] text-ink-muted">
                <li>{t('contact.responseGeneral')}</li>
                <li>{t('contact.responseTechnical')}</li>
                <li>{t('contact.responseBooks')}</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
