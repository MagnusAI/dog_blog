import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import { useTranslation } from '../contexts/LanguageContext';
import CloudinaryImage from '../components/CloudinaryImage';
import { face } from '@cloudinary/url-gen/qualifiers/focusOn';
import dkkLogo from '../assets/dkk_uddannet.png';

function ContactPage() {
  const { t } = useTranslation('pages');

  const handleEmailClick = () => {
    window.location.href = 'mailto:tinearnild@hotmail.com';
  };

  const handlePhoneClick = () => {
    window.location.href = 'tel:+4527741140';
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-8 py-8">


        {/* Contact Information Section */}
        <div className="mb-16">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="mb-8">
              <Typography variant="h2" weight="bold" className="text-3xl md:text-4xl text-gray-900">
                {t('contact.sections.contactInfo')}
              </Typography>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Contact Details */}
              <div className="space-y-8">
                {/* Kennel Owner Section */}
                <div className="text-start">
                  <div className="mb-6">
                    <CloudinaryImage
                      publicId="kennel-owner/tine-arnild"
                      width={200}
                      height={200}
                      alt="Tine Arnild - Kennel Owner"
                      className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-lg shadow-lg mx-auto"
                      crop="fill"
                      gravity={face()}
                    />
                  </div>
                  <div>
                    <Typography variant="h4" weight="semibold" className="text-gray-900 mb-2">
                      {t('contact.labels.breeder')}
                    </Typography>
                    <Typography variant="h3" weight="bold" className="text-2xl text-gray-900 mb-2">
                      Tine Arnild
                    </Typography>
                    <Typography variant="body" className="text-gray-600">
                      {t('contact.labels.kennelOwner')}
                    </Typography>
                  </div>
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
                        className="text-blue-600 hover:text-blue-800 p-0 h-auto font-medium pl-0 pr-0"
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
                        className="text-green-600 hover:text-green-800 p-0 h-auto font-medium pl-0 pr-0"
                      >
                        +45 27 74 11 40
                      </Button>
                    </div>
                  </div>
                </div>
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
                      width={1200}
                      height={800}
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
                <div className="w-16 h-16 bg-beige-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <img src={dkkLogo} alt="DKK" className="w-16 h-16" />
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
                  {t('contact.labels.specialists')}
                </Typography>
                <Typography variant="body" color="secondary">
                  {t('contact.messages.description')}
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
