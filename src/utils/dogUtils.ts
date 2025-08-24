/**
 * Utility functions for handling dog-related operations
 */

/**
 * Encodes a dog ID for safe use in URLs
 * Handles special characters like forward slashes in registration numbers
 * @param dogId - The original dog ID (e.g., "02239/2006")
 * @returns URL-safe encoded dog ID
 */
export function encodeDogId(dogId: string): string {
  return encodeURIComponent(dogId);
}

/**
 * Decodes a dog ID from URL parameters
 * @param encodedDogId - The URL-encoded dog ID
 * @returns The original dog ID
 */
export function decodeDogId(encodedDogId: string): string {
  return decodeURIComponent(encodedDogId);
}

/**
 * Creates a navigation path to a dog's detail page
 * @param dogId - The dog ID to navigate to
 * @returns The encoded path for navigation
 */
export function createDogDetailPath(dogId: string): string {
  return `/dogs/${encodeDogId(dogId)}`;
}
