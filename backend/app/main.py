from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.models import models  # noqa: F401 — ensures all models are registered
from app.routers.auth import router as auth_router
from app.routers.resources import (
    categories_router, products_router,
    floors_router, tables_router,
    bookings_router, payments_router,
    coupons_router, promotions_router,
    orders_router, customers_router, users_router,
)
from app.routers.kds import router as kds_router

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Odoo Cafe POS — API",
    description="Backend for the Odoo Cafe POS system. FastAPI is the primary API; Flask wraps it as a fallback.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Register routers ────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(products_router)
app.include_router(floors_router)
app.include_router(tables_router)
app.include_router(bookings_router)
app.include_router(payments_router)
app.include_router(coupons_router)
app.include_router(promotions_router)
app.include_router(orders_router)
app.include_router(customers_router)
app.include_router(users_router)
app.include_router(kds_router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "Odoo Cafe POS API (FastAPI)"}
