import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, Printer, LayoutDashboard, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentSuccessPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  // Mock data for success page
  const transactionId = "TXN-" + Math.floor(Math.random() * 1000000);
  const amountPaid = 1522.50;
  const paymentMethod = "UPI";
  const tableNumber = "3";

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-lg mx-auto py-12">
      <Card className="w-full bg-white shadow-xl border-slate-100 overflow-hidden">
        <div className="bg-green-500 h-2 w-full" />
        <CardContent className="p-8 flex flex-col items-center text-center">
          
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
          <p className="text-slate-500 mb-8">Table {tableNumber} is now available</p>

          <div className="w-full bg-slate-50 rounded-xl p-5 mb-8 border border-slate-100">
            <div className="grid grid-cols-2 gap-y-4 text-left text-sm">
              <div className="text-slate-500">Amount Paid</div>
              <div className="font-bold text-slate-900 text-right">₹{amountPaid.toFixed(2)}</div>
              
              <div className="text-slate-500">Payment Method</div>
              <div className="font-semibold text-slate-900 text-right">{paymentMethod}</div>
              
              <div className="text-slate-500">Transaction ID</div>
              <div className="font-semibold text-slate-900 text-right">{transactionId}</div>
            </div>
          </div>

          <div className="flex flex-col w-full gap-3">
            <Button 
              className="w-full h-12 text-lg bg-slate-900 hover:bg-slate-800"
              onClick={() => navigate('/pos/floor')}
            >
              <LayoutDashboard className="mr-2 h-5 w-5" />
              Return To Floor View
            </Button>
            
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Button variant="outline" className="h-12 bg-white" onClick={() => {}}>
                <Printer className="mr-2 h-4 w-4" />
                Print Receipt
              </Button>
              <Button variant="outline" className="h-12 bg-white" onClick={() => navigate('/pos/floor')}>
                <UtensilsCrossed className="mr-2 h-4 w-4" />
                New Order
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
