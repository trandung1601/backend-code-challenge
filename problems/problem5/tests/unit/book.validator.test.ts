import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createBookSchema,
  updateBookSchema,
  listBooksQuerySchema,
  idParamSchema,
} from '../../src/modules/book/validators/book.validator';

const validBook = {
  title: 'Clean Code',
  author: 'Robert C. Martin',
  price: 32.5,
  stock: 12,
  category: 'Programming',
};

const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function failedFields(result: { success: boolean; error?: { issues: { path: (string | number)[] }[] } }) {
  return result.success ? [] : result.error!.issues.map((i) => i.path.join('.'));
}

test('createBookSchema accepts a valid payload', () => {
  const result = createBookSchema.safeParse(validBook);
  assert.equal(result.success, true);
});

test('createBookSchema coerces string numbers and booleans (multipart form fields)', () => {
  const result = createBookSchema.safeParse({
    ...validBook,
    price: '25.5',
    stock: '4',
    isAvailable: 'true',
  });
  assert.equal(result.success, true);
  assert.equal(result.data?.price, 25.5);
  assert.equal(result.data?.stock, 4);
  assert.equal(result.data?.isAvailable, true);
});

test('createBookSchema accepts a currency and normalizes it to upper case', () => {
  const result = createBookSchema.safeParse({ ...validBook, currency: 'eur' });
  assert.equal(result.success, true);
  assert.equal(result.data?.currency, 'EUR');
});

test('createBookSchema leaves currency undefined when omitted (DB default applies)', () => {
  const result = createBookSchema.safeParse(validBook);
  assert.equal(result.success, true);
  assert.equal(result.data?.currency, undefined);
});

test('createBookSchema rejects an unsupported currency', () => {
  const result = createBookSchema.safeParse({ ...validBook, currency: 'XYZ' });
  assert.equal(result.success, false);
  assert.ok(failedFields(result).includes('currency'));
});

test('createBookSchema rejects missing/invalid fields with per-field issues', () => {
  const result = createBookSchema.safeParse({
    title: '',
    author: 'X',
    price: -5,
    stock: 1.5,
    category: 'C',
    imageUrl: 'not-a-url',
  });
  assert.equal(result.success, false);
  const fields = failedFields(result);
  assert.ok(fields.includes('title'));
  assert.ok(fields.includes('price'));
  assert.ok(fields.includes('stock'));
  assert.ok(fields.includes('imageUrl'));
});

test('createBookSchema rejects imageMimeType without imageBase64', () => {
  const result = createBookSchema.safeParse({ ...validBook, imageMimeType: 'image/png' });
  assert.equal(result.success, false);
  assert.ok(failedFields(result).includes('imageMimeType'));
});

test('createBookSchema rejects raw imageBase64 without imageMimeType', () => {
  const result = createBookSchema.safeParse({ ...validBook, imageBase64: tinyPngBase64 });
  assert.equal(result.success, false);
  assert.ok(failedFields(result).includes('imageMimeType'));
});

test('createBookSchema accepts a data-URL imageBase64 without imageMimeType', () => {
  const result = createBookSchema.safeParse({
    ...validBook,
    imageBase64: `data:image/png;base64,${tinyPngBase64}`,
  });
  assert.equal(result.success, true);
});

test('updateBookSchema rejects an empty body', () => {
  const result = updateBookSchema.safeParse({});
  assert.equal(result.success, false);
});

test('updateBookSchema strips unknown keys and rejects when nothing remains', () => {
  const result = updateBookSchema.safeParse({ foo: 1, bar: 'x' });
  assert.equal(result.success, false);
});

test('updateBookSchema allows a partial payload', () => {
  const result = updateBookSchema.safeParse({ price: 99.5 });
  assert.equal(result.success, true);
  assert.equal(result.data?.price, 99.5);
});

test('updateBookSchema allows imageUrl null to clear the image', () => {
  const result = updateBookSchema.safeParse({ imageUrl: null });
  assert.equal(result.success, true);
  assert.equal(result.data?.imageUrl, null);
});

test('listBooksQuerySchema applies defaults', () => {
  const result = listBooksQuerySchema.parse({});
  assert.equal(result.page, 1);
  assert.equal(result.limit, 10);
  assert.equal(result.sortBy, 'createdAt');
  assert.equal(result.order, 'desc');
});

test('listBooksQuerySchema coerces query-string values', () => {
  const result = listBooksQuerySchema.parse({
    currency: 'gbp',
    minPrice: '10',
    maxPrice: '50.5',
    isAvailable: 'false',
    page: '2',
    limit: '5',
  });
  assert.equal(result.currency, 'GBP');
  assert.equal(result.minPrice, 10);
  assert.equal(result.maxPrice, 50.5);
  assert.equal(result.isAvailable, false);
  assert.equal(result.page, 2);
  assert.equal(result.limit, 5);
});

test('listBooksQuerySchema rejects out-of-range and unknown enum values', () => {
  const result = listBooksQuerySchema.safeParse({
    page: '0',
    limit: '101',
    isAvailable: 'yes',
    sortBy: 'id',
  });
  assert.equal(result.success, false);
  const fields = failedFields(result);
  assert.ok(fields.includes('page'));
  assert.ok(fields.includes('limit'));
  assert.ok(fields.includes('isAvailable'));
  assert.ok(fields.includes('sortBy'));
});

test('idParamSchema coerces a numeric string and rejects invalid ids', () => {
  assert.equal(idParamSchema.parse({ id: '12' }).id, 12);
  assert.equal(idParamSchema.safeParse({ id: 'abc' }).success, false);
  assert.equal(idParamSchema.safeParse({ id: '0' }).success, false);
  assert.equal(idParamSchema.safeParse({ id: '1.5' }).success, false);
});
