import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, Plus, Minus, X, Info, Utensils, CheckCircle2, Users, ArrowRightCircle, FilePlus, User, Percent, LayoutDashboard, Printer, Loader2, CreditCard, QrCode, Banknote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Mock Data
const categories = ["All", "Starters", "Main Course", "Pizza", "Burger", "Pasta", "Drinks", "Desserts"];

const mockMenuItems = [
  { id: "m1", name: "Cheese Pizza", price: 450, category: "Pizza", isVeg: true, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60" },
  { id: "m2", name: "Cheese Burger", price: 270, category: "Burger", isVeg: false, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60" },
  { id: "m3", name: "Paneer Tikka", price: 300, category: "Starters", isVeg: true, image: "https://images.unsplash.com/photo-1567188040759-bf8d7fc34ed5?w=500&auto=format&fit=crop&q=60" },
  { id: "m4", name: "Arrabiata Pasta", price: 380, category: "Pasta", isVeg: true, image: "https://images.unsplash.com/photo-1621996311239-5a1887e2b10a?w=500&auto=format&fit=crop&q=60" },
  { id: "m5", name: "Mojito", price: 200, category: "Drinks", isVeg: true, image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=500&auto=format&fit=crop&q=60" },
  { id: "m6", name: "Chocolate Brownie", price: 250, category: "Desserts", isVeg: true, image: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=500&auto=format&fit=crop&q=60" },
];

const mockCustomers = [
  { id: "c1", name: "Rahul Kumar", email: "rahul@example.com", phone: "9876543210" },
  { id: "c2", name: "Priya Sharma", email: "priya@example.com", phone: "8765432109" },
  { id: "c3", name: "Amit Singh", email: "amit@example.com", phone: "7654321098" },
];

interface OrderItem {
  id: string;
  menuItem: typeof mockMenuItems[0];
  quantity: number;
}

type PaymentMethod = "CASH" | "UPI" | "CARD" | null;

export default function OrderViewPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();

  // Left Panel State
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Right Panel State (Payment)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [numpadValue, setNumpadValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Dialog States
  const [customers, setCustomers] = useState(mockCustomers);
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [emailReceipt, setEmailReceipt] = useState("");
  
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string; email: string; phone: string } | null>(null);

  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  // Filter Customers
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.email.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch)
  );

  // Filter Items
  const filteredItems = mockMenuItems.filter(item => {
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
  const handleAddItem = (menuItem: typeof mockMenuItems[0]) => {
    setOrderItems(prev => {
      const existing = prev.find(item => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map(item => item.menuItem.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: Math.random().toString(), menuItem, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleRemoveItem = (id: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== id));
  };

  // Numpad Functions
  const handleNumpad = (val: string) => {
    if (val === "CLEAR") setNumpadValue("");
    else if (val === "BACK") setNumpadValue(prev => prev.slice(0, -1));
    else setNumpadValue(prev => prev + val);
  };

  const handleProcessPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
    }, 2000);
  };

  const handleNewOrder = () => {
    setPaymentSuccess(false);
    setOrderItems([]);
    setPaymentMethod(null);
    setNumpadValue("");
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-950 text-slate-100 -m-4 md:-m-6">
      
      {/* -------------------------------------------------------------------------
          LEFT PANEL: MENU & CART (60%)
          ------------------------------------------------------------------------- */}
      <div className="w-[60%] flex flex-col border-r border-slate-800 bg-slate-900">
        
        {/* Top Header & Search */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center font-bold text-lg text-white">
              T{tableId || "?"}
            </div>
            <div>
              <div className="font-bold">Table {tableId || "Unknown"}</div>
              <div className="text-xs text-slate-400">Order Management</div>
            </div>
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search menu..." 
              className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Vertical Categories */}
          <div className="w-32 md:w-40 flex flex-col overflow-y-auto p-2 gap-2 bg-slate-900 border-r border-slate-800 hide-scrollbar shrink-0">
            {categories.map(category => (
              <Button
                key={category}
                variant="outline"
                className={`justify-start border-slate-700 h-12 text-left px-3 ${
                  activeCategory === category 
                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" 
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
                onClick={() => setActiveCategory(category)}
              >
                <span className="truncate">{category}</span>
              </Button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <ScrollArea className="flex-1 p-4 bg-slate-950">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pb-20">
              {filteredItems.map(item => (
                <Card 
                  key={item.id} 
                  className="cursor-pointer transition-transform hover:scale-[1.02] bg-slate-800 border-slate-700 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-900/20 p-3 flex flex-col justify-between min-h-[100px]"
                  onClick={() => handleAddItem(item)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-white leading-tight line-clamp-2">{item.name}</h4>
                    <div className={`mt-0.5 h-3 w-3 rounded-full border-2 flex items-center justify-center shrink-0 ${item.isVeg ? "border-green-500" : "border-red-500"}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                    </div>
                  </div>
                  <div className="mt-3 font-semibold text-blue-400">₹{item.price}</div>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Vertical Divider */}
          <div className="w-px bg-slate-800" />

          {/* Cart Area */}
          <div className="w-72 xl:w-80 flex flex-col bg-slate-950 shrink-0">
            <div className="p-3 bg-slate-900 font-bold border-b border-slate-800">
              Current Order
            </div>
            
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {orderItems.length === 0 ? (
                  <div className="text-center text-slate-500 py-10 text-sm">
                    Cart is empty. Select items to add.
                  </div>
                ) : (
                  orderItems.map(item => (
                    <div key={item.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700 relative group">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-slate-700 text-slate-300 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      
                      <div className="font-semibold text-sm mb-1">{item.menuItem.name}</div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 bg-slate-900 rounded border border-slate-700 p-0.5">
                          <button className="h-6 w-6 flex items-center justify-center hover:bg-slate-700 rounded text-slate-300" onClick={() => handleUpdateQuantity(item.id, -1)}>
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                          <button className="h-6 w-6 flex items-center justify-center hover:bg-slate-700 rounded text-slate-300" onClick={() => handleUpdateQuantity(item.id, 1)}>
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-sm font-bold text-blue-400">
                          ₹{item.menuItem.price * item.quantity}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
                        + Add Instruction
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Cart Summary */}
            <div className="bg-[#1e1b1a] border-t border-slate-800 flex flex-col font-medium">
              
              <button className="w-full h-14 bg-[#5c2b2b] hover:bg-[#6c3b3b] text-white text-lg flex justify-between items-center px-4 transition-colors">
                <span className="font-medium tracking-wide">Send to Kitchen</span>
                <ArrowRightCircle className="h-7 w-7" strokeWidth={1.5} />
              </button>

              <Separator className="bg-slate-700/50" />
              
              <div className="flex items-center justify-between px-4 py-3 text-[#d1d0c5] text-sm">
                <button className="flex items-center gap-1.5 hover:text-white transition-colors" onClick={() => setIsCustomerOpen(true)}>
                  <User className="h-4 w-4" />
                  <span className="tracking-wide">Customer</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-white transition-colors" onClick={() => setIsCouponOpen(true)}>
                  <Percent className="h-4 w-4" />
                  <span className="tracking-wide">Add coupon</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-white transition-colors" onClick={() => setIsSendOpen(true)}>
                  <FilePlus className="h-4 w-4" />
                  <span className="tracking-wide">Send</span>
                </button>
              </div>

              <Separator className="bg-slate-700/50" />

              <div className="px-4 py-3 space-y-1.5 text-[#d1d0c5] tracking-wide">
                <div className="flex justify-between">
                  <span>Sub total</span>
                  <span className="text-white">₹{subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax(GST 5%)</span>
                  <span className="text-white">₹{tax.toFixed(0)}</span>
                </div>
              </div>

              <Separator className="bg-slate-700/50" />

              <div className="flex justify-between items-center px-4 py-4 text-2xl font-bold tracking-wide text-[#d1d0c5]">
                <span>Total</span>
                <span className="text-white">₹{grandTotal.toFixed(0)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* -------------------------------------------------------------------------
          RIGHT PANEL: PAYMENT (40%)
          ------------------------------------------------------------------------- */}
      <div className="w-[40%] flex flex-col bg-slate-950">
        <div className="p-4 bg-slate-900 font-bold border-b border-slate-800 text-lg flex items-center justify-between">
          Payment Processing
          <div className="text-sm font-normal text-slate-400">Amount: <span className="font-bold text-white text-lg ml-1">₹{grandTotal.toFixed(2)}</span></div>
        </div>

        <div className="p-6 flex-1 flex flex-col overflow-y-auto">
          
          {/* Payment Methods */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { id: "CASH", icon: Banknote, label: "Cash" },
              { id: "UPI", icon: QrCode, label: "UPI" },
              { id: "CARD", icon: CreditCard, label: "Card" },
            ].map(pm => (
              <Button
                key={pm.id}
                variant="outline"
                className={`h-24 flex flex-col gap-2 border-2 transition-all ${
                  paymentMethod === pm.id 
                    ? "bg-slate-800 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] text-blue-400" 
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
                onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
              >
                <pm.icon className="h-8 w-8" />
                <span className="font-semibold text-base">{pm.label}</span>
              </Button>
            ))}
          </div>

          {/* Dynamic Payment Flow Area */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[250px] mb-6">
            {!paymentMethod && (
              <div className="text-slate-500 text-center">
                Select a payment method above to proceed.
              </div>
            )}

            {paymentMethod === "CASH" && (
              <div className="w-full max-w-sm space-y-6">
                <div className="text-center">
                  <div className="text-sm text-slate-400 mb-1">Bill Amount</div>
                  <div className="text-3xl font-bold text-white">₹{grandTotal.toFixed(2)}</div>
                </div>
                
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-400">Cash Received:</span>
                    <span className="text-xl font-semibold text-blue-400">₹{numpadValue || "0"}</span>
                  </div>
                  <Separator className="bg-slate-800 mb-3" />
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Change Return:</span>
                    <span className={`text-xl font-bold ${Number(numpadValue) >= grandTotal ? "text-green-400" : "text-slate-500"}`}>
                      ₹{Math.max(0, Number(numpadValue) - grandTotal).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "UPI" && (
              <div className="text-center">
                <div className="bg-white p-3 rounded-xl mb-6 mx-auto w-fit">
                  {/* Fake QR */}
                  <div className="grid grid-cols-5 gap-1.5 w-32 h-32 opacity-90">
                    {Array.from({length: 25}).map((_, i) => (
                      <div key={i} className={`bg-slate-900 rounded-sm ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-20'}`} />
                    ))}
                  </div>
                </div>
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <div className="text-blue-400 font-medium">Waiting for Payment...</div>
                  </div>
                ) : (
                  <div className="text-slate-400">Scan QR code to pay</div>
                )}
              </div>
            )}

            {paymentMethod === "CARD" && (
              <div className="text-center">
                <div className="h-24 w-32 bg-slate-800 rounded-xl mx-auto mb-6 relative overflow-hidden flex items-center justify-center border border-slate-700">
                  <CreditCard className="h-10 w-10 text-slate-500" />
                </div>
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <div className="text-blue-400 font-medium">Processing...</div>
                  </div>
                ) : (
                  <div className="text-slate-400">Connect Card Terminal</div>
                )}
              </div>
            )}
          </div>

          {/* POS Number Pad */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
              <Button key={num} variant="outline" className="h-14 bg-slate-900 border-slate-800 text-xl font-semibold hover:bg-slate-800 hover:text-white" onClick={() => handleNumpad(num.toString())}>
                {num}
              </Button>
            ))}
            <Button variant="outline" className="h-14 bg-slate-900 border-slate-800 hover:bg-slate-800 hover:text-white col-span-2" onClick={() => handleNumpad("CLEAR")}>CLEAR</Button>
            <Button variant="outline" className="h-14 bg-slate-900 border-slate-800 hover:bg-slate-800 hover:text-white" onClick={() => handleNumpad("BACK")}>⌫</Button>
            <Button variant="outline" className="h-14 bg-slate-900 border-slate-800 hover:bg-slate-800 hover:text-white font-medium text-xs">DISC %</Button>
            <Button variant="outline" className="h-14 bg-slate-900 border-slate-800 hover:bg-slate-800 hover:text-white font-medium text-xs">QTY</Button>
            <Button variant="outline" className="h-14 bg-slate-900 border-slate-800 hover:bg-slate-800 hover:text-white font-medium text-xs">PRICE</Button>
          </div>

          {/* Complete Payment Button */}
          <Button 
            className="w-full h-16 text-lg font-bold bg-green-600 hover:bg-green-700 text-white mt-auto disabled:opacity-50"
            disabled={!paymentMethod || isProcessing || (paymentMethod === "CASH" && Number(numpadValue) < grandTotal)}
            onClick={handleProcessPayment}
          >
            {isProcessing ? "Processing..." : "Complete Payment"}
          </Button>

        </div>
      </div>

      {/* Success Overlay Dialog */}
      <Dialog open={paymentSuccess} onOpenChange={setPaymentSuccess}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white p-0 overflow-hidden hide-close">
          <div className="bg-green-500 h-2 w-full" />
          <div className="p-8 flex flex-col items-center text-center">
            <div className="h-20 w-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Payment Successful</h2>
            <p className="text-slate-400 mb-8">Table #{tableId || "Unknown"} is now available</p>

            <div className="w-full bg-slate-950 rounded-xl p-4 mb-8 border border-slate-800 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-bold">₹{grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">Method</span>
                <span className="font-semibold">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-semibold text-slate-300">TXN-{Math.floor(Math.random() * 1000000)}</span>
              </div>
            </div>

            <div className="flex flex-col w-full gap-3">
              <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate('/pos/floor')}>
                <LayoutDashboard className="mr-2 h-5 w-5" /> Return To Floor View
              </Button>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <Button variant="outline" className="h-12 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => {}}>
                  <Printer className="mr-2 h-4 w-4" /> Print Receipt
                </Button>
                <Button variant="outline" className="h-12 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={handleNewOrder}>
                  <Plus className="mr-2 h-4 w-4" /> New Order
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Coupon Dialog */}
      <Dialog open={isCouponOpen} onOpenChange={setIsCouponOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Add Coupon</h2>
            <div className="flex gap-3">
              <Input 
                placeholder="Enter coupon code..." 
                className="bg-slate-800 border-slate-700 text-white"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <Button 
                className="bg-blue-600 hover:bg-blue-700" 
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
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Send Bill Receipt</h2>
            <div className="flex gap-3">
              <Input 
                placeholder="Enter email address..." 
                type="email"
                className="bg-slate-800 border-slate-700 text-white"
                value={emailReceipt}
                onChange={(e) => setEmailReceipt(e.target.value)}
              />
              <Button 
                className="bg-blue-600 hover:bg-blue-700" 
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
        <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-800 text-white h-[600px] flex flex-col p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
            <h2 className="text-xl font-bold">Select Customer</h2>
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => setIsAddCustomerOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add New
            </Button>
          </div>
          <div className="p-4 bg-slate-900">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search by name, email, or phone..." 
                className="pl-9 bg-slate-800 border-slate-700 text-white"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1 p-4 bg-slate-950">
            <div className="space-y-2 pb-4">
              {filteredCustomers.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  No customers found. Click 'Add New' to create one.
                </div>
              ) : (
                filteredCustomers.map(customer => (
                  <div 
                    key={customer.id} 
                    className="p-3 bg-slate-800 border border-slate-700 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setIsCustomerOpen(false);
                    }}
                  >
                    <div className="font-bold text-lg mb-1">{customer.name}</div>
                    <div className="text-slate-400 text-sm flex items-center justify-between">
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
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold mb-2">Add New Customer</h2>
            <div className="space-y-3">
              <Input 
                placeholder="Full Name" 
                className="bg-slate-800 border-slate-700 text-white"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
              />
              <Input 
                placeholder="Email Address" 
                type="email"
                className="bg-slate-800 border-slate-700 text-white"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
              />
              <Input 
                placeholder="Phone Number" 
                className="bg-slate-800 border-slate-700 text-white"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => setIsAddCustomerOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700" 
                onClick={() => {
                  const newCust = {
                    id: "c" + Date.now(),
                    name: newCustomerName,
                    email: newCustomerEmail,
                    phone: newCustomerPhone
                  };
                  setCustomers(prev => [...prev, newCust]);
                  setSelectedCustomer(newCust);
                  setNewCustomerName("");
                  setNewCustomerEmail("");
                  setNewCustomerPhone("");
                  setIsAddCustomerOpen(false);
                  setIsCustomerOpen(false);
                }}
              >
                Save Customer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
