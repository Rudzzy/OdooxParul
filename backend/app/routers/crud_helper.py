"""
Tiny helper that builds standard CRUD routes for a SQLAlchemy model.
Each router still defines its own APIRouter so it can be mounted
independently; this just wires up the four handlers.
"""
from typing import Type, Callable
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.auth import get_current_user
import uuid


def gen_id() -> str:
    return str(uuid.uuid4())


def build_crud_router(
    router,
    model,
    create_schema: Type[BaseModel],
    out_schema: Type[BaseModel],
    prefix: str,          # human label for 404 messages e.g. "Category"
):
    """Attach GET-all, GET-one, POST, PUT, DELETE to an existing APIRouter."""

    @router.get("", response_model=list[out_schema])
    def list_items(
        db: Session = Depends(get_db),
        _: object = Depends(get_current_user),
    ):
        return db.query(model).all()

    @router.get("/{item_id}", response_model=out_schema)
    def get_item(
        item_id: str,
        db: Session = Depends(get_db),
        _: object = Depends(get_current_user),
    ):
        obj = db.query(model).filter(model.id == item_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail=f"{prefix} not found")
        return obj

    @router.post("", response_model=out_schema, status_code=status.HTTP_201_CREATED)
    def create_item(
        payload: create_schema,
        db: Session = Depends(get_db),
        _: object = Depends(get_current_user),
    ):
        obj = model(id=gen_id(), **payload.dict())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    @router.put("/{item_id}", response_model=out_schema)
    def update_item(
        item_id: str,
        payload: create_schema,
        db: Session = Depends(get_db),
        _: object = Depends(get_current_user),
    ):
        obj = db.query(model).filter(model.id == item_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail=f"{prefix} not found")
        for key, value in payload.dict(exclude_unset=True).items():
            setattr(obj, key, value)
        db.commit()
        db.refresh(obj)
        return obj

    @router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_item(
        item_id: str,
        db: Session = Depends(get_db),
        _: object = Depends(get_current_user),
    ):
        obj = db.query(model).filter(model.id == item_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail=f"{prefix} not found")
        db.delete(obj)
        db.commit()

    return router
