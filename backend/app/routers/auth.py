from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User
from app.schemas import LoginRequest, PinLoginRequest, TokenResponse, UserOut
from app.auth import verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    token = create_access_token({"sub": user.id})
    return {"token": token, "user": UserOut.from_orm(user)}


@router.post("/pin-login", response_model=TokenResponse)
def pin_login(payload: PinLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.pin == payload.pin).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid PIN"
        )
    token = create_access_token({"sub": user.id})
    return {"token": token, "user": UserOut.from_orm(user)}

