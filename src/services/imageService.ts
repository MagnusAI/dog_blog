// Image service for handling different image providers
// This allows easy switching between Cloudinary, ImageKit, etc.

import { Cloudinary } from "@cloudinary/url-gen";
import { quality } from "@cloudinary/url-gen/actions/delivery";
import { format } from "@cloudinary/url-gen/actions/delivery";
import { auto } from "@cloudinary/url-gen/qualifiers/quality";
import { auto as autoFormat } from "@cloudinary/url-gen/qualifiers/format";
import { fill } from "@cloudinary/url-gen/actions/resize";
import { focusOn } from "@cloudinary/url-gen/qualifiers/gravity";
import { face } from "@cloudinary/url-gen/qualifiers/focusOn";

export interface ImageService {
  getOptimizedUrl(publicId: string, options: ImageOptions): string;
  getMultipleUrls(publicId: string, sizes: ImageOptions[]): string[];
}

export interface ImageOptions {
  width: number;
  height: number;
  quality?: "auto" | number;
  format?: "auto" | "webp" | "jpg" | "png";
  crop?: "fill" | "fit" | "scale" | "crop";
  gravity?: "auto" | "face" | "center" | "north" | "south" | "east" | "west";
  transformations?: string[];
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
      gravity = "face",
      transformations = []
    } = options;

    // Create image instance
    let image = this.cld.image(publicId);

    // Apply resize with gravity
    if (gravity === "face") {
      image = image.resize(fill().width(width).height(height).gravity(focusOn(face())));
    } else {
      image = image.resize(fill().width(width).height(height));
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
