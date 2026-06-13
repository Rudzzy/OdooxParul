import { Outlet } from "react-router-dom";
import HamburgerMenu from "../components/HamburgerMenu";
import GlobalDesktopSidebar from "../components/GlobalDesktopSidebar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      <GlobalDesktopSidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="flex md:hidden h-20 items-center px-6 border-b bg-slate-950 shadow-md shrink-0">
          <HamburgerMenu />
          <h2 className="ml-6 text-2xl font-bold tracking-tight text-white">Admin Dashboard</h2>
        </header>

        <main className="flex-1 overflow-auto relative flex flex-col">
          {/* Removed Desktop Top Bar */}
          
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
