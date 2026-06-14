import { useState, useMemo, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Clock, CheckCircle2, ChefHat, Search, Filter, Play, Check } from "lucide-react";

import { useKdsStore, KDSStage } from "../../store/kdsStore";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Checkbox } from "../../components/ui/checkbox";
import { Separator } from "../../components/ui/separator";

type TabFilter = "All" | KDSStage;

export default function KitchenDisplayPage() {
  const { orders, toggleItemPrepared, advanceOrderStage, fetchOrders } = useKdsStore();

  // Fetch orders on mount + poll every 5 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const [activeTab, setActiveTab] = useState<TabFilter>("To Cook");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dynamic filter lists based on current orders
  const allProducts = useMemo(() => {
    const products = new Set<string>();
    orders.forEach(o => o.items.forEach(i => products.add(i.name)));
    return Array.from(products);
  }, [orders]);

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Tab filter
      if (activeTab !== "All" && order.stage !== activeTab) return false;

      // Search filter (ticket or customer)
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const ticketNum = (order as any).ticketNumber || order.id;
        if (!ticketNum.toLowerCase().includes(q) && !order.customerName?.toLowerCase().includes(q)) {
          return false;
        }
      }

      // Product filter
      if (selectedProducts.length > 0) {
        const hasSelectedProduct = order.items.some(item => selectedProducts.includes(item.name));
        if (!hasSelectedProduct) return false;
      }

      return true;
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [orders, activeTab, searchQuery, selectedProducts]);

  const toggleProductFilter = (product: string) => {
    setSelectedProducts(prev => 
      prev.includes(product) ? prev.filter(p => p !== product) : [...prev, product]
    );
  };

  const getStageColor = (stage: KDSStage) => {
    switch(stage) {
      case "To Cook": return "bg-orange-50 text-orange-700 border-orange-200";
      case "Preparing": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Completed": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  const getStageIcon = (stage: KDSStage) => {
    switch(stage) {
      case "To Cook": return <Clock className="w-4 h-4 mr-2" />;
      case "Preparing": return <ChefHat className="w-4 h-4 mr-2" />;
      case "Completed": return <CheckCircle2 className="w-4 h-4 mr-2" />;
    }
  };

  const getStageCounts = () => {
    const counts = { "To Cook": 0, Preparing: 0, Completed: 0, All: orders.length };
    orders.forEach(o => counts[o.stage]++);
    return counts;
  };

  const stageCounts = getStageCounts();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Mobile Header (Hidden on Desktop) */}
        <div className="md:hidden flex h-16 items-center px-4 border-b border-slate-800 bg-slate-900 shrink-0 w-full z-40">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ChefHat className="text-orange-500 w-5 h-5" /> KDS
          </h2>
        </div>
      {/* Sidebar Filters */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col hidden md:flex shrink-0 shadow-sm z-10">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ChefHat className="text-blue-600" /> KDS
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Kitchen Display System</p>
        </div>

        <ScrollArea className="flex-1 p-6 bg-white">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Search className="w-3.5 h-3.5" /> Search Tickets
              </label>
              <Input 
                placeholder="Ticket # or Customer..." 
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Separator className="bg-slate-100" />

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" /> Filter by Product
              </label>
              <div className="space-y-2.5">
                {allProducts.map(product => (
                  <div key={product} className="flex items-center space-x-3">
                    <Checkbox 
                      id={`prod-${product}`} 
                      checked={selectedProducts.includes(product)}
                      onCheckedChange={() => toggleProductFilter(product)}
                      className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                    />
                    <label 
                      htmlFor={`prod-${product}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-700"
                    >
                      {product}
                    </label>
                  </div>
                ))}
                {allProducts.length === 0 && (
                  <div className="p-4 bg-slate-50 border border-slate-200 border-dashed rounded-lg text-center">
                    <p className="text-sm text-slate-500 font-medium">No products in queue.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50">
        {/* Top Nav Tabs */}
        <div className="bg-white border-b border-slate-200 p-4 shrink-0 flex items-center gap-3 overflow-x-auto no-scrollbar shadow-sm z-10">
          {(["All", "To Cook", "Preparing", "Completed"] as TabFilter[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 whitespace-nowrap border
                ${activeTab === tab 
                  ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                  : "bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                }`}
            >
              {tab}
              <Badge variant="secondary" className={`border-none ${activeTab === tab ? "bg-white/20 text-white hover:bg-white/30" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {stageCounts[tab]}
              </Badge>
            </button>
          ))}
        </div>

        {/* Tickets Grid */}
        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20">
            {filteredOrders.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center h-[60vh] text-slate-500">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <ChefHat className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-700 mb-2">No active orders</h3>
                <p className="text-slate-500 font-medium">Waiting for new tickets to arrive from the POS...</p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div 
                  key={order.id} 
                  className="bg-white rounded-xl border border-slate-200 shadow-md hover:shadow-lg overflow-hidden flex flex-col transition-all duration-300 animate-in fade-in zoom-in-95"
                >
                  {/* Card Header */}
                  <div className={`p-5 flex justify-between items-center border-b ${getStageColor(order.stage)}`}>
                    <div>
                      <h3 className="text-2xl font-extrabold tracking-tight">#{(order as any).ticketNumber || order.id}</h3>
                      <p className="text-sm font-semibold opacity-90 mt-0.5">{order.customerName || "Walk-in"}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end text-sm font-bold uppercase tracking-wider mb-1.5">
                        {getStageIcon(order.stage)}
                        {order.stage}
                      </div>
                      <div className="text-xs font-semibold opacity-80 bg-white/40 px-2 py-1 rounded-md inline-block shadow-sm">
                        {formatDistanceToNow(new Date(order.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  </div>

                  {/* Card Body / Items */}
                  <div className="p-3 flex-1 bg-slate-50/30">
                    <ul className="space-y-2">
                      {order.items.map(item => (
                        <li 
                          key={item.id}
                          onClick={() => {
                            if (order.stage === "Preparing") {
                              toggleItemPrepared(order.id, item.id);
                            }
                          }}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-300
                            ${item.prepared 
                              ? "bg-slate-100/50 text-slate-400 border-dashed border-slate-200" 
                              : "bg-white text-slate-800 border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md"
                            }
                          `}
                        >
                          <div className={`flex items-center gap-3 text-lg font-bold ${item.prepared ? "line-through decoration-slate-400 decoration-2" : "text-slate-900"}`}>
                            <span className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold border transition-colors
                              ${item.prepared ? "bg-slate-100 border-slate-200 text-slate-400" : "bg-blue-50 border-blue-200 text-blue-700"}
                            `}>
                              {item.quantity}x
                            </span>
                            <div className="flex flex-col">
                              <span>{item.name}</span>
                              {item.notes && <span className="text-sm text-orange-600 mt-0.5 font-medium bg-orange-50 px-2 py-0.5 rounded w-fit border border-orange-200">Instruction: {item.notes}</span>}
                            </div>
                          </div>
                          {item.prepared && <Check className="w-6 h-6 text-emerald-500 mr-2 shrink-0" />}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card Footer / Action */}
                  {order.stage !== "Completed" && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
                      <Button 
                        onClick={() => advanceOrderStage(order.id)}
                        className={`w-full py-6 text-lg font-bold shadow-md hover:shadow-lg transition-all duration-300
                          ${order.stage === "To Cook" 
                            ? "bg-blue-600 hover:bg-blue-700 text-white" 
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }
                        `}
                      >
                        {order.stage === "To Cook" ? (
                          <><Play className="w-5 h-5 mr-2 fill-current" /> Start Preparing</>
                        ) : (
                          <><CheckCircle2 className="w-5 h-5 mr-2" /> Mark Completed</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
