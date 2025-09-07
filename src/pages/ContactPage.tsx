import { useState, useEffect } from 'react';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import { contentService } from '../services/supabaseService';
import type { ContentSection } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import CloudinaryImage from '../components/CloudinaryImage';
import { dog } from '@cloudinary/url-gen/qualifiers/focusOn';

function ContactPage() {
  const { user } = useAuth();
  const { t } = useTranslation('pages');
  const [contactContent, setContactContent] = useState<ContentSection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContactData();
  }, []);

  const loadContactData = async () => {
    try {
      // Load contact content from CMS
      const content = await contentService.getContentByKey('contact_info');
      setContactContent(content);
    } catch (error) {
      console.error('Error loading contact data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClick = () => {
    window.location.href = 'mailto:tinearnild@hotmail.com';
  };

  const handlePhoneClick = () => {
    window.location.href = 'tel:+4527741140';
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Typography variant="h1" weight="bold" className="text-4xl md:text-6xl text-gray-900 mb-4">
            {t('contact.header.title')}
          </Typography>
          <Typography variant="h3" className="text-gray-600 max-w-3xl mx-auto text-xl md:text-2xl">
            {t('contact.header.subtitle')}
          </Typography>
        </div>

        {/* Contact Information Section */}
        <div className="mb-16">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <Typography variant="h2" weight="bold" className="text-3xl md:text-4xl text-gray-900">
                {t('contact.sections.contactInfo')}
              </Typography>
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/admin/content/edit/contact_info'}
                  className="text-gray-500 hover:text-gray-700 border-gray-300"
                >
                  ✏️ {t('actions.editContent', 'common')}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Contact Details */}
              <div className="space-y-8">
                <div>
                  <Typography variant="h4" weight="semibold" className="text-gray-900 mb-4">
                    {t('contact.labels.breeder')}
                  </Typography>
                  <Typography variant="h3" weight="bold" className="text-2xl text-gray-900 mb-2">
                    Tine Arnild
                  </Typography>
                  <Typography variant="body" className="text-gray-600">
                    {t('contact.labels.kennelOwner')}
                  </Typography>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xl">📧</span>
                    </div>
                    <div>
                      <Typography variant="body" color="secondary" className="text-sm">
                        {t('contact.labels.email')}
                      </Typography>
                      <Button
                        variant="ghost"
                        onClick={handleEmailClick}
                        className="text-blue-600 hover:text-blue-800 p-0 h-auto font-medium"
                      >
                        tinearnild@hotmail.com
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xl">📱</span>
                    </div>
                    <div>
                      <Typography variant="body" color="secondary" className="text-sm">
                        {t('contact.labels.phone')}
                      </Typography>
                      <Button
                        variant="ghost"
                        onClick={handlePhoneClick}
                        className="text-green-600 hover:text-green-800 p-0 h-auto font-medium"
                      >
                        +45 27 74 11 40
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Content from CMS */}
                {contactContent && (
                  <div className="prose prose-lg max-w-none">
                    {contactContent.content.split('\n\n').map((paragraph, index) => (
                      <Typography key={index} variant="body" className="text-lg text-gray-600 leading-relaxed mb-4">
                        {paragraph}
                      </Typography>
                    ))}
                  </div>
                )}
              </div>

              {/* Kennel Images */}
              <div className="space-y-6">
                <Typography variant="h4" weight="semibold" className="text-gray-900 mb-4">
                  {t('contact.sections.kennelEnvironment')}
                </Typography>
                
                <div className="grid grid-cols-1 gap-6">
                  {/* Main Kennel Image */}
                  <div className="relative">
                    <CloudinaryImage
                      publicId="kennel-environment/kennel-main"
                      width={600}
                      height={400}
                      alt="Kennel Speedex main facility"
                      className="w-full h-64 object-cover rounded-lg shadow-md"
                      crop="fill"
                    />
                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded">
                      <Typography variant="caption" className="text-white">
                        {t('contact.labels.mainFacility')}
                      </Typography>
                    </div>
                  </div>

                  {/* Secondary Images */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <CloudinaryImage
                        publicId="kennel-environment/kennel-outdoor"
                        width={300}
                        height={200}
                        alt="Outdoor kennel area"
                        className="w-full h-32 object-cover rounded-lg shadow-md"
                        crop="fill"
                      />
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                        {t('contact.labels.outdoorArea')}
                      </div>
                    </div>

                    <div className="relative">
                      <CloudinaryImage
                        publicId="kennel-environment/kennel-indoor"
                        width={300}
                        height={200}
                        alt="Indoor kennel facilities"
                        className="w-full h-32 object-cover rounded-lg shadow-md"
                        crop="fill"
                      />
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                        {t('contact.labels.indoorFacilities')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="bg-gray-50 rounded-lg p-8">
          <div className="text-center max-w-4xl mx-auto">
            <Typography variant="h3" weight="bold" className="text-2xl md:text-3xl text-gray-900 mb-6">
              {t('contact.sections.additionalInfo')}
            </Typography>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 text-2xl">🏆</span>
                </div>
                <Typography variant="h4" weight="semibold" className="text-gray-900 mb-2">
                  {t('contact.labels.dkkCertified')}
                </Typography>
                <Typography variant="body" color="secondary">
                  {t('contact.messages.dkkDescription')}
                </Typography>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 text-2xl">❤️</span>
                </div>
                <Typography variant="h4" weight="semibold" className="text-gray-900 mb-2">
                  {t('contact.labels.passionateBreeding')}
                </Typography>
                <Typography variant="body" color="secondary">
                  {t('contact.messages.passionDescription')}
                </Typography>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 text-2xl">🐕</span>
                </div>
                <Typography variant="h4" weight="semibold" className="text-gray-900 mb-2">
                  {t('contact.labels.norfolkSpecialists')}
                </Typography>
                <Typography variant="body" color="secondary">
                  {t('contact.messages.norfolkDescription')}
                </Typography>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Typography variant="body" className="text-lg text-gray-600 leading-relaxed">
                {t('contact.messages.contactEncouragement')}
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
