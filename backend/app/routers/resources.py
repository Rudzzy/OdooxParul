from fastapi import APIRouter

from app.models.models import (
    Category, Product, Floor, TableItem,
    Booking, PaymentMethod, Coupon, Promotion, Order
)
from app.schemas import (
    CategoryCreate, CategoryOut,
    ProductCreate, ProductOut,
    FloorCreate, FloorOut,
    TableCreate, TableOut,
    BookingCreate, BookingOut,
    PaymentMethodCreate, PaymentMethodOut,
    CouponCreate, CouponOut,
    PromotionCreate, PromotionOut,
    OrderCreate, OrderOut,
)
from app.routers.crud_helper import build_crud_router

# ─── Categories ──────────────────────────────────────────────────────────────
categories_router = APIRouter(prefix="/api/categories", tags=["Categories"])
build_crud_router(categories_router, Category, CategoryCreate, CategoryOut, "Category")

# ─── Products ────────────────────────────────────────────────────────────────
products_router = APIRouter(prefix="/api/products", tags=["Products"])
build_crud_router(products_router, Product, ProductCreate, ProductOut, "Product")

# ─── Floors ──────────────────────────────────────────────────────────────────
floors_router = APIRouter(prefix="/api/floors", tags=["Floors"])
build_crud_router(floors_router, Floor, FloorCreate, FloorOut, "Floor")

# ─── Tables ──────────────────────────────────────────────────────────────────
tables_router = APIRouter(prefix="/api/tables", tags=["Tables"])
build_crud_router(tables_router, TableItem, TableCreate, TableOut, "Table")

# ─── Bookings ────────────────────────────────────────────────────────────────
bookings_router = APIRouter(prefix="/api/bookings", tags=["Bookings"])
build_crud_router(bookings_router, Booking, BookingCreate, BookingOut, "Booking")

# ─── Payment Methods ─────────────────────────────────────────────────────────
payments_router = APIRouter(prefix="/api/payment-methods", tags=["Payment Methods"])
build_crud_router(payments_router, PaymentMethod, PaymentMethodCreate, PaymentMethodOut, "Payment Method")

# ─── Coupons ─────────────────────────────────────────────────────────────────
coupons_router = APIRouter(prefix="/api/coupons", tags=["Coupons"])
build_crud_router(coupons_router, Coupon, CouponCreate, CouponOut, "Coupon")

# ─── Promotions ──────────────────────────────────────────────────────────────
promotions_router = APIRouter(prefix="/api/promotions", tags=["Promotions"])
build_crud_router(promotions_router, Promotion, PromotionCreate, PromotionOut, "Promotion")

# ─── Orders ──────────────────────────────────────────────────────────────────
orders_router = APIRouter(prefix="/api/orders", tags=["Orders"])
build_crud_router(orders_router, Order, OrderCreate, OrderOut, "Order")
