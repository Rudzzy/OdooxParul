# ☕ Odoo Cafe POS — Frontend Architecture Guide v2.0

> **React · Tailwind CSS · Framer Motion · WebSocket**
>
> *Updated workflow: Waiter-centric ordering. No customer-facing frontend.*

---

## 1. Project Overview & Tech Stack

This document is the complete frontend implementation guide for Odoo Cafe POS. It covers every page, every route, every component, and every interaction — written specifically for a React developer building the UI from scratch. The backend is handled separately; all API calls here use mock data or Axios with environment variables pointing to the real API when ready.

### 1.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| HTTP | Axios |
| Real-time | socket.io-client |
| Icons | Lucide React |
| Toasts | Sonner |

### 1.2 Folder Structure

```
src/
├── assets/           # Fonts, images, logo
├── components/       # Shared UI components
│   ├── ui/           # Buttons, inputs, modals, badges, cards
│   ├── layout/       # Sidebar, topbar, nav
│   └── shared/       # ProductCard, OrderCard, TableCard, etc.
├── pages/
│   ├── auth/         # Login screens
│   ├── admin/        # All backend admin pages
│   ├── pos/          # Waiter POS terminal pages
│   └── kitchen/      # Kitchen Display
├── store/            # Zustand stores (auth, cart, table, session, socket)
├── hooks/            # Custom hooks (useSocket, useCart, useProducts)
├── services/         # Axios API calls per domain
├── utils/            # formatCurrency, formatDate, etc.
├── constants/        # Role enums, route paths, payment methods
└── router/           # Route definitions, guards, layouts
```

### 1.3 Global Design Tokens (tailwind.config.js)

The warm café palette lives here. Every color used anywhere in the app must reference one of these tokens — no raw hex values in JSX.

```js
colors: {
  cafe: {
    cream:   '#FDF6EE',   // page background
    sand:    '#F5ECD9',   // card surfaces, table rows
    warm:    '#C8813A',   // primary brand – buttons, active states
    warmDark:'#A0622A',   // hover on primary
    green:   '#2D6A4F',   // success, available, paid
    red:     '#E63946',   // error, cancel, unavailable
    amber:   '#F4A261',   // warning, pending, in progress
    brown:   '#5C4A32',   // body text, headings
    muted:   '#7A6650',   // secondary text, placeholders
    border:  '#E2D9C8',   // all borders and dividers
  }
}
```

Set the base background in index.css: `bg-cafe-cream`. All screens inherit this warm off-white base.

---

## 2. Routing Architecture

All routes live in `src/router/index.jsx`. React Router v6 nested layouts handle the two distinct app shells — **Admin** and **POS/Waiter**. The Kitchen Display is a standalone route with no shell.

### 2.1 Route Tree

```
/                           → Route Index (dashboard of all routes)
/login                      → Admin Login
/signup                     → Admin Signup
/pos/login                  → Waiter PIN Login

/admin                      → AdminLayout shell
  /admin/dashboard          → Dashboard
  /admin/products           → Products list
  /admin/products/new       → New product form
  /admin/products/:id/edit  → Edit product form
  /admin/categories         → Categories
  /admin/payment-methods    → Payment Methods
  /admin/coupons            → Coupons
  /admin/promotions         → Promotions
  /admin/floors             → Floors & Tables
  /admin/bookings           → Bookings
  /admin/employees          → Employees
  /admin/kds-settings       → KDS Settings
  /admin/reports            → Reports

/pos                        → POSLayout shell
  /pos/floor                → Floor/Table Select
  /pos/order                → Order View (add items)
  /pos/orders               → Orders List
  /pos/orders/:id           → Order Detail
  /pos/customers            → Customer Management
  /pos/payment              → Payment (UPI / Card / Cash)

/kitchen                    → Kitchen Display (standalone, no shell)
```

### 2.2 Route Guards

Create a `ProtectedRoute` component that reads from the Zustand auth store. If not authenticated or the role doesn't match, redirect to the correct login page.

```jsx
// router/ProtectedRoute.jsx
const role = useAuthStore(s => s.role)
if (!role) return <Navigate to='/login' />
if (requiredRole && role !== requiredRole)
  return <Navigate to={roleHomeMap[role]} />
```

### 2.3 Layout Shells

