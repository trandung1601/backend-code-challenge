import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../../src/app';
import { prisma } from '../../src/database';
import { snapshotUploads, cleanupTestData } from '../helpers/cleanup';

/**
 * End-to-end: a real HTTP server on an ephemeral port, exercised with fetch
 * over the network — covering routing, middleware, static file serving and
 * the database in one pass.
 */

let server: Server;
let baseUrl: string;
let uploadsSnapshot: Set<string>;

const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

before(async () => {
  uploadsSnapshot = await snapshotUploads();
  await prisma.book.deleteMany();
  server = createApp().listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
  // Wipe rows and any upload file the tests created, then disconnect.
  await cleanupTestData(uploadsSnapshot);
  await prisma.$disconnect();
});

test('service endpoints respond: /, /health and /docs.json', async () => {
  const root = await fetch(baseUrl);
  assert.equal(root.status, 200);
  assert.equal((await root.json() as any).resource, '/api/books');

  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json() as any).status, 'ok');

  const docs = await fetch(`${baseUrl}/docs.json`);
  assert.equal(docs.status, 200);
  assert.equal((await docs.json() as any).openapi, '3.0.3');
});

test('full book lifecycle over HTTP', async () => {
  // Create with an uploaded base64 image.
  const createRes = await fetch(`${baseUrl}/api/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'E2E Driven Development',
      author: 'End To End',
      price: 42,
      stock: 7,
      category: 'Testing',
      imageBase64: tinyPngBase64,
      imageMimeType: 'image/png',
    }),
  });
  assert.equal(createRes.status, 201);
  const created = await createRes.json() as any;
  assert.match(created.imageUrl, /^\/uploads\/books\/.+\.png$/);

  // The stored image is served publicly.
  const image = await fetch(`${baseUrl}${created.imageUrl}`);
  assert.equal(image.status, 200);
  assert.match(image.headers.get('content-type') ?? '', /^image\/png/);

  // Listing with filters finds it.
  const listRes = await fetch(`${baseUrl}/api/books?category=Testing&minPrice=40`);
  assert.equal(listRes.status, 200);
  const list = await listRes.json() as any;
  assert.equal(list.pagination.total, 1);
  assert.equal(list.data[0].id, created.id);

  // Partial update, then clear the image with imageUrl null.
  const patchRes = await fetch(`${baseUrl}/api/books/${created.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ price: 13.37, imageUrl: null }),
  });
  assert.equal(patchRes.status, 200);
  const patched = await patchRes.json() as any;
  assert.equal(patched.price, 13.37);
  assert.equal(patched.imageUrl, null);

  // The cleared image file is no longer served.
  const goneImage = await fetch(`${baseUrl}${created.imageUrl}`);
  assert.equal(goneImage.status, 404);

  // Delete, then the book is gone.
  const deleteRes = await fetch(`${baseUrl}/api/books/${created.id}`, { method: 'DELETE' });
  assert.equal(deleteRes.status, 204);

  const getRes = await fetch(`${baseUrl}/api/books/${created.id}`);
  assert.equal(getRes.status, 404);
});

test('validation and 404 error shapes over HTTP', async () => {
  const badCreate = await fetch(`${baseUrl}/api/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: '', price: -1 }),
  });
  assert.equal(badCreate.status, 400);
  const badBody = await badCreate.json() as any;
  assert.equal(badBody.error, 'Validation failed');
  assert.ok(Array.isArray(badBody.details));

  const missing = await fetch(`${baseUrl}/api/books/999999`);
  assert.equal(missing.status, 404);

  const unknownRoute = await fetch(`${baseUrl}/api/nope`);
  assert.equal(unknownRoute.status, 404);
  assert.equal((await unknownRoute.json() as any).error, 'Not Found');
});
