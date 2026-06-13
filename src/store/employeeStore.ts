import { create } from "zustand";

export type Role = "Admin" | "Employee";
export type EmployeeStatus = "Active" | "Archived";

export type Employee = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: EmployeeStatus;
  pin: string;
};

interface EmployeeState {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, "id">) => Employee;
  updateEmployee: (id: string, updatedFields: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  changePin: (id: string, newPin: string) => void;
  archiveEmployee: (id: string) => void;
}

const initialEmployees: Employee[] = [
  {
    id: "admin-1",
    name: "System Admin",
    email: "admin@cafe.com",
    role: "Admin",
    status: "Active",
    pin: "1234",
  },
  {
    id: "emp-1",
    name: "John Doe",
    email: "john@cafe.com",
    role: "Employee",
    status: "Active",
    pin: "0000",
  },
  {
    id: "emp-2",
    name: "Jane Smith",
    email: "jane@cafe.com",
    role: "Employee",
    status: "Archived",
    pin: "9999",
  },
];

export const useEmployeeStore = create<EmployeeState>((set) => ({
  employees: initialEmployees,
  addEmployee: (employee) => {
    const newEmployee = { ...employee, id: Math.random().toString(36).substring(2, 9) };
    set((state) => ({ employees: [...state.employees, newEmployee] }));
    return newEmployee;
  },
  updateEmployee: (id, updatedFields) => {
    set((state) => ({
      employees: state.employees.map((e) => (e.id === id ? { ...e, ...updatedFields } : e)),
    }));
  },
  deleteEmployee: (id) => {
    set((state) => ({
      employees: state.employees.filter((e) => e.id !== id),
    }));
  },
  changePin: (id, newPin) => {
    set((state) => ({
      employees: state.employees.map((e) => (e.id === id ? { ...e, pin: newPin } : e)),
    }));
  },
  archiveEmployee: (id) => {
    set((state) => ({
      employees: state.employees.map((e) => (e.id === id ? { ...e, status: "Archived" } : e)),
    }));
  },
}));
