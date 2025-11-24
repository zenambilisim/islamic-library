import { useTranslation } from 'react-i18next';
import { BookOpen, Heart, Users, Globe, Shield, Award } from 'lucide-react';

const AboutPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="bg-primary-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <BookOpen className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('navigation.about')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            İslamic Library, dini kitapları dijital ortamda erişilebilir kılmak amacıyla oluşturulmuş 
            ücretsiz bir elektronik kütüphane platformudur.
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Heart className="text-red-500 mr-3" size={24} />
              Misyonumuz
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              İslami ilimler alanındaki değerli eserleri dijital ortamda toplumun hizmetine sunmak, 
              İslam kültürünün ve biliminin yaygınlaşmasına katkıda bulunmak temel misyonumuzdur.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Kuran-ı Kerim, hadis, tefsir, tasavvuf ve diğer İslami konularda kaliteli kaynakları 
              ücretsiz olarak erişilebilir kılıyoruz.
            </p>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Award className="text-yellow-500 mr-3" size={24} />
              Vizyonumuz
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Dünyanın her yerindeki Müslümanların İslami bilgiye kolayca erişebileceği, 
              en kapsamlı dijital İslami kütüphane olmayı hedefliyoruz.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Teknoloji ile İslami bilimi buluşturarak, gelecek nesillere değerli mirası 
              aktarmak için çalışıyoruz.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="bg-blue-100 p-3 rounded-lg w-fit mb-4">
              <Globe size={24} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Çok Dilli Destek
            </h3>
            <p className="text-gray-600">
              Türkçe, İngilizce, Rusça ve Azerbaycan Türkçesi olmak üzere 4 dilde hizmet veriyoruz.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="bg-green-100 p-3 rounded-lg w-fit mb-4">
              <BookOpen size={24} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Çoklu Format
            </h3>
            <p className="text-gray-600">
              PDF, EPUB ve DOC formatlarında kitapları indirip, online okuma imkanı sunuyoruz.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="bg-purple-100 p-3 rounded-lg w-fit mb-4">
              <Shield size={24} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ücretsiz Erişim
            </h3>
            <p className="text-gray-600">
              Tüm kitaplarımıza tamamen ücretsiz erişim sağlıyor, hiçbir ücret talep etmiyoruz.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="bg-red-100 p-3 rounded-lg w-fit mb-4">
              <Users size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Topluluk Odaklı
            </h3>
            <p className="text-gray-600">
              Kullanıcı geri bildirimleri ile sürekli gelişiyor, ihtiyaçlara uygun çözümler üretiyoruz.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="bg-indigo-100 p-3 rounded-lg w-fit mb-4">
              <BookOpen size={24} className="text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Kaliteli İçerik
            </h3>
            <p className="text-gray-600">
              Güvenilir kaynaklar ve uzman kontrolünden geçmiş, kaliteli İslami eserler sunuyoruz.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="bg-yellow-100 p-3 rounded-lg w-fit mb-4">
              <Award size={24} className="text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sürekli Güncelleme
            </h3>
            <p className="text-gray-600">
              Düzenli olarak yeni kitaplar ekliyور, mevcut içeriği güncel tutuyoruz.
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-xl p-8 text-white text-center mb-16">
          <h2 className="text-2xl font-bold mb-8">Rakamlarla Islamic Library</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl font-bold mb-2">500+</div>
              <div className="text-primary-100">Kitap</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">50+</div>
              <div className="text-primary-100">Yazar</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">100K+</div>
              <div className="text-primary-100">İndirme</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">4</div>
              <div className="text-primary-100">Dil Desteği</div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ekibimiz</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            İslami ilimlerde uzman, teknoloji alanında deneyimli gönüllülerden oluşan ekibimiz, 
            bu projeyi hayata geçirmek için özenle çalışmaktadır.
          </p>
          
          <div className="bg-primary-50 rounded-xl p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Katkıda Bulunmak İster misiniz?
            </h3>
            <p className="text-gray-600 mb-6">
              Projeye katkıda bulunmak, kitap önerisi yapmak veya geri bildirim vermek için 
              bizimle iletişime geçebilirsiniz.
            </p>
            <button className="btn-primary">
              İletişime Geçin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
