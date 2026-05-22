from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine
from app.middleware.auth import AuthContextMiddleware
from app.routers import auth, consultations, doctors, patients, prescriptions, subscriptions, triage

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.create_tables_on_startup:
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
    version="0.1.0",
)

app.add_middleware(AuthContextMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
