import type { HTMLAttributes } from "react";
import { CloseButton, Typography, formatDate, createBackdropClickHandler, createModalKeyHandler } from "./ui";
import { useImageFallback } from "../hooks/useModal";
import ClickableImage from "./ClickableImage";
import { useState, useEffect } from "react";
import { dogService, type Dog } from "../services/supabaseService";

export interface NewsModalProps extends HTMLAttributes<HTMLDivElement> {
  // Core props
  isOpen: boolean;
  onClose: () => void;

  // Content props - either new images array OR legacy single image props
  images?: Array<{
    url: string;
    alt: string;
  }>;
  // Legacy props for backward compatibility
  imageUrl?: string;
  imageAlt?: string;
  
  date: string | Date;
  title: string;
  excerpt: string;

  // Optional props
  fallbackImageUrl?: string;
  dateFormat?: "short" | "long" | "relative";
  taggedDogs?: string[];       // Array of dog IDs that are tagged in this post
}

const NewsModal = ({
  isOpen,
  onClose,
  images,
  imageUrl,
  imageAlt,
  date,
  title,
  excerpt,
  fallbackImageUrl,
  dateFormat = "short",
  taggedDogs = [],
  className = "",
  ...rest
}: NewsModalProps) => {
  if (!isOpen) return null;

  // Handle backward compatibility: convert legacy props to images array
  const finalImages = images && images.length > 0 
    ? images 
    : imageUrl 
      ? [{ url: imageUrl, alt: imageAlt || "" }]
      : [];

  const { } = useImageFallback(fallbackImageUrl);
  const handleBackdropClick = createBackdropClickHandler(onClose);
  const handleKeyDown = createModalKeyHandler(onClose);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loadingDogs, setLoadingDogs] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Handle keyboard navigation for images
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen || finalImages.length <= 1) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentImageIndex(prev => prev === 0 ? finalImages.length - 1 : prev - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentImageIndex(prev => prev === finalImages.length - 1 ? 0 : prev + 1);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isOpen, finalImages.length]);

  // Reset image index when modal opens/closes or images change
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [finalImages]);

  // Fetch dog details when taggedDogs changes
  useEffect(() => {
    if (taggedDogs.length === 0) {
      setDogs([]);
      return;
    }

    const fetchDogs = async () => {
      setLoadingDogs(true);
      try {
        const dogPromises = taggedDogs.map(dogId => dogService.getDogById(dogId));
        const dogResults = await Promise.allSettled(dogPromises);

        const validDogs = dogResults
          .filter((result): result is PromiseFulfilledResult<Dog> =>
            result.status === 'fulfilled' && result.value !== null
          )
          .map(result => result.value);

        setDogs(validDogs);
      } catch (error) {
        console.error("Error fetching tagged dogs:", error);
        setDogs([]);
      } finally {
        setLoadingDogs(false);
      }
    };

    fetchDogs();
  }, [taggedDogs]);

  return (
    <>
    <div className="fixed inset-0 bg-black opacity-80 flex items-center justify-center z-10 p-4 min-h-screen"/>
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${className}`}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      {...rest}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-end items-center p-6">
          <CloseButton onClose={onClose} />
        </div>

        {/* Modal Content */}
        <div className="flex flex-col h-full">
          {/* Main Content Area */}
          <div className="flex-1 px-6">
            <div className="space-y-6">
              {/* Image Gallery */}
              <div className="w-full">
                {finalImages.length > 0 && (
                  <div className="space-y-4">
                    {/* Main Image */}
                    <div className="flex justify-center">
                      <ClickableImage
                        src={finalImages[currentImageIndex].url}
                        alt={finalImages[currentImageIndex].alt}
                        size="xxxl"
                      />
                    </div>
                    
                    {/* Image Navigation */}
                    {finalImages.length > 1 && (
                      <div className="space-y-3">
                        {/* Navigation Buttons */}
                        <div className="flex justify-center items-center gap-4">
                          <button
                            onClick={() => setCurrentImageIndex(prev => prev === 0 ? finalImages.length - 1 : prev - 1)}
                            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                            aria-label="Previous image"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          
                          <span className="text-sm text-gray-600">
                            {currentImageIndex + 1} of {finalImages.length}
                          </span>
                          
                          <button
                            onClick={() => setCurrentImageIndex(prev => prev === finalImages.length - 1 ? 0 : prev + 1)}
                            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                            aria-label="Next image"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Thumbnail Strip */}
                        <div className="flex justify-center gap-2 flex-wrap">
                          {finalImages.map((image, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                index === currentImageIndex 
                                  ? 'border-blue-500 shadow-lg' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <img
                                src={image.url}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <time
                className="text-sm text-gray-500 font-medium text-right"
                dateTime={typeof date === 'string' ? date : date.toISOString()}
              >
                {formatDate(date, dateFormat)}
              </time>

              {/* Article Content */}
              <div className="space-y-4">
                <Typography variant="h2" color="primary">
                  {title}
                </Typography>

                <div className="prose prose-lg max-w-none">
                  <Typography variant="body" color="secondary" className="text-lg leading-relaxed">
                    {excerpt}
                  </Typography>
                </div>
              </div>
            </div>
          </div>

          {/* Tagged Dogs Section - Clean Pills Only */}
          {(dogs.length === 0) && <div className="bg-gray-50 py-4 px-6"/>}
          {(dogs.length > 0) && (
            <div className="bg-gray-50 py-4 px-6">
              {!loadingDogs && (
                <div className="flex flex-wrap gap-2">
                  {dogs.map((dog) => (
                    <span
                      key={dog.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-colors cursor-default"
                    >
                      {dog.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default NewsModal;