- **AdminLayout** — Fixed left sidebar (240px) + top header + main content area. Sidebar collapses to icons on mobile.
- **POSLayout** — Full-width top navbar + content. No sidebar. Optimised for tablet landscape use.
- **KitchenDisplay** — No shell. Full-screen grid of ticket cards. Designed for a large monitor in landscape.

---

## 3. Auth Pages

### 3.1 Admin Login — `/login`

The entry point for the admin and any registered employee/waiter logging into the backend or POS. Full-screen centered card on a warm cream background with a soft animated logo entrance.

**Layout**
- Full-screen flex-center layout, background: cafe-cream
- Centered card (max-width 420px) with a subtle border and drop shadow
- Logo / cafe name at top of card
- Form below with email, password fields and a Login button
- Link at bottom: "New here? Sign up" navigates to /signup (admin only)

**Animations**
- Card enters with Framer Motion: opacity 0→1, y 24→0, spring easing, 400ms
- Input fields stagger in with 80ms delay each
- Login button has a loading spinner that replaces the label during API call
- On error: card does a subtle horizontal shake (keyframe: x 0→8→-8→0)

**Form Fields**

| Field | Type | Validation |
|-------|------|-----------|
| Email | email input | required, valid email |
| Password | password input | required, min 6 chars |

**Behaviour**
- On success: store token + role in Zustand + localStorage. Redirect by role: admin → /admin/dashboard, waiter → /pos/floor
- On failure: show inline error below password field using react-hot-toast
- "Forgot password" link is visible but shows a toast: "Contact your admin" for now

### 3.2 Admin Signup — `/signup`

Only accessible if no admin account exists yet, or from the login page link. Same visual style as login.
On success: auto-login and redirect to /admin/dashboard

### 3.3 Waiter PIN Login — `/pos/login`

A separate minimal screen. The waiter sees a numpad and enters their 4-digit PIN. No keyboard needed — fully touch-based.

**Layout**
- Full-screen warm cream background
- Top: Cafe logo + "Staff Login"
- Center: 4-dot PIN display (filled dot per digit entered)
- Below: 3×4 numpad grid (digits 1-9, 0, backspace, confirm)
- Large tap targets — minimum 64px per button

**Animations**
- Each dot fills with a spring pop animation when a digit is entered
- On wrong PIN: dots shake and clear
- On success: screen slides out to the right, floor view slides in from the right

**Behaviour**
- After 3 failed attempts: show a 30-second lockout countdown
- On success: store waiter identity in Zustand, redirect to /pos/floor

---

## 4. Admin Backend Pages

All admin pages share the AdminLayout shell — a fixed left sidebar, a top header bar with the admin's name and a logout button, and a scrollable main content area. The sidebar highlights the active route.

### 4.1 Admin Sidebar Navigation

| Icon | Label | Route |
|------|-------|-------|
| LayoutDashboard | Dashboard | /admin/dashboard |
| Package | Products | /admin/products |
| Tag | Categories | /admin/categories |
| CreditCard | Payment Methods | /admin/payment-methods |
| Ticket | Coupons | /admin/coupons |
| Percent | Promotions | /admin/promotions |
| Grid3x3 | Floors & Tables | /admin/floors |
| Calendar | Bookings | /admin/bookings |
| Users | Employees | /admin/employees |
| Monitor | KDS Settings | /admin/kds-settings |
| BarChart3 | Reports | /admin/reports |

### 4.2 Dashboard — `/admin/dashboard`

**Summary Cards (top row)**
Three stat cards in a row. Each card has an icon, a large number, a label, and a subtle trend indicator (up/down arrow + percentage vs yesterday).

| Card | Icon | Value |
|------|------|-------|
| Today's Revenue | DollarSign | ₹12,450 |
| Orders Today | ShoppingBag | 47 |
| Active Tables | Armchair | 6 / 12 |

**Filter Bar**
Appears below the stat cards. All charts and tables react instantly when filters change.
- Period picker: Today / This Week / This Month / Custom Date Range (date picker modal)
- Employee dropdown: All or specific employee
- Session dropdown: All sessions or a specific one
- Product dropdown: All or filter to orders containing a specific product

**Charts (middle section)**
- Sales Trend Chart — Recharts LineChart or BarChart. X axis: time (hours/days). Y axis: revenue or order count. Toggle between the two with a segmented control above the chart.
- Top Categories Chart — Recharts PieChart or BarChart. Shows revenue split by category. Color coded with category colors from the database.

