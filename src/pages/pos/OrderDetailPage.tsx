import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Printer, Utensils, Clock, Receipt, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

interface OrderDetail {
  id: string;
  orderNumber: string;
  tableNumber: string;
  waiter: string;
  createdTime: string;
  status: string;
  items: { id: string; name: string; quantity: number; price: number; status: string }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderAndTables = async () => {
      try {
        const [orderRes, tablesRes] = await Promise.all([
          api.get(`/orders/${id}`),
          api.get("/tables").catch(() => ({ data: [] }))
        ]);
        const o = orderRes.data;
        
        const tablesMap: Record<string, string> = {};
        tablesRes.data.forEach((t: any) => {
          tablesMap[t.id] = t.tableNumber;
        });

        // Map backend order to local shape
        const items = (o.items || []).map((item: any, idx: number) => ({
          id: item.id || `i${idx}`,
          name: item.productName || item.name || "Item",
          quantity: item.quantity || 1,
          price: item.price || 0,
          status: item.status || "Served",
        }));
        const subtotal = items.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);
        const tax = subtotal * 0.05;
        setOrder({
          id: o.id,
          orderNumber: `ORD-${o.id?.substring(0, 4)?.toUpperCase() || "0000"}`,
          tableNumber: tablesMap[o.tableId] || o.tableId || "N/A",
          waiter: o.waiterName || "Staff",
          createdTime: o.timestamp ? new Date(o.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--",
          status: o.status || "Pending",
          items,
          subtotal,
          tax,
          discount: o.discount || 0,
          total: subtotal + tax - (o.discount || 0),
        });
      } catch {
        // If order not found, show fallback
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderAndTables();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Loading order...
      </div>
    );
  }

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      const res = await api.get(`/orders/${order!.id}`);
      await api.put(`/orders/${order!.id}`, {
        ...res.data,
        status: "cancelled"
      });
      setOrder(prev => prev ? { ...prev, status: "cancelled" } : null);
    } catch (error) {
      console.error("Failed to cancel order:", error);
      alert("Failed to cancel order");
    }
  };

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <p className="text-lg font-medium">Order not found</p>
        <Button variant="link" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="bg-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              Order {order.orderNumber}
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {order.status}
              </Badge>
            </h1>
            <div className="text-slate-500 text-sm mt-1 flex items-center gap-4">
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {order.createdTime}</span>
              <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {order.waiter}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {order.status !== "cancelled" && (
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={handleCancelOrder}>
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Items */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Utensils className="h-5 w-5 text-slate-500" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {order.items.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="bg-slate-100 text-slate-700 font-bold h-8 w-8 rounded-md flex items-center justify-center shrink-0">
                        {item.quantity}x
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{item.name}</h4>
                        <div className="text-slate-500 text-sm mt-0.5">₹{item.price} each</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">₹{item.quantity * item.price}</div>
                      <Badge variant="outline" className="mt-1 text-green-700 border-green-200 bg-green-50">
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Info */}
        <div className="space-y-6">

          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Table Info</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Table Number</span>
                <span className="font-bold text-slate-900 text-lg">{order.tableNumber}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
