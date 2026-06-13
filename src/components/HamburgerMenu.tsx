import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";

export const MENU_LINKS = [
  { label: "Products", to: "/admin/products" },
  { label: "Category", to: "/admin/categories" },
  { label: "Payment method", to: "/admin/payment-methods" },
  { label: "Coupons", to: "/admin/coupons" },
  { label: "Promotions", to: "/admin/promotions" },
  { label: "Booking", to: "/admin/bookings" },
  { label: "User/Employee", to: "/admin/employees" },
  { label: "Reports", to: "/admin/reports" },
  { label: "KDS", to: "/admin/kds-settings" },
  { label: "Log-Out", to: "/login" },
];

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <div className="relative z-50 md:hidden" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-12 h-12 rounded-xl border-2 border-orange-500/80 hover:bg-orange-500/10 transition-colors bg-[#111]"
        title="Menu"
      >
        <Menu className="w-7 h-7 text-slate-200" />
      </button>

      {isOpen && (
        <div className="absolute top-14 left-0 w-[260px] bg-[#111] border border-slate-700 shadow-2xl py-3 rounded-sm font-['Comic_Sans_MS',_'Chalkboard_SE',_'Marker_Felt',_cursive]">
          <div className="flex flex-col gap-1">
            {MENU_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="px-4 py-1.5 text-slate-200 border border-transparent hover:border-orange-500/70 mx-3 transition-all rounded-[4px] text-lg tracking-wide hover:bg-orange-500/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
