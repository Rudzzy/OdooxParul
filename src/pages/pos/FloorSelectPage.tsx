import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Users, IndianRupee } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/api";

type TableStatus = "Available" | "Ordering" | "Sent To Kitchen" | "Ready To Serve" | "Payment Pending";

interface Table {
  id: string;
  number: string;
  status: TableStatus;
  capacity: number;
  orderAmount: number;
  customerName?: string;
}

const getStatusColor = (status: TableStatus) => {
  switch (status) {
    case "Available": return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
    case "Ordering": return "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200";
    case "Sent To Kitchen": return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
    case "Ready To Serve": return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200";
    case "Payment Pending": return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
    default: return "bg-slate-100 text-slate-800";
  }
};

const getStatusIndicator = (status: TableStatus) => {
  switch (status) {
    case "Available": return "bg-green-500";
    case "Ordering": return "bg-orange-500";
    case "Sent To Kitchen": return "bg-blue-500";
    case "Ready To Serve": return "bg-purple-500";
    case "Payment Pending": return "bg-red-500";
    default: return "bg-slate-500";
  }
};

const filters = ["All Tables", "Available", "Ordering", "Sent To Kitchen", "Ready To Serve", "Payment Pending"];

export default function FloorSelectPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Tables");
  const [tables, setTables] = useState<Table[]>([]);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await api.get("/tables");
        const backendTables = res.data.map((t: any) => ({
          id: t.id,
          number: t.tableNumber.replace(/^T/i, ""),
          status: t.isActive ? "Available" as TableStatus : "Available" as TableStatus,
          capacity: t.capacity || 0,
          orderAmount: 0,
        }));
        setTables(backendTables);
      } catch {
        // If API fails, show empty state
        setTables([]);
      }
    };
    fetchTables();
  }, []);

  const filteredTables = tables.filter((table) => {
    // Search matching
    const matchesSearch = table.number.includes(searchQuery) || 
      (table.customerName?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      
    // Filter matching
    let matchesFilter = true;
    if (activeFilter !== "All Tables") {
      matchesFilter = table.status === activeFilter;
    }

    return matchesSearch && matchesFilter;
  });

  const handleTableClick = (tableId: string) => {
    navigate(`/pos/order/${tableId}`);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Floor View</h1>
          <p className="text-slate-500 mt-1">Manage tables and active orders</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search table or customer..." 
              className="pl-9 w-full bg-white border-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="shrink-0 bg-white">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
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

      {/* Table Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto pb-6">
        {filteredTables.map((table) => (
          <Card 
            key={table.id} 
            className={`cursor-pointer transition-all border-2 ${getStatusColor(table.status)} shadow-sm hover:shadow-md`}
            onClick={() => handleTableClick(table.id)}
          >
            <CardContent className="p-4 sm:p-5 flex flex-col h-full">
              <div className="flex justify-between items-start mb-3">
                <span className="text-2xl font-bold tracking-tight">T{table.number}</span>
                <div className={`h-3 w-3 rounded-full shadow-sm ${getStatusIndicator(table.status)}`} />
              </div>
              
              <div className="text-sm font-semibold mb-3 truncate" style={{ minHeight: '1.25rem' }}>
                {table.status}
              </div>

              <div className="mt-auto space-y-2">
                <div className="flex items-center justify-between text-sm opacity-80">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Users className="h-4 w-4" />
                    <span>{table.capacity > 0 ? `${table.capacity} Seats` : '--'}</span>
                  </div>
                </div>
                
                {table.orderAmount > 0 && (
                  <div className="flex items-center justify-between font-semibold mt-2 pt-2 border-t border-black/10">
                    <span className="opacity-80 text-xs uppercase tracking-wider">Total</span>
                    <span className="text-base flex items-center">
                      <IndianRupee className="h-3.5 w-3.5 mr-0.5" />
                      {table.orderAmount}
                    </span>
                  </div>
                )}
                
                {table.customerName && (
                  <div className="text-xs font-medium opacity-75 truncate mt-1">
                    {table.customerName}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredTables.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
          <p className="text-lg font-medium">No tables found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
