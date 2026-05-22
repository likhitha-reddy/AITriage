from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.routers._helpers import internal_server_error
from app.schemas.user import UserResponse, UserUpdate
from app.utils.security import get_password_hash

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
def update_my_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    try:
        updates = payload.model_dump(exclude_unset=True)
        password = updates.pop("password", None)
        for field, value in updates.items():
            setattr(current_user, field, value)
        if password:
            current_user.hashed_password = get_password_hash(password)
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
        return UserResponse.model_validate(current_user)
    except Exception as exc:
        raise internal_server_error("Unable to update patient profile") from exc


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    try:
        if current_user.consultations:
            for consultation in current_user.consultations:
                consultation.prescription_id = None
        db.delete(current_user)
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception as exc:
        raise internal_server_error("Unable to delete patient profile") from exc
