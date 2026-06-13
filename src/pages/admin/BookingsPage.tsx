import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, CalendarDays, Clock, Users, IndianRupee, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { useBookingStore, Booking, BookingStatus } from "../../store/bookingStore";
import { useFloorStore } from "../../store/floorStore";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

function toISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const bookingSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerPhone: z.string().min(1, "Phone is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  partySize: z.coerce.number().min(1, "Must be at least 1"),
  tableId: z.string().optional(),
  status: z.enum(["Pending", "Confirmed", "Seated", "Cancelled"]),
  charges: z.coerce.number().min(0, "Charges cannot be negative"),
}).superRefine((data, ctx) => {
  if (!data.date || !data.time) return;

  const now = new Date();
  const todayDateStr = toISODate(now);
  
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 2);
  const maxDateStr = toISODate(maxDate);

  if (data.date < todayDateStr) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cannot book for past dates.",
      path: ["date"]
    });
  }

  if (data.date > maxDateStr) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Advance bookings are only allowed up to 2 days before.",
      path: ["date"]
    });
  }

  if (data.date === todayDateStr) {
    const [hours, minutes] = data.time.split(":").map(Number);
    const visitTime = new Date();
    visitTime.setHours(hours, minutes, 0, 0);

    const threeHoursFromNow = new Date();
    threeHoursFromNow.setHours(threeHoursFromNow.getHours() + 3);

    if (visitTime < threeHoursFromNow) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Same-day bookings require at least 3 hours notice.",
        path: ["time"]
      });
    }
  }
});

type BookingFormValues = z.infer<typeof bookingSchema>;

type DateFilter = "today" | "tomorrow" | "this_week";

