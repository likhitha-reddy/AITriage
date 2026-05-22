from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.utils.security import get_password_hash

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)) -> UserResponse:
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_my_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    updates = payload.dict(exclude_unset=True)
    password = updates.pop("password", None)
    for field, value in updates.items():
        setattr(current_user, field, value)
    if password:
        current_user.hashed_password = get_password_hash(password)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    if current_user.consultations:
        for consultation in current_user.consultations:
            consultation.prescription_id = None
    db.delete(current_user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
