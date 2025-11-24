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
    alert('Mesajınız gönderildi! En kısa sürede size dönüş yapacağız.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('navigation.contact')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sorularınız, önerileriniz veya katkılarınız için bizimle iletişime geçin. 
            Size yardımcı olmaktan memnuniyet duyarız.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <MessageCircle className="text-primary-600 mr-3" size={24} />
              Bize Mesaj Gönderin
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Adınız Soyadınız *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="search-input"
                  placeholder="Adınızı ve soyadınızı girin"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta Adresiniz *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="search-input"
                  placeholder="ornek@email.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Konu *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="search-input"
                >
                  <option value="">Konu seçin</option>
                  <option value="book-request">Kitap Talebi</option>
                  <option value="bug-report">Hata Bildirimi</option>
                  <option value="feature-request">Özellik Önerisi</option>
                  <option value="general-inquiry">Genel Soru</option>
                  <option value="collaboration">İş Birliği</option>
                  <option value="technical-support">Teknik Destek</option>
                  <option value="other">Diğer</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Mesajınız *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="search-input resize-none"
                  placeholder="Mesajınızı detaylı bir şekilde yazın..."
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <Send size={20} />
                <span>Mesajı Gönder</span>
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            {/* Contact Cards */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">İletişim Bilgileri</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <Mail className="text-primary-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">E-posta</h3>
                    <p className="text-gray-600">info@islamiclibrary.com</p>
                    <p className="text-gray-600">destek@islamiclibrary.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Phone className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Telefon</h3>
                    <p className="text-gray-600">+90 (212) 555 0123</p>
                    <p className="text-sm text-gray-500">Hafta içi 09:00 - 18:00</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <MapPin className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Adres</h3>
                    <p className="text-gray-600">
                      Fatih Mahallesi<br />
                      İslam Sokak No: 123<br />
                      34000 İstanbul, Türkiye
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="text-blue-600" size={24} />
                <h3 className="text-lg font-semibold text-gray-900">Yanıt Süremiz</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Genel sorular: 24 saat içinde</p>
                <p>• Teknik destek: 48 saat içinde</p>
                <p>• Kitap talepleri: 1 hafta içinde</p>
                <p>• İş birliği önerileri: 3-5 iş günü içinde</p>
              </div>
            </div>

            {/* FAQ Link */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Sık Sorulan Sorular
              </h3>
              <p className="text-gray-600 mb-4">
                Merak ettiklerinizin cevapları SSS bölümünde bulunabilir.
              </p>
              <button className="text-primary-600 hover:text-primary-700 font-medium">
                SSS'yi İnceleyin →
              </button>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sosyal Medya
              </h3>
              <p className="text-gray-600 mb-4">
                Güncellemeler ve duyurular için bizi takip edin:
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
          <h2 className="text-2xl font-bold mb-4">Nasıl Yardımcı Olabiliriz?</h2>
          <p className="mb-6 opacity-90">
            Islamic Library topluluğunun bir parçası olarak size en iyi hizmeti vermek için buradayız.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Kitap Önerisi</h4>
              <p className="text-sm opacity-90">Kütüphanemize eklemek istediğiniz kitapları önerebilirsiniz.</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Geri Bildirim</h4>
              <p className="text-sm opacity-90">Platformu iyileştirmek için önerilerinizi paylaşın.</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h4 className="font-semibild mb-2">Katkı Sağlayın</h4>
              <p className="text-sm opacity-90">Çeviri, düzenleme ve geliştirme konularında destek olun.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
