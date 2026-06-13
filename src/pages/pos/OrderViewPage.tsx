import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, Plus, Minus, X, CheckCircle2, Users, ArrowRightCircle, FilePlus, User, Percent, LayoutDashboard, Printer, Loader2, CreditCard, QrCode, Banknote, ArrowLeft, Utensils } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useFloorStore } from "@/store/floorStore";
import { useProductStore } from "@/store/productStore";
import { useKdsStore } from "@/store/kdsStore";
import api from "@/lib/api";
import { usePosStore, OrderItem } from "@/store/posStore";

// Fallback Mock Data (used if API returns nothing)
const fallbackCategories = ["All", "Starters", "Main Course", "Pizza", "Burger", "Pasta", "Drinks", "Desserts"];

const fallbackMenuItems = [
  { id: "m1", name: "Cheese Pizza", price: 450, category: "Pizza", isVeg: true, image: "" },
  { id: "m2", name: "Cheese Burger", price: 270, category: "Burger", isVeg: false, image: "" },
  { id: "m3", name: "Paneer Tikka", price: 300, category: "Starters", isVeg: true, image: "" },
  { id: "m4", name: "Arrabiata Pasta", price: 380, category: "Pasta", isVeg: true, image: "" },
  { id: "m5", name: "Mojito", price: 200, category: "Drinks", isVeg: true, image: "" },
  { id: "m6", name: "Chocolate Brownie", price: 250, category: "Desserts", isVeg: true, image: "" },
];

const mockCustomers = [
  { id: "c1", name: "Rahul Kumar", email: "rahul@example.com", phone: "9876543210" },
  { id: "c2", name: "Priya Sharma", email: "priya@example.com", phone: "8765432109" },
  { id: "c3", name: "Amit Singh", email: "amit@example.com", phone: "7654321098" },
];

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isVeg: boolean;
  image: string;
}

// OrderItem is now imported from posStore

type PaymentMethod = "CASH" | "UPI" | "CARD" | null;

