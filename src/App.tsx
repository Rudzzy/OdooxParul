import { BrowserRouter, Routes, Route } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";
import POSLayout from "./layouts/POSLayout";

import LoginPage from "./pages/auth/LoginPage";
import AdminSignupPage from "./pages/auth/AdminSignupPage";

import DashboardPage from "./pages/admin/DashboardPage";
import ProductsPage from "./pages/admin/ProductsPage";
import ProductFormPage from "./pages/admin/ProductFormPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import PaymentMethodsPage from "./pages/admin/PaymentMethodsPage";
import CouponsPage from "./pages/admin/CouponsPage";
import PromotionsPage from "./pages/admin/PromotionsPage";
import FloorsPage from "./pages/admin/FloorsPage";
import BookingsPage from "./pages/admin/BookingsPage";
import EmployeesPage from "./pages/admin/EmployeesPage";
import KDSSettingsPage from "./pages/admin/KDSSettingsPage";
import ReportsPage from "./pages/admin/ReportsPage";

import FloorSelectPage from "./pages/pos/FloorSelectPage";
import OrderViewPage from "./pages/pos/OrderViewPage";
import OrdersListPage from "./pages/pos/OrdersListPage";
import OrderDetailPage from "./pages/pos/OrderDetailPage";
import CustomerManagePage from "./pages/pos/CustomerManagePage";
import PaymentPage from "./pages/pos/PaymentPage";
import PaymentSuccessPage from "./pages/pos/PaymentSuccessPage";

import KitchenDisplayPage from "./pages/kitchen/KitchenDisplayPage";

import RouteIndexPage from "./pages/RouteIndexPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RouteIndexPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<AdminSignupPage />} />
        <Route path="/pos/login" element={<LoginPage />} />
        <Route path="/kitchen" element={<KitchenDisplayPage />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:id/edit" element={<ProductFormPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="payment-methods" element={<PaymentMethodsPage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="promotions" element={<PromotionsPage />} />
          <Route path="floors" element={<FloorsPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="kds-settings" element={<KDSSettingsPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>

        <Route path="/pos" element={<POSLayout />}>
          <Route path="floor" element={<FloorSelectPage />} />
          <Route path="order/:tableId" element={<OrderViewPage />} />
          <Route path="orders" element={<OrdersListPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="customers" element={<CustomerManagePage />} />
          <Route path="payment/:orderId" element={<PaymentPage />} />
          <Route path="payment-success/:orderId" element={<PaymentSuccessPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
