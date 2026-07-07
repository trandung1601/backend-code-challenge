import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import path from 'node:path';
import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/database';
import { BOOK_UPLOADS_DIR } from '../../src/config/paths';
import { snapshotUploads, cleanupTestData } from '../helpers/cleanup';

const storedFilePath = (imageUrl: string) => path.join(BOOK_UPLOADS_DIR, path.basename(imageUrl));

const app = createApp();
let uploadsSnapshot: Set<string>;

const sample = {
  title: 'Test Driven Development',
  author: 'Kent Beck',
  price: 30,
  stock: 10,
  category: 'Programming',
  imageUrl: 'https://example.com/images/tdd.jpg',
};

const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

before(async () => {
  uploadsSnapshot = await snapshotUploads();
  await prisma.book.deleteMany();
});

beforeEach(async () => {
  await prisma.book.deleteMany();
});

after(async () => {
  // Wipe rows and any upload file the tests created, then disconnect.
  await cleanupTestData(uploadsSnapshot);
  await prisma.$disconnect();
});

test('POST /api/books creates a book (201)', async () => {
  const res = await request(app).post('/api/books').send(sample);
  assert.equal(res.status, 201);
  assert.equal(res.body.title, sample.title);
  assert.equal(res.body.imageUrl, sample.imageUrl);
  assert.equal(res.body.isAvailable, true);
  assert.ok(res.body.id);
});

test('POST /api/books stores a base64 image and returns a public imageUrl', async () => {
  const res = await request(app)
    .post('/api/books')
    .send({ ...sample, imageUrl: undefined, imageBase64: tinyPngBase64, imageMimeType: 'image/png' });

  assert.equal(res.status, 201);
  assert.match(res.body.imageUrl, /^\/uploads\/books\/.+\.png$/);

  const storedPath = path.resolve(process.cwd(), res.body.imageUrl.slice(1));
  await assert.doesNotReject(() => access(storedPath));

  const image = await request(app).get(res.body.imageUrl);
  assert.equal(image.status, 200);
  assert.match(image.headers['content-type'], /^image\/png/);
});

test('POST /api/books accepts multipart file upload', async () => {
  const res = await request(app)
    .post('/api/books')
    .field('title', 'Uploaded Cover')
    .field('author', 'Test Author')
    .field('price', '25.5')
    .field('stock', '4')
    .field('category', 'Programming')
    .field('isAvailable', 'true')
    .attach('image', Buffer.from(tinyPngBase64, 'base64'), {
      filename: 'cover.png',
      contentType: 'image/png',
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.title, 'Uploaded Cover');
  assert.equal(res.body.price, 25.5);
  assert.equal(res.body.stock, 4);
  assert.equal(res.body.isAvailable, true);
  assert.match(res.body.imageUrl, /^\/uploads\/books\/.+\.png$/);
});

test('POST /api/books rejects invalid input (400)', async () => {
  const res = await request(app)
    .post('/api/books')
    .send({ title: '', author: 'X', price: -5, stock: 1.5, category: 'C', imageUrl: 'invalid-url' });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Validation failed');
  const fields = res.body.details.map((d: { field: string }) => d.field);
  assert.ok(fields.includes('title'));
  assert.ok(fields.includes('price'));
  assert.ok(fields.includes('stock'));
  assert.ok(fields.includes('imageUrl'));
});

test('GET /api/books rejects invalid query params (400)', async () => {
  const res = await request(app).get('/api/books?page=0&limit=101&isAvailable=yes&sortBy=id');
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Validation failed');

  const fields = res.body.details.map((d: { field: string }) => d.field);
  assert.ok(fields.includes('page'));
  assert.ok(fields.includes('limit'));
  assert.ok(fields.includes('isAvailable'));
  assert.ok(fields.includes('sortBy'));
});

test('GET /api/books lists with filters + pagination', async () => {
  await request(app).post('/api/books').send({ ...sample, title: 'A', price: 10, category: 'Programming' });
  await request(app).post('/api/books').send({ ...sample, title: 'B', price: 50, category: 'History' });
  await request(app).post('/api/books').send({ ...sample, title: 'C', price: 100, category: 'Programming' });

  const res = await request(app).get('/api/books?category=Programming&minPrice=20&page=1&limit=10');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.length, 1);
  assert.equal(res.body.data[0].title, 'C');
  assert.equal(res.body.pagination.total, 1);
  assert.equal(res.body.pagination.page, 1);
});

