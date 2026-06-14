import { create } from "zustand";

import api from "../lib/api";

export type Role = "Admin" | "Employee" | "admin" | "staff";
export type EmployeeStatus = "Active" | "Archived";

export type Employee = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: EmployeeStatus;
  pin: string | null;
};

interface EmployeeState {
  employees: Employee[];
  fetchEmployees: () => Promise<void>;
  addEmployee: (employee: Omit<Employee, "id">) => Promise<Employee>;
  updateEmployee: (id: string, updatedFields: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  changePin: (id: string, newPin: string) => Promise<void>;
  archiveEmployee: (id: string) => Promise<void>;
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
  employees: [],
  fetchEmployees: async () => {
    try {
      const res = await api.get("/users");
      set({ employees: res.data });
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  },
  addEmployee: async (employee) => {
    const payload = {
      ...employee,
      role: employee.role.toLowerCase() === "admin" ? "admin" : "staff",
      status: employee.status || "Active",
      pin: employee.pin || null,
      hashed_password: "dummy"
    };
    const res = await api.post("/users", payload);
    const newEmployee = res.data;
    set((state) => ({ employees: [...state.employees, newEmployee] }));
    return newEmployee;
  },
  updateEmployee: async (id, updatedFields) => {
    const current = useEmployeeStore.getState().employees.find((e) => e.id === id);
    if (!current) return;
    const merged = { ...current, ...updatedFields };
    await api.put(`/users/${id}`, merged);
    set((state) => ({
      employees: state.employees.map((e) => (e.id === id ? { ...e, ...updatedFields } : e)),
    }));
  },
  deleteEmployee: async (id) => {
    await api.delete(`/users/${id}`);
    set((state) => ({
      employees: state.employees.filter((e) => e.id !== id),
    }));
  },
  changePin: async (id, newPin) => {
    const current = useEmployeeStore.getState().employees.find((e) => e.id === id);
    if (!current) return;
    await api.put(`/users/${id}`, { ...current, pin: newPin });
    set((state) => ({
      employees: state.employees.map((e) => (e.id === id ? { ...e, pin: newPin } : e)),
    }));
  },
  archiveEmployee: async (id) => {
    const current = useEmployeeStore.getState().employees.find((e) => e.id === id);
    if (!current) return;
    await api.put(`/users/${id}`, { ...current, status: "Archived" });
    set((state) => ({
      employees: state.employees.map((e) => (e.id === id ? { ...e, status: "Archived" } : e)),
    }));
  },
}));
