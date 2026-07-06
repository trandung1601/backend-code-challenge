import type { Request, Response, NextFunction } from 'express';
import { bookService } from '../services/book.service';
import { created, noContent, ok } from '../utils/api-response';
import type { CreateBookInput, UpdateBookInput, ListBooksQuery, IdParam } from '../types/book.types';

/**
 * HTTP handlers. Validated values are read from `res.locals`,
 * then delegated to the service layer.
 */
export const bookController = {
  async create(_req: Request, res: Response, next: NextFunction) {
    try {
      const book = await bookService.create(res.locals.body as CreateBookInput);
      return created(res, book);
    } catch (err) {
      return next(err);
    }
  },

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await bookService.list(res.locals.query as ListBooksQuery);
      return ok(res, result);
    } catch (err) {
      return next(err);
    }
  },

  async getOne(_req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as IdParam;
      return ok(res, await bookService.getById(id));
    } catch (err) {
      return next(err);
    }
  },

  async update(_req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as IdParam;
      const book = await bookService.update(id, res.locals.body as UpdateBookInput);
      return ok(res, book);
    } catch (err) {
      return next(err);
    }
  },

  async remove(_req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as IdParam;
      await bookService.remove(id);
      return noContent(res);
    } catch (err) {
      return next(err);
    }
  },
};
