import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Printer, Utensils, Clock, Receipt, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Mock Order Details
const mockOrder = {
  id: "o1",
  orderNumber: "ORD-1001",
  tableNumber: "3",
  guests: 2,
  waiter: "John Waiter",
  createdTime: "12:30 PM",
  status: "Payment Pending",
  items: [
    { id: "i1", name: "Cheese Pizza", quantity: 1, price: 450, status: "Served" },
    { id: "i2", name: "Paneer Tikka", quantity: 2, price: 300, status: "Served" },
    { id: "i3", name: "Mojito", quantity: 2, price: 200, status: "Served" },
  ],
  subtotal: 1450,
  tax: 72.5,
  discount: 0,
  total: 1522.5
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // In a real app, we'd fetch the order using the 'id'
  const order = mockOrder;

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
          <Button variant="outline" className="bg-white">
            <Printer className="mr-2 h-4 w-4" />
            Print KOT
          </Button>
          <Button onClick={() => navigate(`/pos/payment/${order.id}`)} className="bg-blue-600 hover:bg-blue-700">
            <CreditCard className="mr-2 h-4 w-4" />
            Process Payment
          </Button>
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

        {/* Right Column: Summary & Info */}
        <div className="space-y-6">
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5 text-slate-500" />
                Billing Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">₹{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax (5%)</span>
                  <span className="font-semibold text-slate-800">₹{order.tax.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-semibold">-₹{order.discount.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-3" />
                <div className="flex justify-between text-xl font-bold text-slate-900">
                  <span>Total</span>
                  <span>₹{order.total.toFixed(2)}</span>
                </div>
              </div>
              
              <Button 
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 h-12 text-lg shadow-sm"
                onClick={() => navigate(`/pos/payment/${order.id}`)}
              >
                Checkout
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Table Info</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Table Number</span>
                <span className="font-bold text-slate-900 text-lg">{order.tableNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Guests</span>
                <span className="font-semibold text-slate-900">{order.guests}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