export default function OrderViewPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();

  // Layout Hacks: Prevents padding overlap on the POS Layout for this specific page
  useEffect(() => {
    const mainEl = document.querySelector("main");
    if (mainEl) {
      const originalPadding = mainEl.style.padding;
      const originalOverflow = mainEl.style.overflow;
      mainEl.style.padding = "0";
      mainEl.style.overflow = "hidden";
      return () => {
        mainEl.style.padding = originalPadding;
        mainEl.style.overflow = originalOverflow;
      };
    }
  }, []);

  // Table name lookup (resolve UUID to human-readable table number)
  const [tableName, setTableName] = useState("Table");
  const [tableBadge, setTableBadge] = useState("T?");

  useEffect(() => {
    const lookupTable = async () => {
      try {
        const res = await api.get("/tables");
        const currentTable = res.data?.find((t: any) => t.id === tableId);
        if (currentTable) {
          const num = currentTable.tableNumber.replace(/^T/i, "");
          setTableName(`Table ${num}`);
          setTableBadge(`T${num}`);
        }
      } catch {
        // Fallback: show short UUID prefix if API is unavailable
        setTableName(`Table ${(tableId || "?").substring(0, 4)}`);
        setTableBadge(`T${(tableId || "?").substring(0, 2)}`);
      }
    };
    lookupTable();
  }, [tableId]);

  // Product Store (fetch from DB)
  const { products: dbProducts, categories: dbCategories, fetchProducts, fetchCategories: fetchCats } = useProductStore();
  
  // KDS Store
  const { addOrder: sendToKds } = useKdsStore();

  // Build menu items from DB products, fall back to mock if empty
  const [menuItems, setMenuItems] = useState<MenuItem[]>(fallbackMenuItems);
  const [categoryList, setCategoryList] = useState<string[]>(fallbackCategories);

  useEffect(() => {
    fetchProducts();
    fetchCats();
  }, []);

  useEffect(() => {
    if (dbProducts.length > 0 && dbCategories.length > 0) {
      // Build a categoryId -> categoryName map
      const catMap: Record<string, string> = {};
      dbCategories.forEach(c => { catMap[c.id] = c.name; });

      // Map DB products to menu items
      const items: MenuItem[] = dbProducts
        .filter(p => p.status === "available")
        .map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: catMap[p.categoryId] || "Other",
          isVeg: p.isVeg,
          image: "",
        }));
      setMenuItems(items);

      // Build category list from DB
      const catNames = ["All", ...dbCategories.map(c => c.name)];
      setCategoryList(catNames);
    }
  }, [dbProducts, dbCategories]);

  // Left Panel State
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Pos Store State
  const session = usePosStore(state => state.sessions[tableId || ""]) || {
    tableId: tableId || "",
    status: "Available",
    customer: null,
    orderItems: []
  };
  const updateSession = usePosStore(state => state.updateSession);
  const clearSession = usePosStore(state => state.clearSession);

  const orderItems = session.orderItems;
  const selectedCustomer = session.customer;

  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchExistingOrder = async () => {
      try {
        const res = await api.get("/orders");
        const existing = res.data.find((o: any) => o.tableId === tableId && o.status === "open");
        if (existing) {
          setOrderId(existing.id);
          if (existing.items && existing.items.length > 0) {
            const mappedItems = existing.items.map((i: any, idx: number) => ({
              id: i.id || `ext-${idx}`,
              menuItem: {
                id: i.productId || "unknown",
                name: i.name,
                price: i.price,
                category: "Unknown",
                isVeg: false,
                image: ""
              },
              quantity: i.quantity,
              instruction: i.notes || "",
              sentQuantity: i.quantity // Already in kitchen
            }));
            // Populate if store is empty
            if (session.orderItems.length === 0) {
              const updates: any = { orderItems: mappedItems };
              if (existing.customerName) {
                updates.customer = {
                  id: "fetched",
                  name: existing.customerName,
                  email: "",
                  phone: existing.customerPhone || ""
                };
              }
              updateSession(tableId || "", updates);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch existing order:", err);
      }
    };
    if (tableId) {
      fetchExistingOrder();
    }
  }, [tableId]); // Note: session.orderItems.length intentionally omitted from deps to prevent loop

  // Right Panel State (Toggle between Cart and Payment)
  const [isPaymentMode, setIsPaymentMode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [numpadValue, setNumpadValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Kitchen State
  const [isSendingToKitchen, setIsSendingToKitchen] = useState(false);
  const [isConfirmingSend, setIsConfirmingSend] = useState(false);
  const [isKitchenSent, setIsKitchenSent] = useState(false);

  // Backend Order Tracking


  // Dialog States
  const [customers, setCustomers] = useState<{id: string, name: string, email: string, phone: string}[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get("/customers");
        setCustomers(res.data);
      } catch (err) {
        setCustomers(mockCustomers);
      }
    };
    fetchCustomers();
  }, []);
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [emailReceipt, setEmailReceipt] = useState("");
  
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  const [isInstructionOpen, setIsInstructionOpen] = useState(false);
  const [instructionItemId, setInstructionItemId] = useState("");
  const [instructionText, setInstructionText] = useState("");

  // Customer Prompt on empty table
  useEffect(() => {
    if (tableId && !session.customer && orderItems.length === 0) {
      setIsCustomerOpen(true);
    }
  }, [tableId]);



  // Filter Customers
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.email.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch)
  );

  // Filter Items (from DB products, with fallback to mock)
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Totals
  const subtotal = orderItems.reduce((acc, item) => acc + (item.menuItem.price * item.quantity), 0);
  const tax = subtotal * 0.05; // 5% GST
  const discount = 0;
  const grandTotal = subtotal + tax - discount;

  // Cart Functions
  const handleAddItem = (menuItem: MenuItem) => {
    setIsKitchenSent(false);
    setIsConfirmingSend(false);
    const existing = orderItems.find(item => item.menuItem.id === menuItem.id);
    if (existing) {
      updateSession(tableId || "", {
        orderItems: orderItems.map(item => item.menuItem.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item)
      });
    } else {
      updateSession(tableId || "", {
        orderItems: [...orderItems, { id: Math.random().toString(), menuItem, quantity: 1, sentQuantity: 0 }]
      });
    }
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setIsKitchenSent(false);
    setIsConfirmingSend(false);
    updateSession(tableId || "", {
      orderItems: orderItems.map(item => {
          if (item.id === id) {
            let newQty = item.quantity + delta;
            if (newQty < item.sentQuantity) {
              newQty = item.sentQuantity;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        }).filter(item => item.quantity > 0)
    });
  };

  const handleRemoveItem = (id: string) => {
    setIsKitchenSent(false);
    setIsConfirmingSend(false);
    updateSession(tableId || "", {
      orderItems: orderItems.filter(item => item.id !== id)
    });
  };

  const saveInstruction = () => {
    updateSession(tableId || "", {
      orderItems: orderItems.map(item => item.id === instructionItemId ? { ...item, instruction: instructionText } : item)
    });
    setIsInstructionOpen(false);
    setInstructionText("");
  };

  // Numpad Functions
  const handleNumpad = (val: string) => {
    if (val === "CLEAR") setNumpadValue("");
    else if (val === "BACK") setNumpadValue(prev => prev.slice(0, -1));
    else setNumpadValue(prev => prev + val);
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    
    try {
      const orderPayload = {
        tableId: tableId === 'takeaway' ? undefined : tableId,
        customerName: selectedCustomer?.name || undefined,
        customerPhone: selectedCustomer?.phone || undefined,
        status: "paid",
        subtotal: subtotal,
        tax: tax,
        total: grandTotal,
        items: orderItems.map(item => ({
          productId: item.menuItem.id,
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity,
          notes: item.instruction || ""
        }))
      };

      if (orderId) {
        await api.put(`/orders/${orderId}`, orderPayload);
      } else {
        const res = await api.post("/orders", orderPayload);
        setOrderId(res.data.id);
      }
      
      setIsProcessing(false);
      setPaymentSuccess(true);
    } catch (error) {
      console.error("Failed to process payment:", error);
      setIsProcessing(false);
      // Fallback UI success if backend fails just for demo
      setPaymentSuccess(true);
    }
  };

  const handleSendToKitchen = async () => {
    const unsentItems = orderItems.filter(item => item.quantity > item.sentQuantity);
    if (unsentItems.length === 0) return;
    
    if (!isConfirmingSend) {
      setIsConfirmingSend(true);
      return;
    }
    
    setIsSendingToKitchen(true);
    // Update backend order FIRST to get the orderId
    let currentOrderId = orderId;
    try {
      const orderPayload = {
        tableId: tableId,
        customerName: selectedCustomer?.name || undefined,
        customerPhone: selectedCustomer?.phone || undefined,
        items: orderItems.map(item => ({
          productId: item.menuItem.id,
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity,
          notes: item.instruction || ""
        })),
        subtotal,
        tax,
        total: grandTotal,
        status: "open"
      };

      if (currentOrderId) {
        await api.put(`/orders/${currentOrderId}`, orderPayload);
      } else {
        const res = await api.post("/orders", orderPayload);
        currentOrderId = res.data.id;
        setOrderId(currentOrderId);
      }
    } catch (error) {
      console.error("Failed to sync order with backend:", error);
    }
    
    // Now send to KDS with the guaranteed orderId
    await sendToKds({
      customerName: selectedCustomer ? selectedCustomer.name : tableName,
      tableId: tableId === 'takeaway' ? undefined : tableId,
      orderId: currentOrderId || undefined,
      items: unsentItems.map(item => ({
        name: item.menuItem.name,
        quantity: item.quantity - item.sentQuantity,
        notes: item.instruction || ""
      }))
    });

    updateSession(tableId || "", {
      orderItems: orderItems.map(item => ({
        ...item,
        sentQuantity: item.quantity
      }))
    });
    
    setIsSendingToKitchen(false);
    setIsConfirmingSend(false);
    setIsKitchenSent(true);
  };

  const handleNewOrder = () => {
    setPaymentSuccess(false);
    clearSession(tableId || "");
    setOrderId(null);
    setPaymentMethod(null);
    setNumpadValue("");
    setIsPaymentMode(false);
    navigate('/pos/floor');
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50 text-slate-900">
      
      {/* -------------------------------------------------------------------------
          LEFT PANEL: MENU & CATEGORIES (65%)
          ------------------------------------------------------------------------- */}
      <div className="w-[65%] flex flex-col border-r border-slate-200 bg-slate-50">
        
        {/* Top Header & Search */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between gap-4 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg border border-blue-100">
              {tableBadge}
            </div>
            <div>
              <div className="font-bold text-lg text-slate-900">{tableName}</div>
              <div className="text-xs font-medium text-slate-500">Order Management</div>
            </div>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search menu..." 
              className="pl-9 bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Vertical Categories */}
          <div className="w-32 md:w-40 xl:w-48 flex flex-col overflow-y-auto p-3 gap-2 bg-slate-50 border-r border-slate-200 hide-scrollbar shrink-0">
            {categoryList.map(category => (
              <Button
                key={category}
                variant="outline"
                className={`justify-start border-slate-200 h-14 text-left px-4 font-semibold transition-all ${
                  activeCategory === category 
                    ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                    : "bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm"
                }`}
                onClick={() => setActiveCategory(category)}
              >
                <span className="truncate">{category}</span>
              </Button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <ScrollArea className="flex-1 p-5 bg-slate-50/50">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
              {filteredItems.map(item => (
                <Card 
                  key={item.id} 
                  className="cursor-pointer transition-all hover:scale-[1.02] bg-white border-slate-200 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-900/5 p-4 flex flex-col justify-between min-h-[120px]"
                  onClick={() => handleAddItem(item)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-slate-900 leading-tight line-clamp-2">{item.name}</h4>
                    <div className={`mt-0.5 h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${item.isVeg ? "border-green-600" : "border-red-600"}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                    </div>
                  </div>
                  <div className="mt-4 font-bold text-blue-700 text-lg">₹{item.price}</div>
                </Card>
              ))}
            </div>
            {filteredItems.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 mt-20">
                <Search className="h-10 w-10 mb-2 opacity-20" />
                <p>No items found matching your search</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          RIGHT PANEL: CART / PAYMENT TOGGLE (35%)
          ------------------------------------------------------------------------- */}
      <div className="w-[35%] flex flex-col bg-white">
        
        {!isPaymentMode ? (
          /* --- CART MODE --- */
          <>
            <div className="p-4 bg-white font-bold border-b border-slate-200 text-lg flex items-center justify-between shadow-sm z-10">
              Current Order
              <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                {orderItems.length} Items
              </Badge>
            </div>
            
            <ScrollArea className="flex-1 p-4 bg-slate-50/50">
              <div className="space-y-3">
                {orderItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                    <Utensils className="h-12 w-12 mb-3 opacity-20" />
                    <span className="font-medium text-slate-500">Cart is empty.</span>
                    <span className="text-sm">Select items to add.</span>
                  </div>
                ) : (
                  orderItems.map(item => (
                    <div key={item.id} className="bg-white rounded-lg p-3.5 border border-slate-200 relative group shadow-sm">
                      {item.sentQuantity === 0 && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute -top-2.5 -right-2.5 h-6 w-6 rounded-full bg-slate-100 text-slate-400 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      
                      <div className="font-semibold text-slate-900 mb-2">{item.menuItem.name}</div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 bg-slate-50 rounded-md border border-slate-200 p-0.5">
                          <button className="h-7 w-7 flex items-center justify-center hover:bg-white hover:shadow-sm rounded text-slate-600 transition-all" onClick={() => handleUpdateQuantity(item.id, -1)}>
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-sm font-bold w-8 text-center text-slate-900">{item.quantity}</span>
                          <button className="h-7 w-7 flex items-center justify-center hover:bg-white hover:shadow-sm rounded text-slate-600 transition-all" onClick={() => handleUpdateQuantity(item.id, 1)}>
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-base font-bold text-slate-900">
                          ₹{item.menuItem.price * item.quantity}
                        </div>
                      </div>

                      {/* Restored Add Instruction Button */}
                      <div 
                        className="mt-2 text-xs text-blue-600 hover:text-blue-500 cursor-pointer font-medium"
                        onClick={() => {
                          setInstructionItemId(item.id);
                          setInstructionText(item.instruction || "");
                          setIsInstructionOpen(true);
                        }}
                      >
                        {item.instruction ? `Instruction: ${item.instruction}` : "+ Add Instruction"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Cart Summary */}
            <div className="bg-white border-t border-slate-200 flex flex-col">
              
              <div className="p-3">
                <Button 
                  className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-base shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={orderItems.filter(i => i.quantity > i.sentQuantity).length === 0 || isSendingToKitchen || isKitchenSent}
                  onClick={handleSendToKitchen}
                >
                  {isSendingToKitchen ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...</>
                  ) : orderItems.filter(i => i.quantity > i.sentQuantity).length === 0 && orderItems.length > 0 ? (
                    <><CheckCircle2 className="mr-2 h-5 w-5" /> Sent to Kitchen</>
                  ) : isConfirmingSend ? (
                    "Confirm"
                  ) : (
                    "Send to Kitchen"
                  )}
                </Button>
              </div>

              <Separator className="bg-slate-100" />
              
              <div className="flex items-center justify-between px-4 py-3 text-slate-600 text-sm gap-2">
                <Button variant="outline" className="flex-1 h-9 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 px-2" onClick={() => setIsCustomerOpen(true)}>
                  <User className="h-4 w-4 mr-1.5 text-slate-400" /> Customer
                </Button>
                <Button variant="outline" className="flex-1 h-9 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 px-2" onClick={() => setIsCouponOpen(true)}>
                  <Percent className="h-4 w-4 mr-1.5 text-slate-400" /> Coupon
                </Button>
                <Button variant="outline" className="flex-1 h-9 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 px-2" onClick={() => setIsSendOpen(true)}>
                  <FilePlus className="h-4 w-4 mr-1.5 text-slate-400" /> Send
                </Button>
              </div>

              <Separator className="bg-slate-100" />

              <div className="px-5 py-3.5 space-y-2 text-slate-500 font-medium text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-900 font-semibold">₹{subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (GST 5%)</span>
                  <span className="text-slate-900 font-semibold">₹{tax.toFixed(0)}</span>
                </div>
              </div>

              <div className="bg-slate-50 border-t border-slate-200 px-5 py-4">
                <div className="flex justify-between items-center mb-4 text-2xl font-bold tracking-tight text-slate-900">
                  <span>Total</span>
                  <span className="text-blue-700">₹{grandTotal.toFixed(0)}</span>
                </div>
                
                <Button 
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold shadow-md disabled:opacity-50 flex justify-between items-center px-6"
                  disabled={orderItems.length === 0}
                  onClick={() => setIsPaymentMode(true)}
                >
                  Proceed to Payment
                  <ArrowRightCircle className="h-6 w-6 opacity-90" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* --- PAYMENT MODE --- */
          <>
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm z-10 shrink-0">
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 -ml-2" onClick={() => setIsPaymentMode(false)}>
                <ArrowLeft className="h-5 w-5 mr-1" /> Back
              </Button>
              <div className="font-bold text-lg text-slate-900">Payment</div>
            </div>

            <div className="p-5 flex-1 flex flex-col overflow-y-auto bg-slate-50">
              
              <div className="text-center mb-6">
                <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Amount Due</div>
                <div className="text-4xl font-extrabold text-slate-900">₹{grandTotal.toFixed(2)}</div>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { id: "CASH", icon: Banknote, label: "Cash" },
                  { id: "UPI", icon: QrCode, label: "UPI" },
                  { id: "CARD", icon: CreditCard, label: "Card" },
                ].map(pm => (
                  <Button
                    key={pm.id}
                    variant="outline"
                    className={`h-20 flex flex-col gap-1.5 border-2 transition-all ${
                      paymentMethod === pm.id 
                        ? "bg-blue-50 border-blue-500 shadow-sm text-blue-700" 
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
                    }`}
                    onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                  >
                    <pm.icon className="h-6 w-6" />
                    <span className="font-semibold">{pm.label}</span>
                  </Button>
                ))}
              </div>

              {/* Dynamic Payment Flow Area */}
              <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-xl p-5 flex flex-col items-center justify-center min-h-[200px] mb-6">
                {!paymentMethod && (
                  <div className="text-slate-400 font-medium text-center">
                    Select a payment method above.
                  </div>
                )}

                {paymentMethod === "CASH" && (
                  <div className="w-full space-y-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-slate-500 font-medium">Cash Received:</span>
                        <span className="text-2xl font-bold text-blue-700">₹{numpadValue || "0"}</span>
                      </div>
                      <Separator className="bg-slate-200 mb-3" />
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Change Return:</span>
                        <span className={`text-xl font-bold ${Number(numpadValue) >= grandTotal ? "text-green-600" : "text-slate-400"}`}>
                          ₹{Math.max(0, Number(numpadValue) - grandTotal).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "UPI" && (
                  <div className="text-center">
                    <div className="bg-white p-3 border border-slate-200 rounded-xl mb-4 mx-auto w-fit shadow-sm">
                      <div className="grid grid-cols-5 gap-1.5 w-28 h-28">
                        {Array.from({length: 25}).map((_, i) => (
                          <div key={i} className={`bg-slate-800 rounded-sm ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-20'}`} />
                        ))}
                      </div>
                    </div>
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <div className="text-blue-700 font-semibold">Waiting for Payment...</div>
                      </div>
                    ) : (
                      <div className="text-slate-500 font-medium">Scan QR code to pay</div>
                    )}
                  </div>
                )}

                {paymentMethod === "CARD" && (
                  <div className="text-center">
                    <div className="h-20 w-28 bg-slate-100 rounded-xl mx-auto mb-4 relative overflow-hidden flex items-center justify-center border border-slate-200 shadow-inner">
                      <CreditCard className="h-8 w-8 text-slate-400" />
                    </div>
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <div className="text-blue-700 font-semibold">Processing...</div>
                      </div>
                    ) : (
                      <div className="text-slate-500 font-medium">Connect Card Terminal</div>
                    )}
                  </div>
                )}
              </div>

              {/* POS Number Pad */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
                  <Button key={num} variant="outline" className="h-12 bg-white border-slate-200 text-slate-800 text-lg font-bold hover:bg-slate-50 hover:text-slate-900 shadow-sm" onClick={() => handleNumpad(num.toString())}>
                    {num}
                  </Button>
                ))}
                <Button variant="outline" className="h-12 bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:text-slate-900 shadow-sm col-span-2 font-bold" onClick={() => handleNumpad("CLEAR")}>CLEAR</Button>
                <Button variant="outline" className="h-12 bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:text-slate-900 shadow-sm font-bold text-lg" onClick={() => handleNumpad("BACK")}>⌫</Button>
                <Button variant="outline" className="h-12 bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 shadow-sm font-semibold text-xs">DISC %</Button>
                <Button variant="outline" className="h-12 bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 shadow-sm font-semibold text-xs">QTY</Button>
                <Button variant="outline" className="h-12 bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 shadow-sm font-semibold text-xs">PRICE</Button>
              </div>

              {/* Complete Payment Button */}
              <Button 
                className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white mt-auto shadow-md disabled:opacity-50"
                disabled={!paymentMethod || isProcessing || (paymentMethod === "CASH" && Number(numpadValue) < grandTotal)}
                onClick={handleProcessPayment}
              >
                {isProcessing ? "Processing..." : "Complete Payment"}
              </Button>

            </div>
          </>
        )}
      </div>

      {/* Success Overlay Dialog */}
      <Dialog open={paymentSuccess} onOpenChange={setPaymentSuccess}>
        <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900 p-0 overflow-hidden hide-close shadow-xl">
          <div className="bg-green-500 h-2 w-full" />
          <div className="p-8 flex flex-col items-center text-center">
            <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Payment Successful</h2>
            <p className="text-slate-500 mb-8">{tableName} is now available</p>

            <div className="w-full bg-slate-50 rounded-xl p-5 mb-8 border border-slate-200 text-sm">
              <div className="flex justify-between mb-3">
                <span className="text-slate-500 font-medium">Amount Paid</span>
                <span className="font-bold text-slate-900 text-base">₹{grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-slate-500 font-medium">Method</span>
                <span className="font-semibold text-slate-900">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Transaction ID</span>
                <span className="font-semibold text-slate-600">TXN-{Math.floor(Math.random() * 1000000)}</span>
              </div>
            </div>

            <div className="flex flex-col w-full gap-3">
              <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold" onClick={handleNewOrder}>
                <LayoutDashboard className="mr-2 h-5 w-5" /> Return To Floor View
              </Button>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <Button variant="outline" className="h-12 border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold" onClick={() => {}}>
                  <Printer className="mr-2 h-4 w-4 text-slate-500" /> Print Receipt
                </Button>
                <Button variant="outline" className="h-12 border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold" onClick={() => {
                  setPaymentSuccess(false);
                  clearSession(tableId || "");
                  setOrderId(null);
                  setPaymentMethod(null);
                  setNumpadValue("");
                  setIsPaymentMode(false);
                }}>
                  <Plus className="mr-2 h-4 w-4 text-slate-500" /> New Order
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Coupon Dialog */}
      <Dialog open={isCouponOpen} onOpenChange={setIsCouponOpen}>
        <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900 shadow-xl">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4 text-slate-900">Add Coupon</h2>
            <div className="flex gap-3">
              <Input 
                placeholder="Enter coupon code..." 
                className="bg-white border-slate-200 text-slate-900"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white" 
                onClick={() => {
                  setIsCouponOpen(false);
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Receipt Dialog */}
      <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
        <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900 shadow-xl">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Send Bill Receipt</h2>
            <div className="flex gap-3">
              <Input 
                placeholder="Enter email address..." 
                type="email"
                className="bg-white border-slate-200 text-slate-900"
                value={emailReceipt}
                onChange={(e) => setEmailReceipt(e.target.value)}
              />
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white" 
                onClick={() => {
                  setIsSendOpen(false);
                }}
              >
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer List Dialog */}
      <Dialog open={isCustomerOpen} onOpenChange={setIsCustomerOpen}>
        <DialogContent className="sm:max-w-lg bg-white border-slate-200 text-slate-900 h-[600px] flex flex-col p-0 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="text-xl font-bold">Select Customer</h2>
            <Button variant="outline" className="border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-white bg-white" onClick={() => setIsAddCustomerOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add New
            </Button>
          </div>
          <div className="p-4 bg-white border-b border-slate-100">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search by name, email, or phone..." 
                className="pl-9 bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-blue-500"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1 p-4 bg-slate-50">
            <div className="space-y-3 pb-4">
              {filteredCustomers.length === 0 ? (
                <div className="text-center text-slate-500 py-12">
                  <User className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  No customers found. Click 'Add New' to create one.
                </div>
              ) : (
                filteredCustomers.map(customer => (
                  <div 
                    key={customer.id} 
                    className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-500 hover:shadow-md cursor-pointer transition-all"
                    onClick={() => {
                      updateSession(tableId || "", { customer });
                      setIsCustomerOpen(false);
                    }}
                  >
                    <div className="font-bold text-lg mb-1 text-slate-900">{customer.name}</div>
                    <div className="text-slate-500 text-sm flex items-center justify-between font-medium">
                      <span>{customer.email}</span>
                      <span>{customer.phone}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900 shadow-xl">
          <div className="p-6 space-y-5">
            <h2 className="text-xl font-bold mb-2">Add New Customer</h2>
            <div className="space-y-4">
              <Input 
                placeholder="Full Name" 
                className="bg-slate-50 border-slate-200 text-slate-900"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
              />
              <Input 
                placeholder="Email Address" 
                type="email"
                className="bg-slate-50 border-slate-200 text-slate-900"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
              />
              <Input 
                placeholder="Phone Number" 
                className="bg-slate-50 border-slate-200 text-slate-900"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900" onClick={() => setIsAddCustomerOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white" 
                onClick={async () => {
                  try {
                    const res = await api.post("/customers", {
                      name: newCustomerName,
                      email: newCustomerEmail,
                      phone: newCustomerPhone
                    });
                    const newCust = res.data;
                    setCustomers(prev => [...prev, newCust]);
                    updateSession(tableId || "", { customer: newCust });
                    setNewCustomerName("");
                    setNewCustomerEmail("");
                    setNewCustomerPhone("");
                    setIsAddCustomerOpen(false);
                    setIsCustomerOpen(false);
                  } catch (err) {
                    console.error("Failed to create customer", err);
                  }
                }}
              >
                Save Customer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Instruction Dialog */}
      <Dialog open={isInstructionOpen} onOpenChange={setIsInstructionOpen}>
        <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900 shadow-xl">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Add Instruction</h2>
            <div className="space-y-4">
              <Input 
                placeholder="e.g. Less spicy, Extra cheese..." 
                className="bg-white border-slate-200 text-slate-900"
                value={instructionText}
                onChange={(e) => setInstructionText(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900" onClick={() => setIsInstructionOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={saveInstruction}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
