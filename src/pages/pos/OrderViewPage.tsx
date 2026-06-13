import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, Plus, Minus, X, Info, Utensils, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Mock Data
const categories = ["All", "Starters", "Main Course", "Pizza", "Pasta", "Burgers", "Desserts", "Beverages"];

const mockMenuItems = [
  { id: "m1", name: "Cheese Pizza", price: 450, category: "Pizza", isVeg: true, available: true, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
  { id: "m2", name: "Chicken Burger", price: 350, category: "Burgers", isVeg: false, available: true, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
  { id: "m3", name: "Paneer Tikka", price: 300, category: "Starters", isVeg: true, available: true, image: "https://images.unsplash.com/photo-1567188040759-bf8d7fc34ed5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
  { id: "m4", name: "Arrabiata Pasta", price: 380, category: "Pasta", isVeg: true, available: true, image: "https://images.unsplash.com/photo-1621996311239-5a1887e2b10a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
  { id: "m5", name: "Chocolate Brownie", price: 250, category: "Desserts", isVeg: true, available: true, image: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
  { id: "m6", name: "Mojito", price: 200, category: "Beverages", isVeg: true, available: true, image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
  { id: "m7", name: "Margherita Pizza", price: 400, category: "Pizza", isVeg: true, available: false, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
  { id: "m8", name: "Grilled Chicken", price: 550, category: "Main Course", isVeg: false, available: true, image: "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
];

interface OrderItem {
  id: string;
  menuItem: typeof mockMenuItems[0];
  quantity: number;
  instruction: string;
}

export default function OrderViewPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Filter items based on category and search
  const filteredItems = mockMenuItems.filter(item => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate totals
  const subtotal = orderItems.reduce((acc, item) => acc + (item.menuItem.price * item.quantity), 0);
  const tax = subtotal * 0.05; // 5% GST
  const discount = 0;
  const grandTotal = subtotal + tax - discount;

  const handleAddItem = (menuItem: typeof mockMenuItems[0]) => {
    if (!menuItem.available) return;
    
    setOrderItems(prev => {
      const existing = prev.find(item => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map(item => 
          item.menuItem.id === menuItem.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { id: Math.random().toString(), menuItem, quantity: 1, instruction: "" }];
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSendToKitchen = () => {
    if (orderItems.length === 0) return;
    toast.success("Order sent to kitchen successfully");
    // navigate('/pos/floor'); // Optionally redirect back
  };

  return (
    <div className="flex h-full gap-4 overflow-hidden -m-4 md:-m-6">
      
      {/* Left Panel - Categories */}
      <div className="w-24 md:w-48 bg-white border-r flex flex-col shrink-0">
        <div className="p-4 border-b">
          <h3 className="font-bold text-slate-800 hidden md:block">Categories</h3>
          <h3 className="font-bold text-slate-800 md:hidden text-center text-sm">Menu</h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 flex flex-col gap-1">
            {categories.map(category => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "ghost"}
                className={`justify-start ${activeCategory === category ? "bg-blue-600" : ""}`}
                onClick={() => setActiveCategory(category)}
              >
                <span className="truncate">{category}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Center Panel - Menu Items */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <div className="p-4 bg-white border-b sticky top-0 z-10 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search menu items..." 
              className="pl-9 bg-slate-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
            {filteredItems.map(item => (
              <Card 
                key={item.id} 
                className={`overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] ${!item.available ? "opacity-50 grayscale" : "hover:shadow-md"}`}
                onClick={() => handleAddItem(item)}
              >
                <div className="aspect-video relative bg-slate-100">
                  <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                  <div className="absolute top-2 right-2">
                    <div className={`h-4 w-4 rounded-full border-2 bg-white flex items-center justify-center ${item.isVeg ? "border-green-600" : "border-red-600"}`}>
                      <div className={`h-2 w-2 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                    </div>
                  </div>
                  {!item.available && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Badge variant="destructive" className="font-bold">Out of Stock</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h4 className="font-bold text-slate-800 line-clamp-1" title={item.name}>{item.name}</h4>
                  <div className="mt-1 font-semibold text-blue-600 flex items-center">
                    ₹{item.price}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredItems.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                No items found
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Current Order */}
      <div className="w-80 lg:w-96 bg-white border-l flex flex-col shrink-0 z-20 shadow-xl lg:shadow-none absolute right-0 inset-y-0 lg:relative transform transition-transform translate-x-0">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-bold text-lg">Table {tableId || "Select"}</h2>
            <div className="text-slate-300 text-sm flex items-center gap-2">
              <Users className="h-3 w-3" /> 2 Guests
            </div>
          </div>
          <Badge variant="secondary" className="bg-slate-800 text-slate-100 hover:bg-slate-700">
            John Waiter
          </Badge>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {orderItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                <Utensils className="h-12 w-12 opacity-20" />
                <p>No items in order</p>
              </div>
            ) : (
              orderItems.map(item => (
                <div key={item.id} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      <div className={`mt-1 h-3 w-3 rounded-full border-2 flex items-center justify-center shrink-0 ${item.menuItem.isVeg ? "border-green-600" : "border-red-600"}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${item.menuItem.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                      </div>
                      <div>
                        <h5 className="font-semibold text-slate-800 text-sm">{item.menuItem.name}</h5>
                        <div className="text-slate-500 text-xs">₹{item.menuItem.price} x {item.quantity}</div>
                      </div>
                    </div>
                    <div className="font-bold text-slate-900">
                      ₹{item.menuItem.price * item.quantity}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={() => handleRemoveItem(item.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-3 bg-white border rounded-md p-1 shadow-sm">
                      <button className="p-1 hover:bg-slate-100 rounded" onClick={() => handleUpdateQuantity(item.id, -1)}>
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button className="p-1 hover:bg-slate-100 rounded" onClick={() => handleUpdateQuantity(item.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Pricing Section */}
        <div className="bg-slate-50 p-4 border-t shrink-0">
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-800">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax (5%)</span>
              <span className="font-semibold text-slate-800">₹{tax.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span className="font-semibold">-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between text-lg font-bold text-slate-900">
              <span>Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="w-full bg-white" onClick={() => toast("Order Draft Saved")}>
              Hold
            </Button>
            <Button variant="outline" className="w-full bg-white text-red-600 hover:text-red-700 hover:bg-red-50">
              Cancel
            </Button>
            <Button 
              className="col-span-2 w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg shadow-md disabled:opacity-50"
              onClick={handleSendToKitchen}
              disabled={orderItems.length === 0}
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Send To Kitchen
            </Button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
