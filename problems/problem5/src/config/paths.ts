import path from 'node:path';

/**
 * Filesystem locations anchored to the project root (problems/problem5),
 * independent of the process working directory. `__dirname` is src/config
 * in dev (tsx) and dist/config after `tsc`, both two levels below the root.
 */
export const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
export const UPLOADS_DIR = path.join(PROJECT_ROOT, 'uploads');
export const BOOK_UPLOADS_DIR = path.join(UPLOADS_DIR, 'books');
