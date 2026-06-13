import { create } from "zustand";

export type KDSStage = "To Cook" | "Preparing" | "Completed";

export type KDSItem = {
  id: string;
  name: string;
  quantity: number;
  prepared: boolean;
  categoryId?: string;
};

export type KDSOrder = {
  id: string; // Ticket number
  customerName?: string;
  items: KDSItem[];
  stage: KDSStage;
  timestamp: string; // ISO String
};

interface KDSState {
  orders: KDSOrder[];
  addOrder: (order: Omit<KDSOrder, "id">) => void;
  toggleItemPrepared: (orderId: string, itemId: string) => void;
  advanceOrderStage: (orderId: string) => void;
}

const initialOrders: KDSOrder[] = [
  {
    id: "101",
    customerName: "Table 4",
    stage: "To Cook",
    timestamp: new Date().toISOString(),
    items: [
      { id: "i1", name: "Margherita Pizza", quantity: 1, prepared: false, categoryId: "c1" },
      { id: "i2", name: "Garlic Bread", quantity: 2, prepared: false, categoryId: "c2" },
    ],
  },
  {
    id: "102",
    customerName: "John (Takeaway)",
    stage: "Preparing",
    timestamp: new Date(Date.now() - 500000).toISOString(),
    items: [
      { id: "i3", name: "Iced Latte", quantity: 1, prepared: true, categoryId: "c3" },
      { id: "i4", name: "Chocolate Croissant", quantity: 1, prepared: false, categoryId: "c4" },
    ],
  },
  {
    id: "103",
    customerName: "Table 12",
    stage: "To Cook",
    timestamp: new Date(Date.now() - 120000).toISOString(),
    items: [
      { id: "i5", name: "Pasta Carbonara", quantity: 2, prepared: false, categoryId: "c1" },
    ],
  },
];

export const useKdsStore = create<KDSState>((set) => ({
  orders: initialOrders,
  addOrder: (order) => {
    const newOrder = { ...order, id: Math.random().toString(36).substring(2, 9) };
    set((state) => ({ orders: [...state.orders, newOrder] }));
  },
  toggleItemPrepared: (orderId, itemId) => {
    set((state) => ({
      orders: state.orders.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          items: o.items.map((i) =>
            i.id === itemId ? { ...i, prepared: !i.prepared } : i
          ),
        };
      }),
    }));
  },
  advanceOrderStage: (orderId) => {
    set((state) => ({
      orders: state.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.stage === "To Cook") return { ...o, stage: "Preparing" };
        if (o.stage === "Preparing") return { ...o, stage: "Completed" };
        return o;
      }),
    }));
  },
}));