**Tables (bottom section)**
- Top Orders — columns: Order #, Customer, Amount, Date, Status. Clicking a row opens the order detail modal.
- Top Products — columns: Product Name, Qty Sold, Revenue. Sorted by revenue desc.
- Top Categories — columns: Category, Orders, Revenue.

**Export**
"Export PDF" and "Export XLS" buttons top right. They apply the current filter before exporting.

**Animations**
- Stat cards count up from 0 on load using a spring animation (useSpring from Framer Motion)
- Charts animate in with a draw-in effect on mount
- When filters change: charts fade out and fade back in with new data

### 4.3 Products — `/admin/products`

**List View**
- Search bar at top to filter by product name
- Category filter tabs below search (All + one tab per category, colored with category color)
- Product grid: cards showing product image (if uploaded), name, category badge, price, and a status pill (Available / Unavailable)
- Each card has Edit and Delete icon buttons in the top-right corner
- "+ Add Product" button top right navigates to /admin/products/new

**Product Form** — `/admin/products/new` and `/admin/products/:id/edit`
- Save button: shows spinner during submit, success toast on save, redirects to list
- Cancel button: navigates back, shows unsaved changes warning if form is dirty

### 4.4 Categories — `/admin/categories`

- Grid of category cards showing name and color swatch
- Each card has Edit (opens inline edit modal) and Delete buttons
- "+ New Category" button opens a modal with Name field and a color picker (12 preset swatches)
- Deleting a category that has products: show a warning modal listing how many products will be affected before confirming
- Color changes reflect immediately on the category chip everywhere in the UI via the store

### 4.5 Payment Methods — `/admin/payment-methods`

A simple settings page with three rows, one per payment method.

| Method | Toggle | Extra Field |
|--------|--------|-------------|
| Cash | Enable / Disable | — |
| Card | Enable / Disable | — |
| UPI | Enable / Disable | UPI ID text input |

- When UPI is enabled and no UPI ID is saved: show an inline warning and disable the Save button
- Preview: when a valid UPI ID is entered, show a small live QR code preview using qrcode.react
- Save button at bottom stores all three settings

### 4.6 Coupons & Promotions — `/admin/coupons`

**Page layout**
Two tabs: "Coupon Codes" and "Automated Promotions"

**Coupon Codes tab**
Table: Code, Discount Type (%), Discount Value, Status (Active/Inactive), Actions
"+ New Coupon" button opens a modal form

**Automated Promotions tab**
Table: Name, Applies To, Min Qty / Min Amount, Discount, Status
"+ New Promotion" opens a modal form

### 4.7 Floors & Tables — `/admin/floors`

**Page layout**
- Left panel: list of floors (Floor 1, Floor 2, etc.) with an Edit and Delete button per floor
- "+ Add Floor" button at top of left panel
- Right panel: shows the tables belonging to the selected floor

**Table Grid**
- Each table shown as a square card with table number, seat count, and Active/Inactive badge
- "+ Add Table" button opens a modal

### 4.8 Bookings — `/admin/bookings`

**Page layout**
- Top: date navigator (Today / Tomorrow / This Week) + "+ New Booking" button
- Below: list of bookings for selected date as a timeline-style card list

**Booking Card shows**
- Customer name and phone
- Date, time, party size
- Table assigned
- Status: Pending / Confirmed / Seated / Cancelled

### 4.9 Employees — `/admin/employees`

Table: Name, Email, Role, Status (Active/Archived), Actions
"+ Add Employee" opens a modal form

**Row Actions**
- Change Password — opens a modal with New Password + Confirm fields
- Archive — confirmation modal, sets status to Archived (greyed row)
- Delete — confirmation modal with warning text

### 4.10 KDS Settings — `/admin/kds-settings`

Controls which products appear on the Kitchen Display.
- Search bar to find products
- Full product list with a toggle per product: "Show on KDS"
- Bulk actions: "Enable All" and "Disable All" buttons
- Changes save immediately with a debounced auto-save (500ms)

### 4.11 Reports — `/admin/reports`

Same filter bar as the dashboard. Three tabs: Overview, Product Report, Employee Report.

**Overview tab**
All dashboard charts and tables, but with a full-page layout giving more room. Session-by-session breakdown table: session ID, opened at, closed at, cashier, total orders, revenue.

**Product Report tab**
Table: Product, Category, Units Sold, Revenue, Avg Price. Sortable columns.

