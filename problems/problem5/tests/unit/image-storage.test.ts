import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { saveBookImage, deleteBookImage } from '../../src/common/utils/image-storage';
import { AppError } from '../../src/common/errors/AppError';
import { BOOK_UPLOADS_DIR } from '../../src/config/paths';
import { MAX_IMAGE_BYTES } from '../../src/constants/image';

const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const storedFilePath = (imageUrl: string) => path.join(BOOK_UPLOADS_DIR, path.basename(imageUrl));

test('saveBookImage stores raw base64 with an explicit mime type', async () => {
  const imageUrl = await saveBookImage({ imageBase64: tinyPngBase64, imageMimeType: 'image/png' });

  assert.match(imageUrl, /^\/uploads\/books\/.+\.png$/);
  await assert.doesNotReject(() => access(storedFilePath(imageUrl)));

  await deleteBookImage(imageUrl);
});

test('saveBookImage parses a data URL and infers the mime type', async () => {
  const imageUrl = await saveBookImage({ imageBase64: `data:image/png;base64,${tinyPngBase64}` });

  assert.match(imageUrl, /\.png$/);
  await assert.doesNotReject(() => access(storedFilePath(imageUrl)));

  await deleteBookImage(imageUrl);
});

test('saveBookImage rejects an unsupported mime type with a 400 AppError', async () => {
  await assert.rejects(
    () => saveBookImage({ imageBase64: tinyPngBase64, imageMimeType: 'image/tiff' }),
    (err: unknown) => err instanceof AppError && err.status === 400,
  );
});

test('saveBookImage rejects raw base64 without a mime type', async () => {
  await assert.rejects(
    () => saveBookImage({ imageBase64: tinyPngBase64 }),
    (err: unknown) => err instanceof AppError && err.status === 400,
  );
});

test('saveBookImage rejects malformed base64', async () => {
  await assert.rejects(
    () => saveBookImage({ imageBase64: '!!!not-base64!!!', imageMimeType: 'image/png' }),
    (err: unknown) => err instanceof AppError && err.status === 400 && /valid base64/.test(err.message),
  );
});

test('saveBookImage rejects images larger than the 2MB limit', async () => {
  const oversized = Buffer.alloc(MAX_IMAGE_BYTES + 3).toString('base64');
  await assert.rejects(
    () => saveBookImage({ imageBase64: oversized, imageMimeType: 'image/png' }),
    (err: unknown) => err instanceof AppError && err.status === 400 && /2MB/.test(err.message),
  );
});

test('deleteBookImage removes a stored file', async () => {
  const imageUrl = await saveBookImage({ imageBase64: tinyPngBase64, imageMimeType: 'image/png' });
  await deleteBookImage(imageUrl);
  await assert.rejects(() => access(storedFilePath(imageUrl)));
});

test('deleteBookImage ignores external URLs and missing files', async () => {
  await assert.doesNotReject(() => deleteBookImage('https://example.com/cover.png'));
  await assert.doesNotReject(() => deleteBookImage('/uploads/books/does-not-exist.png'));
  await assert.doesNotReject(() => deleteBookImage(null));
});
