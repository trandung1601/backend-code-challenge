/**
 * Single source of truth for supported image types and size limits,
 * shared by the multipart middleware, the Zod validators and image storage.
 */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const SUPPORTED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type SupportedImageMimeType = (typeof SUPPORTED_IMAGE_MIME_TYPES)[number];

export const EXTENSIONS_BY_MIME_TYPE: Record<SupportedImageMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export const SUPPORTED_IMAGE_TYPES_MESSAGE = SUPPORTED_IMAGE_MIME_TYPES.join(', ');