**Employee Report tab**
Table: Employee, Orders Taken, Revenue, Avg Order Value, Sessions.

**Export**
- PDF export: styled report with cafe logo, date range, and all visible tables
- XLS export: raw data in Excel format using SheetJS

---

## 5. Waiter POS Terminal

The POS terminal is a tablet-first interface used by waiters. All screens inside `/pos/*` share the POSLayout shell. The layout is optimised for a landscape 10–12 inch tablet but also works on desktop.

### New Ordering Workflow

The waiter manages the entire ordering lifecycle:

```
1. Customer sits at a table
2. Waiter comes to take the order
3. Waiter selects the table on their screen (Floor View)
4. Waiter adds items as the customer requests (Order View)
5. Waiter sends items to the kitchen
6. When customer is done eating, waiter comes to take payment
7. Waiter processes payment — UPI / Card / Cash (Payment Screen)
8. After payment is confirmed, the table is freed
9. Waiter returns to Floor View to serve the next table
```

### 5.1 POS Top Navigation Bar

Fixed top bar, full width, height 56px. From left to right:
- Cafe logo (small, 32px)
- **"Tables"** tab — navigates to /pos/floor
- **"Order"** tab — navigates to /pos/order (disabled if no table selected)
- **"Orders"** tab — navigates to /pos/orders
- **"Customers"** tab — navigates to /pos/customers
- Product search bar (expands to 240px on focus)
- Current table badge (e.g. "Table T3") — tapping opens table switcher
- Waiter avatar icon + name
- Hamburger menu — dropdown with links to all admin sections + Log Out

### 5.2 Floor Select — `/pos/floor`

**This is the first screen the waiter sees after login.** The waiter must select a table before they can take an order.

**Layout**
- Floor tabs at top (Floor 1, Floor 2, etc.)
- Table grid below — each table is a card showing table number and seat count

**Table Card States**

| State | Color | Border | Behaviour on Tap |
|-------|-------|--------|-------------------|
| Available | Green bg, white text | Green border | Sets as active table → navigates to /pos/order |
| Occupied | Amber bg, dark text | Amber border | Loads that table's current order → navigates to /pos/order |
| Reserved | Blue bg, white text | Blue border | Shows reservation info popup |
| Billing | Red bg, white text | Red border | Shows "Payment pending" — navigates to /pos/payment |

**Behaviour**
- Tapping an available table: sets it as the active table in Zustand store, marks it as "occupied", navigates to /pos/order with an empty cart
- Tapping an occupied table: loads that table's current order into the cart store, navigates to /pos/order
- Table states update in real-time via WebSocket when other waiters make changes

### 5.3 Order View — `/pos/order`

The main POS ordering screen. The waiter uses this to add items as the customer requests them.

**Two-panel layout** on tablet/desktop: Products (left, ~60%) + Cart (right, ~40%).

#### Products Panel (left)
- Category tab bar at top — tabs colored with each category's color. "All" tab first.
- Product search bar below the tabs
- Product grid: 3 columns of product cards

**Product Card contains:**
- Product image (placeholder icon if none uploaded)
- Product name
- Price
- Category color dot
- 'Unavailable' overlay (semi-transparent, not tappable) when marked unavailable in admin

Tapping adds 1 unit to cart with a spring pop animation on the cart count badge.

#### Cart Panel (right)
- **Active table displayed at top** (e.g. "Table T3 · 4 seats") — tapping allows switching table
- Scrollable list of cart items

**Each cart line shows:**
- Product name (bold)
- Quantity stepper: [-] [qty] [+]
- Unit price
- Line total (qty × price)
- Delete icon (trash) to remove item

If a product-level promotion is active: a green discount line below the product line (e.g. "Buy 2 get 10% off – -₹12")

#### Cart Action Buttons (below item list):
- **Assign Customer** — opens customer search/create drawer
- **Apply Coupon** — opens coupon code popup
- **Send to Kitchen** — sends current items to KDS (only items not yet sent), shows confirmation toast

#### Order Summary (bottom of cart panel):
- Subtotal line
- Tax line (calculated from product tax rates)
- Discount line (if coupon or auto-promotion applied) — shown in green
- Order-level coupon label (e.g. "CHAI20 applied") with a remove ✕ button
- **Grand Total** (large, bold)
- **"Proceed to Payment"** button — navigates to /pos/payment