test('GET /api/books/:id returns a book, 404 when missing', async () => {
  const created = await request(app).post('/api/books').send(sample);
  const id = created.body.id;

  const ok = await request(app).get(`/api/books/${id}`);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.id, id);

  const missing = await request(app).get('/api/books/999999');
  assert.equal(missing.status, 404);
});

test('GET /api/books/:id rejects invalid id params (400)', async () => {
  const res = await request(app).get('/api/books/not-a-number');
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Validation failed');
  assert.equal(res.body.details[0].field, 'id');
});

test('PATCH /api/books/:id updates fields', async () => {
  const created = await request(app).post('/api/books').send(sample);
  const id = created.body.id;

  const imageUrl = 'https://example.com/images/tdd-updated.jpg';
  const res = await request(app).patch(`/api/books/${id}`).send({ price: 99.99, stock: 3, imageUrl });
  assert.equal(res.status, 200);
  assert.equal(res.body.price, 99.99);
  assert.equal(res.body.stock, 3);
  assert.equal(res.body.imageUrl, imageUrl);
  assert.equal(res.body.title, sample.title);
});

test('POST /api/books rejects raw base64 without imageMimeType (400 validation shape)', async () => {
  const res = await request(app)
    .post('/api/books')
    .send({ ...sample, imageUrl: undefined, imageBase64: tinyPngBase64 });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Validation failed');
  const fields = res.body.details.map((d: { field: string }) => d.field);
  assert.ok(fields.includes('imageMimeType'));
});

test('PATCH /api/books/:id replaces the image and deletes the old stored file', async () => {
  const created = await request(app)
    .post('/api/books')
    .send({ ...sample, imageUrl: undefined, imageBase64: tinyPngBase64, imageMimeType: 'image/png' });
  const oldPath = storedFilePath(created.body.imageUrl);
  await assert.doesNotReject(() => access(oldPath));

  const res = await request(app)
    .patch(`/api/books/${created.body.id}`)
    .send({ imageBase64: tinyPngBase64, imageMimeType: 'image/png' });

  assert.equal(res.status, 200);
  assert.notEqual(res.body.imageUrl, created.body.imageUrl);
  await assert.doesNotReject(() => access(storedFilePath(res.body.imageUrl)));
  await assert.rejects(() => access(oldPath));
});

test('PATCH /api/books/:id with imageUrl null clears the image and deletes the file', async () => {
  const created = await request(app)
    .post('/api/books')
    .send({ ...sample, imageUrl: undefined, imageBase64: tinyPngBase64, imageMimeType: 'image/png' });
  const oldPath = storedFilePath(created.body.imageUrl);

  const res = await request(app).patch(`/api/books/${created.body.id}`).send({ imageUrl: null });

  assert.equal(res.status, 200);
  assert.equal(res.body.imageUrl, null);
  await assert.rejects(() => access(oldPath));
});

test('DELETE /api/books/:id also deletes the stored image file', async () => {
  const created = await request(app)
    .post('/api/books')
    .send({ ...sample, imageUrl: undefined, imageBase64: tinyPngBase64, imageMimeType: 'image/png' });
  const oldPath = storedFilePath(created.body.imageUrl);

  const del = await request(app).delete(`/api/books/${created.body.id}`);
  assert.equal(del.status, 204);
  await assert.rejects(() => access(oldPath));
});

test('PATCH /api/books/:id rejects empty update body (400)', async () => {
  const created = await request(app).post('/api/books').send(sample);
  const id = created.body.id;

  const res = await request(app).patch(`/api/books/${id}`).send({});
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Validation failed');
  assert.equal(res.body.details[0].message, 'Provide at least one field to update');
});

test('DELETE /api/books/:id removes a book (204), then 404', async () => {
  const created = await request(app).post('/api/books').send(sample);
  const id = created.body.id;

  const del = await request(app).delete(`/api/books/${id}`);
  assert.equal(del.status, 204);

  const after = await request(app).get(`/api/books/${id}`);
  assert.equal(after.status, 404);
});

test('unknown routes return centralized 404 response', async () => {
  const res = await request(app).get('/api/unknown');
  assert.equal(res.status, 404);
  assert.equal(res.body.error, 'Not Found');
  assert.equal(res.body.path, '/api/unknown');
});
