import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { AppError } from './AppError';
import { BOOK_UPLOADS_DIR } from '../config/paths';
import {
  EXTENSIONS_BY_MIME_TYPE,
  MAX_IMAGE_BYTES,
  SUPPORTED_IMAGE_TYPES_MESSAGE,
  type SupportedImageMimeType,
} from '../constants/image';

const PUBLIC_UPLOAD_PREFIX = '/uploads/books/';

interface SaveBookImageInput {
  imageBase64: string;
  imageMimeType?: string;
}

function parseImageInput({ imageBase64, imageMimeType }: SaveBookImageInput) {
  const dataUrlMatch = /^data:([^;,]+);base64,(.+)$/i.exec(imageBase64);

  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1].toLowerCase(),
      base64: dataUrlMatch[2],
    };
  }

  return {
    mimeType: imageMimeType,
    base64: imageBase64,
  };
}

function assertSupportedMimeType(mimeType: string | undefined): asserts mimeType is SupportedImageMimeType {
  if (!mimeType || !(mimeType in EXTENSIONS_BY_MIME_TYPE)) {
    throw new AppError(400, `imageMimeType must be one of ${SUPPORTED_IMAGE_TYPES_MESSAGE}`);
  }
}

export async function saveBookImage(input: SaveBookImageInput) {
  const { mimeType, base64 } = parseImageInput(input);
  assertSupportedMimeType(mimeType);

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 !== 0) {
    throw new AppError(400, 'imageBase64 must be valid base64');
  }

  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length === 0) {
    throw new AppError(400, 'imageBase64 cannot be empty');
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new AppError(400, 'imageBase64 must be 2MB or smaller');
  }

  await mkdir(BOOK_UPLOADS_DIR, { recursive: true });

  const extension = EXTENSIONS_BY_MIME_TYPE[mimeType];
  const filename = `${Date.now()}-${randomUUID()}.${extension}`;
  await writeFile(path.join(BOOK_UPLOADS_DIR, filename), buffer);

  return `${PUBLIC_UPLOAD_PREFIX}${filename}`;
}

/**
 * Best-effort removal of a locally stored book image. External URLs and
 * already-missing files are ignored; other filesystem errors are logged
 * but never fail the request that triggered the cleanup.
 */
export async function deleteBookImage(imageUrl: string | null | undefined) {
  if (!imageUrl?.startsWith(PUBLIC_UPLOAD_PREFIX)) return;

  const filename = path.basename(imageUrl);
  try {
    await unlink(path.join(BOOK_UPLOADS_DIR, filename));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error(`Failed to delete image ${imageUrl}:`, err);
    }
  }
}
