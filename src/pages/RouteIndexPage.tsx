import { Link } from "react-router-dom";

const groups: { title: string; icon: string; color: string; routes: { to: string; label: string; description: string }[] }[] = [
  {
    title: "Auth",
    icon: "🔐",
    color: "#C8813A",
    routes: [
      { to: "/login", label: "Admin Login", description: "Email + password login for admin panel" },
      { to: "/signup", label: "Admin Signup", description: "New admin account registration" },
      { to: "/pos/login", label: "Waiter PIN Login", description: "4-digit PIN entry for POS access" },
    ],
  },
  {
    title: "Admin",
    icon: "⚙️",
    color: "#5C4A32",
    routes: [
      { to: "/admin/dashboard", label: "Dashboard", description: "Revenue, orders, and analytics overview" },
      { to: "/admin/products", label: "Products", description: "Product listing and management" },
      { to: "/admin/products/new", label: "New Product", description: "Add a new product form" },
      { to: "/admin/products/1/edit", label: "Edit Product", description: "Edit existing product (sample)" },
      { to: "/admin/categories", label: "Categories", description: "Manage product categories & colors" },
      { to: "/admin/payment-methods", label: "Payment Methods", description: "Enable/disable Cash, Card, UPI" },
      { to: "/admin/coupons", label: "Coupons", description: "Coupon codes management" },
      { to: "/admin/promotions", label: "Promotions", description: "Automated promotions setup" },
      { to: "/admin/floors", label: "Floors & Tables", description: "Floor plans and table configuration" },
      { to: "/admin/bookings", label: "Bookings", description: "Table reservations and scheduling" },
      { to: "/admin/employees", label: "Employees", description: "Staff accounts and roles" },
      { to: "/admin/kds-settings", label: "KDS Settings", description: "Kitchen display product visibility" },
      { to: "/admin/reports", label: "Reports", description: "Sales, product, and employee reports" },
    ],
  },
  {
    title: "POS (Waiter)",
    icon: "📋",
    color: "#2D6A4F",
    routes: [
      { to: "/pos/floor", label: "Floor / Table Select", description: "Step 1 — Choose a table to serve" },
      { to: "/pos/order", label: "Order View", description: "Step 2 — Add items as customer requests" },
      { to: "/pos/payment", label: "Payment", description: "Step 3 — Process UPI / Card / Cash payment" },
      { to: "/pos/orders", label: "Orders List", description: "View all orders with filters" },
      { to: "/pos/orders/1", label: "Order Detail", description: "Single order detail view (sample)" },
      { to: "/pos/customers", label: "Customer Management", description: "Search, add, assign customers" },
    ],
  },
  {
    title: "Kitchen",
    icon: "👨‍🍳",
    color: "#E63946",
    routes: [
      { to: "/kitchen", label: "Kitchen Display", description: "Full-screen ticket board for kitchen staff" },
    ],
  },
];

export default function RouteIndexPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #FDF6EE 0%, #F5ECD9 100%)",
        padding: "40px 24px",
        fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              fontSize: 48,
              marginBottom: 8,
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
            }}
          >
            ☕
          </div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#5C4A32",
              margin: "0 0 8px 0",
              letterSpacing: "-0.5px",
            }}
          >
            Odoo Cafe POS
          </h1>
          <p
            style={{
              color: "#7A6650",
              margin: 0,
              fontSize: 16,
              maxWidth: 500,
              marginInline: "auto",
              lineHeight: 1.5,
            }}
          >
            Route Dashboard — Pick any page to start developing. All pages are blank stubs ready to be built out.
          </p>
        </div>

        {/* Workflow Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #C8813A, #A0622A)",
            borderRadius: 16,
            padding: "20px 28px",
            marginBottom: 40,
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
            boxShadow: "0 4px 20px rgba(200, 129, 58, 0.3)",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, textTransform: "uppercase", letterSpacing: 1, opacity: 0.9 }}>
            Waiter Workflow
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 14 }}>
            {[
              "Select Table",
              "Add Items",
              "Send to Kitchen",
              "Take Payment",
              "Table Freed",
            ].map((step, i) => (
              <span key={step} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    background: "rgba(255,255,255,0.25)",
                    borderRadius: "50%",
                    width: 24,
                    height: 24,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontWeight: 500 }}>{step}</span>
                {i < 4 && <span style={{ opacity: 0.5 }}>→</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Route Groups */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 24,
          }}
        >
          {groups.map((g) => (
            <section
              key={g.title}
              style={{
                background: "white",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
                border: "1px solid #E2D9C8",
                transition: "box-shadow 0.2s ease",
              }}
            >
              {/* Section Header */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #E2D9C8",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: `${g.color}08`,
                }}
              >
                <span style={{ fontSize: 20 }}>{g.icon}</span>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: g.color,
                    letterSpacing: "-0.2px",
                  }}
                >
                  {g.title}
                </h2>
                <span
                  style={{
                    marginLeft: "auto",
                    background: `${g.color}15`,
                    color: g.color,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 100,
                  }}
                >
                  {g.routes.length} {g.routes.length === 1 ? "route" : "routes"}
                </span>
              </div>

              {/* Route List */}
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {g.routes.map((r, i) => (
                  <li
                    key={r.to}
                    style={{
                      borderBottom: i < g.routes.length - 1 ? "1px solid #F5ECD9" : "none",
                    }}
                  >
                    <Link
                      to={r.to}
                      style={{
                        display: "block",
                        padding: "12px 20px",
                        textDecoration: "none",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "#FDF6EE";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: "#5C4A32" }}>
                          {r.label}
                        </span>
                        <code
                          style={{
                            fontSize: 11,
                            color: "#7A6650",
                            background: "#F5ECD9",
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            flexShrink: 0,
                          }}
                        >
                          {r.to}
                        </code>
                      </div>
                      <div style={{ fontSize: 12, color: "#7A6650", marginTop: 4 }}>
                        {r.description}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 48, color: "#7A6650", fontSize: 13 }}>
          <p style={{ margin: 0 }}>
            ☕ Odoo Cafe POS · Frontend Guide v2.0 · Waiter-Centric Workflow
          </p>
        </div>
      </div>
    </div>
  );
}
