import { Link, Outlet, useLocation } from "react-router-dom";
import HamburgerMenu from "../components/HamburgerMenu";
import GlobalDesktopSidebar from "../components/GlobalDesktopSidebar";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Clock, 
  History, 
  Settings,
  Bell,
  Wifi,
  LogOut,
  User
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function POSLayout() {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { to: "/pos/floor", label: "Floor View", icon: LayoutDashboard },
    { to: "/pos/orders", label: "Active Orders", icon: UtensilsCrossed },
    { to: "/kitchen", label: "Kitchen Status", icon: Clock },
    { to: "/pos/payment/history", label: "Payment History", icon: History },
    { to: "/pos/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <GlobalDesktopSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <HamburgerMenu />
          <div className="flex items-center gap-2 ml-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 text-white font-bold text-xl">
              O
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800 hidden sm:block">OdooX</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-600 font-medium">
            <Clock className="h-4 w-4" />
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          
          <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-slate-600 hidden sm:block">Shift Active</span>
            </div>
            <div className="flex items-center gap-2 ml-2 bg-slate-100 px-3 py-1.5 rounded-full">
              <User className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">John Waiter</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-700">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500"></span>
            </Button>
            <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-600">
              <Wifi className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-red-600 transition-colors">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-20 md:w-64 border-r bg-white flex flex-col justify-between shrink-0 shadow-sm z-10">
          <nav className="flex flex-col gap-2 p-4">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 md:px-4 md:py-3 transition-colors ${
                    isActive 
                      ? "bg-blue-50 text-blue-700 font-semibold" 
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 font-medium"
                  }`}
                >
                  <item.icon className={`h-6 w-6 md:h-5 md:w-5 ${isActive ? "text-blue-600" : ""}`} />
                  <span className="hidden md:block">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t text-xs text-center text-slate-400 hidden md:block">
            Waiter POS Terminal v1.0
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
    </div>
  );
}
