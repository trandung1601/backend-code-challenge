import { PrismaClient } from '@prisma/client';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const prisma = new PrismaClient();
const uploadDir = path.resolve(process.cwd(), 'uploads', 'books');

const placeholderPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const books = [
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    price: 32.5,
    stock: 12,
    category: 'Programming',
    imageFile: 'seed-clean-code.png',
    isAvailable: true,
  },
  {
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt',
    price: 28.0,
    stock: 7,
    category: 'Programming',
    imageFile: 'seed-the-pragmatic-programmer.png',
    isAvailable: true,
  },
  {
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    price: 18.99,
    stock: 0,
    category: 'History',
    imageFile: 'seed-sapiens.png',
    isAvailable: false,
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    price: 21.75,
    stock: 25,
    category: 'Self-Help',
    imageFile: 'seed-atomic-habits.png',
    isAvailable: true,
  },
  {
    title: 'Dune',
    author: 'Frank Herbert',
    price: 15.4,
    stock: 5,
    category: 'Science Fiction',
    imageFile: 'seed-dune.png',
    isAvailable: true,
  },
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    price: 12.0,
    stock: 3,
    category: 'Fantasy',
    imageFile: 'seed-the-hobbit.png',
    isAvailable: true,
  },
];

async function main() {
  // Reset so seeding is idempotent.
  await mkdir(uploadDir, { recursive: true });
  await prisma.book.deleteMany();

  for (const book of books) {
    const { imageFile, ...data } = book;
    await writeFile(path.join(uploadDir, imageFile), Buffer.from(placeholderPngBase64, 'base64'));
    await prisma.book.create({
      data: {
        ...data,
        imageUrl: `/uploads/books/${imageFile}`,
      },
    });
  }

  console.log(`🌱 Seeded ${books.length} books`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
