from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.routers._helpers import internal_server_error, raise_for_service_error
from app.schemas.auth import RefreshTokenRequest, TokenResponse, UserLogin
from app.schemas.user import UserCreate, UserResponse
from app.services import auth as auth_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        return auth_service.register_user(db, payload)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to register user") from exc


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        return auth_service.login_user(db, payload)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to log in") from exc


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        return auth_service.refresh_user_session(db, payload.refresh_token)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to refresh token") from exc


@router.get("/me", response_model=UserResponse)
def get_authenticated_user(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)
