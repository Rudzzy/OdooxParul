"""
Seed Script
───────────
Run once to populate the SQLite DB with a default admin user + sample data.

    python seed.py

Default admin credentials:
    email:    admin
    password: admin

Default waiter credentials:
    pin: 0001
"""
import sys, os, random
sys.path.insert(0, os.path.dirname(__file__))

# Remove old DB to ensure clean schema
db_path = os.path.join(os.path.dirname(__file__), "cafe.db")
if os.path.exists(db_path):
    os.remove(db_path)
    print("[OK] Removed old cafe.db")

from app.database import SessionLocal, engine, Base
from app.models.models import (
    User, UserRole, Category, Product, ProductStatus,
    Floor, TableItem, PaymentMethod, PaymentType,
    Order, OrderStatus, Customer, Coupon, Promotion,
    DiscountType, ConditionType, AppliesToType
)
from app.auth import hash_password
import uuid
from datetime import datetime, timedelta

Base.metadata.create_all(bind=engine)

db = SessionLocal()


def gen_id():
    return str(uuid.uuid4())


def seed():
    # ── Admin user ─────────────────────────────────────────────────────────
    if not db.query(User).filter(User.email == "admin").first():
        db.add(User(
            id=gen_id(),
            name="Admin",
            email="admin",
            hashed_password=hash_password("admin"),
            role=UserRole.admin,
        ))
        print("[OK] Admin user created -> admin / admin")
    else:
        print("[INFO] Admin user already exists, skipping.")

    # ── Waiter user ────────────────────────────────────────────────────────
    if not db.query(User).filter(User.pin == "0001").first():
        db.add(User(
            id=gen_id(),
            name="Waiter",
            email="waiter@cafe.com",
            hashed_password=hash_password("waiter123"),
            role=UserRole.staff,
            pin="0001",
        ))
        print("[OK] Waiter user created -> PIN: 0001")
    else:
        print("[INFO] Waiter user already exists, skipping.")

    # ── Customers ──────────────────────────────────────────────────────────
    dummy_customers = [
        {"name": "Rahul Sharma", "email": "rahul.sharma@example.com", "phone": "9876543210"},
        {"name": "Priya Singh", "email": "priya.singh@example.com", "phone": "8765432109"},
        {"name": "Amit Patel", "email": "amit.patel@example.com", "phone": "7654321098"},
        {"name": "Neha Gupta", "email": "neha.gupta@example.com", "phone": "6543210987"},
        {"name": "Karan Malhotra", "email": "karan.m@example.com", "phone": "5432109876"},
    ]
    for cust in dummy_customers:
        existing = db.query(Customer).filter(Customer.phone == cust["phone"]).first()
        if not existing:
            db.add(Customer(id=gen_id(), **cust))
    db.commit()
    print("[OK] Dummy customers created")

    # ── Categories ─────────────────────────────────────────────────────────
    categories = [
        {"name": "Beverages", "color": "bg-blue-500"},
        {"name": "Snacks",    "color": "bg-yellow-500"},
        {"name": "Mains",     "color": "bg-red-500"},
        {"name": "Desserts",  "color": "bg-pink-500"},
        {"name": "Pizza",     "color": "bg-orange-500"},
        {"name": "Burger",    "color": "bg-amber-500"},
        {"name": "Starters",  "color": "bg-green-500"},
        {"name": "Pasta",     "color": "bg-purple-500"},
        {"name": "Drinks",    "color": "bg-cyan-500"},
    ]
    cat_ids = {}
    for c in categories:
        existing = db.query(Category).filter(Category.name == c["name"]).first()
        if not existing:
            obj = Category(id=gen_id(), **c)
            db.add(obj)
            db.flush()
            cat_ids[c["name"]] = obj.id
            print(f"[OK] Category: {c['name']}")
        else:
            cat_ids[c["name"]] = existing.id

    # ── Products ───────────────────────────────────────────────────────────
    products = [
        {"name": "Espresso",       "categoryId": cat_ids["Beverages"], "price": 120, "isVeg": True},
        {"name": "Cappuccino",     "categoryId": cat_ids["Beverages"], "price": 150, "isVeg": True},
        {"name": "Masala Chai",    "categoryId": cat_ids["Beverages"], "price": 60,  "isVeg": True},
        {"name": "Veg Sandwich",   "categoryId": cat_ids["Snacks"],    "price": 180, "isVeg": True},
        {"name": "Chicken Wrap",   "categoryId": cat_ids["Snacks"],    "price": 220, "isVeg": False},
        {"name": "Dal Tadka",      "categoryId": cat_ids["Mains"],     "price": 280, "isVeg": True},
        {"name": "Butter Chicken", "categoryId": cat_ids["Mains"],     "price": 350, "isVeg": False},
        {"name": "Gulab Jamun",    "categoryId": cat_ids["Desserts"],  "price": 90,  "isVeg": True},
        {"name": "Cheese Pizza",   "categoryId": cat_ids["Pizza"],     "price": 450, "isVeg": True},
        {"name": "Cheese Burger",  "categoryId": cat_ids["Burger"],    "price": 270, "isVeg": False},
        {"name": "Paneer Tikka",   "categoryId": cat_ids["Starters"],  "price": 300, "isVeg": True},
        {"name": "Arrabiata Pasta","categoryId": cat_ids["Pasta"],     "price": 380, "isVeg": True},
        {"name": "Mojito",         "categoryId": cat_ids["Drinks"],    "price": 200, "isVeg": True},
        {"name": "Chocolate Brownie","categoryId": cat_ids["Desserts"],"price": 250, "isVeg": True},
    ]
    product_objs = []
    for p in products:
        existing = db.query(Product).filter(Product.name == p["name"]).first()
        if not existing:
            obj = Product(id=gen_id(), description="", status=ProductStatus.available, **p)
            db.add(obj)
            db.flush()
            product_objs.append(obj)
            print(f"[OK] Product: {p['name']}")
        else:
            product_objs.append(existing)

    # ── Floors & Tables ────────────────────────────────────────────────────
    table_ids = []
    floors = [
        {"name": "Ground Floor", "tables": ["T1", "T2", "T3", "T4"]},
        {"name": "First Floor",  "tables": ["T5", "T6", "T7"]},
    ]
    for f in floors:
        existing_floor = db.query(Floor).filter(Floor.name == f["name"]).first()
        if not existing_floor:
            floor_obj = Floor(id=gen_id(), name=f["name"])
            db.add(floor_obj)
            db.flush()
            for t in f["tables"]:
                tbl = TableItem(
                    id=gen_id(), floorId=floor_obj.id,
                    tableNumber=t, capacity=4, isActive=True
                )
                db.add(tbl)
                db.flush()
                table_ids.append(tbl.id)
            print(f"[OK] Floor: {f['name']} with {len(f['tables'])} tables")
        else:
            existing_tables = db.query(TableItem).filter(TableItem.floorId == existing_floor.id).all()
            table_ids.extend([t.id for t in existing_tables])

    # ── Payment Methods ────────────────────────────────────────────────────
    payments = [
        {"name": "Cash",   "type": PaymentType.Cash},
        {"name": "Card",   "type": PaymentType.CardDigital},
        {"name": "UPI",    "type": PaymentType.UPI, "upiId": "cafe@upi"},
    ]
    for p in payments:
        if not db.query(PaymentMethod).filter(PaymentMethod.name == p["name"]).first():
            db.add(PaymentMethod(id=gen_id(), isActive=True, upiId=p.pop("upiId", None), **p))
            print(f"[OK] Payment method: {p['name']}")

    # ── Promotions ─────────────────────────────────────────────────────────
    promotions = [
        {"name": "Happy Hour", "appliesTo": AppliesToType.order, "discountType": DiscountType.percentage, "discountValue": 15, "activeDays": [1, 2, 3, 4, 5]},
        {"name": "Weekend Special", "appliesTo": AppliesToType.order, "discountType": DiscountType.percentage, "discountValue": 10, "activeDays": [0, 6]},
        {"name": "Pizza Combo", "appliesTo": AppliesToType.product, "discountType": DiscountType.fixed, "discountValue": 50, "conditionType": ConditionType.min_qty, "conditionValue": 2},
        {"name": "Drinks Festival", "appliesTo": AppliesToType.product, "discountType": DiscountType.percentage, "discountValue": 20, "conditionType": ConditionType.none},
        {"name": "Lunch Offer", "appliesTo": AppliesToType.order, "discountType": DiscountType.fixed, "discountValue": 100, "conditionType": ConditionType.min_amount, "conditionValue": 800},
        {"name": "Dinner Special", "appliesTo": AppliesToType.order, "discountType": DiscountType.percentage, "discountValue": 5, "conditionType": ConditionType.min_amount, "conditionValue": 1500},
        {"name": "Student Discount", "appliesTo": AppliesToType.order, "discountType": DiscountType.percentage, "discountValue": 10, "conditionType": ConditionType.none},
        {"name": "Snack Time", "appliesTo": AppliesToType.product, "discountType": DiscountType.percentage, "discountValue": 25, "activeDays": [1, 2, 3, 4, 5]},
        {"name": "Family Pack", "appliesTo": AppliesToType.order, "discountType": DiscountType.fixed, "discountValue": 250, "conditionType": ConditionType.min_amount, "conditionValue": 2500},
        {"name": "Mega Deal", "appliesTo": AppliesToType.order, "discountType": DiscountType.percentage, "discountValue": 30, "conditionType": ConditionType.min_amount, "conditionValue": 5000},
    ]
    for p in promotions:
        if not db.query(Promotion).filter(Promotion.name == p["name"]).first():
            db.add(Promotion(id=gen_id(), isActive=True, **p))
            print(f"[OK] Promotion: {p['name']}")

    # ── Coupons ────────────────────────────────────────────────────────────
    coupons = [
        {"code": "WELCOME10", "discountType": DiscountType.percentage, "discountValue": 10},
        {"code": "FLAT50", "discountType": DiscountType.fixed, "discountValue": 50},
        {"code": "SAVE20", "discountType": DiscountType.percentage, "discountValue": 20, "conditionType": ConditionType.min_amount, "conditionValue": 500},
        {"code": "PARTY100", "discountType": DiscountType.fixed, "discountValue": 100, "conditionType": ConditionType.min_amount, "conditionValue": 1000},
        {"code": "BINGO", "discountType": DiscountType.percentage, "discountValue": 15, "conditionType": ConditionType.none},
        {"code": "LUCKY7", "discountType": DiscountType.percentage, "discountValue": 7},
        {"code": "SUPER150", "discountType": DiscountType.fixed, "discountValue": 150, "conditionType": ConditionType.min_amount, "conditionValue": 1200},
        {"code": "FREEDRINK", "discountType": DiscountType.fixed, "discountValue": 200, "conditionType": ConditionType.min_amount, "conditionValue": 1500},
        {"code": "WINTER20", "discountType": DiscountType.percentage, "discountValue": 20},
        {"code": "NEWYEAR", "discountType": DiscountType.fixed, "discountValue": 500, "conditionType": ConditionType.min_amount, "conditionValue": 3000},
    ]
    for c in coupons:
        if not db.query(Coupon).filter(Coupon.code == c["code"]).first():
            db.add(Coupon(id=gen_id(), isActive=True, **c))
            print(f"[OK] Coupon: {c['code']}")

    # ── Mock Orders for Reports ────────────────────────────────────────────
    SESSIONS = ["Breakfast", "Lunch", "Dinner", "Night Shift"]
    EMPLOYEES = ["Waiter 1", "Waiter 2", "Waiter 3", "Manager"]
    POS_TERMINALS = ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4", "Terminal 5"]
    CUSTOMER_NAMES = [
        "Rahul Sharma", "Priya Patel", "Amit Singh", "Sneha Gupta",
        "Vikram Joshi", "Ananya Reddy", "Karan Mehta", "Deepa Nair",
        "Rohit Kumar", "Meera Iyer", "Arjun Das", "Pooja Verma",
    ]

    now = datetime.now()
    order_count = 0

    for i in range(200):
        random_days_ago = random.randint(0, 60)
        random_hour = random.randint(7, 23)
        random_minute = random.randint(0, 59)
        order_dt = now - timedelta(days=random_days_ago)
        order_dt = order_dt.replace(hour=random_hour, minute=random_minute, second=0, microsecond=0)

        session = random.choice(SESSIONS)
        employee = random.choice(EMPLOYEES)
        pos_terminal = random.choice(POS_TERMINALS)
        customer_name = random.choice(CUSTOMER_NAMES) if random.random() > 0.3 else "Walk-in"
        table_id = random.choice(table_ids) if table_ids else None

        # Generate 1-5 random items
        num_items = random.randint(1, 5)
        items = []
        subtotal = 0.0

        for j in range(num_items):
            prod = random.choice(product_objs)
            qty = random.randint(1, 3)
            item_total = prod.price * qty
            subtotal += item_total
            items.append({
                "productId": prod.id,
                "name": prod.name,
                "price": prod.price,
                "quantity": qty,
                "category": prod.category.name if prod.category else "Unknown",
            })

        tax = round(subtotal * 0.05, 2)
        total = round(subtotal + tax, 2)

        order = Order(
            id=gen_id(),
            tableId=table_id,
            customerName=customer_name,
            customerPhone=f"+91{random.randint(7000000000, 9999999999)}",
            status=OrderStatus.paid,
            items=items,
            subtotal=round(subtotal, 2),
            tax=tax,
            total=total,
            timestamp=order_dt.isoformat(),
            session=session,
            pos=pos_terminal,
            employee=employee,
        )
        db.add(order)
        order_count += 1

    print(f"[OK] Created {order_count} mock orders for reports")

    db.commit()
    print("\nSeed complete!")


if __name__ == "__main__":
    seed()
    db.close()


