import type { HTMLAttributes } from "react";
import { Badge, CloseButton, Typography } from "./ui";
import { useModal } from "../hooks/useModal";
import { useState } from "react";
import CloudinaryImage from "./CloudinaryImage";

export interface PedigreeCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  // Image props
  imageUrl?: string;
  imagePublicId?: string;  // Cloudinary public ID
  imageAlt: string;
  
  // Pedigree details
  relation: string;        // e.g., "Father", "Mother", "Grandparents"
  regnr: string;          // Registration number
  name: string;           // Full name
  titles?: string[];      // Array of titles/achievements
  
  // Optional props
  fallbackInitials?: string;
  onClick?: () => void;   // Custom click handler
}

const PedigreeCard = ({
  imageUrl,
  imagePublicId,
  imageAlt,
  relation,
  regnr,
  name,
  titles = [],
  fallbackInitials,
  onClick,
  className = "",
  ...rest
}: PedigreeCardProps) => {
  const { isOpen: isExpanded, open: openModal, close: closeModal } = useModal();
  const [imageError, setImageError] = useState(false);

  const handleCardClick = () => {
    openModal();
    onClick?.();
  };

  const handleCloseModal = () => {
    closeModal();
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Check if we have a valid image (either Cloudinary publicId or direct URL)
  const hasCloudinaryImage = imagePublicId && imagePublicId.trim() !== '';
  const hasDirectImage = imageUrl && imageUrl.trim() !== '' && !imageError;
  const hasValidImage = hasCloudinaryImage || hasDirectImage;
  
  // Debug logging for image URLs
  if (imagePublicId || imageUrl) {
    console.log(`PedigreeCard for ${name}:`, {
      imageUrl,
      imagePublicId,
      hasCloudinaryImage,
      hasDirectImage,
      hasValidImage,
      imageError,
      relation
    });
  }

  // Format titles string
  const titlesText = titles.length > 0 ? titles.join(", ") : "";

  return (
    <>
      {/* Main Card */}
      <div
        className={`
          h-20 max-w-80 p-3
          bg-white border border-gray-200 rounded-lg shadow-sm
          hover:shadow-md hover:border-gray-300
          cursor-pointer transition-all duration-200
          flex items-center gap-3
          w-full
          ${className}
        `}
        onClick={handleCardClick}
        {...rest}
      >
        {/* Image */}
        <div className="w-16 h-16 flex-shrink-0">
          {hasValidImage ? (
            hasCloudinaryImage ? (
              <CloudinaryImage
                publicId={imagePublicId!}
                width={64}
                height={64}
                alt={imageAlt}
                crop="fill"
                gravity="face"
                className="w-full h-full rounded-md"
                enableLazyLoading={false}
                enablePlaceholder={false}
                enableAccessibility={false}
              />
            ) : (
              <img
                src={imageUrl}
                alt={imageAlt}
                className="w-full h-full object-cover rounded-md"
                onError={handleImageError}
              />
            )
          ) : (
            <div className="w-full h-full bg-gray-300 rounded-md flex items-center justify-center text-base font-semibold text-gray-600">
              {fallbackInitials || name.charAt(0)}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          {/* Relation */}
          <Typography 
            variant="overline"
            color="muted"
            className="truncate block text-xs"
          >
            {relation}
          </Typography>
          

          
          {/* Name */}
          <Typography 
            variant="body"
            weight="semibold"
            className={`truncate block leading-tight`}
          >
            {name}
          </Typography>

                    {/* Registration Number */}
                    <Typography 
            variant="caption"
            color="secondary"
            className={`truncate block  ${titlesText ? '' : 'mb-4'}`}
          >
            Reg: {regnr}
          </Typography>
          
          {/* Titles (if any) */}
          {titlesText && (
            <Typography 
              variant="caption"
              color="secondary"
              className="truncate block"
            >
              {titlesText}
            </Typography>
          )}
        </div>
      </div>

      {/* Expanded Modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <Typography variant="h4" weight="semibold">Pedigree Details</Typography>
              <CloseButton onClose={handleCloseModal} />
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Enlarged Image */}
                <div className="flex-shrink-0">
                  {hasValidImage ? (
                    hasCloudinaryImage ? (
                      <CloudinaryImage
                        publicId={imagePublicId!}
                        width={192}
                        height={192}
                        alt={imageAlt}
                        crop="fill"
                        gravity="face"
                        className="w-48 h-48 rounded-lg shadow-md mx-auto md:mx-0"
                        enableLazyLoading={false}
                        enablePlaceholder={false}
                        enableAccessibility={false}
                      />
                    ) : (
                      <img
                        src={imageUrl}
                        alt={imageAlt}
                        className="w-48 h-48 object-cover rounded-lg shadow-md mx-auto md:mx-0"
                        onError={handleImageError}
                      />
                    )
                  ) : (
                    <div className="w-48 h-48 bg-gray-300 rounded-lg shadow-md mx-auto md:mx-0 flex items-center justify-center text-4xl text-gray-600 font-semibold">
                      {fallbackInitials || name.charAt(0)}
                    </div>
                  )}
                </div>
                
                {/* Detailed Information */}
                <div className="flex-1 space-y-4">
                  <div>
                    <Typography variant="overline" color="muted">Relation</Typography>
                    <Typography variant="body" weight="medium">{relation}</Typography>
                  </div>
                  
                  <div>
                    <Typography variant="overline" color="muted">Registration Number</Typography>
                    <Typography variant="body">{regnr}</Typography>
                  </div>
                  
                  <div>
                    <Typography variant="overline" color="muted">Name</Typography>
                    <Typography variant="h4" weight="semibold">{name}</Typography>
                  </div>
                  
                  {titles.length > 0 && (
                    <div>
                      <Typography variant="overline" color="muted">Titles & Achievements</Typography>
                      <div className="mt-2">
                        {titles.map((title, index) => (
                          <Badge
                            key={index}
                            variant="primary"
                            className="mr-2 mb-2"
                          >
                            {title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PedigreeCard;