#### Animations in Order View
- Adding a product: card briefly highlights (scale 1 → 1.05 → 1) and a floating +1 animates up to the cart
- Cart item addition: new item slides in from the right
- Cart item removal: item slides out left and other items slide up to fill space
- Quantity change: number flips (AnimatePresence with key on the qty value)
- Send to Kitchen: button pulses green, then returns to normal. Toast appears.

### 5.4 Coupon Code Popup

A small centered modal (not full screen).
- Title: "Apply Coupon"
- Single text input: uppercase, placeholder "Enter code"
- "Apply" button
- On valid code: modal closes, discount appears in cart summary, success toast
- On invalid code: input shakes + red border + inline error message "Invalid or expired code"
- Only one coupon active at a time — applying a new one replaces the old one with a confirmation

### 5.5 Payment — `/pos/payment`

**This is the screen the waiter uses when the customer is ready to pay.** The waiter selects the payment method and processes the payment.

#### Layout
- Header showing table number and order summary
- Full itemised list of all items ordered during this table's session
- Subtotal, tax, any discounts, **Grand Total** (large, prominent)
- Three payment method buttons below: **Cash** | **Card** | **UPI**

#### Cash Payment
- Show a numeric input: "Amount Received"
- Below it: change due = Amount Received − Grand Total (updates as waiter types)
- If amount received < total: show warning, disable Confirm button
- Quick amount buttons: Exact, ₹500, ₹1000, ₹2000
- "Confirm Payment" button → marks order as paid → frees the table

#### Card Payment
- Show a text input: "Transaction Reference / Approval Code"
- "Confirm Payment" button → marks order as paid → frees the table

#### UPI Payment
- Generate QR code from the saved UPI ID + total amount using qrcode.react
- Display: large QR code, amount below it, UPI ID label
- Two buttons: "Payment Received" (green) and "Cancel" (ghost)
- On confirm: marks order as paid → frees the table

#### Post-Payment
- Brief success animation (large checkmark + "Payment Complete!")
- Order receipt summary: order number, table number, date, itemised list, total, payment method
- Two action buttons: "Print Receipt" and "Send via Email"
- **Table is automatically freed** (status reset to Available in the store)
- **"New Order"** button — returns to /pos/floor to serve the next table
- Auto-navigates to /pos/floor after 5 seconds if no action taken

### 5.6 Orders List — `/pos/orders`

- Search bar: filter by order number, customer name, or date
- Filter tabs: All / Draft / Paid / Cancelled

**List of order cards:** order number, table number, customer name (if assigned), time, total, status badge

**Order Status Badges**

| Status | Color | Background |
|--------|-------|-----------|
| Draft | cafe-amber | Amber light bg |
| Sent to Kitchen | cafe-warm | Warm light bg |
| Paid | cafe-green | Green light bg |
| Cancelled | cafe-red | Red light bg |

Clicking an order → navigates to /pos/orders/:id

### 5.7 Order Detail — `/pos/orders/:id`

- Header: order number, table number, date, status badge
- Customer info (if assigned)
- Items list with qty, price, line total
- Summary: subtotal, tax, discount, total
- If status is **Draft**: show "Edit Order" button (loads order into cart and returns to /pos/order) and "Cancel Order" button (confirmation modal)
- If status is **Paid**: view-only, show "Print Receipt" and "Email Receipt" buttons

### 5.8 Customer Management — `/pos/customers`

- Search input: filter by name, email, or phone
- Customer list cards: name, phone, email, last visit date
- "+ New Customer" button opens a form drawer from the right side
- Edit and Delete actions on each customer card
- Tapping a customer in the list also allows "Assign to Current Order" button if an order is active

---

## 6. Kitchen Display — `/kitchen`

The Kitchen Display System (KDS) is a standalone full-screen page opened on a separate device. It has no navigation shell, no auth requirement. Real-time updates arrive via WebSocket.

### 6.1 Layout

- Full-screen dark background
- Top bar: cafe name/logo (left), current time (right, large, live updating)
- Three columns: **To Cook** | **Preparing** | **Completed**
- Each column has a colored header and a scrollable list of ticket cards below

### 6.2 Ticket Card

