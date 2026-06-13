import { create } from "zustand";
import api from "../lib/api";

export type Floor = {
  id: string;
  name: string;
};

export type TableItem = {
  id: string;
  floorId: string;
  tableNumber: string;
  capacity: number;
  isActive: boolean;
};

interface FloorState {
  floors: Floor[];
  tables: TableItem[];
  fetchFloors: () => Promise<void>;
  fetchTables: () => Promise<void>;
  addFloor: (floor: Omit<Floor, "id">) => Promise<Floor>;
  updateFloor: (id: string, floor: Partial<Floor>) => Promise<void>;
  deleteFloor: (id: string) => Promise<void>;
  addTable: (table: Omit<TableItem, "id">) => Promise<TableItem>;
  updateTable: (id: string, table: Partial<TableItem>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
}

export const useFloorStore = create<FloorState>((set) => ({
  floors: [],
  tables: [],
  fetchFloors: async () => {
    const res = await api.get("/floors");
    set({ floors: res.data });
  },
  fetchTables: async () => {
    const res = await api.get("/tables");
    set({ tables: res.data });
  },
  addFloor: async (floor) => {
    const res = await api.post("/floors", floor);
    const newFloor = res.data;
    set((state) => ({ floors: [...state.floors, newFloor] }));
    return newFloor;
  },
  updateFloor: async (id, updatedFields) => {
    const current = useFloorStore.getState().floors.find((f) => f.id === id);
    if (!current) return;
    const merged = { ...current, ...updatedFields };
    await api.put(`/floors/${id}`, { name: merged.name });
    set((state) => ({
      floors: state.floors.map((f) => (f.id === id ? { ...f, ...updatedFields } : f)),
    }));
  },
  deleteFloor: async (id) => {
    await api.delete(`/floors/${id}`);
    set((state) => ({
      floors: state.floors.filter((f) => f.id !== id),
      // Cascading delete: Remove all tables associated with this floor
      tables: state.tables.filter((t) => t.floorId !== id),
    }));
  },
  addTable: async (table) => {
    const res = await api.post("/tables", table);
    const newTable = res.data;
    set((state) => ({ tables: [...state.tables, newTable] }));
    return newTable;
  },
  updateTable: async (id, updatedFields) => {
    const current = useFloorStore.getState().tables.find((t) => t.id === id);
    if (!current) return;
    const merged = { ...current, ...updatedFields };
    await api.put(`/tables/${id}`, {
      floorId: merged.floorId,
      tableNumber: merged.tableNumber,
      capacity: merged.capacity,
      isActive: merged.isActive,
    });
    set((state) => ({
      tables: state.tables.map((t) => (t.id === id ? { ...t, ...updatedFields } : t)),
    }));
  },
  deleteTable: async (id) => {
    await api.delete(`/tables/${id}`);
    set((state) => ({
      tables: state.tables.filter((t) => t.id !== id),
    }));
  },
}));
