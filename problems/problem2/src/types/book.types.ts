import type { z } from 'zod';
import type { Book } from '../models/book.model';
import type {
  createBookSchema,
  updateBookSchema,
  listBooksQuerySchema,
  idParamSchema,
} from '../validators/book.validator';

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type ListBooksQuery = z.infer<typeof listBooksQuerySchema>;
export type IdParam = z.infer<typeof idParamSchema>;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedBooks {
  data: Book[];
  pagination: PaginationMeta;
}
