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
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

# Remove old DB to ensure clean schema
db_path = os.path.join(os.path.dirname(__file__), "cafe.db")
if os.path.exists(db_path):
    os.remove(db_path)
    print("[OK] Removed old cafe.db")

from app.database import SessionLocal, engine, Base
from app.models.models import (
    User, UserRole, Category, Product, ProductStatus,
    Floor, TableItem, PaymentMethod, PaymentType
)
from app.auth import hash_password
import uuid

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
    for p in products:
        if not db.query(Product).filter(Product.name == p["name"]).first():
            db.add(Product(id=gen_id(), description="", status=ProductStatus.available, **p))
            print(f"[OK] Product: {p['name']}")

    # ── Floors & Tables ────────────────────────────────────────────────────
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
                db.add(TableItem(
                    id=gen_id(), floorId=floor_obj.id,
                    tableNumber=t, capacity=4, isActive=True
                ))
            print(f"[OK] Floor: {f['name']} with {len(f['tables'])} tables")

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

    db.commit()
    print("\nSeed complete!")


if __name__ == "__main__":
    seed()
    db.close()

