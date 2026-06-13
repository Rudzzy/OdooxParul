import { Link, Outlet } from "react-router-dom";

export default function AdminLayout() {
  const links = [
    ["dashboard", "Dashboard"],
    ["products", "Products"],
    ["categories", "Categories"],
    ["payment-methods", "Payment Methods"],
    ["coupons", "Coupons"],
    ["promotions", "Promotions"],
    ["floors", "Floors"],
    ["bookings", "Bookings"],
    ["employees", "Employees"],
    ["kds-settings", "KDS Settings"],
    ["reports", "Reports"],
  ];
  return (
    <div style={{ padding: 16 }}>
      <h2>Admin</h2>
      <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        {links.map(([to, label]) => (
          <Link key={to} to={to}>{label}</Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
