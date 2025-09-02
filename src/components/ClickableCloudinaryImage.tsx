import React from "react";
import type { HTMLAttributes } from "react";
import { CloseButton } from "./ui";
import { useModal } from "../hooks/useModal";
import CloudinaryImage, { type CloudinaryImageProps } from "./CloudinaryImage";

export interface ClickableCloudinaryImageProps extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  // CloudinaryImage props
  publicId: string;
  width: number;
  height: number;
  alt: string;
  
  // Enlargement options
  enlargedWidth?: number;     // Width for enlarged version (defaults to 2x original)
  enlargedHeight?: number;    // Height for enlarged version (defaults to 2x original)
  maxEnlargedWidth?: number;  // Maximum width for enlarged image (defaults to 1200px)
  maxEnlargedHeight?: number; // Maximum height for enlarged image (defaults to 800px)
  disableEnlarge?: boolean;   // Disable click-to-enlarge functionality
  
  // Custom click handler (disables enlargement if provided)
  onClick?: () => void;
  
  // CloudinaryImage passthrough props
  quality?: CloudinaryImageProps['quality'];
  format?: CloudinaryImageProps['format'];
  gravity?: CloudinaryImageProps['gravity'];
  crop?: CloudinaryImageProps['crop'];
  transformations?: CloudinaryImageProps['transformations'];
  cloudName?: CloudinaryImageProps['cloudName'];
  enableLazyLoading?: CloudinaryImageProps['enableLazyLoading'];
  enableResponsive?: CloudinaryImageProps['enableResponsive'];
  responsiveStepSize?: CloudinaryImageProps['responsiveStepSize'];
  responsiveWidths?: CloudinaryImageProps['responsiveWidths'];
  enablePlaceholder?: CloudinaryImageProps['enablePlaceholder'];
  placeholderType?: CloudinaryImageProps['placeholderType'];
  enableAccessibility?: CloudinaryImageProps['enableAccessibility'];
  accessibilityMode?: CloudinaryImageProps['accessibilityMode'];
  responsive?: CloudinaryImageProps['responsive'];
  dpr?: CloudinaryImageProps['dpr'];
  enhance?: CloudinaryImageProps['enhance'];
}

const ClickableCloudinaryImage = ({
  // Core image props
  publicId,
  width,
  height,
  alt,
  
  // Enlargement props
  enlargedWidth,
  enlargedHeight,
  maxEnlargedWidth = 1200,
  maxEnlargedHeight = 800,
  disableEnlarge = false,
  onClick,
  
  // CloudinaryImage props
  quality = "auto",
  format = "auto",
  gravity = "auto",
  crop = "fill",
  transformations = [],
  cloudName,
  enableLazyLoading = true,
  enableResponsive = true,
  responsiveStepSize = 200,
  responsiveWidths,
  enablePlaceholder = true,
  placeholderType = "blur",
  enableAccessibility = false,
  accessibilityMode = "darkmode",
  responsive = true,
  dpr,
  enhance = false,
  
  // HTML props
  className = "",
  ...rest
}: ClickableCloudinaryImageProps) => {
  const { isOpen: isEnlarged, open: openModal, close: closeModal } = useModal();

  // Calculate enlarged dimensions
  const actualEnlargedWidth = enlargedWidth || Math.min(width * 2, maxEnlargedWidth);
  const actualEnlargedHeight = enlargedHeight || Math.min(height * 2, maxEnlargedHeight);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (!disableEnlarge) {
      openModal();
    }
  };

  const handleCloseModal = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isEnlarged) {
      closeModal();
    }
  };

  const shouldShowCursor = onClick || !disableEnlarge;

  // CloudinaryImage props for the thumbnail
  const thumbnailProps: CloudinaryImageProps = {
    publicId,
    width,
    height,
    alt,
    quality,
    format,
    gravity,
    crop,
    transformations,
    cloudName,
    enableLazyLoading,
    enableResponsive,
    responsiveStepSize,
    responsiveWidths,
    enablePlaceholder,
    placeholderType,
    enableAccessibility,
    accessibilityMode,
    responsive,
    dpr,
    enhance,
    className: `w-full h-full object-cover transition-transform ${
      shouldShowCursor ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
    }`
  };

  // CloudinaryImage props for the enlarged version
  const enlargedProps: CloudinaryImageProps = {
    publicId,
    width: actualEnlargedWidth,
    height: actualEnlargedHeight,
    alt,
    quality: quality === "auto" ? "auto" : Math.max(quality as number, 80), // Higher quality for enlarged
    format,
    gravity,
    crop: "fit", // Use 'fit' for enlarged to preserve aspect ratio
    transformations,
    cloudName,
    enableLazyLoading: false, // Don't lazy load the modal image
    enableResponsive: false, // Fixed size for modal
    enablePlaceholder: false, // No placeholder needed in modal
    enableAccessibility: false, // No accessibility overlay in modal
    responsive: false,
    dpr,
    enhance,
    className: "max-w-full max-h-full object-contain rounded-lg shadow-2xl"
  };

  return (
    <>
      {/* Clickable Thumbnail */}
      <div
        className={`relative overflow-hidden transition-all duration-200 ${
          shouldShowCursor ? 'cursor-pointer' : ''
        } ${className}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={shouldShowCursor ? 0 : -1}
        role={shouldShowCursor ? "button" : undefined}
        aria-label={shouldShowCursor && !onClick ? `Click to enlarge ${alt}` : undefined}
        {...rest}
      >
        <CloudinaryImage {...thumbnailProps} />
      </div>

      {/* Enlarged Modal */}
      {isEnlarged && !disableEnlarge && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={`Enlarged view of ${alt}`}
        >
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            {/* Close button */}
            <CloseButton
              onClose={closeModal}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
            />
            
            {/* Enlarged image */}
            <div className="relative">
              <CloudinaryImage {...enlargedProps} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClickableCloudinaryImage;
