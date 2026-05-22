from fastapi import HTTPException, status

from app.services.exceptions import ServiceError


def raise_for_service_error(exc: ServiceError) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.detail)


def internal_server_error(message: str = "Internal server error") -> HTTPException:
    return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=message)
