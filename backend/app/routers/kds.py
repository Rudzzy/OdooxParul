"""
KDS (Kitchen Display System) router.
Custom endpoints beyond standard CRUD for managing kitchen tickets.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.models import KDSOrder, KDSOrderItem, KDSStage
from app.schemas import KDSOrderCreate, KDSOrderOut
import uuid


def gen_id() -> str:
    return str(uuid.uuid4())


router = APIRouter(prefix="/api/kds", tags=["KDS"])


# ─── GET /api/kds — List all KDS orders (optionally filter by stage) ─────────

@router.get("", response_model=list[KDSOrderOut])
def list_kds_orders(
    stage: Optional[str] = Query(None, description="Filter by stage: 'To Cook', 'Preparing', 'Completed'"),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    query = db.query(KDSOrder)
    if stage:
        query = query.filter(KDSOrder.stage == stage)
    orders = query.order_by(KDSOrder.timestamp.asc()).all()
    return orders


# ─── POST /api/kds — Create a new kitchen ticket ─────────────────────────────

@router.post("", response_model=KDSOrderOut, status_code=status.HTTP_201_CREATED)
def create_kds_order(
    payload: KDSOrderCreate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cannot create empty order")

    # Check for an active ticket for this table
    kds_order = None
    if payload.tableId:
        kds_order = db.query(KDSOrder).filter(
            KDSOrder.tableId == payload.tableId,
            KDSOrder.stage != KDSStage.completed
        ).first()

    if kds_order:
        # Append to existing active order and reset stage so kitchen notices it
        if kds_order.stage != KDSStage.to_cook:
            kds_order.stage = KDSStage.to_cook

        for item_data in payload.items:
            item = KDSOrderItem(
                id=gen_id(),
                kdsOrderId=kds_order.id,
                name=item_data.name,
                quantity=item_data.quantity,
                prepared=False,
                categoryId=item_data.categoryId,
            )
            kds_order.items.append(item)
    else:
        # Auto-generate ticket number from current count
        count = db.query(KDSOrder).count()
        ticket_number = str(100 + count + 1)

        kds_order = KDSOrder(
            id=gen_id(),
            ticketNumber=ticket_number,
            customerName=payload.customerName,
            stage=KDSStage.to_cook,
            timestamp=datetime.utcnow().isoformat(),
            tableId=payload.tableId,
        )

        for item_data in payload.items:
            item = KDSOrderItem(
                id=gen_id(),
                kdsOrderId=kds_order.id,
                name=item_data.name,
                quantity=item_data.quantity,
                prepared=False,
                categoryId=item_data.categoryId,
            )
            kds_order.items.append(item)

        db.add(kds_order)

    db.commit()
    db.refresh(kds_order)
    return kds_order


# ─── PATCH /api/kds/{id}/stage — Advance an order's stage ────────────────────

@router.patch("/{order_id}/stage", response_model=KDSOrderOut)
def advance_kds_stage(
    order_id: str,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    order = db.query(KDSOrder).filter(KDSOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="KDS order not found")

    if order.stage == KDSStage.to_cook:
        order.stage = KDSStage.preparing
    elif order.stage == KDSStage.preparing:
        order.stage = KDSStage.completed
    else:
        raise HTTPException(status_code=400, detail="Order is already completed")

    db.commit()
    db.refresh(order)
    return order


# ─── PATCH /api/kds/{id}/items/{itemId}/toggle — Toggle item prepared ────────

@router.patch("/{order_id}/items/{item_id}/toggle", response_model=KDSOrderOut)
def toggle_kds_item_prepared(
    order_id: str,
    item_id: str,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    order = db.query(KDSOrder).filter(KDSOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="KDS order not found")

    item = db.query(KDSOrderItem).filter(
        KDSOrderItem.id == item_id,
        KDSOrderItem.kdsOrderId == order_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="KDS item not found")

    item.prepared = not item.prepared
    db.commit()
    db.refresh(order)
    return order


# ─── DELETE /api/kds/{id} — Delete a ticket ──────────────────────────────────

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_kds_order(
    order_id: str,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    order = db.query(KDSOrder).filter(KDSOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="KDS order not found")
    db.delete(order)
    db.commit()
