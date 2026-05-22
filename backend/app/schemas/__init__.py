from app.schemas.auth import RefreshTokenRequest, TokenResponse, UserLogin
from app.schemas.consultation import ConsultationCreate, ConsultationResponse, ConsultationUpdate
from app.schemas.doctor import DoctorAvailabilityResponse, DoctorCreate, DoctorResponse, DoctorUpdate
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse, PrescriptionUpdate
from app.schemas.subscription import SubscriptionCreate, SubscriptionResponse, SubscriptionUpdate
from app.schemas.triage import TriageResultCreate, TriageResultResponse, TriageResultUpdate
from app.schemas.user import UserCreate, UserResponse, UserUpdate

__all__ = [
    "ConsultationCreate",
    "ConsultationResponse",
    "ConsultationUpdate",
    "DoctorAvailabilityResponse",
    "DoctorCreate",
    "DoctorResponse",
    "DoctorUpdate",
    "PrescriptionCreate",
    "PrescriptionResponse",
    "PrescriptionUpdate",
    "RefreshTokenRequest",
    "SubscriptionCreate",
    "SubscriptionResponse",
    "SubscriptionUpdate",
    "TokenResponse",
    "TriageResultCreate",
    "TriageResultResponse",
    "TriageResultUpdate",
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "UserUpdate",
]
