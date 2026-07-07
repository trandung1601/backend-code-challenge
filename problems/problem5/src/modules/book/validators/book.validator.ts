import { z } from 'zod';
import { SUPPORTED_IMAGE_MIME_TYPES } from '../../../constants/image';
import { SUPPORTED_CURRENCIES, SUPPORTED_CURRENCIES_MESSAGE } from '../../../constants/currency';

const imageMimeTypeSchema = z.enum(SUPPORTED_IMAGE_MIME_TYPES);
const booleanSchema = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

// ISO 4217 code, accepted case-insensitively and normalized to upper case.
const currencySchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toUpperCase() : value),
  z.enum(SUPPORTED_CURRENCIES, {
    errorMap: () => ({ message: `currency must be one of: ${SUPPORTED_CURRENCIES_MESSAGE}` }),
  }),
);

const bookSchemaShape = {
  title: z.string().trim().min(1, 'title is required'),
  author: z.string().trim().min(1, 'author is required'),
  price: z.coerce.number({ invalid_type_error: 'price must be a number' }).nonnegative('price must be >= 0'),
  // Optional on input: the database defaults the currency to USD when omitted.
  currency: currencySchema.optional(),
  stock: z
    .coerce.number({ invalid_type_error: 'stock must be a number' })
    .int('stock must be an integer')
    .nonnegative('stock must be >= 0'),
  category: z.string().trim().min(1, 'category is required'),
  imageUrl: z.string().trim().url('imageUrl must be a valid URL').optional(),
  imageBase64: z.string().trim().min(1, 'imageBase64 cannot be empty').optional(),
  imageMimeType: imageMimeTypeSchema.optional(),
  isAvailable: booleanSchema.optional(),
};

function validateImageFields(
  data: { imageBase64?: string; imageMimeType?: string },
  ctx: z.RefinementCtx,
) {
  if (data.imageMimeType && !data.imageBase64) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['imageMimeType'],
      message: 'imageMimeType requires imageBase64',
    });
  }

  // Raw base64 (not a data URL) carries no type information of its own.
  if (data.imageBase64 && !data.imageMimeType && !/^data:/i.test(data.imageBase64)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['imageMimeType'],
      message: 'imageMimeType is required when imageBase64 is raw base64',
    });
  }
}

/** Payload to create a book. */
export const createBookSchema = z.object(bookSchemaShape).superRefine(validateImageFields);

/**
 * Partial update: any subset of the create fields, but at least one.
 * `imageUrl: null` is allowed here to clear a book's stored image.
 */
export const updateBookSchema = z
  .object({ ...bookSchemaShape, imageUrl: bookSchemaShape.imageUrl.nullable() })
  .partial()
  .superRefine((data, ctx) => {
    validateImageFields(data, ctx);

    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide at least one field to update',
      });
    }
  });

/** Query params for listing with filters, pagination and sorting. */
export const listBooksQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  currency: currencySchema.optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  isAvailable: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['price', 'stock', 'title', 'createdAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/** `:id` route param: coerced from string to a positive integer. */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
