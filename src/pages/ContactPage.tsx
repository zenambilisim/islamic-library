import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock } from 'lucide-react';

const ContactPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle form submission
    alert(t('contact.successMessage'));
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('contact.pageTitle')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('contact.pageDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <MessageCircle className="text-primary-600 mr-3" size={24} />
              {t('contact.formTitle')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('contact.nameLabel')}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="search-input"
                  placeholder={t('contact.namePlaceholder')}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('contact.emailLabel')}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="search-input"
                  placeholder={t('contact.emailPlaceholder')}
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('contact.subjectLabel')}
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="search-input"
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
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('contact.messageLabel')}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="search-input resize-none"
                  placeholder={t('contact.messagePlaceholder')}
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <Send size={20} />
                <span>{t('contact.sendButton')}</span>
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            {/* Contact Cards */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t('contact.contactInfoTitle')}</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <Mail className="text-primary-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('contact.emailTitle')}</h3>
                    <p className="text-gray-600">info@islamiclibrary.com</p>
                    <p className="text-gray-600">destek@islamiclibrary.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Phone className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('contact.phoneTitle')}</h3>
                    <p className="text-gray-600">+90 (212) 555 0123</p>
                    <p className="text-sm text-gray-500">{t('contact.phoneHours')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <MapPin className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('contact.addressTitle')}</h3>
                    <p className="text-gray-600">
                      {t('contact.address1')}<br />
                      {t('contact.address2')}<br />
                      {t('contact.address3')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="text-blue-600" size={24} />
                <h3 className="text-lg font-semibold text-gray-900">{t('contact.responseTimeTitle')}</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• {t('contact.responseGeneral')}</p>
                <p>• {t('contact.responseTechnical')}</p>
                <p>• {t('contact.responseBooks')}</p>
                <p>• {t('contact.responseCollaboration')}</p>
              </div>
            </div>

            {/* FAQ Link */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {t('contact.faqTitle')}
              </h3>
              <p className="text-gray-600 mb-4">
                {t('contact.faqDescription')}
              </p>
              <button className="text-primary-600 hover:text-primary-700 font-medium">
                {t('contact.faqButton')}
              </button>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('contact.socialMediaTitle')}
              </h3>
              <p className="text-gray-600 mb-4">
                {t('contact.socialMediaDescription')}
              </p>
              <div className="flex space-x-4">
                <button className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Facebook
                </button>
                <button className="bg-blue-400 text-white p-2 rounded-lg hover:bg-blue-500 transition-colors">
                  Twitter
                </button>
                <button className="bg-pink-600 text-white p-2 rounded-lg hover:bg-pink-700 transition-colors">
                  Instagram
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-16 bg-gradient-to-r from-primary-600 to-blue-600 rounded-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">{t('contact.helpTitle')}</h2>
          <p className="mb-6 opacity-90">
            {t('contact.helpDescription')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h4 className="font-semibold mb-2">{t('contact.help1Title')}</h4>
              <p className="text-sm opacity-90">{t('contact.help1Desc')}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h4 className="font-semibold mb-2">{t('contact.help2Title')}</h4>
              <p className="text-sm opacity-90">{t('contact.help2Desc')}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h4 className="font-semibold mb-2">{t('contact.help3Title')}</h4>
              <p className="text-sm opacity-90">{t('contact.help3Desc')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
