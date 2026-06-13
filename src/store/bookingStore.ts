import { create } from "zustand";

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
  addBooking: (booking: Omit<Booking, "id">) => Booking;
  updateBooking: (id: string, booking: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
}

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

const initialBookings: Booking[] = [
  {
    id: "1",
    customerName: "Alice Smith",
    customerPhone: "555-0100",
    date: today.toISOString().split("T")[0],
    time: "19:00",
    partySize: 2,
    tableId: "1",
    status: "Confirmed",
    charges: 150,
  },
  {
    id: "2",
    customerName: "Bob Jones",
    customerPhone: "555-0200",
    date: today.toISOString().split("T")[0],
    time: "20:30",
    partySize: 4,
    status: "Pending",
    charges: 0,
  },
  {
    id: "3",
    customerName: "Charlie Davis",
    customerPhone: "555-0300",
    date: tomorrow.toISOString().split("T")[0],
    time: "18:00",
    partySize: 6,
    tableId: "3",
    status: "Confirmed",
    charges: 500,
  },
];

export const useBookingStore = create<BookingState>((set) => ({
  bookings: initialBookings,
  addBooking: (booking) => {
    const newBooking = { ...booking, id: Math.random().toString(36).substring(2, 9) };
    set((state) => ({ bookings: [...state.bookings, newBooking] }));
    return newBooking;
  },
  updateBooking: (id, updatedFields) => {
    set((state) => ({
      bookings: state.bookings.map((b) => (b.id === id ? { ...b, ...updatedFields } : b)),
    }));
  },
  deleteBooking: (id) => {
    set((state) => ({
      bookings: state.bookings.filter((b) => b.id !== id),
    }));
  },
}));
