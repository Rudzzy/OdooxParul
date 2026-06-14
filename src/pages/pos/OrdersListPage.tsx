import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Clock, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/api";

type OrderStatus = "open" | "paid" | "cancelled" | "Pending";

interface Order {
  id: string;
  orderNumber: string;
  tableNumber: string;
  totalValue: number;
  createdTime: string;
  status: OrderStatus;
  kdsStage?: string;
}

const getKdsColor = (stage: string) => {
  switch (stage) {
    case "To Cook": return "bg-orange-50 text-orange-700 border-orange-200";
    case "Preparing": return "bg-blue-50 text-blue-700 border-blue-200";
    case "Completed": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default: return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case "open": return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "paid": return "bg-green-100 text-green-800 hover:bg-green-200";
    case "cancelled": return "bg-red-100 text-red-800 hover:bg-red-200";
    case "Pending": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    default: return "bg-slate-100 text-slate-800";
  }
};

const filters = ["All Orders", "open", "paid", "cancelled"];

export default function OrdersListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Orders");
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrdersAndTables = async () => {
      try {
        const [ordersRes, tablesRes, kdsRes] = await Promise.all([
          api.get("/orders"),
          api.get("/tables").catch(() => ({ data: [] })),
          api.get("/kds").catch(() => ({ data: [] }))
        ]);

        const tablesMap: Record<string, string> = {};
        tablesRes.data.forEach((t: any) => {
          tablesMap[t.id] = t.tableNumber;
        });

        const kdsMap: Record<string, string> = {};
        kdsRes.data.forEach((k: any) => {
          if (k.orderId) kdsMap[k.orderId] = k.stage;
        });

        const backendOrders: Order[] = ordersRes.data
          .map((o: any, index: number) => ({
          id: o.id,
          orderNumber: `ORD-${String(1001 + index).padStart(4, "0")}`,
          tableNumber: tablesMap[o.tableId] || o.tableId || "N/A",
          totalValue: o.total || 0,
          createdTime: o.timestamp ? new Date(o.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--",
          status: (o.status || "open") as OrderStatus,
          kdsStage: kdsMap[o.id],
        }));
        setOrders(backendOrders);
      } catch {
        // If no orders endpoint or it fails, show empty
        setOrders([]);
      }
    };
    fetchOrdersAndTables();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
      order.tableNumber.includes(searchQuery);
      
    const matchesFilter = activeFilter === "All Orders" || order.status === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const handleOrderClick = (orderId: string) => {
    navigate(`/pos/orders/${orderId}`);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Active Orders</h1>
          <p className="text-slate-500 mt-1">Manage and track all ongoing orders</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by Order # or Table..." 
              className="pl-9 w-full bg-white border-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap pb-2 gap-2">
        {filters.map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "default" : "outline"}
            className={`shrink-0 rounded-full ${
              activeFilter === filter ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 border-slate-200"
            }`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </Button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pb-6">
        {filteredOrders.map((order) => (
          <Card 
            key={order.id} 
            className="cursor-pointer transition-all border shadow-sm hover:shadow-md hover:border-blue-200 bg-white"
            onClick={() => handleOrderClick(order.id)}
          >
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-sm text-slate-500 font-medium mb-1">{order.orderNumber}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold tracking-tight">Table {order.tableNumber}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="secondary" className={`font-semibold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </Badge>
                  {order.kdsStage && (
                    <Badge variant="outline" className={`text-xs font-semibold ${getKdsColor(order.kdsStage)}`}>
                      Kitchen: {order.kdsStage}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center text-sm text-slate-500 font-medium gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {order.createdTime}
                </div>
                <div className="flex items-center font-bold text-lg text-slate-900 gap-1">
                  <Receipt className="h-4 w-4 text-slate-400" />
                  ₹{order.totalValue}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
          <p className="text-lg font-medium">No orders found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
