import { useState, useEffect } from "react";
import { z } from "zod";
import Button from "./ui/Button";
import Typography from "./ui/Typography";
import { dogService, type MyDog } from "../services/supabaseService";

// Zod schema for news post validation
const newsPostSchema = z.object({
  title: z.string()
    .min(10, "Title must be at least 10 characters")
    .max(100, "Title must be less than 100 characters"),
  excerpt: z.string()
    .min(50, "Excerpt must be at least 50 characters")
    .max(500, "Excerpt must be less than 500 characters"),
  content: z.string()
    .min(100, "Content must be at least 100 characters")
    .max(5000, "Content must be less than 5000 characters"),
  image: z.instanceof(File)
    .optional()
    .refine((file) => {
      if (!file) return true;
      return file.size <= 5 * 1024 * 1024; // 5MB limit
    }, "Image must be smaller than 5MB")
    .refine((file) => {
      if (!file) return true;
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      return allowedTypes.includes(file.type);
    }, "Image must be a JPEG, PNG, or WebP file"),
  imageAlt: z.string()
    .max(100, "Image alt text must be less than 100 characters")
    .optional(),
  taggedDogs: z.array(z.string())
    .optional()
    .default([])
});

export type NewsPostFormData = z.infer<typeof newsPostSchema>;

// Type for the data that gets submitted (includes auto-generated date)
export type NewsPostSubmissionData = NewsPostFormData & {
  date: string;
};

export interface NewsPostFormProps {
  onSubmit: (data: NewsPostSubmissionData) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<NewsPostFormData>;
  isLoading?: boolean;
}

