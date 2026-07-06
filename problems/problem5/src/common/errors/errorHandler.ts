import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from './AppError';

function isPrismaErrorCode(err: unknown, code: string) {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === code
  );
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((issue) => ({
        field: issue.path.join('.') || '(root)',
        message: issue.message,
      })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (isPrismaErrorCode(err, 'P2025')) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Internal Server Error' });
}
