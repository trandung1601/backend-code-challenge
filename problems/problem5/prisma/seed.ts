import { PrismaClient } from '@prisma/client';
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { BOOK_UPLOADS_DIR } from '../src/config/paths';

const prisma = new PrismaClient();
const uploadDir = BOOK_UPLOADS_DIR;

// Real book-cover images committed under prisma/seed-images/ are copied into
// uploads/books/ at seed time, so seeded books show an actual cover instead of
// a blank placeholder pixel. `uploads/` is gitignored, hence the committed copy.
const seedImagesDir = path.join(__dirname, 'seed-images');

const books = [
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    price: 32.5,
    stock: 12,
    category: 'Programming',
    imageFile: 'seed-clean-code.jpg',
    isAvailable: true,
  },
  {
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt',
    price: 28.0,
    stock: 7,
    category: 'Programming',
    imageFile: 'seed-the-pragmatic-programmer.jpg',
    isAvailable: true,
  },
  {
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    price: 18.99,
    stock: 0,
    category: 'History',
    imageFile: 'seed-sapiens.jpg',
    isAvailable: false,
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    price: 21.75,
    stock: 25,
    category: 'Self-Help',
    imageFile: 'seed-atomic-habits.jpg',
    isAvailable: true,
  },
  {
    title: 'Dune',
    author: 'Frank Herbert',
    price: 15.4,
    stock: 5,
    category: 'Science Fiction',
    imageFile: 'seed-dune.jpg',
    isAvailable: true,
  },
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    price: 12.0,
    stock: 3,
    category: 'Fantasy',
    imageFile: 'seed-the-hobbit.jpg',
    isAvailable: true,
  },
];

async function main() {
  // Reset so seeding is idempotent.
  await mkdir(uploadDir, { recursive: true });
  await prisma.book.deleteMany();

  for (const book of books) {
    const { imageFile, ...data } = book;
    await copyFile(path.join(seedImagesDir, imageFile), path.join(uploadDir, imageFile));
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
