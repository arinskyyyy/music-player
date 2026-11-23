from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from jose import JWTError, jwt
import bcrypt, secrets
from backend.database import get_db
from backend.models import User
from backend.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])
_reset_codes: dict = {}

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    identifier: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    class Config: from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try: return bcrypt.checkpw(plain_password.encode("utf-8")[:72], hashed_password.encode("utf-8"))
    except: return False

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter((User.username == req.username) | (User.email == req.email)).first():
        raise HTTPException(status_code=400, detail="Username or email is already registered")
    new_user = User(username=req.username.strip(), email=req.email.strip().lower(), hashed_password=get_password_hash(req.password))
    db.add(new_user); db.commit(); db.refresh(new_user)
    token = create_access_token({"sub": str(new_user.id), "username": new_user.username})
    return TokenResponse(access_token=token, token_type="bearer", user=UserResponse.model_validate(new_user))

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    ident = req.identifier.strip().lower()
    user = db.query(User).filter((func.lower(User.username) == ident) | (User.email == ident)).first()
    if not user: raise HTTPException(status_code=404, detail="No account found. Please create an account first.")
    if not verify_password(req.password, user.hashed_password): raise HTTPException(status_code=401, detail="Incorrect password.")
    token = create_access_token({"sub": str(user.id), "username": user.username})
    return TokenResponse(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user: raise HTTPException(status_code=404, detail="No account found with this email.")
    code = f"{secrets.randbelow(10**6):06d}"
    _reset_codes[email] = {"code": code, "expires_at": datetime.utcnow() + timedelta(minutes=15)}
    payload = {"status": "sent"}
    if settings.ALLOW_RESET_CODE_IN_RESPONSE: payload["dev_code"] = code
    return payload

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    entry = _reset_codes.get(email)
    if not entry or entry["code"] != req.code.strip(): raise HTTPException(status_code=400, detail="Invalid or expired reset code.")
    if datetime.utcnow() > entry["expires_at"]:
        _reset_codes.pop(email, None); raise HTTPException(status_code=400, detail="Reset code has expired.")
    user = db.query(User).filter(User.email == email).first()
    if not user: raise HTTPException(status_code=404, detail="Account not found.")
    user.hashed_password = get_password_hash(req.new_password); db.commit(); _reset_codes.pop(email, None)
    return {"status": "reset"}

bearer_scheme = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme), db: Session = Depends(get_db)) -> User:
    if credentials is None: raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None: raise HTTPException(status_code=401, detail="Invalid auth token")
    except JWTError: raise HTTPException(status_code=401, detail="Invalid auth token")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user: raise HTTPException(status_code=401, detail="User not found or deleted")
    return user

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)): return current_user