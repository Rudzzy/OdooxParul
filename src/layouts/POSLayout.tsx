import { Link, Outlet } from "react-router-dom";

export default function POSLayout() {
  const links = [
    ["floor", "Floor"],
    ["order", "Order"],
    ["orders", "Orders"],
    ["customers", "Customers"],
  ];
  return (
    <div style={{ padding: 16 }}>
      <h2>POS</h2>
      <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        {links.map(([to, label]) => (
          <Link key={to} to={to}>{label}</Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
