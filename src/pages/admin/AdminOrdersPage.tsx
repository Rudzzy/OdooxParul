import { useState, useEffect } from "react";
import { Search, Receipt, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/api";

type OrderStatus = "open" | "paid" | "cancelled";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  tableId?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  timestamp?: string;
}

const getStatusColor = (status: OrderStatus) => {
  switch (status.toLowerCase()) {
    case "open": return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "paid": return "bg-green-100 text-green-800 hover:bg-green-200";
    case "cancelled": return "bg-red-100 text-red-800 hover:bg-red-200";
    default: return "bg-slate-100 text-slate-800";
  }
};

const getStatusLabel = (status: OrderStatus) => {
  switch (status.toLowerCase()) {
    case "open": return "Open";
    case "paid": return "Paid";
    case "cancelled": return "Cancelled";
    default: return status;
  }
};

const dateFilters = ["All Time", "Today", "Yesterday", "Last Week", "Last Month"];

export default function AdminOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDateFilter, setActiveDateFilter] = useState("All Time");
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTables = async () => {
    try {
      const res = await api.get("/tables");
      setTables(res.data);
    } catch (error) {
      console.error("Failed to fetch tables:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchTables();
  }, []);

  const getTableName = (tId: string | undefined) => {
    if (!tId) return "Takeaway";
    const table = tables.find(t => t.id === tId);
    if (table) {
      const num = table.tableNumber.replace(/^T/i, "");
      return `T${num}`;
    }
    return `T${tId.substring(0, 4)}`;
  };

  const filteredOrders = orders.filter((order) => {
    // Search
    const searchableText = `${order.id} ${order.tableId || ""}`.toLowerCase();
    const matchesSearch = searchableText.includes(searchQuery.toLowerCase());
    
    // Date Filtering
    let matchesDate = true;
    if (activeDateFilter !== "All Time" && order.timestamp) {
      // Ensure the timestamp is parsed as UTC by appending 'Z' if missing
      const timestampStr = order.timestamp.endsWith('Z') ? order.timestamp : `${order.timestamp}Z`;
      const orderDate = new Date(timestampStr);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      if (activeDateFilter === "Today") {
        matchesDate = orderDate >= today;
      } else if (activeDateFilter === "Yesterday") {
        matchesDate = orderDate >= yesterday && orderDate < today;
      } else if (activeDateFilter === "Last Week") {
        matchesDate = orderDate >= lastWeek;
      } else if (activeDateFilter === "Last Month") {
        matchesDate = orderDate >= lastMonth;
      }
    }

    return matchesSearch && matchesDate;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-['Comic_Sans_MS',_'Chalkboard_SE',_'Marker_Felt',_cursive]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Order History</h1>
          <p className="text-slate-500 mt-1">Review a complete history of successfully processed orders.</p>
        </div>
        <Button onClick={fetchOrders} variant="outline" className="h-10 px-4 border-orange-200 text-orange-700 hover:bg-orange-50">
          Refresh List
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {dateFilters.map((filter) => (
            <Button
              key={filter}
              variant={activeDateFilter === filter ? "default" : "outline"}
              className={`rounded-full h-9 px-4 text-sm font-medium transition-all ${
                activeDateFilter === filter 
                  ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md" 
                  : "bg-white border-slate-200 text-slate-600 hover:border-orange-500/50 hover:text-orange-600 hover:bg-orange-50"
              }`}
              onClick={() => setActiveDateFilter(filter)}
            >
              {filter}
            </Button>
          ))}
        </div>
        
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search Order ID or Table..." 
            className="pl-9 h-10 border-slate-200 focus-visible:ring-orange-500 bg-white shadow-sm rounded-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Orders List */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Order Details</th>
                <th className="px-6 py-4">Table</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-base font-medium">No orders found.</p>
                      <p className="text-sm">Try adjusting your filters or search query.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-orange-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </div>
                          {order.timestamp && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              {new Date(order.timestamp.endsWith('Z') ? order.timestamp : `${order.timestamp}Z`).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} {new Date(order.timestamp.endsWith('Z') ? order.timestamp : `${order.timestamp}Z`).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute:'2-digit' })}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {getTableName(order.tableId)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-600">
                        {order.items.reduce((acc, item) => acc + item.quantity, 0)} items
                      </div>
                      <div className="text-xs text-slate-400 mt-1 max-w-[200px] truncate">
                        {order.items.map(i => i.name).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      ₹{order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="secondary" className={`${getStatusColor(order.status)} border-transparent font-semibold`}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
