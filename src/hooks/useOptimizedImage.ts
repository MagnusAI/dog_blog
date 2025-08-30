import { useMemo } from "react";
import { getDefaultImageService, type ImageOptions } from "../services/imageService";

export interface UseOptimizedImageOptions {
  publicId: string;
  size: number;
  enlargedSize?: number;
  quality?: "auto" | number;
  format?: "auto" | "webp" | "jpg" | "png";
  crop?: "fill" | "fit" | "scale" | "crop" | "pad" | "limitFit";
  gravity?: "auto" | "face" | "center" | "north" | "south" | "east" | "west";
  transformations?: string[];
  dpr?: number;
}

export function useOptimizedImage({
  publicId,
  size,
  enlargedSize = 400,
  quality = "auto",
  format = "auto",
  crop = "fill",
  gravity = "auto",
  transformations = [],
  dpr = 1
}: UseOptimizedImageOptions) {
  const imageService = getDefaultImageService();

  const urls = useMemo(() => {
    // Standard size options (with DPR for retina)
    const standardOptions: ImageOptions = {
      width: size,
      height: size,
      quality,
      format,
      crop,
      gravity,
      dpr,
      transformations
    };

    // Enlarged size options for modal
    const enlargedOptions: ImageOptions = {
      width: enlargedSize,
      height: enlargedSize,
      quality,
      format,
      crop,
      gravity,
      dpr,
      transformations
    };

    return {
      standard: imageService.getOptimizedUrl(publicId, standardOptions),
      enlarged: imageService.getOptimizedUrl(publicId, enlargedOptions)
    };
  }, [publicId, size, enlargedSize, quality, format, crop, gravity, dpr, transformations, imageService]);

  return urls;
}
