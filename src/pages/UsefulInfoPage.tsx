import { useTranslation } from 'react-i18next';
import { Book, Download, Eye, Search, Smartphone, HelpCircle} from 'lucide-react';

const UsefulInfoPage = () => {
  const { t } = useTranslation();

  const guides = [
    {
      id: 1,
      icon: <Download className="text-blue-600" size={24} />,
      steps: ['guide1Step1', 'guide1Step2', 'guide1Step3', 'guide1Step4']
    },
    {
      id: 2,
      icon: <Eye className="text-green-600" size={24} />,
      steps: ['guide2Step1', 'guide2Step2', 'guide2Step3', 'guide2Step4']
    },
    {
      id: 3,
      icon: <Search className="text-purple-600" size={24} />,
      steps: ['guide3Step1', 'guide3Step2', 'guide3Step3', 'guide3Step4']
    },
    {
      id: 4,
      icon: <Smartphone className="text-orange-600" size={24} />,
      steps: ['guide4Step1', 'guide4Step2', 'guide4Step3', 'guide4Step4']
    }
  ];

  const faqs = [
    { question: 'faq1Question', answer: 'faq1Answer' },
    { question: 'faq2Question', answer: 'faq2Answer' },
    { question: 'faq3Question', answer: 'faq3Answer' },
    { question: 'faq4Question', answer: 'faq4Answer' }
  ];

  const fileFormats = [
    {
      format: 'PDF',
      descKey: 'pdfDesc',
      advantages: ['pdfAdv1', 'pdfAdv2', 'pdfAdv3'],
      recommended: 'pdfRecommended'
    },
    {
      format: 'EPUB',
      descKey: 'epubDesc',
      advantages: ['epubAdv1', 'epubAdv2', 'epubAdv3'],
      recommended: 'epubRecommended'
    },
    {
      format: 'DOC',
      descKey: 'docDesc',
      advantages: ['docAdv1', 'docAdv2', 'docAdv3'],
      recommended: 'docRecommended'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('usefulInfo.pageTitle')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('usefulInfo.pageDescription')}
          </p>
        </div>

        {/* Usage Guides */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <Book className="text-primary-600 mr-3" size={28} />
            {t('usefulInfo.usageGuides')}
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
                      {t(`usefulInfo.guide${guide.id}Title`)}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {t(`usefulInfo.guide${guide.id}Desc`)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {guide.steps.map((step, index) => (
                    <p key={index} className="text-gray-700 text-sm">
                      {t(`usefulInfo.${step}`)}
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
            {t('usefulInfo.fileFormatsGuide')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {fileFormats.map((format) => (
              <div key={format.format} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center mb-4">
                  <div className="bg-primary-100 text-primary-600 font-bold text-xl py-2 px-4 rounded-lg inline-block mb-2">
                    {format.format}
                  </div>
                  <p className="text-gray-600 text-sm">{t(`usefulInfo.${format.descKey}`)}</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{t('usefulInfo.advantages')}</h4>
                    <ul className="space-y-1">
                      {format.advantages.map((advantage, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          {t(`usefulInfo.${advantage}`)}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-sm text-primary-600 font-medium">
                      {t(`usefulInfo.${format.recommended}`)}
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
            {t('usefulInfo.faq')}
          </h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="bg-primary-100 text-primary-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {index + 1}
                  </span>
                  {t(`usefulInfo.${faq.question}`)}
                </h3>
                <p className="text-gray-700 ml-9 leading-relaxed">
                  {t(`usefulInfo.${faq.answer}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsefulInfoPage;
