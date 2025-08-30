import { AdvancedImage } from '@cloudinary/react';
import { lazyload, responsive as responsivePlugin, accessibility, placeholder } from '@cloudinary/react';
import { Cloudinary } from "@cloudinary/url-gen";
import { quality } from "@cloudinary/url-gen/actions/delivery";
import { format } from "@cloudinary/url-gen/actions/delivery";
import { auto } from "@cloudinary/url-gen/qualifiers/quality";
import { auto as autoFormat } from "@cloudinary/url-gen/qualifiers/format";
import { fill, fit, scale, crop, pad, limitFit } from "@cloudinary/url-gen/actions/resize";
import { focusOn, autoGravity, compass } from "@cloudinary/url-gen/qualifiers/gravity";
import { face } from "@cloudinary/url-gen/qualifiers/focusOn";
import { improve } from "@cloudinary/url-gen/actions/adjust";
import { useMemo } from 'react';

export interface CloudinaryImageProps {
  publicId: string;
  width: number;
  height: number;
  alt: string;
  className?: string;
  quality?: "auto" | number;
  format?: "auto" | "webp" | "jpg" | "png";
  gravity?: "auto" | "face" | "faces" | "body" | "center" | "north" | "south" | "east" | "west" | "auto:subject" | "auto:classic";
  crop?: "fill" | "fit" | "scale" | "crop" | "pad" | "limitFit";
  transformations?: string[];
  cloudName?: string;
  // React Plugin Options
  enableLazyLoading?: boolean;
  enableResponsive?: boolean;
  responsiveStepSize?: number;
  responsiveWidths?: number[];
  enablePlaceholder?: boolean;
  placeholderType?: "blur" | "pixelate" | "vectorize" | "predominant";
  enableAccessibility?: boolean;
  accessibilityMode?: "monochrome" | "darkmode" | "brightmode" | "colorblind";
  // Legacy responsive support
  responsive?: boolean;
  dpr?: number; // Device pixel ratio override
  enhance?: boolean; // Apply automatic enhancements
}

const CloudinaryImage = ({
  publicId,
  width,
  height,
  alt,
  className = "",
  quality: qualityOption = "auto",
  format: formatOption = "auto",
  gravity = "auto",
  crop: cropMode = "fill",
  transformations = [],
  cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dsstocv9w",
  // React Plugin Options
  enableLazyLoading = true,
  enableResponsive = true,
  responsiveStepSize = 200,
  responsiveWidths,
  enablePlaceholder = true,
  placeholderType = "blur",
  enableAccessibility = false,
  accessibilityMode = "darkmode",
  // Legacy support
  responsive = true,
  dpr,
  enhance = false
}: CloudinaryImageProps) => {
  // Detect device pixel ratio for retina displays
  const devicePixelRatio = dpr || (typeof window !== 'undefined' ? window.devicePixelRatio : 1);
  const cldImage = useMemo(() => {
    if (!cloudName) {
      console.warn('VITE_CLOUDINARY_CLOUD_NAME not found in environment variables');
      return null;
    }

    // Create Cloudinary instance
    const cld = new Cloudinary({
      cloud: {
        cloudName: cloudName
      }
    });

    // Create image instance
    let image = cld.image(publicId);

    // Apply DPR for retina displays
    const actualWidth = responsive ? Math.round(width * devicePixelRatio) : width;
    const actualHeight = responsive ? Math.round(height * devicePixelRatio) : height;

    // Apply resize based on crop mode and gravity
    let resizeTransform;
    
    switch (cropMode) {
      case "fill":
        resizeTransform = fill().width(actualWidth).height(actualHeight);
        break;
      case "fit":
        resizeTransform = fit().width(actualWidth).height(actualHeight);
        break;
      case "scale":
        resizeTransform = scale().width(actualWidth).height(actualHeight);
        break;
      case "crop":
        resizeTransform = crop().width(actualWidth).height(actualHeight);
        break;
      case "pad":
        resizeTransform = pad().width(actualWidth).height(actualHeight);
        break;
      case "limitFit":
        resizeTransform = limitFit().width(actualWidth).height(actualHeight);
        break;
      default:
        resizeTransform = fill().width(actualWidth).height(actualHeight);
    }

    // Apply advanced gravity options for modes that support it
    if ((cropMode === "fill" || cropMode === "crop") && gravity) {
      if (gravity === "face") {
        resizeTransform = (resizeTransform as any).gravity(focusOn(face()));
      } else if (gravity === "auto") {
        resizeTransform = (resizeTransform as any).gravity(autoGravity());
      } else if (gravity === "auto:subject") {
        // Enhanced auto-gravity focusing on main subject
        resizeTransform = (resizeTransform as any).gravity(autoGravity());
      } else if (gravity === "auto:classic") {
        // Classic auto-gravity algorithm
        resizeTransform = (resizeTransform as any).gravity(autoGravity());
      } else if (["center", "north", "south", "east", "west"].includes(gravity)) {
        resizeTransform = (resizeTransform as any).gravity(compass(gravity as any));
      }
    }

    image = image.resize(resizeTransform);

    // Apply automatic enhancements if requested
    if (enhance) {
      image = image.adjust(improve());
    }

    // Apply quality
    if (qualityOption === "auto") {
      image = image.delivery(quality(auto()));
    } else {
      image = image.delivery(quality(qualityOption));
    }

    // Apply format
    if (formatOption === "auto") {
      image = image.delivery(format(autoFormat()));
    } else {
      image = image.delivery(format(formatOption));
    }

    // Apply custom transformations if any
    if (transformations.length > 0) {
      // For custom transformations, we can chain them
      // This is a simplified approach - you might need to parse and apply specific transformations
      transformations.forEach(transform => {
        // This would need to be expanded based on your specific transformation needs
        console.log('Custom transformation:', transform);
      });
    }

    return image;
  }, [publicId, width, height, gravity, cropMode, qualityOption, formatOption, enhance, transformations, cloudName, responsive, devicePixelRatio]);

  if (!cldImage) {
    // Fallback to regular img if Cloudinary is not configured
    return (
      <img
        src={`https://via.placeholder.com/${width}x${height}?text=Image+Not+Found`}
        alt={alt}
        className={className}
        width={width}
        height={height}
      />
    );
  }

  // Build plugins array based on enabled features
  const plugins = [];

  // Add responsive plugin (recommended first)  
  if (enableResponsive) {
    if (responsiveWidths) {
      plugins.push(responsivePlugin({ steps: responsiveWidths }));
    } else {
      plugins.push(responsivePlugin({ steps: responsiveStepSize }));
    }
  }

  // Add accessibility plugin
  if (enableAccessibility) {
    plugins.push(accessibility({ mode: accessibilityMode }));
  }

  // Add placeholder plugin (recommended before lazy loading)
  if (enablePlaceholder) {
    plugins.push(placeholder({ mode: placeholderType }));
  }

  // Add lazy loading plugin (recommended last)
  if (enableLazyLoading) {
    plugins.push(lazyload());
  }

  return (
    <AdvancedImage
      cldImg={cldImage}
      alt={alt}
      className={className}
      width={width}
      height={height}
      plugins={plugins}
    />
  );
};

export default CloudinaryImage;