export default function BookingsPage() {
  const { bookings, addBooking, updateBooking, deleteBooking, fetchBookings } = useBookingStore();
  const { tables, floors, fetchFloors, fetchTables } = useFloorStore();

  useEffect(() => {
    fetchBookings();
    fetchFloors();
    fetchTables();
  }, []);

  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      date: toISODate(new Date()),
      time: "",
      partySize: 2,
      tableId: "none",
      status: "Pending",
      charges: 0,
    },
  });

  const openModal = (booking?: Booking) => {
    if (booking) {
      setEditingId(booking.id);
      form.reset({
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        date: booking.date,
        time: booking.time,
        partySize: booking.partySize,
        tableId: booking.tableId || "none",
        status: booking.status,
        charges: booking.charges,
      });
    } else {
      setEditingId(null);
      form.reset({
        customerName: "",
        customerPhone: "",
        date: toISODate(new Date()),
        time: "",
        partySize: 2,
        tableId: "none",
        status: "Pending",
        charges: 0,
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data: BookingFormValues) => {
    const payload = { ...data, tableId: data.tableId === "none" ? undefined : data.tableId };
    if (editingId) {
      updateBooking(editingId, payload);
      toast.success("Booking updated");
    } else {
      addBooking(payload);
      toast.success("Booking created");
    }
    setIsModalOpen(false);
  };

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    const today = new Date();
    const todayStr = toISODate(today);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = toISODate(tomorrow);

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const nextWeekStr = toISODate(nextWeek);

    return bookings.filter((b) => {
      if (dateFilter === "today") return b.date === todayStr;
      if (dateFilter === "tomorrow") return b.date === tomorrowStr;
      if (dateFilter === "this_week") return b.date >= todayStr && b.date <= nextWeekStr;
      return true;
    });
  }, [bookings, dateFilter]);

  // Group by Time Slot
  const groupedBookings = useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    const sorted = [...filteredBookings].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    sorted.forEach((b) => {
      // Grouping logic: format slot key
      const slotKey = dateFilter === "this_week" ? `${b.date} at ${b.time}` : b.time;
      if (!groups[slotKey]) groups[slotKey] = [];
      groups[slotKey].push(b);
    });
    return groups;
  }, [filteredBookings, dateFilter]);

  const getTableInfo = (tableId?: string) => {
    if (!tableId) return "No table assigned";
    const table = tables.find(t => t.id === tableId);
    if (!table) return "Unknown table";
    const floor = floors.find(f => f.id === table.floorId);
    return `${table.tableNumber} (${floor?.name || 'Unknown Floor'})`;
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Confirmed": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Seated": return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled": return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">Manage reservations and table assignments.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg border">
            <Button
              variant={dateFilter === "today" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDateFilter("today")}
              className="rounded-md"
            >
              Today
            </Button>
            <Button
              variant={dateFilter === "tomorrow" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDateFilter("tomorrow")}
              className="rounded-md"
            >
              Tomorrow
            </Button>
            <Button
              variant={dateFilter === "this_week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDateFilter("this_week")}
              className="rounded-md"
            >
              This Week
            </Button>
          </div>
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" /> New Booking
          </Button>
        </div>
      </div>

      {/* Timeline View */}
      <div className="bg-white rounded-xl border shadow-sm p-6 min-h-[500px]">
        {Object.keys(groupedBookings).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <CalendarDays className="w-12 h-12 mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-600">No bookings found</p>
            <p className="text-sm">There are no reservations for the selected time period.</p>
          </div>
        ) : (
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {Object.entries(groupedBookings).map(([slot, slotBookings]) => (
              <div key={slot} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Timeline Node */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-bold text-xs">
                  <Clock className="w-4 h-4" />
                </div>
                
                {/* Slot Container */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-slate-50 shadow-sm space-y-4">
                  <h3 className="font-semibold text-lg text-slate-700 mb-2 border-b pb-2">{slot}</h3>
                  
                  {slotBookings.map((booking) => (
                    <div 
                      key={booking.id} 
                      className={`bg-white border rounded-lg p-4 shadow-sm transition-all relative ${booking.status === "Cancelled" ? "opacity-60 grayscale" : "hover:border-blue-300"}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-slate-800">{booking.customerName}</h4>
                          <p className="text-sm text-muted-foreground">{booking.customerPhone}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline" className={`${getStatusColor(booking.status)} uppercase tracking-wider text-[10px]`}>
                            {booking.status}
                          </Badge>
                          <Select 
                            value={booking.status} 
                            onValueChange={(val: BookingStatus) => updateBooking(booking.id, { status: val })}
                          >
                            <SelectTrigger className="h-6 w-[100px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Confirmed">Confirmed</SelectItem>
                              <SelectItem value="Seated">Seated</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-4">
                        <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-md">
                          <Users className="w-4 h-4 text-slate-400" /> 
                          <span className="font-medium">{booking.partySize} Guests</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-md">
                          <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">T</div>
                          <span className="truncate">{getTableInfo(booking.tableId)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="w-4 h-4 text-slate-400" />
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Charges:</span>
                            <Input 
                              type="number" 
                              className="w-20 h-7 text-xs font-medium" 
                              value={booking.charges}
                              onChange={(e) => updateBooking(booking.id, { charges: Number(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500" onClick={() => openModal(booking)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-50" onClick={() => deleteBooking(booking.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Booking" : "New Booking"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 9876543210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="partySize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Party Size</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="charges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Charges (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tableId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign Table (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Table" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No specific table</SelectItem>
                          {floors.map(floor => {
                            const floorTables = tables.filter(t => t.floorId === floor.id);
                            if (floorTables.length === 0) return null;
                            return (
                              <div key={floor.id}>
                                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                                  {floor.name}
                                </div>
                                {floorTables.map(t => (
                                  <SelectItem key={t.id} value={t.id} className="pl-6">
                                    Table {t.tableNumber} ({t.capacity} seats)
                                  </SelectItem>
                                ))}
                              </div>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Confirmed">Confirmed</SelectItem>
                          <SelectItem value="Seated">Seated</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save Booking</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
