import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { AppError } from './AppError';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'books');

const extensionsByMimeType = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
} as const;

type SupportedMimeType = keyof typeof extensionsByMimeType;

interface SaveBookImageInput {
  imageBase64: string;
  imageMimeType?: string;
}

function parseImageInput({ imageBase64, imageMimeType }: SaveBookImageInput) {
  const dataUrlMatch = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/i.exec(imageBase64);

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

function assertSupportedMimeType(mimeType: string | undefined): asserts mimeType is SupportedMimeType {
  if (!mimeType || !(mimeType in extensionsByMimeType)) {
    throw new AppError(400, 'imageMimeType must be one of image/jpeg, image/png, image/webp, image/gif');
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

  await mkdir(UPLOAD_DIR, { recursive: true });

  const extension = extensionsByMimeType[mimeType];
  const filename = `${Date.now()}-${randomUUID()}.${extension}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/uploads/books/${filename}`;
}
