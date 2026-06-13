import { create } from "zustand";
import api from "../lib/api";

export type BookingStatus = "Pending" | "Confirmed" | "Seated" | "Cancelled";

export type Booking = {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  partySize: number;
  tableId?: string;
  status: BookingStatus;
  charges: number;
};

interface BookingState {
  bookings: Booking[];
  fetchBookings: () => Promise<void>;
  addBooking: (booking: Omit<Booking, "id">) => Promise<Booking>;
  updateBooking: (id: string, booking: Partial<Booking>) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  fetchBookings: async () => {
    const res = await api.get("/bookings");
    set({ bookings: res.data });
  },
  addBooking: async (booking) => {
    const res = await api.post("/bookings", booking);
    const newBooking = res.data;
    set((state) => ({ bookings: [...state.bookings, newBooking] }));
    return newBooking;
  },
  updateBooking: async (id, updatedFields) => {
    const current = useBookingStore.getState().bookings.find((b) => b.id === id);
    if (!current) return;
    const merged = { ...current, ...updatedFields };
    await api.put(`/bookings/${id}`, {
      customerName: merged.customerName,
      customerPhone: merged.customerPhone,
      date: merged.date,
      time: merged.time,
      partySize: merged.partySize,
      tableId: merged.tableId || null,
      status: merged.status,
      charges: merged.charges,
    });
    set((state) => ({
      bookings: state.bookings.map((b) => (b.id === id ? { ...b, ...updatedFields } : b)),
    }));
  },
  deleteBooking: async (id) => {
    await api.delete(`/bookings/${id}`);
    set((state) => ({
      bookings: state.bookings.filter((b) => b.id !== id),
    }));
  },
}));