- White card with a bold border in the column's stage color
- Order number (top left, large — e.g. #0042)
- Table number (top right)
- Time elapsed since order was placed (e.g. "4 min ago" — updates live)
- List of items: product name + quantity on each row
- Items that have been individually ticked off show with a strikethrough and muted text

**Interactions**
- Tapping the ticket card header: moves the entire ticket to the next stage (To Cook → Preparing → Completed)
- Tapping an individual item row: toggles that item as done (strikethrough). Does not advance the whole ticket.
- Long-press on a Completed ticket: removes it from the board (archived)

**Animations**
- New ticket arriving: slides in from the top of the To Cook column with a spring animation
- Ticket advancing stage: slides out of current column and slides into new column
- Individual item completion: text and icon fade and strikethrough animates in
- Time elapsed: smoothly counts up every 30 seconds

### 6.3 Top Bar Controls

- Search bar: filters visible tickets by order number or product name
- Category filter pills: tap to show only tickets containing that category
- "Clear Completed" button: archives all Completed tickets from the board

### 6.4 Real-time Updates

- WebSocket event: `new_order` → new ticket appears in To Cook column
- WebSocket event: `order_updated` → ticket updates in place (items added)
- No polling. The display is always live. If socket disconnects: show a yellow reconnecting banner at top.

---

## 7. Real-time Architecture (WebSocket)

All real-time communication uses socket.io-client. The socket connection is managed in a Zustand store (useSocketStore). The socket connects on auth and disconnects on logout.

### 7.1 Socket Store

```js
// store/socketStore.js
socket: null
connect(token) { ... }   // joins room by role
disconnect() { ... }
```

### 7.2 Events the Frontend Listens To

| Event | Payload | Action |
|-------|---------|--------|
| `new_order` | order object | Add ticket to KDS To Cook column |
| `order_updated` | order object | Update ticket in KDS |
| `table_status_changed` | { tableId, status } | Update table card in Floor View |
| `order_status_changed` | { orderId, status } | Update order badge in Orders List |

### 7.3 Events the Frontend Emits

| Event | Payload | When |
|-------|---------|------|
| `send_to_kitchen` | { orderId, items } | Waiter taps "Send to Kitchen" |
| `update_order_status` | { orderId, status } | KDS moves ticket between stages |
| `table_freed` | { tableId } | Payment completed, table freed |

### 7.4 Disconnection Handling

- If socket drops: show a subtle yellow banner "Reconnecting…" that auto-hides when reconnected
- Use socket.io auto-reconnect with exponential backoff
- On reconnect: refetch current session data to resync any missed events

---

## 8. Shared Components

### 8.1 Component Library (`src/components/ui/`)

| Component | Description |
|-----------|-------------|
| Button | Primary, secondary, ghost, destructive variants. Loading state with spinner. |
| Input | Text, email, password, number. With label and inline error. |
| Badge | Status pills — colored by status type. |
| Card | Surface container with optional header/footer. |
| Modal | Centered overlay dialog with title, content, actions. |
| Drawer | Slide-in panel from right side. |
| Toast | Sonner-based notifications. |
| Skeleton | Pulsing placeholder loaders. |
| Stepper | Quantity [-] [qty] [+] control. |
| Numpad | Touch-optimized numeric input grid. |
| TableCard | Table display card with status coloring. |
| ProductCard | Product grid card with image, name, price. |
| OrderCard | Order list card with status badge. |

### 8.2 Page Transitions

All route changes use Framer Motion AnimatePresence with a consistent transition:

```js
initial: { opacity: 0, y: 8 }
animate: { opacity: 1, y: 0 }
exit: { opacity: 0, y: -8 }
transition: { duration: 0.2, ease: 'easeOut' }
```

### 8.3 Loading States

- Skeleton loaders for all list and grid views — use a pulsing grey placeholder in the shape of the real content
- Full-page spinner only for initial auth check on app load
- Inline button spinners for form submissions
- Optimistic updates for cart actions (no loading state needed — update UI, sync in background)

### 8.4 Error Handling

- Axios interceptor: on 401 → clear auth store → redirect to login
- Axios interceptor: on 500 → show generic toast error
- React Error Boundary wrapping each layout shell — shows a friendly "Something went wrong" screen with a reload button
- Form errors: inline under each field, red text, field border turns red

---

## 9. State Management (Zustand)

### 9.1 Auth Store — `useAuthStore`

```js
{
  token: string | null,
  role: 'admin' | 'waiter' | null,
  user: { id, name, email, avatar } | null,
  login(credentials) → Promise,
  logout(),
  pinLogin(pin) → Promise,
}
```

### 9.2 Cart Store — `useCartStore`

```js
{
  items: [{ product, quantity }],
  tableId: string | null,
  coupon: { code, discount } | null,
  addItem(product),
  removeItem(productId),
  updateQuantity(productId, qty),
  applyCoupon(code) → Promise,
  removeCoupon(),
  clearCart(),
  subtotal: computed,
  tax: computed,
  discount: computed,
  total: computed,
}
```

### 9.3 Table Store — `useTableStore`

```js
{
  tables: [{ id, number, floor, seats, status }],
  activeTable: table | null,
  selectTable(id),
  freeTable(id),      // after payment → status = 'available'
  occupyTable(id),    // when order started → status = 'occupied'
  getTablesByFloor(floorId),
}
```

### 9.4 Session Store — `useSessionStore`

```js
{
  sessionId: string | null,
  openedAt: Date | null,
  orders: [],
  openSession(),
  closeSession(),
}
```

---

## 10. Animation Principles

All animations use Framer Motion. The guiding principle: animations should feel alive but never distracting. Use spring physics for anything interactive (adds to cart, buttons) and ease-out for transitions.

### 10.1 Motion Tokens

```js
const spring = { type: 'spring', stiffness: 300, damping: 20 }
const springBouncy = { type: 'spring', stiffness: 400, damping: 15 }
const easeOut = { duration: 0.2, ease: 'easeOut' }
const easeInOut = { duration: 0.3, ease: 'easeInOut' }
```

### 10.2 Pattern Library

| Pattern | Use Case | Config |
|---------|----------|--------|
| Fade up | Page transitions | y: 8→0, opacity: 0→1 |
| Spring pop | Button press, add to cart | scale: 1→1.05→1 |
| Slide right | Step flows, drawers | x: 100%→0 |
| Shake | Error feedback | x: [0,8,-8,4,-4,0] |
| Count up | Stat numbers | useSpring with round |

---

## 11. Mock Data & API Layer

Until the real backend is ready, all data comes from mock JSON files in `src/services/mock/`. Axios interceptors check for a `VITE_USE_MOCK=true` environment variable and return mock data instead of hitting the network. Switching to real API requires only changing that flag and ensuring the endpoint paths match.

### 11.1 Mock Data Files

| File | Content |
|------|---------|
| `products.json` | 15–20 products across 5 categories |
| `categories.json` | Coffee, Tea, Snacks, Desserts, Beverages |
| `tables.json` | 2 floors, 8–10 tables each |
| `orders.json` | Sample orders with different statuses |
| `employees.json` | 3–4 staff members |
| `customers.json` | 5–6 customer records |

### 11.2 API Service Files (`src/services/`)

| File | Endpoints |
|------|-----------|
| `authService.js` | login, signup, pinLogin, logout |
| `productService.js` | getProducts, getProduct, createProduct, updateProduct, deleteProduct |
| `categoryService.js` | getCategories, createCategory, updateCategory, deleteCategory |
| `orderService.js` | getOrders, getOrder, createOrder, updateOrder, cancelOrder |
| `tableService.js` | getTables, updateTableStatus |
| `customerService.js` | getCustomers, createCustomer, updateCustomer |
| `paymentService.js` | processPayment |
| `reportService.js` | getDashboardStats, getReports |

---

## 12. Recommended Build Order

Follow this order to have something working and testable at each stage:

| Phase | What to Build | Test |
|-------|---------------|------|
| 1 | Route skeleton + layouts + blank pages | All routes load |
| 2 | Auth pages (Admin Login + Waiter PIN) | Can log in, redirects work |
| 3 | POS Floor Select + Table store + mock tables | Can see and tap tables |
| 4 | POS Order View + Cart store + mock products | Can add items, see cart |
| 5 | POS Payment screen | Can process payment, table frees |
| 6 | Kitchen Display | Tickets show, can move stages |
| 7 | Admin Dashboard + Reports | Charts render with mock data |
| 8 | Admin CRUD pages (Products, Categories, etc.) | Can create/edit/delete |
| 9 | WebSocket integration | Real-time updates work |
| 10 | Polish — animations, transitions, error handling | Everything feels smooth |

---

> ☕ *Brew it well.*
> *Every good cafe runs on good systems.*
>
> **Odoo Cafe POS — Frontend Guide v2.0**
