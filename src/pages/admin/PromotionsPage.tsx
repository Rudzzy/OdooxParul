import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { usePromotionStore, Promotion } from "../../store/promotionStore";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";
import { Badge } from "../../components/ui/badge";
import { Checkbox } from "../../components/ui/checkbox";
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

// --- PROMOTION FORM SCHEMA ---
const promoSchema = z.object({
  name: z.string().min(1, "Promotion name is required"),
  appliesTo: z.enum(["product", "order"]),
  conditionType: z.enum(["min_qty", "min_amount", "none"]),
  conditionValue: z.coerce.number().min(0),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.coerce.number().min(0.01, "Discount value must be greater than 0"),
  isActive: z.boolean(),
  activeDays: z.array(z.number()),
});

type PromoFormValues = z.infer<typeof promoSchema>;

const DAYS_OF_WEEK = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

export default function PromotionsPage() {
  const { promotions, addPromotion, updatePromotion, deletePromotion, checkExpirations, fetchPromotions } = usePromotionStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPromotions();
  }, []);

  useEffect(() => {
    checkExpirations();
    const interval = setInterval(checkExpirations, 60000);
    return () => clearInterval(interval);
  }, [checkExpirations]);

  const form = useForm<PromoFormValues>({
    resolver: zodResolver(promoSchema),
    defaultValues: {
      name: "",
      appliesTo: "order",
      conditionType: "min_amount",
      conditionValue: 0,
      discountType: "percentage",
      discountValue: 0,
      isActive: true,
      activeDays: [],
    },
  });

  const conditionType = form.watch("conditionType");

  const openModal = (promo?: Promotion) => {
    if (promo) {
      setEditingId(promo.id);
      form.reset({
        name: promo.name,
        appliesTo: promo.appliesTo,
        conditionType: promo.conditionType,
        conditionValue: promo.conditionValue,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        isActive: promo.isActive,
        activeDays: promo.activeDays || [],
      });
    } else {
      setEditingId(null);
      form.reset({
        name: "",
        appliesTo: "order",
        conditionType: "min_amount",
        conditionValue: 0,
        discountType: "percentage",
        discountValue: 0,
        isActive: true,
        activeDays: [],
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data: PromoFormValues) => {
    if (editingId) {
      updatePromotion(editingId, data);
      toast.success("Promotion updated successfully");
    } else {
      addPromotion(data);
      toast.success("Promotion created successfully");
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automated Promotions</h1>
          <p className="text-muted-foreground">
            Manage automated promotional rules.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-md border shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">Promotions</h2>
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" /> New Promotion
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Applies To</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Discount Type</TableHead>
              <TableHead>Discount Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  No automated promotions found.
                </TableCell>
              </TableRow>
            ) : (
              promotions.map((p) => (
                <TableRow key={p.id} className="even:bg-slate-50/50">
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="capitalize">{p.appliesTo}</TableCell>
                  <TableCell>
                    {p.conditionType === "min_amount" 
                      ? `Min Amount: ₹${p.conditionValue}` 
                      : p.conditionType === "min_qty" 
                        ? `Min Qty: ${p.conditionValue}` 
                        : "None"}
                  </TableCell>
                  <TableCell className="capitalize">{p.discountType}</TableCell>
                  <TableCell>
                  {p.discountType === "percentage" ? `${p.discountValue}%` : `₹${p.discountValue.toFixed(2)}`}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant={p.isActive ? "default" : "secondary"} className="w-fit">
                      {p.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {p.activeDays && p.activeDays.length > 0 && (
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Scheduled
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openModal(p)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          deletePromotion(p.id);
                          toast.success("Promotion deleted");
                        }}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Promotion" : "New Promotion"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Promotion Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Weekend Special" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="appliesTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Applies To</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="order">Entire Order</SelectItem>
                          <SelectItem value="product">Specific Product (Future)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4 border p-3 rounded-md bg-slate-50">
                  <FormField
                    control={form.control}
                    name="conditionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="min_amount">Min. Order Amount</SelectItem>
                            <SelectItem value="min_qty">Min. Item Quantity</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {conditionType !== "none" && (
                    <FormField
                      control={form.control}
                      name="conditionValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Threshold Value</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" className="bg-white" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="discountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">% Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discountValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Value</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="activeDays"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Active Days (Optional)</FormLabel>
                        <p className="text-[0.8rem] text-muted-foreground">
                          Select specific days of the week this promotion should be active. Leave empty to activate every day.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-4 border p-4 rounded-md bg-slate-50">
                        {DAYS_OF_WEEK.map((day) => (
                          <FormField
                            key={day.value}
                            control={form.control}
                            name="activeDays"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={day.value}
                                  className="flex flex-row items-start space-x-2 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(day.value)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), day.value])
                                          : field.onChange(
                                              field.value?.filter((value) => value !== day.value)
                                            )
                                      }}
                                      className="bg-white"
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {day.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Status</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Allow this promotion to be applied automatically.
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
                  <Button type="submit">Save Promotion</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
