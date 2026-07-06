import type { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import type { ListBooksQuery } from '../types/book.types';

interface FindManyWithTotalArgs {
  where: Prisma.BookWhereInput;
  skip: number;
  take: number;
  sortBy: ListBooksQuery['sortBy'];
  order: ListBooksQuery['order'];
}

export const bookRepository = {
  create(data: Prisma.BookCreateInput) {
    return prisma.book.create({ data });
  },

  async findManyWithTotal({ where, skip, take, sortBy, order }: FindManyWithTotalArgs) {
    return Promise.all([
      prisma.book.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip,
        take,
      }),
      prisma.book.count({ where }),
    ]);
  },

  findById(id: number) {
    return prisma.book.findUnique({ where: { id } });
  },

  update(id: number, data: Prisma.BookUpdateInput) {
    return prisma.book.update({ where: { id }, data });
  },

  delete(id: number) {
    return prisma.book.delete({ where: { id } });
  },
};
