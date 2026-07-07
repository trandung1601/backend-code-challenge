import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bookService } from '../../src/modules/book/services/book.service';
import { bookRepository } from '../../src/modules/book/repositories/book.repository';
import { AppError } from '../../src/common/errors/AppError';

/**
 * Pure service-logic tests: the repository (and therefore Prisma) is mocked
 * with node:test's t.mock, so no database is touched.
 */

const fakeBook = {
  id: 1,
  title: 'Clean Code',
  author: 'Robert C. Martin',
  price: 32.5,
  stock: 12,
  category: 'Programming',
  imageUrl: null as string | null,
  isAvailable: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

test('getById returns the book when it exists', async (t) => {
  t.mock.method(bookRepository, 'findById', async () => fakeBook);
  const book = await bookService.getById(1);
  assert.equal(book.id, 1);
});

test('getById throws a 404 AppError when the book is missing', async (t) => {
  t.mock.method(bookRepository, 'findById', async () => null);
  await assert.rejects(
    () => bookService.getById(999),
    (err: unknown) => err instanceof AppError && err.status === 404 && /999/.test(err.message),
  );
});

test('list builds the where filter and pagination from the query', async (t) => {
  const findMany = t.mock.method(
    bookRepository,
    'findManyWithTotal',
    (async () => [[fakeBook], 12]) as unknown as typeof bookRepository.findManyWithTotal,
  );

  const result = await bookService.list({
    search: 'clean',
    category: 'Programming',
    minPrice: 10,
    maxPrice: 50,
    isAvailable: true,
    page: 2,
    limit: 5,
    sortBy: 'price',
    order: 'asc',
  });

  const args = findMany.mock.calls[0].arguments[0];
  assert.deepEqual(args.where.OR, [
    { title: { contains: 'clean' } },
    { author: { contains: 'clean' } },
  ]);
  assert.equal(args.where.category, 'Programming');
  assert.deepEqual(args.where.price, { gte: 10, lte: 50 });
  assert.equal(args.where.isAvailable, true);
  assert.equal(args.skip, 5);
  assert.equal(args.take, 5);
  assert.equal(args.sortBy, 'price');
  assert.equal(args.order, 'asc');

  assert.deepEqual(result.pagination, { page: 2, limit: 5, total: 12, totalPages: 3 });
});

test('list omits filters that were not provided', async (t) => {
  const findMany = t.mock.method(
    bookRepository,
    'findManyWithTotal',
    (async () => [[], 0]) as unknown as typeof bookRepository.findManyWithTotal,
  );

  await bookService.list({ page: 1, limit: 10, sortBy: 'createdAt', order: 'desc' });

  const args = findMany.mock.calls[0].arguments[0];
  assert.deepEqual(args.where, {});
  assert.equal(args.skip, 0);
});

test('create forwards the payload (with pass-through imageUrl) to the repository', async (t) => {
  const create = t.mock.method(
    bookRepository,
    'create',
    (async () => fakeBook) as unknown as typeof bookRepository.create,
  );

  await bookService.create({
    title: 'Clean Code',
    author: 'Robert C. Martin',
    price: 32.5,
    stock: 12,
    category: 'Programming',
    imageUrl: 'https://example.com/cover.png',
  });

  const args = create.mock.calls[0].arguments[0];
  assert.equal(args.imageUrl, 'https://example.com/cover.png');
  assert.equal(args.title, 'Clean Code');
});

test('update passes imageUrl null through to clear the image', async (t) => {
  t.mock.method(bookRepository, 'findById', async () => ({ ...fakeBook, imageUrl: null }));
  const update = t.mock.method(
    bookRepository,
    'update',
    (async () => ({ ...fakeBook, imageUrl: null })) as unknown as typeof bookRepository.update,
  );

  await bookService.update(1, { imageUrl: null });

  const args = update.mock.calls[0].arguments[1];
  assert.equal(args.imageUrl, null);
});

test('update leaves imageUrl untouched when no image field is sent', async (t) => {
  t.mock.method(bookRepository, 'findById', async () => fakeBook);
  const update = t.mock.method(
    bookRepository,
    'update',
    (async () => fakeBook) as unknown as typeof bookRepository.update,
  );

  await bookService.update(1, { price: 9.99 });

  const args = update.mock.calls[0].arguments[1];
  assert.ok(!('imageUrl' in args));
  assert.equal(args.price, 9.99);
});

test('update throws 404 before touching the repository when the book is missing', async (t) => {
  t.mock.method(bookRepository, 'findById', async () => null);
  const update = t.mock.method(bookRepository, 'update', async () => fakeBook);

  await assert.rejects(
    () => bookService.update(42, { price: 1 }),
    (err: unknown) => err instanceof AppError && err.status === 404,
  );
  assert.equal(update.mock.callCount(), 0);
});

test('remove deletes the book via the repository', async (t) => {
  t.mock.method(bookRepository, 'findById', async () => fakeBook);
  const del = t.mock.method(bookRepository, 'delete', async () => fakeBook);

  await bookService.remove(1);

  assert.equal(del.mock.callCount(), 1);
  assert.equal(del.mock.calls[0].arguments[0], 1);
});
