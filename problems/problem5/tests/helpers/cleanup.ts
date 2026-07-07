import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../../src/database';
import { BOOK_UPLOADS_DIR } from '../../src/config/paths';

/**
 * Test data isolation helpers.
 *
 * Integration and e2e tests hit the real API, which persists rows in the test
 * database and writes uploaded images into the shared `uploads/books/` folder.
 * To keep a test run from leaving anything behind, we snapshot the upload folder
 * before a test file runs and, once it finishes, delete every book row plus any
 * upload file that wasn't already there (i.e. files the tests created).
 */

/** Filenames present in the uploads folder right now (empty if it doesn't exist yet). */
export async function snapshotUploads(): Promise<Set<string>> {
  try {
    return new Set(await readdir(BOOK_UPLOADS_DIR));
  } catch {
    return new Set();
  }
}

/** Remove all book rows and any upload file created since the snapshot. */
export async function cleanupTestData(before: Set<string>): Promise<void> {
  await prisma.book.deleteMany();

  let current: string[] = [];
  try {
    current = await readdir(BOOK_UPLOADS_DIR);
  } catch {
    return;
  }

  await Promise.all(
    current
      .filter((name) => !before.has(name))
      .map((name) => rm(path.join(BOOK_UPLOADS_DIR, name), { force: true })),
  );
}
