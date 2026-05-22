from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import RefreshTokenRequest, TokenResponse, UserLogin
from app.schemas.user import UserCreate, UserResponse
from app.utils.jwt import create_access_token, create_refresh_token, validate_token_type
from app.utils.security import get_password_hash, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _build_token_response(user: User) -> TokenResponse:
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> TokenResponse:
    existing_user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        name=payload.name,
        phone=payload.phone,
        date_of_birth=payload.date_of_birth,
        subscription_tier=payload.subscription_tier,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _build_token_response(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return _build_token_response(user)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        token_payload = validate_token_type(payload.refresh_token, "refresh")
        user_id = int(token_payload["sub"])
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return _build_token_response(user)
