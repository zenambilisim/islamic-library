import { useTranslation } from 'react-i18next';
import { Book, Download, Eye, Search, Smartphone, HelpCircle, ExternalLink } from 'lucide-react';

const UsefulInfoPage = () => {
  const { t } = useTranslation();

  const guides = [
    {
      id: 1,
      title: "Kitap Nasıl İndirilir?",
      icon: <Download className="text-blue-600" size={24} />,
      description: "Platform üzerinden kitapları indirme adımları",
      content: [
        "1. İstediğiniz kitabın üzerine tıklayın",
        "2. Kitap detay sayfasında format seçin (PDF, EPUB, DOC)",
        "3. İndirme butonuna tıklayın",
        "4. Dosya otomatik olarak indirilecektir"
      ]
    },
    {
      id: 2,
      title: "Online Okuma Rehberi",
      icon: <Eye className="text-green-600" size={24} />,
      description: "Kitapları çevrimiçi okuma özelliğini kullanma",
      content: [
        "1. Kitap kartında 'Çevrimiçi Oku' butonuna tıklayın",
        "2. Okuma arayüzü açılacaktır",
        "3. Sayfa numarası ile istediğiniz sayfaya atlayabilirsiniz",
        "4. Zoom özelliği ile yazı boyutunu ayarlayabilirsiniz"
      ]
    },
    {
      id: 3,
      title: "Gelişmiş Arama Teknikleri",
      icon: <Search className="text-purple-600" size={24} />,
      description: "Aradığınız kitapları daha hızlı bulma yöntemleri",
      content: [
        "• Yazar adı ile arama yapabilirsiniz",
        "• Kitap başlığının bir kısmını yazarak arama yapın",
        "• Kategori filtrelerini kullanın",
        "• Etiketler ile arama yapabilirsiniz"
      ]
    },
    {
      id: 4,
      title: "Mobil Kullanım İpuçları",
      icon: <Smartphone className="text-orange-600" size={24} />,
      description: "Mobil cihazlarınızda daha iyi deneyim için öneriler",
      content: [
        "• Dikey modda kullanım önerilir",
        "• Ana ekrana kısayol ekleyebilirsiniz",
        "• Offline okuma için kitapları indirin",
        "• Touch hareketleri ile sayfa çevirebilirsiniz"
      ]
    }
  ];

  const faqs = [
    {
      question: "Kitaplar ücretsiz mi?",
      answer: "Evet, platformumuzdaki tüm kitaplar tamamen ücretsizdir. Hiçbir ücret talep etmiyoruz."
    },
    {
      question: "Hangi formatlarda kitap indirme mevcut?",
      answer: "PDF, EPUB ve DOC formatlarında kitap indirebilirsiniz. Her kitap için mevcut formatlar kitap detay sayfasında belirtilmiştir."
    },
    {
      question: "Yeni kitap taleplerini nasıl iletebilirim?",
      answer: "İletişim sayfası üzerinden 'Kitap Talebi' konusu ile bizimle iletişime geçebilirsiniz. Talebinizi değerlendirip en kısa sürede dönüş yapacağız."
    },
    {
      question: "Kitapları çevrimdışı okuyabilir miyim?",
      answer: "Evet, kitapları indirdikten sonra internet bağlantısı olmadan okuyabilirsiniz. Online okuma özelliği ise internet bağlantısı gerektirir."
    },
    {
      question: "Dil desteği nasıl çalışır?",
      answer: "Platform arayüzü Türkçe, İngilizce, Rusça ve Azerbaycan Türkçesi dillerini desteklemektedir. Sağ üstteki dil menüsünden değiştirebilirsiniz."
    }
  ];

  const fileFormats = [
    {
      format: "PDF",
      description: "Portable Document Format",
      advantages: ["Evrensel uyumluluk", "Orijinal düzen koruması", "Yazdırmaya uygun"],
      recommended: "Bilgisayar ve tablet kullanımı için önerilir"
    },
    {
      format: "EPUB",
      description: "Electronic Publication",
      advantages: ["Responsive düzen", "Yazı boyutu ayarlanabilir", "E-reader uyumluluğu"],
      recommended: "E-kitap okuyucuları ve mobil cihazlar için ideal"
    },
    {
      format: "DOC",
      description: "Microsoft Word Document",
      advantages: ["Düzenlenebilir", "Not alabilme", "Kelime arama"],
      recommended: "Araştırma ve not alma için uygun"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('navigation.usefulInfo')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Islamic Library platformunu daha verimli kullanmanız için hazırladığımız 
            rehberler, ipuçları ve sık sorulan soruların cevapları.
          </p>
        </div>

        {/* Usage Guides */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <Book className="text-primary-600 mr-3" size={28} />
            Kullanım Rehberleri
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {guides.map((guide) => (
              <div key={guide.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    {guide.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {guide.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {guide.description}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {guide.content.map((step, index) => (
                    <p key={index} className="text-gray-700 text-sm">
                      {step}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* File Formats */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Dosya Formatları Rehberi
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {fileFormats.map((format) => (
              <div key={format.format} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center mb-4">
                  <div className="bg-primary-100 text-primary-600 font-bold text-xl py-2 px-4 rounded-lg inline-block mb-2">
                    {format.format}
                  </div>
                  <p className="text-gray-600 text-sm">{format.description}</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Avantajları:</h4>
                    <ul className="space-y-1">
                      {format.advantages.map((advantage, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          {advantage}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-sm text-primary-600 font-medium">
                      {format.recommended}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <HelpCircle className="text-primary-600 mr-3" size={28} />
            Sık Sorulan Sorular
          </h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="bg-primary-100 text-primary-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {index + 1}
                  </span>
                  {faq.question}
                </h3>
                <p className="text-gray-700 ml-9 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Requirements */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Teknik Gereksinimler
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Desteklenen Tarayıcılar</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Chrome</span>
                  <span className="text-green-600 font-medium">90+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Firefox</span>
                  <span className="text-green-600 font-medium">88+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Safari</span>
                  <span className="text-green-600 font-medium">14+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Edge</span>
                  <span className="text-green-600 font-medium">90+</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Sistem Gereksinimleri</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>• <span className="font-medium">RAM:</span> Minimum 2GB</p>
                <p>• <span className="font-medium">İnternet:</span> Aktif bağlantı gerekli</p>
                <p>• <span className="font-medium">Ekran:</span> 1024x768 ve üzeri</p>
                <p>• <span className="font-medium">JavaScript:</span> Etkinleştirilmiş olmalı</p>
              </div>
            </div>
          </div>
        </div>

        {/* External Resources */}
        <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Daha Fazla Yardım</h2>
          <p className="mb-6 opacity-90">
            Aradığınız cevabı bulamadınız mı? Size yardımcı olmak için buradayız.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="bg-white bg-opacity-20 rounded-lg p-4 hover:bg-opacity-30 transition-colors flex items-center justify-center space-x-2">
              <ExternalLink size={20} />
              <span>Destek Merkezi</span>
            </button>
            <button className="bg-white bg-opacity-20 rounded-lg p-4 hover:bg-opacity-30 transition-colors flex items-center justify-center space-x-2">
              <ExternalLink size={20} />
              <span>Video Rehberler</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsefulInfoPage;
