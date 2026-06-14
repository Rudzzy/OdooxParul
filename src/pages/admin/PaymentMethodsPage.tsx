import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Trash2, CreditCard } from "lucide-react";
import toast from "react-hot-toast";

import { usePaymentStore } from "../../store/paymentStore";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["Cash", "Card/Digital", "UPI"] as const),
  isActive: z.boolean(),
  upiId: z.string().optional(),
}).refine(data => {
  if (data.type === "UPI" && (!data.upiId || data.upiId.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "UPI ID is required when type is UPI",
  path: ["upiId"],
});

type FormValues = z.infer<typeof formSchema>;

export default function PaymentMethodsPage() {
  const { paymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod, fetchPaymentMethods } = usePaymentStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const isEditing = selectedId !== null;
  const currentMethod = isEditing ? paymentMethods.find(p => p.id === selectedId) : null;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "Cash",
      isActive: false,
      upiId: "",
    },
  });

  const selectedType = form.watch("type");
  const upiIdValue = form.watch("upiId");

  useEffect(() => {
    if (currentMethod) {
      form.reset({
        name: currentMethod.name,
        type: currentMethod.type,
        isActive: currentMethod.isActive,
        upiId: currentMethod.upiId || "",
      });
    } else {
      form.reset({
        name: "",
        type: "Cash",
        isActive: false,
        upiId: "",
      });
    }
  }, [currentMethod, form]);

  const onSubmit = async (data: FormValues) => {
    if (isEditing && selectedId) {
      await updatePaymentMethod(selectedId, data);
      toast.success("Payment method updated");
    } else {
      const newMethod = await addPaymentMethod(data);
      setSelectedId(newMethod.id);
      toast.success("Payment method created");
    }
  };

  return (
    <div className="p-6 space-y-6 flex flex-col md:flex-row gap-6">
      {/* Sidebar List */}
      <div className="w-full md:w-[320px] bg-white rounded-xl border shadow-sm p-4 flex flex-col shrink-0">
        <div className="flex items-center gap-2 mb-6 text-slate-800">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold tracking-tight">Payment Methods</h2>
        </div>

        <Button 
          variant="outline" 
          className="w-full border-dashed mb-4"
          onClick={() => setSelectedId(null)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Method
        </Button>

        <div className="space-y-2 flex-1 overflow-y-auto">
          {paymentMethods.map(method => (
            <div 
              key={method.id} 
              onClick={() => setSelectedId(method.id)}
              className={`p-3 rounded-lg cursor-pointer flex justify-between items-center transition-all duration-200 border ${
                selectedId === method.id 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div>
                <p className="font-medium text-slate-900">{method.name}</p>
                <p className="text-xs text-slate-500">{method.type}</p>
              </div>
              {method.isActive && <Check className="w-4 h-4 text-green-500" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Configuration Form */}
      <div className="flex-1 bg-white rounded-xl border shadow-sm p-6 overflow-y-auto">
        <div className="mb-6 border-b pb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">
            {isEditing ? "Edit Payment Method" : "Create New Method"}
          </h2>
          <div className="text-sm text-slate-500">
            Status: <span className={form.watch("isActive") ? "text-green-600 font-medium" : "text-slate-400"}>
              {form.watch("isActive") ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Payment Method Name
            </label>
            <Input 
              {...form.register("name")}
              placeholder="e.g. UPI - Odoo Dineflow"
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Type
              </label>
              <select 
                {...form.register("type")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Cash">Cash</option>
                <option value="Card/Digital">Card/Digital</option>
                <option value="UPI">UPI</option>
              </select>
            </div>

            <div className="flex items-center pt-8">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  {...form.register("isActive")}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                <span className="text-sm font-medium text-slate-700">
                  Active
                </span>
              </label>
            </div>
          </div>

          <AnimatePresence>
            {selectedType === "UPI" && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="border border-blue-100 bg-blue-50/50 rounded-lg p-5 mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        UPI ID
                      </label>
                      <Input 
                        {...form.register("upiId")}
                        placeholder="merchant@upi"
                        className="bg-white"
                      />
                      {form.formState.errors.upiId && (
                        <p className="text-red-500 text-xs mt-1">{form.formState.errors.upiId.message}</p>
                      )}
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-sm font-medium text-slate-700">
                        QR Preview
                      </label>
                      <div className="mt-2">
                        {upiIdValue ? (
                          <div className="border border-blue-200 rounded-xl p-3 bg-blue-50 shadow-sm mb-2 w-fit">
                            <div className="flex flex-col items-center gap-1">
                              <p className="text-[10px] text-blue-600 font-bold tracking-widest uppercase mb-1">UPI QR</p>
                              <div className="bg-white p-1.5 rounded-lg shadow-sm border border-blue-100">
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi://pay?pa=${upiIdValue}&pn=Odoo%20Dineflow&margin=0`}
                                  alt="UPI QR Code"
                                  className="w-[100px] h-[100px] object-contain"
                                />
                              </div>
                              <p className="text-[11px] font-bold tracking-widest text-slate-700 mt-1 uppercase">Scan to Pay</p>
                            </div>
                          </div>
                        ) : (
                          <div className="w-[120px] h-[120px] flex items-center justify-center border-2 border-dashed border-slate-200 bg-white text-slate-400 text-xs rounded-lg text-center p-4">
                            Awaiting UPI ID
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-6 flex justify-between items-center border-t mt-8">
            {isEditing ? (
              <Button 
                type="button" 
                variant="ghost"
                onClick={() => {
                  deletePaymentMethod(selectedId);
                  setSelectedId(null);
                  toast.success("Payment method deleted");
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            ) : (
              <div />
            )}
            <Button type="submit">
              Save Payment Method
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
