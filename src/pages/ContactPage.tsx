import { useState, useRef, useEffect } from 'react';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import CloudinaryImage from '../components/CloudinaryImage';
import { face } from '@cloudinary/url-gen/qualifiers/focusOn';
import dkkLogo from '../assets/dkk_uddannet.png';
import { CloudinaryUploadService } from '../services/cloudinaryUploadService';
import { dogService, type StaticImage } from '../services/supabaseService';

function ContactPage() {
  const { t } = useTranslation('pages');
  const { user } = useAuth();
  
  // State for image uploads
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // State for storing the actual image data (following the same pattern as DogDetailsPage)
  const [ownerImage, setOwnerImage] = useState<StaticImage | null>(null);
  const [mainKennelImage, setMainKennelImage] = useState<StaticImage | null>(null);
  const [outdoorImage, setOutdoorImage] = useState<StaticImage | null>(null);
  const [indoorImage, setIndoorImage] = useState<StaticImage | null>(null);
  const [loading, setLoading] = useState(true);

  // Load contact page images on component mount
  useEffect(() => {
    loadContactImages();
  }, []);

  const loadContactImages = async () => {
    try {
      const contactSectionIds = ['profile', 'facility', 'outdoor', 'indoor'];
      const images = await dogService.getStaticImages('contact', contactSectionIds);
      setOwnerImage(images.profile || null);
      setMainKennelImage(images.facility || null);
      setOutdoorImage(images.outdoor || null);
      setIndoorImage(images.indoor || null);
    } catch (error) {
      console.error('Failed to load contact page images:', error);
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

  const handleImageUpload = async (imageType: string, file: File) => {
    if (!user) return;

    setUploadingImages(prev => ({ ...prev, [imageType]: true }));
    setUploadErrors(prev => ({ ...prev, [imageType]: '' }));

    try {
      const uploadOptions = {
        folder: `contact-page/${imageType}`,
        tags: ['contact-page', imageType],
        publicId: `${imageType}-${Date.now()}`
      };

      const uploadService = new CloudinaryUploadService(
        import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dsstocv9w',
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default'
      );
      const result = await uploadService.uploadFile(file, uploadOptions);
      
                // Map imageType to sectionId and save to database
                const imageTypeToSectionId: Record<string, string> = {
                    'kennel-owner': 'profile',
                    'kennel-main': 'facility',
                    'kennel-outdoor': 'outdoor',
                    'kennel-indoor': 'indoor'
                };

                const sectionId = imageTypeToSectionId[imageType];
                if (!sectionId) {
                    console.warn(`Unknown imageType for upload: ${imageType}`);
                    return;
                }

                // Save to database
                const savedImage = await dogService.saveStaticImage('contact', sectionId, {
                    publicId: result.public_id,
                    url: result.secure_url,
                    altText: `${imageType} image`
                });

      // Update local state
      switch (imageType) {
        case 'kennel-owner':
          setOwnerImage(savedImage);
          break;
        case 'kennel-main':
          setMainKennelImage(savedImage);
          break;
        case 'kennel-outdoor':
          setOutdoorImage(savedImage);
          break;
        case 'kennel-indoor':
          setIndoorImage(savedImage);
          break;
      }

      // Clear any previous errors
      setUploadErrors(prev => ({ ...prev, [imageType]: '' }));
      
      // Show success message
      alert(`Successfully uploaded ${imageType} image!`);
      
    } catch (error) {
      console.error(`Failed to upload ${imageType} image:`, error);
      setUploadErrors(prev => ({ 
        ...prev, 
        [imageType]: error instanceof Error ? error.message : 'Upload failed' 
      }));
      alert(`Failed to upload ${imageType} image. Please try again.`);
    } finally {
      setUploadingImages(prev => ({ ...prev, [imageType]: false }));
    }
  };

  const handleFileSelect = (imageType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(imageType, file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <Typography variant="body" color="muted">Loading contact page images...</Typography>
          </div>
        </div>
      </div>
    );
  }

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
                  <div className="mb-6 relative">
                    <div className="w-48 h-48 md:w-56 md:h-56 mx-auto rounded-lg shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      {ownerImage ? (
                        ownerImage.image_public_id ? (
                          <CloudinaryImage
                            key={ownerImage.image_public_id}
                            publicId={ownerImage.image_public_id}
                            width={200}
                            height={200}
                            alt={ownerImage.alt_text || "Tine Arnild - Kennel Owner"}
                            className="w-full h-full object-cover"
                            crop="fill"
                            gravity={face()}
                            enablePlaceholder={false}
                          />
                        ) : (
                          <img
                            src={ownerImage.image_url}
                            alt={ownerImage.alt_text || "Tine Arnild - Kennel Owner"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = `
                                <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <span class="text-gray-400 text-4xl">👤</span>
                                </div>
                              `;
                            }}
                          />
                        )
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-4xl">👤</span>
                        </div>
                      )}
                    </div>
                    {user && (
                      <>
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                             onClick={() => fileInputRefs.current['kennel-owner']?.click()}>
                          <Typography variant="body" className="text-white font-medium">
                            {uploadingImages['kennel-owner'] ? 'Uploading...' : 'Upload New Photo'}
                          </Typography>
                        </div>
                        <input
                          ref={el => { fileInputRefs.current['kennel-owner'] = el; }}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={(e) => handleFileSelect('kennel-owner', e)}
                          className="hidden"
                          disabled={uploadingImages['kennel-owner']}
                        />
                      </>
                    )}
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
                    <div className="w-full h-64 rounded-lg shadow-md overflow-hidden bg-gray-100 flex items-center justify-center">
                      {mainKennelImage ? (
                        mainKennelImage.image_public_id ? (
                          <CloudinaryImage
                            key={mainKennelImage.image_public_id}
                            publicId={mainKennelImage.image_public_id}
                            width={1200}
                            height={800}
                            alt={mainKennelImage.alt_text || "Kennel Speedex main facility"}
                            className="w-full h-full object-cover"
                            crop="fill"
                            enablePlaceholder={false}
                          />
                        ) : (
                          <img
                            src={mainKennelImage.image_url}
                            alt={mainKennelImage.alt_text || "Kennel Speedex main facility"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = `
                                <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <span class="text-gray-400 text-4xl">🏠</span>
                                </div>
                              `;
                            }}
                          />
                        )
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-4xl">🏠</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded">
                      <Typography variant="caption" className="text-white">
                        {t('contact.labels.mainFacility')}
                      </Typography>
                    </div>
                    {user && (
                      <>
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                             onClick={() => fileInputRefs.current['kennel-main']?.click()}>
                          <Typography variant="body" className="text-white font-medium">
                            {uploadingImages['kennel-main'] ? 'Uploading...' : 'Upload New Photo'}
                          </Typography>
                        </div>
                        <input
                          ref={el => { fileInputRefs.current['kennel-main'] = el; }}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={(e) => handleFileSelect('kennel-main', e)}
                          className="hidden"
                          disabled={uploadingImages['kennel-main']}
                        />
                      </>
                    )}
                  </div>

                  {/* Secondary Images */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <div className="w-full h-32 rounded-lg shadow-md overflow-hidden bg-gray-100 flex items-center justify-center">
                        {outdoorImage ? (
                          outdoorImage.image_public_id ? (
                            <CloudinaryImage
                              key={outdoorImage.image_public_id}
                              publicId={outdoorImage.image_public_id}
                              width={300}
                              height={200}
                              alt={outdoorImage.alt_text || "Outdoor kennel area"}
                              className="w-full h-full object-cover"
                              crop="fill"
                              enablePlaceholder={false}
                            />
                          ) : (
                            <img
                              src={outdoorImage.image_url}
                              alt={outdoorImage.alt_text || "Outdoor kennel area"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = `
                                  <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <span class="text-gray-400 text-2xl">🌳</span>
                                  </div>
                                `;
                              }}
                            />
                          )
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-2xl">🌳</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                        {t('contact.labels.outdoorArea')}
                      </div>
                      {user && (
                        <>
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                               onClick={() => fileInputRefs.current['kennel-outdoor']?.click()}>
                            <Typography variant="caption" className="text-white font-medium">
                              {uploadingImages['kennel-outdoor'] ? 'Uploading...' : 'Upload'}
                            </Typography>
                          </div>
                          <input
                            ref={el => { fileInputRefs.current['kennel-outdoor'] = el; }}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => handleFileSelect('kennel-outdoor', e)}
                            className="hidden"
                            disabled={uploadingImages['kennel-outdoor']}
                          />
                        </>
                      )}
                    </div>

                    <div className="relative">
                      <div className="w-full h-32 rounded-lg shadow-md overflow-hidden bg-gray-100 flex items-center justify-center">
                        {indoorImage ? (
                          indoorImage.image_public_id ? (
                            <CloudinaryImage
                              key={indoorImage.image_public_id}
                              publicId={indoorImage.image_public_id}
                              width={300}
                              height={200}
                              alt={indoorImage.alt_text || "Indoor kennel facilities"}
                              className="w-full h-full object-cover"
                              crop="fill"
                              enablePlaceholder={false}
                            />
                          ) : (
                            <img
                              src={indoorImage.image_url}
                              alt={indoorImage.alt_text || "Indoor kennel facilities"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = `
                                  <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <span class="text-gray-400 text-2xl">🏠</span>
                                  </div>
                                `;
                              }}
                            />
                          )
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-2xl">🏠</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                        {t('contact.labels.indoorFacilities')}
                      </div>
                      {user && (
                        <>
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                               onClick={() => fileInputRefs.current['kennel-indoor']?.click()}>
                            <Typography variant="caption" className="text-white font-medium">
                              {uploadingImages['kennel-indoor'] ? 'Uploading...' : 'Upload'}
                            </Typography>
                          </div>
                          <input
                            ref={el => { fileInputRefs.current['kennel-indoor'] = el; }}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => handleFileSelect('kennel-indoor', e)}
                            className="hidden"
                            disabled={uploadingImages['kennel-indoor']}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Error Display */}
        {Object.keys(uploadErrors).length > 0 && (
          <div className="mb-8">
            {Object.entries(uploadErrors).map(([imageType, error]) => (
              error && (
                <div key={imageType} className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <Typography variant="caption" color="danger">
                    Failed to upload {imageType} image: {error}
                  </Typography>
                </div>
              )
            ))}
          </div>
        )}

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
