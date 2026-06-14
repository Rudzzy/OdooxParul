import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, Trash2, Archive, KeyRound, Eye, EyeOff, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

import { useEmployeeStore, Employee, Role, EmployeeStatus } from "../../store/employeeStore";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
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
const employeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  role: z.enum(["Admin", "Employee"]),
  status: z.enum(["Active", "Archived"]),
  pin: z.string().min(4, "PIN must be at least 4 digits"),
});

const passwordSchema = z.object({
  newPin: z.string().min(4, "PIN must be at least 4 digits"),
  confirmPin: z.string().min(4, "Please confirm PIN"),
}).refine((data) => data.newPin === data.confirmPin, {
  message: "PINs do not match",
  path: ["confirmPin"],
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function EmployeesPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, archiveEmployee, changePin } = useEmployeeStore();
  
  // Modals state
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordTargetId, setPasswordTargetId] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

  // Alerts
  const [employeeToArchive, setEmployeeToArchive] = useState<string | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);

  // Forms
  const employeeForm = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "Employee",
      status: "Active",
      pin: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPin: "", confirmPin: "" },
  });

  // Derived state (Assume the first Admin is the current logged in user for this demo)
  const currentAdmin = employees.find(e => e.role.toLowerCase() === "admin");

  // Fetch users on mount
  useEffect(() => {
    useEmployeeStore.getState().fetchEmployees();
  }, []);

  // --- Handlers ---
  const openEmployeeModal = (employee?: Employee) => {
    if (employee) {
      setEditingId(employee.id);
      employeeForm.reset({
        name: employee.name,
        email: employee.email,
        role: employee.role,
        status: employee.status,
        pin: employee.pin,
      });
    } else {
      setEditingId(null);
      employeeForm.reset({
        name: "",
        email: "",
        role: "Employee",
        status: "Active",
        pin: "",
      });
    }
    setIsEmployeeModalOpen(true);
  };

  const onEmployeeSubmit = (data: EmployeeFormValues) => {
    if (editingId) {
      updateEmployee(editingId, data);
      toast.success("Employee updated successfully");
    } else {
      addEmployee(data);
      toast.success("Employee created successfully");
    }
    setIsEmployeeModalOpen(false);
  };

  const openPasswordModal = (employeeId: string) => {
    setPasswordTargetId(employeeId);
    passwordForm.reset({ newPin: "", confirmPin: "" });
    setShowPin(false);
    setIsPasswordModalOpen(true);
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    if (passwordTargetId) {
      changePin(passwordTargetId, data.newPin);
      toast.success("PIN updated successfully");
      setIsPasswordModalOpen(false);
      setPasswordTargetId(null);
    }
  };

  const handleArchive = () => {
    if (employeeToArchive) {
      archiveEmployee(employeeToArchive);
      toast.success("Employee archived");
      setEmployeeToArchive(null);
    }
  };

  const handleDelete = () => {
    if (employeeToDelete) {
      deleteEmployee(employeeToDelete);
      toast.success("Employee deleted");
      setEmployeeToDelete(null);
    }
  };

  const toggleStatus = (id: string, currentStatus: EmployeeStatus) => {
    const newStatus = currentStatus === "Active" ? "Archived" : "Active";
    updateEmployee(id, { status: newStatus });
    toast.success(`Status updated to ${newStatus}`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Manage your staff accounts and access.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {currentAdmin && (
            <Button variant="outline" onClick={() => openPasswordModal(currentAdmin.id)}>
              <ShieldAlert className="w-4 h-4 mr-2" /> Change My Password
            </Button>
          )}
          <Button onClick={() => openEmployeeModal()}>
            <Plus className="w-4 h-4 mr-2" /> Add Employee
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No employees found.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((e) => (
                <TableRow 
                  key={e.id} 
                  className={`even:bg-slate-50/50 transition-opacity ${e.status === "Archived" ? "opacity-50 grayscale" : ""}`}
                >
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell>{e.email}</TableCell>
                  <TableCell>
                    <Badge variant={e.role === "Admin" ? "default" : "secondary"}>
                      {e.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch 
                      checked={e.status === "Active"} 
                      onCheckedChange={() => toggleStatus(e.id, e.status)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openPasswordModal(e.id)} title="Change PIN">
                        <KeyRound className="w-4 h-4 text-amber-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEmployeeModal(e)} title="Edit Employee">
                        <Pencil className="w-4 h-4 text-blue-500" />
                      </Button>
                      {e.status === "Active" && (
                        <Button variant="ghost" size="icon" onClick={() => setEmployeeToArchive(e.id)} title="Archive Employee">
                          <Archive className="w-4 h-4 text-slate-500" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => setEmployeeToDelete(e.id)} className="hover:bg-red-50 text-red-500 hover:text-red-600" title="Delete Permanently">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- MODALS --- */}

      {/* Employee Modal */}
      <Dialog open={isEmployeeModalOpen} onOpenChange={setIsEmployeeModalOpen}>
        <DialogContent className="sm:max-w-[425px] transform transition-all">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Employee" : "Add Employee"}</DialogTitle>
          </DialogHeader>
          <Form {...employeeForm}>
            <form onSubmit={employeeForm.handleSubmit(onEmployeeSubmit)} className="space-y-4 mt-2">
              <FormField
                control={employeeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={employeeForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={employeeForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Employee">Employee</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!editingId && (
                  <FormField
                    control={employeeForm.control}
                    name="pin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial PIN</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="1234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={employeeForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-slate-50/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Status</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {field.value === "Active" ? "Employee can log in." : "Employee is archived and cannot log in."}
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === "Active"}
                        onCheckedChange={(c) => field.onChange(c ? "Active" : "Archived")}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEmployeeModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save Employee</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change Login PIN</DialogTitle>
          </DialogHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5 mt-2">
              <FormField
                control={passwordForm.control}
                name="newPin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New PIN</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPin ? "text" : "password"} 
                          placeholder="••••" 
                          {...field} 
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPin(!showPin)}
                        >
                          {showPin ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm PIN</FormLabel>
                    <FormControl>
                      <Input 
                        type={showPin ? "text" : "password"} 
                        placeholder="••••" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
                <Button type="submit">Update PIN</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation */}
      <AlertDialog open={!!employeeToArchive} onOpenChange={(open) => !open && setEmployeeToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Employee?</AlertDialogTitle>
            <AlertDialogDescription>
              Archiving an employee will disable their ability to log in, but keep their historical data intact. You can reactivate them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!employeeToDelete} onOpenChange={(open) => !open && setEmployeeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the employee's account and credentials from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
