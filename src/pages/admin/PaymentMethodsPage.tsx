import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Plus, Check, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { usePaymentStore } from "../../store/paymentStore";

import { Button } from "../../components/ui/button";

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

  // Stagger variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-[#12100f] text-[#f4ece3] flex flex-col md:flex-row font-sans">
      {/* Sidebar List */}
      <div className="w-full md:w-[320px] border-b md:border-b-0 md:border-r border-[#3b3228] p-6 space-y-6 bg-[#171412]">
        <div className="flex items-center gap-3 text-[#e2a874] mb-8">
          <Coffee className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-wider font-serif">Payments</h1>
        </div>

        <Button 
          variant="outline" 
          className="w-full border-[#5c4a3d] text-[#e2a874] hover:bg-[#2a221b] hover:text-[#f4ece3] bg-[#1f1914] shadow-md"
          onClick={() => setSelectedId(null)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Method
        </Button>

        <div className="space-y-3 mt-6">
          {paymentMethods.map(method => (
            <div 
              key={method.id} 
              onClick={() => setSelectedId(method.id)}
              className={`p-4 rounded-lg cursor-pointer flex justify-between items-center transition-all duration-200 ${
                selectedId === method.id 
                  ? 'bg-[#2a221b] border-l-4 border-l-[#e2a874] shadow-lg scale-[1.02]' 
                  : 'hover:bg-[#1f1914] border-l-4 border-l-transparent hover:border-l-[#5c4a3d]'
              }`}
            >
              <div>
                <p className="font-medium text-[#f4ece3]">{method.name}</p>
                <p className="text-sm text-[#a38c75]">{method.type}</p>
              </div>
              {method.isActive && <Check className="w-5 h-5 text-green-500" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Configuration Form */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-2xl bg-[#1f1914] p-8 md:p-10 rounded-2xl shadow-2xl border border-[#3b3228] relative overflow-hidden">
          {/* Subtle Cafe Watermark Background */}
          <div className="absolute -bottom-10 -right-10 opacity-[0.03] pointer-events-none">
            <Coffee className="w-64 h-64 text-amber-500" />
          </div>

          <div className="mb-8 border-b border-[#3b3228] pb-6 flex items-center justify-between">
            <h2 className="text-xl font-serif tracking-widest text-[#e2a874]">
              {isEditing ? "Edit Payment Method" : "Create New Method"}
            </h2>
            <div className="text-sm text-[#a38c75] font-mono">
              Status: {form.watch("isActive") ? "Active" : "Inactive"}
            </div>
          </div>

          <motion.form 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            key={selectedId || "new"}
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-10 relative z-10"
          >
            <motion.div variants={itemVariants} className="space-y-3">
              <label className="text-[#d8c3af] font-medium font-serif text-lg tracking-wide">
                Payment method Name
              </label>
              <input 
                {...form.register("name")}
                placeholder="e.g. UPI - Merchant"
                className="w-full bg-transparent border-b border-[#5c4a3d] px-0 py-2 text-[#f4ece3] focus:outline-none focus:border-[#e2a874] transition-colors placeholder:text-[#5c4a3d] text-xl"
              />
              {form.formState.errors.name && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.name.message}</p>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[#d8c3af] font-medium font-serif text-lg tracking-wide">
                  Type
                </label>
                <div className="relative">
                  <select 
                    {...form.register("type")}
                    className="w-full bg-transparent border-b border-[#5c4a3d] px-0 py-2 text-[#f4ece3] focus:outline-none focus:border-[#e2a874] transition-colors appearance-none cursor-pointer text-lg"
                  >
                    <option value="Cash" className="bg-[#1f1914] text-[#f4ece3]">Cash</option>
                    <option value="Card/Digital" className="bg-[#1f1914] text-[#f4ece3]">Card/Digital</option>
                    <option value="UPI" className="bg-[#1f1914] text-[#f4ece3]">UPI</option>
                  </select>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[#a38c75]">
                    V
                  </div>
                </div>
              </div>

              <div className="flex items-center pt-8">
                <label className="flex items-center gap-4 cursor-pointer group">
                  <span className="text-[#d8c3af] font-medium font-serif text-lg tracking-wide">
                    Activate
                  </span>
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      {...form.register("isActive")}
                      className="w-6 h-6 rounded border border-[#5c4a3d] bg-transparent appearance-none checked:bg-[#e2a874] checked:border-[#e2a874] transition-colors cursor-pointer focus:outline-none group-hover:border-[#e2a874]"
                    />
                    <AnimatePresence>
                      {form.watch("isActive") && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute pointer-events-none"
                        >
                          <Check className="w-4 h-4 text-[#12100f]" strokeWidth={3} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </label>
              </div>
            </motion.div>

            <AnimatePresence>
              {selectedType === "UPI" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden pt-4"
                >
                  <div className="border border-red-500/30 rounded-xl p-8 relative bg-[#171412] shadow-inner">
                    <div className="absolute -top-3 right-6 bg-[#1f1914] px-3 py-1 rounded text-xs text-red-400 font-mono tracking-widest border border-red-500/30">
                      Show only when type = UPI
                    </div>
                    
                    <div className="space-y-8">
                      <div className="space-y-3">
                        <label className="text-[#d8c3af] font-medium font-serif text-lg tracking-wide mr-6 inline-block min-w-[100px]">
                          UPI ID
                        </label>
                        <input 
                          {...form.register("upiId")}
                          placeholder="abc@upi.com"
                          className="bg-transparent border-b border-[#5c4a3d] px-2 py-1 text-[#f4ece3] focus:outline-none focus:border-[#e2a874] transition-colors placeholder:text-[#5c4a3d] min-w-[280px] text-lg"
                        />
                        {form.formState.errors.upiId && (
                          <p className="text-red-400 text-sm mt-2 ml-[124px]">{form.formState.errors.upiId.message}</p>
                        )}
                      </div>

                      <div className="space-y-4">
                        <label className="text-[#d8c3af] font-medium font-serif text-lg tracking-wide">
                          QR Preview
                        </label>
                        <div className="border border-[#3b3228] rounded-xl p-6 inline-block bg-[#1f1914] shadow-md ml-4 mt-2">
                          {upiIdValue ? (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex flex-col items-center gap-3"
                            >
                              <p className="text-xs text-[#a38c75] tracking-widest uppercase">UPI QR</p>
                              <div className="bg-white p-3 rounded-lg shadow-inner">
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${upiIdValue}&pn=Merchant&margin=0`}
                                  alt="UPI QR Code"
                                  className="w-[150px] h-[150px] object-contain"
                                />
                              </div>
                              <p className="text-base font-bold tracking-widest text-[#f4ece3] mt-2 font-mono">SCAN ME</p>
                            </motion.div>
                          ) : (
                            <div className="w-[150px] h-[150px] flex items-center justify-center border-2 border-dashed border-[#3b3228] m-5 text-[#5c4a3d] rounded-lg">
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

            <motion.div variants={itemVariants} className="pt-10 flex justify-between items-center border-t border-[#3b3228] mt-10">
              {isEditing ? (
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => {
                    deletePaymentMethod(selectedId);
                    setSelectedId(null);
                    toast.success("Payment method deleted");
                  }}
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/40 px-6"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Method
                </Button>
              ) : (
                <div />
              )}
              <Button 
                type="submit" 
                className="bg-[#e2a874] text-[#12100f] hover:bg-[#d8c3af] font-semibold tracking-wider px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                Save Payment Method
              </Button>
            </motion.div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
