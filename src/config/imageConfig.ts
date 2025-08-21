// Image service configuration
// Set up your image service here

import { createImageService, setDefaultImageService } from "../services/imageService";

// Configure your image service
// For browser-only usage, we only need the cloud name
const imageService = createImageService("cloudinary", {
  cloudName: "dsstocv9w", // You can also use: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
});

// Set as default service
setDefaultImageService(imageService);

// Alternative: ImageKit configuration (uncomment to use)
// const imageService = createImageService("imagekit", {
//   urlEndpoint: "https://ik.imagekit.io/your-imagekit-id"
// });
// setDefaultImageService(imageService);

export { imageService };
