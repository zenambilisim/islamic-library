import { useTranslation } from 'react-i18next';
import { BookOpen, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();

  const quickLinks = [
    { key: 'home', label: t('navigation.home'), href: '#home' },
    { key: 'categories', label: t('navigation.categories'), href: '#categories' },
    { key: 'authors', label: t('navigation.authors'), href: '#authors' },
    { key: 'about', label: t('navigation.about'), href: '#about' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#facebook', label: 'Facebook' },
    { icon: Twitter, href: '#twitter', label: 'Twitter' },
    { icon: Instagram, href: '#instagram', label: 'Instagram' },
    { icon: Youtube, href: '#youtube', label: 'Youtube' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-primary-600 p-2 rounded-lg">
                <BookOpen className="text-white" size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Islamic Library</h3>
                <p className="text-gray-400 text-sm">{t('footer.description')}</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Binlerce İslami kitabı ücretsiz indirin, çevrimiçi okuyun ve bilginizi artırın. 
              Modern teknoloji ile geleneksel bilginin buluştuğu platform.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="bg-gray-800 hover:bg-primary-600 p-2 rounded-lg transition-colors"
                  aria-label={social.label}
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('footer.contact')}</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-300">
                <Mail size={16} />
                <span>info@islamiclibrary.org</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <Phone size={16} />
                <span>+90 212 xxx xx xx</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <MapPin size={16} />
                <span>İstanbul, Türkiye</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Islamic Library. {t('footer.copyright')}
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#privacy" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                Gizlilik Politikası
              </a>
              <a href="#terms" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                Kullanım Şartları
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
