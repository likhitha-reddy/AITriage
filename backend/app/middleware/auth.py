from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware

from app.database import get_db
from app.models.user import User
from app.utils.jwt import validate_token_type

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


class AuthContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request.state.user_id = None
        request.state.user_email = None

        authorization = request.headers.get("Authorization")
        if authorization and authorization.lower().startswith("bearer "):
            token = authorization.split(" ", 1)[1]
            try:
                payload = validate_token_type(token, "access")
                request.state.user_id = int(payload["sub"])
                request.state.user_email = payload.get("email")
            except (ValueError, TypeError):
                request.state.user_id = None
                request.state.user_email = None

        return await call_next(request)


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = validate_token_type(token, "access")
        user_id = int(payload["sub"])
    except (ValueError, TypeError):
        raise credentials_exception

    user = db.get(User, user_id)
    if user is None:
        raise credentials_exception
    return user


def get_optional_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    if getattr(request.state, "user_id", None) is None:
        return None
    return db.get(User, request.state.user_id)
