'use client';

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
            {t('about.pageTitle')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('about.pageDescription')}
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Heart className="text-red-500 mr-3" size={24} />
              {t('about.missionTitle')}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('about.missionText1')}
            </p>
            <p className="text-gray-700 leading-relaxed">
              {t('about.missionText2')}
            </p>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Award className="text-yellow-500 mr-3" size={24} />
              {t('about.visionTitle')}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('about.visionText1')}
            </p>
            <p className="text-gray-700 leading-relaxed">
              {t('about.visionText2')}
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
              {t('about.feature1Title')}
            </h3>
            <p className="text-gray-600">
              {t('about.feature1Desc')}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="bg-green-100 p-3 rounded-lg w-fit mb-4">
              <BookOpen size={24} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('about.feature2Title')}
            </h3>
            <p className="text-gray-600">
              {t('about.feature2Desc')}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="bg-purple-100 p-3 rounded-lg w-fit mb-4">
              <Shield size={24} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('about.feature3Title')}
            </h3>
            <p className="text-gray-600">
              {t('about.feature3Desc')}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="bg-red-100 p-3 rounded-lg w-fit mb-4">
              <Users size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('about.feature4Title')}
            </h3>
            <p className="text-gray-600">
              {t('about.feature4Desc')}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="bg-indigo-100 p-3 rounded-lg w-fit mb-4">
              <BookOpen size={24} className="text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('about.feature5Title')}
            </h3>
            <p className="text-gray-600">
              {t('about.feature5Desc')}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="bg-yellow-100 p-3 rounded-lg w-fit mb-4">
              <Award size={24} className="text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('about.feature6Title')}
            </h3>
            <p className="text-gray-600">
              {t('about.feature6Desc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
