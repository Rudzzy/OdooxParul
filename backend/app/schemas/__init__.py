from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, EmailStr


# ─── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    token: str
    user: UserOut

class PinLoginRequest(BaseModel):
    pin: str


# ─── Category ────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str
    color: str = "bg-gray-500"

class CategoryOut(CategoryCreate):
    id: str
    class Config:
        from_attributes = True


# ─── Product ─────────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str
    categoryId: str
    price: float
    description: str = ""
    isVeg: bool = False
    status: str = "available"

class ProductOut(ProductCreate):
    id: str
    class Config:
        from_attributes = True


# ─── Floor ───────────────────────────────────────────────────────────────────

class FloorCreate(BaseModel):
    name: str

class FloorOut(FloorCreate):
    id: str
    class Config:
        from_attributes = True


# ─── Table ───────────────────────────────────────────────────────────────────

class TableCreate(BaseModel):
    floorId: str
    tableNumber: str
    capacity: int = 4
    isActive: bool = True

class TableOut(TableCreate):
    id: str
    class Config:
        from_attributes = True


# ─── Booking ─────────────────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    customerName: str
    customerPhone: str
    date: str
    time: str
    partySize: int
    tableId: Optional[str] = None
    status: str = "Pending"
    charges: float = 0.0

class BookingOut(BookingCreate):
    id: str
    class Config:
        from_attributes = True


# ─── Payment Method ──────────────────────────────────────────────────────────

class PaymentMethodCreate(BaseModel):
    name: str
    type: str
    isActive: bool = True
    upiId: Optional[str] = None

class PaymentMethodOut(PaymentMethodCreate):
    id: str
    class Config:
        from_attributes = True


# ─── Coupon ──────────────────────────────────────────────────────────────────

class CouponCreate(BaseModel):
    code: str
    discountType: str
    discountValue: float
    isActive: bool = True
    conditionType: str = "none"
    conditionValue: Optional[float] = None
    expiresAt: Optional[str] = None

class CouponOut(CouponCreate):
    id: str
    class Config:
        from_attributes = True


# ─── Promotion ───────────────────────────────────────────────────────────────

class PromotionCreate(BaseModel):
    name: str
    appliesTo: str
    conditionType: str = "none"
    conditionValue: float = 0.0
    discountType: str
    discountValue: float
    isActive: bool = True
    activeDays: Optional[List[int]] = None

class PromotionOut(PromotionCreate):
    id: str
    class Config:
        from_attributes = True


# ─── Order ───────────────────────────────────────────────────────────────────

class OrderItem(BaseModel):
    productId: str
    name: str
    price: float
    quantity: int

class OrderCreate(BaseModel):
    tableId: Optional[str] = None
    items: List[OrderItem] = []
    subtotal: float = 0.0
    tax: float = 0.0
    total: float = 0.0
    status: str = "open"

class OrderOut(BaseModel):
    id: str
    tableId: Optional[str]
    status: str
    items: list
    subtotal: float
    tax: float
    total: float
    class Config:
        from_attributes = True


# ─── KDS (Kitchen Display System) ────────────────────────────────────────────

class KDSOrderItemCreate(BaseModel):
    name: str
    quantity: int = 1
    categoryId: Optional[str] = None

class KDSOrderItemOut(BaseModel):
    id: str
    name: str
    quantity: int
    prepared: bool
    categoryId: Optional[str] = None
    class Config:
        from_attributes = True

class KDSOrderCreate(BaseModel):
    customerName: Optional[str] = None
    items: List[KDSOrderItemCreate] = []
    tableId: Optional[str] = None

class KDSOrderOut(BaseModel):
    id: str
    ticketNumber: str
    customerName: Optional[str] = None
    stage: str
    timestamp: str
    tableId: Optional[str] = None
    items: List[KDSOrderItemOut] = []
    class Config:
        from_attributes = True

