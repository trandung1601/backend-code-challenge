import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError';

const MAX_MULTIPART_BYTES = 3 * 1024 * 1024;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const supportedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function getBoundary(contentType: string) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  return match?.[1] ?? match?.[2];
}

function parseContentDisposition(value: string | undefined) {
  const name = /name="([^"]+)"/i.exec(value ?? '')?.[1];
  const filename = /filename="([^"]*)"/i.exec(value ?? '')?.[1];
  return { name, filename };
}

async function readMultipartBody(req: Parameters<RequestHandler>[0]) {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;

    if (total > MAX_MULTIPART_BYTES) {
      throw new AppError(400, 'multipart payload must be 3MB or smaller');
    }

    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}

function parseMultipartParts(body: Buffer, boundary: string) {
  const delimiter = Buffer.from(`--${boundary}`);
  const nextDelimiter = Buffer.from(`\r\n--${boundary}`);
  const headerSeparator = Buffer.from('\r\n\r\n');
  const parts: Array<{ headers: Record<string, string>; content: Buffer }> = [];

  let position = body.indexOf(delimiter);
  if (position === -1) {
    throw new AppError(400, 'multipart boundary was not found');
  }

  while (position !== -1) {
    position += delimiter.length;

    if (body.subarray(position, position + 2).equals(Buffer.from('--'))) {
      break;
    }

    if (!body.subarray(position, position + 2).equals(Buffer.from('\r\n'))) {
      throw new AppError(400, 'invalid multipart payload');
    }

    position += 2;
    const nextPosition = body.indexOf(nextDelimiter, position);
    if (nextPosition === -1) {
      throw new AppError(400, 'multipart closing boundary was not found');
    }

    const part = body.subarray(position, nextPosition);
    const separatorIndex = part.indexOf(headerSeparator);
    if (separatorIndex === -1) {
      throw new AppError(400, 'multipart part headers are invalid');
    }

    const rawHeaders = part.subarray(0, separatorIndex).toString('utf8');
    const headers = Object.fromEntries(
      rawHeaders.split('\r\n').map((line) => {
        const [name, ...value] = line.split(':');
        return [name.toLowerCase(), value.join(':').trim()];
      }),
    );

    parts.push({
      headers,
      content: part.subarray(separatorIndex + headerSeparator.length),
    });

    position = nextPosition + 2;
  }

  return parts;
}

/**
 * Minimal multipart parser for Swagger/local uploads.
 * It supports scalar form fields and one book image file field named `image`.
 */
export const parseMultipartBookUpload: RequestHandler = async (req, _res, next) => {
  try {
    const contentType = req.headers['content-type'];
    if (!contentType?.toLowerCase().startsWith('multipart/form-data')) {
      return next();
    }

    const boundary = getBoundary(contentType);
    if (!boundary) {
      throw new AppError(400, 'multipart boundary is required');
    }

    const fields: Record<string, unknown> = {};
    const body = await readMultipartBody(req);

    for (const { headers, content } of parseMultipartParts(body, boundary)) {
      const { name, filename } = parseContentDisposition(headers['content-disposition']);
      if (!name) continue;

      if (filename !== undefined) {
        if (!filename) continue;
        if (name !== 'image') continue;

        const mimeType = headers['content-type'];
        if (!supportedImageTypes.has(mimeType)) {
          throw new AppError(400, 'image must be jpeg, png, webp, or gif');
        }

        if (content.length > MAX_IMAGE_BYTES) {
          throw new AppError(400, 'image must be 2MB or smaller');
        }

        fields.imageBase64 = content.toString('base64');
        fields.imageMimeType = mimeType;
        continue;
      }

      fields[name] = content.toString('utf8');
    }

    req.body = fields;
    return next();
  } catch (err) {
    return next(err);
  }
};
