import { create } from "zustand";
import api from "../lib/api";

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
  fetchCategories: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  addCategory: (category: Omit<Category, "id">) => Promise<Category>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (startIndex: number, endIndex: number) => void;
  addProduct: (product: Omit<Product, "id">) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

export const useProductStore = create<ProductState>((set) => ({
  categories: [],
  products: [],
  fetchCategories: async () => {
    const res = await api.get("/categories");
    set({ categories: res.data });
  },
  fetchProducts: async () => {
    const res = await api.get("/products");
    set({ products: res.data });
  },
  addCategory: async (category) => {
    const res = await api.post("/categories", category);
    const newCategory = res.data;
    set((state) => ({ categories: [...state.categories, newCategory] }));
    return newCategory;
  },
  updateCategory: async (id, updatedFields) => {
    // Fetch current, merge, and PUT
    const current = useProductStore.getState().categories.find((c) => c.id === id);
    if (!current) return;
    const merged = { ...current, ...updatedFields };
    await api.put(`/categories/${id}`, { name: merged.name, color: merged.color });
    set((state) => ({
      categories: state.categories.map((c) => (c.id === id ? { ...c, ...updatedFields } : c)),
    }));
  },
  deleteCategory: async (id) => {
    await api.delete(`/categories/${id}`);
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
  addProduct: async (product) => {
    const res = await api.post("/products", product);
    const newProduct = res.data;
    set((state) => ({ products: [...state.products, newProduct] }));
  },
  updateProduct: async (id, updatedFields) => {
    const current = useProductStore.getState().products.find((p) => p.id === id);
    if (!current) return;
    const merged = { ...current, ...updatedFields };
    await api.put(`/products/${id}`, {
      name: merged.name,
      categoryId: merged.categoryId,
      price: merged.price,
      description: merged.description,
      isVeg: merged.isVeg,
      status: merged.status,
    });
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)),
    }));
  },
  deleteProduct: async (id) => {
    await api.delete(`/products/${id}`);
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));
  },
}));
