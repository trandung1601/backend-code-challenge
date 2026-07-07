-- Denominate each book's price in an ISO 4217 currency (defaults to USD).
ALTER TABLE "Book" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
