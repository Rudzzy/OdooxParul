import { create } from "zustand";

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
  addFloor: (floor: Omit<Floor, "id">) => Floor;
  updateFloor: (id: string, floor: Partial<Floor>) => void;
  deleteFloor: (id: string) => void;
  addTable: (table: Omit<TableItem, "id">) => TableItem;
  updateTable: (id: string, table: Partial<TableItem>) => void;
  deleteTable: (id: string) => void;
}

const initialFloors: Floor[] = [
  { id: "1", name: "Main Dining" },
  { id: "2", name: "Patio" },
];

const initialTables: TableItem[] = [
  { id: "1", floorId: "1", tableNumber: "T1", capacity: 4, isActive: true },
  { id: "2", floorId: "1", tableNumber: "T2", capacity: 2, isActive: true },
  { id: "3", floorId: "1", tableNumber: "T3", capacity: 6, isActive: false },
  { id: "4", floorId: "2", tableNumber: "P1", capacity: 4, isActive: true },
];

export const useFloorStore = create<FloorState>((set) => ({
  floors: initialFloors,
  tables: initialTables,
  addFloor: (floor) => {
    const newFloor = { ...floor, id: Math.random().toString(36).substring(2, 9) };
    set((state) => ({ floors: [...state.floors, newFloor] }));
    return newFloor;
  },
  updateFloor: (id, updatedFields) => {
    set((state) => ({
      floors: state.floors.map((f) => (f.id === id ? { ...f, ...updatedFields } : f)),
    }));
  },
  deleteFloor: (id) => {
    set((state) => ({
      floors: state.floors.filter((f) => f.id !== id),
      // Cascading delete: Remove all tables associated with this floor
      tables: state.tables.filter((t) => t.floorId !== id),
    }));
  },
  addTable: (table) => {
    const newTable = { ...table, id: Math.random().toString(36).substring(2, 9) };
    set((state) => ({ tables: [...state.tables, newTable] }));
    return newTable;
  },
  updateTable: (id, updatedFields) => {
    set((state) => ({
      tables: state.tables.map((t) => (t.id === id ? { ...t, ...updatedFields } : t)),
    }));
  },
  deleteTable: (id) => {
    set((state) => ({
      tables: state.tables.filter((t) => t.id !== id),
    }));
  },
}));
