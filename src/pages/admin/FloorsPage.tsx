import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, Trash2, LayoutDashboard, Users, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

import { useFloorStore, Floor, TableItem } from "../../store/floorStore";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

// --- SCHEMAS ---
const floorSchema = z.object({
  name: z.string().min(1, "Floor name is required"),
});

const tableSchema = z.object({
  tableNumber: z.string().min(1, "Table number is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  isActive: z.boolean(),
});

type FloorFormValues = z.infer<typeof floorSchema>;
type TableFormValues = z.infer<typeof tableSchema>;

export default function FloorsPage() {
  const { floors, tables, addFloor, updateFloor, deleteFloor, addTable, updateTable, deleteTable } = useFloorStore();
  
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);

  // Modals state
  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);

  // Delete Alert
  const [floorToDelete, setFloorToDelete] = useState<string | null>(null);

  // Forms
  const floorForm = useForm<FloorFormValues>({
    resolver: zodResolver(floorSchema),
    defaultValues: { name: "" },
  });

  const tableForm = useForm<TableFormValues>({
    resolver: zodResolver(tableSchema),
    defaultValues: { tableNumber: "", capacity: 4, isActive: true },
  });

  // Derived state
  const selectedFloor = floors.find(f => f.id === selectedFloorId);
  const selectedFloorTables = tables.filter(t => t.floorId === selectedFloorId);

  // --- Handlers ---
  const openFloorModal = (floor?: Floor) => {
    if (floor) {
      setEditingFloor(floor);
      floorForm.reset({ name: floor.name });
    } else {
      setEditingFloor(null);
      floorForm.reset({ name: "" });
    }
    setIsFloorModalOpen(true);
  };

  const onFloorSubmit = (data: FloorFormValues) => {
    if (editingFloor) {
      updateFloor(editingFloor.id, data);
      toast.success("Floor updated");
    } else {
      const newFloor = addFloor(data);
      toast.success("Floor created");
      if (!selectedFloorId) setSelectedFloorId(newFloor.id); // Auto select if first floor
    }
    setIsFloorModalOpen(false);
  };

  const confirmDeleteFloor = () => {
    if (floorToDelete) {
      deleteFloor(floorToDelete);
      toast.success("Floor and associated tables deleted");
      if (selectedFloorId === floorToDelete) {
        setSelectedFloorId(null);
      }
      setFloorToDelete(null);
    }
  };

  const openTableModal = (table?: TableItem) => {
    if (table) {
      setEditingTable(table);
      tableForm.reset({ 
        tableNumber: table.tableNumber, 
        capacity: table.capacity, 
        isActive: table.isActive 
      });
    } else {
      setEditingTable(null);
      tableForm.reset({ tableNumber: "", capacity: 4, isActive: true });
    }
    setIsTableModalOpen(true);
  };

  const onTableSubmit = (data: TableFormValues) => {
    if (!selectedFloorId) return;

    if (editingTable) {
      updateTable(editingTable.id, data);
      toast.success("Table updated");
    } else {
      addTable({ ...data, floorId: selectedFloorId });
      toast.success("Table created");
    }
    setIsTableModalOpen(false);
  };

  return (
    <div className="h-[calc(100vh-6rem)] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Floors & Tables</h1>
          <p className="text-muted-foreground">
            Manage your restaurant layout, seating capacities, and table availability.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
        {/* LEFT PANEL - FLOORS */}
        <div className="md:col-span-1 bg-white rounded-xl border shadow-sm flex flex-col h-[calc(100vh-12rem)]">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50/50 rounded-t-xl">
            <h2 className="font-semibold flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-slate-500" /> Floors
            </h2>
            <Button size="sm" variant="outline" onClick={() => openFloorModal()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="p-2 flex-1 overflow-y-auto space-y-1">
            {floors.length === 0 ? (
              <div className="text-center p-4 text-sm text-muted-foreground mt-10">
                No floors found. Add one to get started.
              </div>
            ) : (
              floors.map((floor) => (
                <div 
                  key={floor.id}
                  onClick={() => setSelectedFloorId(floor.id)}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedFloorId === floor.id 
                      ? "bg-slate-900 text-white shadow-md" 
                      : "hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <span className="font-medium truncate pr-2">{floor.name}</span>
                  <div className={`flex gap-1 ${selectedFloorId === floor.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-7 w-7 ${selectedFloorId === floor.id ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-500'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openFloorModal(floor);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-7 w-7 ${selectedFloorId === floor.id ? 'text-red-400 hover:text-red-300 hover:bg-red-950/50' : 'text-red-500 hover:bg-red-50'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFloorToDelete(floor.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL - TABLES */}
        <div className="md:col-span-3 bg-white rounded-xl border shadow-sm flex flex-col h-[calc(100vh-12rem)] overflow-hidden">
          {!selectedFloorId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/30">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <LayoutDashboard className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-medium text-slate-600 mb-2">No Floor Selected</h3>
              <p>Please select a floor from the left panel to manage its tables.</p>
            </div>
          ) : (
            <>
              <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    {selectedFloor?.name} <span className="text-slate-400 font-normal text-base">({selectedFloorTables.length} tables)</span>
                  </h2>
                </div>
                <Button onClick={() => openTableModal()}>
                  <Plus className="w-4 h-4 mr-2" /> Add Table
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                {selectedFloorTables.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <AlertCircle className="w-12 h-12 mb-4 text-slate-300" />
                    <p>No tables configured for this floor yet.</p>
                    <Button variant="link" onClick={() => openTableModal()}>Add your first table</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {selectedFloorTables.map(table => (
                      <div 
                        key={table.id}
                        className={`relative group flex flex-col items-center justify-center aspect-square rounded-2xl border-2 transition-all duration-200 ${
                          table.isActive 
                            ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md' 
                            : 'bg-slate-50 border-dashed border-slate-300 opacity-75'
                        }`}
                      >
                        {/* Actions Overlay */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-7 w-7 bg-white/90 shadow-sm backdrop-blur-sm hover:bg-slate-100"
                            onClick={() => openTableModal(table)}
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-600" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="h-7 w-7 shadow-sm opacity-90 hover:opacity-100"
                            onClick={() => deleteTable(table.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        {/* Table Number */}
                        <h3 className="text-4xl font-bold text-slate-800 mb-2 font-mono">
                          {table.tableNumber}
                        </h3>

                        {/* Capacity */}
                        <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-sm font-medium mb-3">
                          <Users className="w-4 h-4" />
                          {table.capacity}
                        </div>

                        {/* Status */}
                        <Badge variant={table.isActive ? "default" : "secondary"} className="absolute bottom-3">
                          {table.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Floor Form Modal */}
      <Dialog open={isFloorModalOpen} onOpenChange={setIsFloorModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingFloor ? "Edit Floor" : "Add New Floor"}</DialogTitle>
          </DialogHeader>
          <Form {...floorForm}>
            <form onSubmit={floorForm.handleSubmit(onFloorSubmit)} className="space-y-4 mt-2">
              <FormField
                control={floorForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Ground Floor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFloorModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save Floor</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Table Form Modal */}
      <Dialog open={isTableModalOpen} onOpenChange={setIsTableModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingTable ? "Edit Table" : "Add New Table"}</DialogTitle>
          </DialogHeader>
          <Form {...tableForm}>
            <form onSubmit={tableForm.handleSubmit(onTableSubmit)} className="space-y-5 mt-2">
              <FormField
                control={tableForm.control}
                name="tableNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Table Number / Identifier</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. T1, A4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={tableForm.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seat Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={tableForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-slate-50/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Status</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Is this table currently available?
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsTableModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save Table</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Floor Confirmation */}
      <AlertDialog open={!!floorToDelete} onOpenChange={(open) => !open && setFloorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this floor and <strong>ALL tables</strong> assigned to it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFloor} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
              Delete Floor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
