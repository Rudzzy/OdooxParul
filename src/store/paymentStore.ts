import { create } from "zustand";

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
  addPaymentMethod: (method: Omit<PaymentMethod, "id">) => PaymentMethod;
  updatePaymentMethod: (id: string, method: Partial<PaymentMethod>) => void;
  deletePaymentMethod: (id: string) => void;
  toggleActive: (id: string) => void;
}

const initialPaymentMethods: PaymentMethod[] = [
  { id: "1", name: "Cash", type: "Cash", isActive: true },
  { id: "2", name: "Credit/Debit Card", type: "Card/Digital", isActive: true },
  { id: "3", name: "UPI - Merchant", type: "UPI", isActive: true, upiId: "merchant@upi" },
];

export const usePaymentStore = create<PaymentState>((set) => ({
  paymentMethods: initialPaymentMethods,
  addPaymentMethod: (method) => {
    const newMethod = { ...method, id: Math.random().toString(36).substring(2, 9) };
    set((state) => ({ paymentMethods: [...state.paymentMethods, newMethod] }));
    return newMethod;
  },
  updatePaymentMethod: (id, updatedFields) => {
    set((state) => ({
      paymentMethods: state.paymentMethods.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)),
    }));
  },
  deletePaymentMethod: (id) => {
    set((state) => ({
      paymentMethods: state.paymentMethods.filter((p) => p.id !== id),
    }));
  },
  toggleActive: (id) => {
    set((state) => ({
      paymentMethods: state.paymentMethods.map((p) => 
        p.id === id ? { ...p, isActive: !p.isActive } : p
      ),
    }));
  },
}));
