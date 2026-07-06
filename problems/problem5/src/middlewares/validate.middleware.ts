import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

export interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Parses request inputs and stores typed, coerced values on `res.locals`.
 */
export const validate =
  (schemas: ValidationSchemas): RequestHandler =>
  (req, res, next) => {
    try {
      if (schemas.params) res.locals.params = schemas.params.parse(req.params);
      if (schemas.query) res.locals.query = schemas.query.parse(req.query);
      if (schemas.body) res.locals.body = schemas.body.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
