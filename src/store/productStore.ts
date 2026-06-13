import { create } from "zustand";

export type Category = {
  id: string;
  name: string;
  color: string;
};

export type Product = {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  description: string;
  isVeg: boolean;
  status: "available" | "unavailable";
};

interface ProductState {
  categories: Category[];
  products: Product[];
  addCategory: (category: Omit<Category, "id">) => Category;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (startIndex: number, endIndex: number) => void;
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
}

const initialCategories: Category[] = [
  { id: "1", name: "Appetizers", color: "bg-red-500" },
  { id: "2", name: "Main Course", color: "bg-blue-500" },
  { id: "3", name: "Desserts", color: "bg-pink-500" },
  { id: "4", name: "Beverages", color: "bg-yellow-500" },
];

const initialProducts: Product[] = [
  {
    id: "1",
    name: "Margherita Pizza",
    categoryId: "2",
    price: 12.99,
    description: "Classic cheese and tomato pizza.",
    isVeg: true,
    status: "available",
  },
  {
    id: "2",
    name: "Chicken Wings",
    categoryId: "1",
    price: 8.99,
    description: "Spicy buffalo wings.",
    isVeg: false,
    status: "available",
  },
  {
    id: "3",
    name: "Chocolate Lava Cake",
    categoryId: "3",
    price: 6.5,
    description: "Warm chocolate cake with a gooey center.",
    isVeg: true,
    status: "unavailable",
  },
];

export const useProductStore = create<ProductState>((set) => ({
  categories: initialCategories,
  products: initialProducts,
  addCategory: (category) => {
    const newCategory = { ...category, id: Math.random().toString(36).substring(2, 9) };
    set((state) => ({ categories: [...state.categories, newCategory] }));
    return newCategory;
  },
  updateCategory: (id, updatedFields) => {
    set((state) => ({
      categories: state.categories.map((c) => (c.id === id ? { ...c, ...updatedFields } : c)),
    }));
  },
  deleteCategory: (id) => {
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
  },
  reorderCategories: (startIndex, endIndex) => {
    set((state) => {
      const newCategories = Array.from(state.categories);
      const [removed] = newCategories.splice(startIndex, 1);
      newCategories.splice(endIndex, 0, removed);
      return { categories: newCategories };
    });
  },
  addProduct: (product) => {
    const newProduct = { ...product, id: Math.random().toString(36).substring(2, 9) };
    set((state) => ({ products: [...state.products, newProduct] }));
  },
  updateProduct: (id, updatedFields) => {
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)),
    }));
  },
  deleteProduct: (id) => {
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));
  },
}));
