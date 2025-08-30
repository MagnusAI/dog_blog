// Image service for handling different image providers
// This allows easy switching between Cloudinary, ImageKit, etc.

import { Cloudinary } from "@cloudinary/url-gen";
import { quality } from "@cloudinary/url-gen/actions/delivery";
import { format } from "@cloudinary/url-gen/actions/delivery";
import { auto } from "@cloudinary/url-gen/qualifiers/quality";
import { auto as autoFormat } from "@cloudinary/url-gen/qualifiers/format";
import { fill, fit, scale, crop, pad, limitFit } from "@cloudinary/url-gen/actions/resize";
import { focusOn, autoGravity, compass } from "@cloudinary/url-gen/qualifiers/gravity";
import { face } from "@cloudinary/url-gen/qualifiers/focusOn";
import { improve } from "@cloudinary/url-gen/actions/adjust";

export interface ImageService {
  getOptimizedUrl(publicId: string, options: ImageOptions): string;
  getMultipleUrls(publicId: string, sizes: ImageOptions[]): string[];
}

export interface ImageOptions {
  width: number;
  height: number;
  quality?: "auto" | number;
  format?: "auto" | "webp" | "jpg" | "png";
  crop?: "fill" | "fit" | "scale" | "crop" | "pad" | "limitFit";
  gravity?: "auto" | "face" | "center" | "north" | "south" | "east" | "west" | "auto:subject" | "auto:classic";
  transformations?: string[];
  dpr?: number; // Device pixel ratio for retina displays
  enhance?: boolean; // Apply automatic enhancements
  aspectRatio?: string; // Target aspect ratio (e.g., "1:1", "16:9")
}

// Cloudinary implementation using React SDK
export class CloudinaryService implements ImageService {
  private cld: Cloudinary;
  
  constructor(cloudName: string) {
    this.cld = new Cloudinary({
      cloud: {
        cloudName: cloudName
      }
    });
  }

  getOptimizedUrl(publicId: string, options: ImageOptions): string {
    // If publicId is already a full URL, return as is
    if (publicId.startsWith("http")) return publicId;

    const {
      width,
      height,
      quality: qualityOption = "auto",
      format: formatOption = "auto",
      gravity = "auto",
      crop: cropMode = "fill",
      dpr = 1,
      enhance = false,
      transformations = []
    } = options;

    // Create image instance
    let image = this.cld.image(publicId);

    // Apply DPR (Device Pixel Ratio) for retina displays
    const actualWidth = Math.round(width * dpr);
    const actualHeight = Math.round(height * dpr);

    // Apply resize based on crop mode and gravity with advanced options
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

    // Apply custom transformations (raw transformation string)
    if (transformations.length > 0) {
      // For custom transformations, we'll fall back to URL building
      const customTransforms = transformations.join(',');
      const baseUrl = image.toURL();
      // Insert custom transformations before the version part
      return baseUrl.replace(/\/image\/upload\//, `/image/upload/${customTransforms}/`);
    }

    return image.toURL();
  }

  getMultipleUrls(publicId: string, sizes: ImageOptions[]): string[] {
    return sizes.map(size => this.getOptimizedUrl(publicId, size));
  }
}

// Example: ImageKit implementation (for future use)
export class ImageKitService implements ImageService {
  private urlEndpoint: string;
  
  constructor(urlEndpoint: string) {
    this.urlEndpoint = urlEndpoint;
  }

  getOptimizedUrl(publicId: string, options: ImageOptions): string {
    if (publicId.startsWith("http")) return publicId;

    const {
      width,
      height,
      quality = "auto",
      format = "auto",
      crop = "maintain_ratio"
    } = options;

    const params = new URLSearchParams({
      "tr": `w-${width},h-${height},c-${crop},q-${quality},f-${format}`
    });

    return `${this.urlEndpoint}/${publicId}?${params.toString()}`;
  }

  getMultipleUrls(publicId: string, sizes: ImageOptions[]): string[] {
    return sizes.map(size => this.getOptimizedUrl(publicId, size));
  }
}

// Factory function to create image service
export function createImageService(
  provider: "cloudinary" | "imagekit", 
  config: any
): ImageService {
  switch (provider) {
    case "cloudinary":
      return new CloudinaryService(config.cloudName);
    case "imagekit":
      return new ImageKitService(config.urlEndpoint);
    default:
      throw new Error(`Unsupported image provider: ${provider}`);
  }
}

// Default service instance (can be configured globally)
let defaultImageService: ImageService | null = null;

export function setDefaultImageService(service: ImageService) {
  defaultImageService = service;
}

export function getDefaultImageService(): ImageService {
  if (!defaultImageService) {
    throw new Error("No default image service configured. Call setDefaultImageService() first.");
  }
  return defaultImageService;
}
