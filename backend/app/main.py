from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

import app.models  # noqa: F401
from app.config import get_settings
from app.database import Base, engine
from app.middleware.auth import AuthContextMiddleware
from app.middleware.cors import add_cors_middleware
from app.routers import auth, consultations, doctors, patients, prescriptions, subscriptions, triage

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="0.1.0",
)

app.add_middleware(AuthContextMiddleware)
add_cors_middleware(app)


@app.on_event("startup")
def on_startup() -> None:
    if settings.create_tables_on_startup:
        Base.metadata.create_all(bind=engine)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    if settings.debug:
        return JSONResponse(status_code=500, content={"detail": str(exc)})
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health", tags=["health"])
def health_check() -> dict:
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.environment,
    }


app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(patients.router, prefix=settings.api_v1_prefix)
app.include_router(doctors.router, prefix=settings.api_v1_prefix)
app.include_router(triage.router, prefix=settings.api_v1_prefix)
app.include_router(consultations.router, prefix=settings.api_v1_prefix)
app.include_router(prescriptions.router, prefix=settings.api_v1_prefix)
app.include_router(subscriptions.router, prefix=settings.api_v1_prefix)
