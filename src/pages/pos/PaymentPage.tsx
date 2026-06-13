import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, CreditCard, Banknote, QrCode, 
  Printer, MessageCircle, SplitSquareVertical, 
  CheckCircle2, XCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const mockOrder = {
  id: "o1",
  orderNumber: "ORD-1001",
  tableNumber: "3",
  totalItems: 5,
  subtotal: 1450,
  tax: 72.5,
  discount: 0,
  total: 1522.5
};

type PaymentMethod = "CASH" | "CARD" | "UPI";

export default function PaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const order = mockOrder;
  
  // Calculate Cash Change
  const receivedAmount = parseFloat(cashReceived) || 0;
  const change = Math.max(0, receivedAmount - order.total);

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      navigate(`/pos/payment-success/${order.id}`);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full gap-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="bg-white">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment</h1>
          <p className="text-slate-500 text-sm mt-1">Complete payment for {order.orderNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Payment Methods */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white shadow-sm border-2 border-slate-100">
            <CardHeader className="pb-4 border-b bg-slate-50/50">
              <CardTitle className="text-lg">Select Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-8">
                <Button 
                  variant={method === "UPI" ? "default" : "outline"}
                  className={`h-24 flex flex-col gap-2 ${method === "UPI" ? "bg-blue-600 border-blue-600 ring-2 ring-blue-100 ring-offset-2" : "border-slate-200"}`}
                  onClick={() => setMethod("UPI")}
                >
                  <QrCode className="h-8 w-8" />
                  <span className="font-semibold text-base">UPI</span>
                </Button>
                <Button 
                  variant={method === "CARD" ? "default" : "outline"}
                  className={`h-24 flex flex-col gap-2 ${method === "CARD" ? "bg-blue-600 border-blue-600 ring-2 ring-blue-100 ring-offset-2" : "border-slate-200"}`}
                  onClick={() => setMethod("CARD")}
                >
                  <CreditCard className="h-8 w-8" />
                  <span className="font-semibold text-base">Card</span>
                </Button>
                <Button 
                  variant={method === "CASH" ? "default" : "outline"}
                  className={`h-24 flex flex-col gap-2 ${method === "CASH" ? "bg-blue-600 border-blue-600 ring-2 ring-blue-100 ring-offset-2" : "border-slate-200"}`}
                  onClick={() => setMethod("CASH")}
                >
                  <Banknote className="h-8 w-8" />
                  <span className="font-semibold text-base">Cash</span>
                </Button>
              </div>

              {/* Dynamic Payment Content */}
              <div className="min-h-[200px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6">
                
                {method === "UPI" && (
                  <div className="flex flex-col items-center text-center max-w-sm">
                    <div className="bg-white p-4 rounded-xl border shadow-sm mb-4">
                      {/* Fake QR Code Pattern */}
                      <div className="grid grid-cols-5 gap-1.5 w-32 h-32 opacity-80">
                        {Array.from({length: 25}).map((_, i) => (
                          <div key={i} className={`bg-slate-900 rounded-sm ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-20'}`} />
                        ))}
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">Scan to Pay ₹{order.total.toFixed(2)}</h3>
                    <p className="text-slate-500 text-sm mt-1">Waiting for payment confirmation from UPI gateway...</p>
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600 mt-4" />
                  </div>
                )}

                {method === "CARD" && (
                  <div className="flex flex-col items-center text-center max-w-sm">
                    <div className="h-24 w-32 bg-slate-800 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center shadow-lg">
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent" />
                      <CreditCard className="h-10 w-10 text-white/50" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">Card Terminal Ready</h3>
                    <p className="text-slate-500 text-sm mt-1">Please ask the customer to tap or insert their card in the terminal.</p>
                  </div>
                )}

                {method === "CASH" && (
                  <div className="w-full max-w-sm space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="cash" className="text-slate-600">Cash Received (₹)</Label>
                      <Input 
                        id="cash"
                        type="number" 
                        placeholder="Enter amount..." 
                        className="text-lg h-12"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        autoFocus
                      />
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border shadow-sm space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Bill Amount</span>
                        <span className="font-semibold">₹{order.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Cash Received</span>
                        <span className="font-semibold text-blue-600">₹{receivedAmount.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-700">Change Due</span>
                        <span className={`font-bold text-xl ${change > 0 ? "text-green-600" : "text-slate-400"}`}>
                          ₹{change.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
              </div>
            </CardContent>
          </Card>

          {/* Additional Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button variant="outline" className="bg-white h-12">
              <SplitSquareVertical className="h-4 w-4 mr-2" />
              Split Bill
            </Button>
            <Button variant="outline" className="bg-white h-12">
              <Printer className="h-4 w-4 mr-2" />
              Print Bill
            </Button>
            <Button variant="outline" className="bg-white h-12">
              <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
              WhatsApp
            </Button>
            <Button variant="outline" className="bg-white h-12 text-red-600 hover:text-red-700 hover:bg-red-50">
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>

        {/* Right Column: Summary */}
        <div className="space-y-6">
          <Card className="bg-white shadow-sm border-2 border-slate-100 sticky top-4">
            <CardHeader className="pb-4 border-b bg-slate-50/50">
              <CardTitle className="text-lg flex justify-between items-center">
                Bill Summary
                <span className="text-sm font-normal text-slate-500">Table {order.tableNumber}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Total Items</span>
                  <span className="font-medium">{order.totalItems}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium">₹{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Tax (5%)</span>
                  <span className="font-medium">₹{order.tax.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between items-center text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-₹{order.discount.toFixed(2)}</span>
                  </div>
                )}
                
                <Separator className="my-2" />
                
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg text-slate-800">Amount to Pay</span>
                  <span className="font-black text-2xl text-blue-600">₹{order.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-dashed border-slate-200">
                <Button 
                  className="w-full h-14 text-lg font-bold shadow-md bg-green-600 hover:bg-green-700 disabled:opacity-70 transition-all"
                  onClick={handleConfirmPayment}
                  disabled={isProcessing || (method === "CASH" && receivedAmount < order.total)}
                >
                  {isProcessing ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-6 w-6" />
                      Confirm Payment
                    </>
                  )}
                </Button>
                {method === "CASH" && receivedAmount < order.total && receivedAmount > 0 && (
                  <p className="text-red-500 text-xs text-center mt-2 font-medium">Insufficient cash received</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
