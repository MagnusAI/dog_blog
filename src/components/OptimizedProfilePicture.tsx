import ClickableImage, { type ClickableImageProps } from "./ClickableImage";
import { useOptimizedImage } from "../hooks/useOptimizedImage";

export interface OptimizedProfilePictureProps extends Omit<ClickableImageProps, "src" | "enlargedSrc"> {
  publicId: string;                // Image identifier (Cloudinary public ID, etc.)
  transformations?: string[];      // Image transformations
  quality?: "auto" | number;       // Image quality
  format?: "auto" | "webp" | "jpg" | "png"; // Image format
  enlargedSize?: number;           // Size for enlarged modal
}

const OptimizedProfilePicture = ({
  publicId,
  transformations = [],
  quality = "auto",
  format = "auto",
  enlargedSize = 400,
  size = "md",
  customSize,
  ...rest
}: OptimizedProfilePictureProps) => {
  // Size mappings (same as ClickableImage)
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

  const { standard, enlarged } = useOptimizedImage({
    publicId,
    size: actualSize,
    enlargedSize,
    quality,
    format,
    transformations,
  });

  return (
    <ClickableImage
      src={standard}
      enlargedSrc={enlarged}
      size={size}
      customSize={customSize}
      {...rest}
    />
  );
};

export default OptimizedProfilePicture;
