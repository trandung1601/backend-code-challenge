import type { Prisma } from '@prisma/client';
import { bookRepository } from '../repositories/book.repository';
import { AppError } from '../../../common/errors/AppError';
import { deleteBookImage, saveBookImage } from '../../../common/utils/image-storage';
import type { CreateBookInput, UpdateBookInput, ListBooksQuery } from '../dto/book.dto';

export const bookService = {
  async create(input: CreateBookInput) {
    const { imageBase64, imageMimeType, ...data } = input;
    const imageUrl = imageBase64 ? await saveBookImage({ imageBase64, imageMimeType }) : data.imageUrl;

    try {
      return await bookRepository.create({ ...data, imageUrl });
    } catch (err) {
      // Don't leave the just-written file orphaned if the insert fails.
      if (imageBase64) await deleteBookImage(imageUrl);
      throw err;
    }
  },

  async list(query: ListBooksQuery) {
    const { search, category, currency, minPrice, maxPrice, isAvailable, page, limit, sortBy, order } = query;
    const where: Prisma.BookWhereInput = {};

    // On SQLite, `contains` (LIKE) is already case-insensitive for ASCII.
    if (search) {
      where.OR = [{ title: { contains: search } }, { author: { contains: search } }];
    }
    if (category) where.category = category;
    if (currency) where.currency = currency;
    if (isAvailable !== undefined) where.isAvailable = isAvailable;

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: Prisma.FloatFilter = {};
      if (minPrice !== undefined) priceFilter.gte = minPrice;
      if (maxPrice !== undefined) priceFilter.lte = maxPrice;
      where.price = priceFilter;
    }

    const [data, total] = await bookRepository.findManyWithTotal({
      where,
      skip: (page - 1) * limit,
      take: limit,
      sortBy,
      order,
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: number) {
    const book = await bookRepository.findById(id);
    if (!book) throw new AppError(404, `Book with id ${id} not found`);
    return book;
  },

  async update(id: number, input: UpdateBookInput) {
    const existing = await this.getById(id);
    const { imageBase64, imageMimeType, ...data } = input;
    const imageUrl = imageBase64 ? await saveBookImage({ imageBase64, imageMimeType }) : data.imageUrl;

    if (imageUrl !== undefined) {
      data.imageUrl = imageUrl;
    }

    let book;
    try {
      book = await bookRepository.update(id, data);
    } catch (err) {
      if (imageBase64) await deleteBookImage(imageUrl);
      throw err;
    }

    // Image replaced (or cleared with `imageUrl: null`): drop the old stored file.
    if (imageUrl !== undefined && existing.imageUrl !== imageUrl) {
      await deleteBookImage(existing.imageUrl);
    }

    return book;
  },

  async remove(id: number) {
    const book = await this.getById(id);
    await bookRepository.delete(id);
    await deleteBookImage(book.imageUrl);
  },
};
