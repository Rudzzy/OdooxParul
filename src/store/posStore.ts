import { create } from "zustand";

export type PosTableStatus = "Available" | "Occupied";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isVeg: boolean;
  image: string;
}

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  sentQuantity: number;
  instruction?: string;
}

export interface ActiveTableSession {
  tableId: string;
  status: PosTableStatus;
  customer: Customer | null;
  orderItems: OrderItem[];
}

interface PosState {
  sessions: Record<string, ActiveTableSession>;
  getSession: (tableId: string) => ActiveTableSession;
  updateSession: (tableId: string, updates: Partial<ActiveTableSession>) => void;
  clearSession: (tableId: string) => void;
  customers: Customer[];
  addCustomer: (customer: Customer) => void;
}

const mockCustomers: Customer[] = [
  { id: "c1", name: "Rahul Kumar", email: "rahul@example.com", phone: "9876543210" },
  { id: "c2", name: "Priya Sharma", email: "priya@example.com", phone: "8765432109" },
  { id: "c3", name: "Amit Singh", email: "amit@example.com", phone: "7654321098" },
];

export const usePosStore = create<PosState>((set, get) => ({
  sessions: {},
  customers: mockCustomers,
  
  getSession: (tableId: string) => {
    const session = get().sessions[tableId];
    if (session) return session;
    return {
      tableId,
      status: "Available",
      customer: null,
      orderItems: [],
    };
  },
  
  updateSession: (tableId: string, updates: Partial<ActiveTableSession>) => set((state) => {
    const currentSession = state.sessions[tableId] || {
      tableId,
      status: "Available",
      customer: null,
      orderItems: [],
    };
    
    const newSession = { ...currentSession, ...updates };
    
    // Automatically determine status based on customer / items
    if (newSession.customer || newSession.orderItems.length > 0) {
      newSession.status = "Occupied";
    } else {
      newSession.status = "Available";
    }
    
    return {
      sessions: {
        ...state.sessions,
        [tableId]: newSession
      }
    };
  }),
  
  clearSession: (tableId: string) => set((state) => {
    const newSessions = { ...state.sessions };
    delete newSessions[tableId];
    return { sessions: newSessions };
  }),
  
  addCustomer: (customer: Customer) => set((state) => ({
    customers: [...state.customers, customer]
  }))
}));
