import { PrismaClient } from '@prisma/client';

/**
 * A single shared PrismaClient instance for the whole app.
 * Creating many clients would exhaust database connections.
 */
export const prisma = new PrismaClient();
