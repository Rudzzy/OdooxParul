from sqlalchemy import (
    Column, String, Boolean, Float, Integer,
    ForeignKey, JSON, Enum as SAEnum
)
from sqlalchemy.orm import relationship
import enum
import uuid
from datetime import datetime

from app.database import Base


def gen_id():
    return str(uuid.uuid4())


# ─── Auth ────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    admin = "admin"
    staff = "staff"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.staff)
    pin = Column(String, nullable=True, index=True)  # 4-digit PIN for waiter login


# ─── Inventory ───────────────────────────────────────────────────────────────

class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    color = Column(String, default="bg-gray-500")

    products = relationship("Product", back_populates="category")


class ProductStatus(str, enum.Enum):
    available = "available"
    unavailable = "unavailable"


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    categoryId = Column(String, ForeignKey("categories.id"), nullable=False)
    price = Column(Float, nullable=False)
    description = Column(String, default="")
    isVeg = Column(Boolean, default=False)
    status = Column(SAEnum(ProductStatus), default=ProductStatus.available)

    category = relationship("Category", back_populates="products")


# ─── Floors & Tables ─────────────────────────────────────────────────────────

class Floor(Base):
    __tablename__ = "floors"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)

    tables = relationship("TableItem", back_populates="floor")


class TableItem(Base):
    __tablename__ = "tables"

    id = Column(String, primary_key=True, default=gen_id)
    floorId = Column(String, ForeignKey("floors.id"), nullable=False)
    tableNumber = Column(String, nullable=False)
    capacity = Column(Integer, default=4)
    isActive = Column(Boolean, default=True)

    floor = relationship("Floor", back_populates="tables")


# ─── Bookings ────────────────────────────────────────────────────────────────

class BookingStatus(str, enum.Enum):
    Pending = "Pending"
    Confirmed = "Confirmed"
    Seated = "Seated"
    Cancelled = "Cancelled"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String, primary_key=True, default=gen_id)
    customerName = Column(String, nullable=False)
    customerPhone = Column(String, nullable=False)
    date = Column(String, nullable=False)   # YYYY-MM-DD
    time = Column(String, nullable=False)   # HH:MM
    partySize = Column(Integer, nullable=False)
    tableId = Column(String, ForeignKey("tables.id"), nullable=True)
    status = Column(SAEnum(BookingStatus), default=BookingStatus.Pending)
    charges = Column(Float, default=0.0)


# ─── Payment Methods ─────────────────────────────────────────────────────────

class PaymentType(str, enum.Enum):
    Cash = "Cash"
    CardDigital = "Card/Digital"
    UPI = "UPI"


class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    type = Column(SAEnum(PaymentType), nullable=False)
    isActive = Column(Boolean, default=True)
    upiId = Column(String, nullable=True)


# ─── Promotions & Coupons ────────────────────────────────────────────────────

class DiscountType(str, enum.Enum):
    percentage = "percentage"
    fixed = "fixed"


class ConditionType(str, enum.Enum):
    min_qty = "min_qty"
    min_amount = "min_amount"
    none = "none"


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(String, primary_key=True, default=gen_id)
    code = Column(String, unique=True, nullable=False, index=True)
    discountType = Column(SAEnum(DiscountType), nullable=False)
    discountValue = Column(Float, nullable=False)
    isActive = Column(Boolean, default=True)
    conditionType = Column(SAEnum(ConditionType), default=ConditionType.none)
    conditionValue = Column(Float, nullable=True)
    expiresAt = Column(String, nullable=True)   # ISO date string


class AppliesToType(str, enum.Enum):
    product = "product"
    order = "order"


class Promotion(Base):
    __tablename__ = "promotions"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    appliesTo = Column(SAEnum(AppliesToType), nullable=False)
    conditionType = Column(SAEnum(ConditionType), default=ConditionType.none)
    conditionValue = Column(Float, default=0.0)
    discountType = Column(SAEnum(DiscountType), nullable=False)
    discountValue = Column(Float, nullable=False)
    isActive = Column(Boolean, default=True)
    activeDays = Column(JSON, nullable=True)    # list of ints [0-6]


# ─── Orders ──────────────────────────────────────────────────────────────────

class OrderStatus(str, enum.Enum):
    open = "open"
    paid = "paid"
    cancelled = "cancelled"


class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=gen_id)
    tableId = Column(String, ForeignKey("tables.id"), nullable=True)
    status = Column(SAEnum(OrderStatus), default=OrderStatus.open)
    items = Column(JSON, default=list)  # [{productId, name, price, quantity}]
    subtotal = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    timestamp = Column(String, default=lambda: datetime.utcnow().isoformat())


# ─── KDS (Kitchen Display System) ────────────────────────────────────────────

class KDSStage(str, enum.Enum):
    to_cook = "To Cook"
    preparing = "Preparing"
    completed = "Completed"


class KDSOrder(Base):
    __tablename__ = "kds_orders"

    id = Column(String, primary_key=True, default=gen_id)
    ticketNumber = Column(String, nullable=False)
    customerName = Column(String, nullable=True)
    stage = Column(SAEnum(KDSStage), default=KDSStage.to_cook)
    timestamp = Column(String, nullable=False)
    tableId = Column(String, ForeignKey("tables.id"), nullable=True)

    items = relationship("KDSOrderItem", back_populates="kds_order", cascade="all, delete-orphan")


class KDSOrderItem(Base):
    __tablename__ = "kds_order_items"

    id = Column(String, primary_key=True, default=gen_id)
    kdsOrderId = Column(String, ForeignKey("kds_orders.id"), nullable=False)
    name = Column(String, nullable=False)
    quantity = Column(Integer, default=1)
    prepared = Column(Boolean, default=False)
    categoryId = Column(String, nullable=True)

    kds_order = relationship("KDSOrder", back_populates="items")