const NewsPostForm = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false
}: NewsPostFormProps) => {
  const [formData, setFormData] = useState<NewsPostFormData>({
    title: initialData?.title || "",
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
    image: initialData?.image || undefined,
    imageAlt: initialData?.imageAlt || "",
    taggedDogs: initialData?.taggedDogs || []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableDogs, setAvailableDogs] = useState<MyDog[]>([]);
  const [loadingDogs, setLoadingDogs] = useState(true);

  // Load available dogs on component mount
  useEffect(() => {
    const loadDogs = async () => {
      try {
        const dogs = await dogService.getMyDogs();
        setAvailableDogs(dogs);
      } catch (error) {
        console.error("Error loading dogs:", error);
      } finally {
        setLoadingDogs(false);
      }
    };

    loadDogs();
  }, []);

  const handleInputChange = (
    field: keyof NewsPostFormData,
    value: string | File | undefined | string[]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleInputChange("image", file);
  };

  const handleDogToggle = (dogId: string) => {
    const currentTaggedDogs = formData.taggedDogs || [];
    const isCurrentlyTagged = currentTaggedDogs.includes(dogId);
    
    if (isCurrentlyTagged) {
      // Remove dog from tagged list
      const updatedDogs = currentTaggedDogs.filter(id => id !== dogId);
      handleInputChange("taggedDogs", updatedDogs);
    } else {
      // Add dog to tagged list
      const updatedDogs = [...currentTaggedDogs, dogId];
      handleInputChange("taggedDogs", updatedDogs);
    }
  };

  const validateForm = () => {
    try {
      newsPostSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            fieldErrors[issue.path[0] as string] = issue.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Add current date to the form data when submitting
      const submissionData = {
        ...formData,
        date: new Date().toISOString()
      };
      await onSubmit(submissionData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isLoading || isSubmitting;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="mb-6">
        <Typography variant="h3" weight="semibold">
          {initialData ? "Edit News Post" : "Create News Post"}
        </Typography>
        <Typography variant="body" color="secondary" className="mt-2">
          Fill in the details below to create a new news post for your kennel.
        </Typography>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block mb-2">
            <Typography variant="body" weight="medium">
              Title *
            </Typography>
          </label>
          <input
            id="title"
            type="text"
            value={formData.title || ""}
            onChange={(e) => handleInputChange("title", e.target.value)}
            disabled={isFormDisabled}
            className={`
              w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-gray-900
              ${errors.title ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"}
              ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""}
            `}
            placeholder="Enter a compelling title for your news post"
          />
          {errors.title && (
            <Typography variant="caption" color="danger" className="mt-1">
              {errors.title}
            </Typography>
          )}
        </div>

        {/* Excerpt */}
        <div>
          <label htmlFor="excerpt" className="block mb-2">
            <Typography variant="body" weight="medium">
              Excerpt *
            </Typography>
          </label>
          <textarea
            id="excerpt"
            value={formData.excerpt || ""}
            onChange={(e) => handleInputChange("excerpt", e.target.value)}
            disabled={isFormDisabled}
            rows={3}
            className={`
              w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-vertical text-gray-900
              ${errors.excerpt ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"}
              ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""}
            `}
            placeholder="Write a brief summary that will appear in news previews"
          />
          {errors.excerpt && (
            <Typography variant="caption" color="danger" className="mt-1">
              {errors.excerpt}
            </Typography>
          )}
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block mb-2">
            <Typography variant="body" weight="medium">
              Content *
            </Typography>
          </label>
          <textarea
            id="content"
            value={formData.content || ""}
            onChange={(e) => handleInputChange("content", e.target.value)}
            disabled={isFormDisabled}
            rows={8}
            className={`
              w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-vertical text-gray-900
              ${errors.content ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"}
              ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""}
            `}
            placeholder="Write the full content of your news post"
          />
          {errors.content && (
            <Typography variant="caption" color="danger" className="mt-1">
              {errors.content}
            </Typography>
          )}
        </div>

        {/* Image Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2">
              <Typography variant="body" weight="medium">
                Upload Image
              </Typography>
            </label>
            <div className="relative">
              <input
                id="image"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={isFormDisabled}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className={`
                w-full px-4 py-3 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 transition-colors text-center
                ${errors.image ? "border-red-500 bg-red-50" : "border-gray-300 bg-white hover:bg-gray-50"}
                ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : "cursor-pointer"}
              `}>
                {formData.image ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <Typography variant="body" color="success">
                      {formData.image.name}
                    </Typography>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <Typography variant="body" color="secondary">
                      Click to upload image
                    </Typography>
                  </div>
                )}
              </div>
            </div>
            {errors.image && (
              <Typography variant="caption" color="danger" className="mt-1">
                {errors.image}
              </Typography>
            )}
            <Typography variant="caption" color="muted" className="mt-1">
              Supports JPEG, PNG, WebP up to 5MB
            </Typography>
          </div>

          <div>
            <label htmlFor="imageAlt" className="block mb-2">
              <Typography variant="body" weight="medium">
                Image Description
              </Typography>
            </label>
            <input
              id="imageAlt"
              type="text"
              value={formData.imageAlt || ""}
              onChange={(e) => handleInputChange("imageAlt", e.target.value)}
              disabled={isFormDisabled}
              className={`
                w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-gray-900
                ${errors.imageAlt ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"}
                ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""}
              `}
              placeholder="Describe the image for accessibility"
            />
            {errors.imageAlt && (
              <Typography variant="caption" color="danger" className="mt-1">
                {errors.imageAlt}
              </Typography>
            )}
          </div>
        </div>

        {/* Dog Tags Section */}
        <div>
          <label className="block mb-4">
            <Typography variant="body" weight="medium">
              Tag Kennel Dogs (Optional)
            </Typography>
            <Typography variant="caption" color="secondary" className="mt-1">
              Tag dogs that are featured in this news post
            </Typography>
          </label>
          
          {loadingDogs ? (
            <div className="flex items-center justify-center py-8">
              <Typography variant="body" color="secondary">
                Loading your dogs...
              </Typography>
            </div>
          ) : availableDogs.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <Typography variant="body" color="secondary">
                No dogs found in your kennel
              </Typography>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableDogs.map((myDog) => {
                if (!myDog.dog) return null;
                
                const isTagged = formData.taggedDogs?.includes(myDog.dog.id) || false;
                
                return (
                  <div
                    key={myDog.dog.id}
                    onClick={() => handleDogToggle(myDog.dog!.id)}
                    className={`
                      relative p-3 border rounded-lg cursor-pointer transition-all duration-200
                      ${isTagged 
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" 
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }
                      ${isFormDisabled ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Checkbox */}
                      <div className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                        ${isTagged 
                          ? "bg-blue-500 border-blue-500" 
                          : "border-gray-300 bg-white"
                        }
                      `}>
                        {isTagged && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      
                      {/* Dog Info */}
                      <div className="flex-1 min-w-0">
                        <Typography variant="body" weight="medium" className="truncate">
                          {myDog.dog.name}
                        </Typography>
                        <Typography variant="caption" color="secondary" className="truncate">
                          {myDog.dog.breed?.name || 'Unknown Breed'}
                        </Typography>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {formData.taggedDogs && formData.taggedDogs.length > 0 && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Typography variant="caption" color="primary">
                {formData.taggedDogs.length} dog(s) tagged in this post
              </Typography>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isFormDisabled}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={isFormDisabled}
          >
            {isSubmitting ? "Publishing..." : initialData ? "Update Post" : "Publish Post"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewsPostForm;
