import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { Clock, CheckCircle2, ChefHat, Search, Filter, Play, Check } from "lucide-react";

import { useKdsStore, KDSStage, KDSItem, KDSOrder } from "../../store/kdsStore";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Checkbox } from "../../components/ui/checkbox";
import { Separator } from "../../components/ui/separator";

type TabFilter = "All" | KDSStage;

export default function KitchenDisplayPage() {
  const { orders, toggleItemPrepared, advanceOrderStage } = useKdsStore();

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
        if (!order.id.toLowerCase().includes(q) && !order.customerName?.toLowerCase().includes(q)) {
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
      case "To Cook": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "Preparing": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Completed": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
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
    <div className="min-h-screen bg-slate-950 text-slate-200 flex overflow-hidden font-sans selection:bg-orange-500/30">
      {/* Sidebar Filters */}
      <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ChefHat className="text-orange-500" /> KDS
          </h2>
          <p className="text-sm text-slate-400 mt-1">Kitchen Display System</p>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Search className="w-3 h-3" /> Search Tickets
              </label>
              <Input 
                placeholder="Ticket # or Customer..." 
                className="bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-orange-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Separator className="bg-slate-800" />

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-3 h-3" /> Filter by Product
              </label>
              <div className="space-y-2">
                {allProducts.map(product => (
                  <div key={product} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`prod-${product}`} 
                      checked={selectedProducts.includes(product)}
                      onCheckedChange={() => toggleProductFilter(product)}
                      className="border-slate-700 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white"
                    />
                    <label 
                      htmlFor={`prod-${product}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {product}
                    </label>
                  </div>
                ))}
                {allProducts.length === 0 && (
                  <p className="text-sm text-slate-500">No products in queue.</p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Nav Tabs */}
        <div className="bg-slate-900 border-b border-slate-800 p-4 shrink-0 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(["All", "To Cook", "Preparing", "Completed"] as TabFilter[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap
                ${activeTab === tab 
                  ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
            >
              {tab}
              <Badge variant="secondary" className={`${activeTab === tab ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-slate-800 text-slate-300"}`}>
                {stageCounts[tab]}
              </Badge>
            </button>
          ))}
        </div>

        {/* Tickets Grid */}
        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20">
            {filteredOrders.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center h-[50vh] text-slate-500">
                <ChefHat className="w-16 h-16 mb-4 opacity-20" />
                <h3 className="text-xl font-medium text-slate-400">No active orders</h3>
                <p>Waiting for new tickets to arrive from the POS...</p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div 
                  key={order.id} 
                  className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col transition-all duration-300 animate-in fade-in zoom-in-95"
                >
                  {/* Card Header */}
                  <div className={`p-4 border-b flex justify-between items-center ${getStageColor(order.stage)}`}>
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight">#{order.id}</h3>
                      <p className="text-xs font-medium opacity-80 mt-0.5">{order.customerName || "Walk-in"}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end text-sm font-bold uppercase tracking-wider mb-1">
                        {getStageIcon(order.stage)}
                        {order.stage}
                      </div>
                      <div className="text-xs font-medium opacity-70">
                        {formatDistanceToNow(new Date(order.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  </div>

                  {/* Card Body / Items */}
                  <div className="p-2 flex-1">
                    <ul className="space-y-1">
                      {order.items.map(item => (
                        <li 
                          key={item.id}
                          onClick={() => toggleItemPrepared(order.id, item.id)}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300
                            ${item.prepared 
                              ? "bg-slate-950/50 text-slate-500 opacity-60" 
                              : "bg-slate-800/40 text-slate-100 hover:bg-slate-800/80"
                            }
                          `}
                        >
                          <div className={`flex items-center gap-3 text-lg font-medium ${item.prepared ? "line-through decoration-slate-500 decoration-2" : ""}`}>
                            <span className="w-8 h-8 rounded bg-slate-950 flex items-center justify-center text-sm text-orange-400 border border-slate-800 font-bold">
                              {item.quantity}x
                            </span>
                            {item.name}
                          </div>
                          {item.prepared && <Check className="w-5 h-5 text-emerald-500 mr-2 shrink-0" />}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card Footer / Action */}
                  {order.stage !== "Completed" && (
                    <div className="p-4 bg-slate-900/50 border-t border-slate-800 mt-auto">
                      <Button 
                        onClick={() => advanceOrderStage(order.id)}
                        className={`w-full py-6 text-lg font-bold shadow-lg transition-all duration-300
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
