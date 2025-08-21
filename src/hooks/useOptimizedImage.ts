import { useMemo } from "react";
import { getDefaultImageService, type ImageOptions } from "../services/imageService";

export interface UseOptimizedImageOptions {
  publicId: string;
  size: number;
  enlargedSize?: number;
  quality?: "auto" | number;
  format?: "auto" | "webp" | "jpg" | "png";
  transformations?: string[];
}

export function useOptimizedImage({
  publicId,
  size,
  enlargedSize = 400,
  quality = "auto",
  format = "auto",
  transformations = []
}: UseOptimizedImageOptions) {
  const imageService = getDefaultImageService();

  const urls = useMemo(() => {
    // Standard size options (with 2x for retina)
    const standardOptions: ImageOptions = {
      width: size * 2,
      height: size * 2,
      quality,
      format,
      crop: "fill",
      gravity: "face",
      transformations
    };

    // Enlarged size options for modal
    const enlargedOptions: ImageOptions = {
      width: enlargedSize,
      height: enlargedSize,
      quality,
      format,
      crop: "fill",
      gravity: "face",
      transformations
    };

    return {
      standard: imageService.getOptimizedUrl(publicId, standardOptions),
      enlarged: imageService.getOptimizedUrl(publicId, enlargedOptions)
    };
  }, [publicId, size, enlargedSize, quality, format, transformations, imageService]);

  return urls;
}
