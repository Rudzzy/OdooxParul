import { create } from "zustand";
import api from "../lib/api";

export type PaymentType = "Cash" | "Card/Digital" | "UPI";

export type PaymentMethod = {
  id: string;
  name: string;
  type: PaymentType;
  isActive: boolean;
  upiId?: string;
};

interface PaymentState {
  paymentMethods: PaymentMethod[];
  fetchPaymentMethods: () => Promise<void>;
  addPaymentMethod: (method: Omit<PaymentMethod, "id">) => Promise<PaymentMethod>;
  updatePaymentMethod: (id: string, method: Partial<PaymentMethod>) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  paymentMethods: [],
  fetchPaymentMethods: async () => {
    const res = await api.get("/payment-methods");
    set({ paymentMethods: res.data });
  },
  addPaymentMethod: async (method) => {
    const res = await api.post("/payment-methods", method);
    const newMethod = res.data;
    set((state) => ({ paymentMethods: [...state.paymentMethods, newMethod] }));
    return newMethod;
  },
  updatePaymentMethod: async (id, updatedFields) => {
    const current = usePaymentStore.getState().paymentMethods.find((p) => p.id === id);
    if (!current) return;
    const merged = { ...current, ...updatedFields };
    await api.put(`/payment-methods/${id}`, {
      name: merged.name,
      type: merged.type,
      isActive: merged.isActive,
      upiId: merged.upiId || null,
    });
    set((state) => ({
      paymentMethods: state.paymentMethods.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)),
    }));
  },
  deletePaymentMethod: async (id) => {
    await api.delete(`/payment-methods/${id}`);
    set((state) => ({
      paymentMethods: state.paymentMethods.filter((p) => p.id !== id),
    }));
  },
  toggleActive: async (id) => {
    const current = usePaymentStore.getState().paymentMethods.find((p) => p.id === id);
    if (!current) return;
    const toggled = { ...current, isActive: !current.isActive };
    await api.put(`/payment-methods/${id}`, {
      name: toggled.name,
      type: toggled.type,
      isActive: toggled.isActive,
      upiId: toggled.upiId || null,
    });
    set((state) => ({
      paymentMethods: state.paymentMethods.map((p) =>
        p.id === id ? { ...p, isActive: !p.isActive } : p
      ),
    }));
  },
}));
