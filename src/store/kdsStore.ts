import { create } from "zustand";
import api from "../lib/api";

export type KDSStage = "To Cook" | "Preparing" | "Completed";

export type KDSItem = {
  id: string;
  name: string;
  quantity: number;
  prepared: boolean;
  categoryId?: string;
  notes?: string;
};

export type KDSOrder = {
  id: string;
  ticketNumber: string;
  customerName?: string;
  items: KDSItem[];
  stage: KDSStage;
  timestamp: string; // ISO String
  tableId?: string;
};

interface KDSState {
  orders: KDSOrder[];
  loading: boolean;
  fetchOrders: () => Promise<void>;
  addOrder: (order: {
    customerName?: string;
    items: { name: string; quantity: number; categoryId?: string; notes?: string }[];
    tableId?: string;
    orderId?: string;
  }) => Promise<void>;
  toggleItemPrepared: (orderId: string, itemId: string) => Promise<void>;
  advanceOrderStage: (orderId: string) => Promise<void>;
}

export const useKdsStore = create<KDSState>((set, get) => ({
  orders: [],
  loading: false,

  fetchOrders: async () => {
    try {
      set({ loading: true });
      const res = await api.get("/kds");
      set({ orders: res.data, loading: false });
    } catch (err) {
      console.error("Failed to fetch KDS orders:", err);
      set({ loading: false });
    }
  },

  addOrder: async (orderData) => {
    try {
      const res = await api.post("/kds", orderData);
      set((state) => {
        const existingIdx = state.orders.findIndex(o => o.id === res.data.id);
        if (existingIdx >= 0) {
          const newOrders = [...state.orders];
          newOrders[existingIdx] = res.data;
          return { orders: newOrders };
        } else {
          return { orders: [...state.orders, res.data] };
        }
      });
    } catch (err) {
      console.error("Failed to create KDS order:", err);
    }
  },

  toggleItemPrepared: async (orderId, itemId) => {
    // Optimistic update
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

    try {
      const res = await api.patch(`/kds/${orderId}/items/${itemId}/toggle`);
      // Sync with server response
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? res.data : o)),
      }));
    } catch (err) {
      console.error("Failed to toggle item:", err);
      // Revert on failure
      get().fetchOrders();
    }
  },

  advanceOrderStage: async (orderId) => {
    // Optimistic update
    set((state) => ({
      orders: state.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.stage === "To Cook") return { ...o, stage: "Preparing" as KDSStage };
        if (o.stage === "Preparing") return { ...o, stage: "Completed" as KDSStage };
        return o;
      }),
    }));

    try {
      const res = await api.patch(`/kds/${orderId}/stage`);
      // Sync with server response
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? res.data : o)),
      }));
    } catch (err) {
      console.error("Failed to advance stage:", err);
      // Revert on failure
      get().fetchOrders();
    }
  },
}));
