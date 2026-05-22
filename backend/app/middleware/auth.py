from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware

from app.database import get_db
from app.models.user import User
from app.services import auth as auth_service
from app.services.exceptions import UnauthorizedError
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
    try:
        return auth_service.get_user_from_access_token(db, token)
    except UnauthorizedError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=exc.detail,
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_optional_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    if getattr(request.state, "user_id", None) is None:
        return None
    return db.get(User, request.state.user_id)
