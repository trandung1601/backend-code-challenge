export interface Book {
  id: number;
  title: string;
  author: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}
