import { useState } from "react";
import type { HTMLAttributes } from "react";
import { CloseButton } from "./ui";
import { useModal } from "../hooks/useModal";

export type ClickableImageProps = {
  src: string;                    // Image URL (already processed/optimized)
  enlargedSrc?: string;           // Optional larger version for modal
  alt: string;                    // Alt text for accessibility
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl"; // Predefined sizes
  customSize?: number;            // Custom size in pixels
  fallbackInitials?: string;      // Fallback initials if image fails
  fallbackBgColor?: string;       // Background color for fallback
  onClick?: () => void;           // Custom click handler
  disableEnlarge?: boolean;       // Disable click-to-enlarge functionality
} & Omit<HTMLAttributes<HTMLDivElement>, "onClick">;

const ClickableImage = ({
  src,
  enlargedSrc,
  alt,
  size = "md",
  customSize,
  fallbackInitials,
  fallbackBgColor = "#6366f1",
  onClick,
  disableEnlarge = false,
  className = "",
  ...rest
}: ClickableImageProps) => {
  const { isOpen: isEnlarged, open: openModal, close: closeModal } = useModal();
  const [imageError, setImageError] = useState(false);

  // Size mappings
  const sizeMap = {
    xs: 16,
    sm: 32,
    md: 48,
    lg: 64,
    xl: 80,
    xxl: 160,
    xxxl: 320,
  };

  const actualSize = customSize || sizeMap[size];

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

  // Fallback content when image fails to load
  const FallbackContent = () => (
    <div
      className="flex items-center justify-center text-white font-semibold rounded-lg w-full h-full"
      style={{ backgroundColor: fallbackBgColor }}
    >
      {fallbackInitials || alt.charAt(0).toUpperCase()}
    </div>
  );

  const shouldShowCursor = onClick || !disableEnlarge;

  return (
    <>
      {/* Profile Picture */}
      <div
        className={`relative rounded-lg overflow-hidden transition-transform ${
          shouldShowCursor ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
        } ${className}`}
        style={{ width: actualSize, height: actualSize }}
        onClick={handleClick}
        {...rest}
      >
        {imageError ? (
          <FallbackContent />
        ) : (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        )}
      </div>

      {/* Enlarged Modal */}
      {isEnlarged && !disableEnlarge && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div className="relative max-w-lg max-h-full">
            {/* Close button */}
            <CloseButton
              onClose={closeModal}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            />
            
            {/* Enlarged image */}
            <div className="rounded-lg overflow-hidden shadow-2xl">
              {imageError ? (
                <div
                  className="flex items-center justify-center text-white font-bold text-6xl rounded-lg"
                  style={{ 
                    backgroundColor: fallbackBgColor,
                    width: 400,
                    height: 400
                  }}
                >
                  {fallbackInitials || alt.charAt(0).toUpperCase()}
                </div>
              ) : (
                <img
                  src={enlargedSrc || src}
                  alt={alt}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onError={() => setImageError(true)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClickableImage;
