from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from jose import JWTError, jwt
import bcrypt, secrets
import httpx
from backend.database import get_db
from backend.models import User
from backend.config import settings
from backend.email_service import send_reset_code_email

router = APIRouter(prefix="/api/auth", tags=["auth"])
_reset_codes: dict = {}

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    user_uid: Optional[str] = None

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
    uid: Optional[str] = None
    username: str
    email: str
    auth_provider: Optional[str] = "local"
    avatar_url: Optional[str] = None
    class Config: from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class OAuthLoginRequest(BaseModel):
    id_token: str

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

def generate_unique_user_uid(db: Session) -> str:
    while True:
        uid = f"USR-{secrets.token_hex(4).upper()}"
        if not db.query(User).filter(User.uid == uid).first():
            return uid

@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    clean_username = req.username.strip()
    clean_email = req.email.strip().lower()
    if req.user_uid and req.user_uid.strip():
        clean_uid = req.user_uid.strip().upper()
        if db.query(User).filter(User.uid == clean_uid).first():
            raise HTTPException(status_code=400, detail="An account already exists with the same UserID.")
    else:
        clean_uid = generate_unique_user_uid(db)

    if db.query(User).filter(func.lower(User.username) == clean_username.lower()).first():
        raise HTTPException(status_code=400, detail="An account already exists with this username.")
    if db.query(User).filter(User.email == clean_email).first():
        raise HTTPException(status_code=400, detail="An account already exists with this email.")

    new_user = User(uid=clean_uid, username=clean_username, email=clean_email, hashed_password=get_password_hash(req.password))
    db.add(new_user); db.commit(); db.refresh(new_user)
    token = create_access_token({"sub": str(new_user.id), "uid": new_user.uid, "username": new_user.username})
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
async def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user: raise HTTPException(status_code=404, detail="No account found with this email.")
    code = f"{secrets.randbelow(10**6):06d}"
    _reset_codes[email] = {"code": code, "expires_at": datetime.utcnow() + timedelta(minutes=15)}
    email_sent = await send_reset_code_email(email, code)
    payload = {"status": "sent", "email_sent": email_sent}
    if settings.ALLOW_RESET_CODE_IN_RESPONSE: payload["dev_code"] = code
    if not email_sent and not settings.ALLOW_RESET_CODE_IN_RESPONSE:
        raise HTTPException(status_code=503, detail="Email service is not configured on the server.")
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

async def verify_google_id_token(token: str) -> dict:
    """Verifies Google ID token against Google's tokeninfo API and audience."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token}")
            if resp.status_code == 200:
                data = resp.json()
                if settings.GOOGLE_CLIENT_ID and data.get("aud") != settings.GOOGLE_CLIENT_ID:
                    raise HTTPException(status_code=401, detail="Google token audience does not match configured GOOGLE_CLIENT_ID")
                return data
            err_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
            raise HTTPException(status_code=401, detail=err_data.get("error_description", "Invalid Google ID token"))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Google token verification failed: {str(e)}")

async def verify_apple_id_token(token: str) -> dict:
    """Verifies Apple ID token against Apple's public JWKS."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get("https://appleid.apple.com/auth/keys")
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail="Failed to fetch Apple public keys")
            apple_keys = resp.json().get("keys", [])

        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        key_data = next((k for k in apple_keys if k.get("kid") == kid), None)
        if not key_data:
            raise HTTPException(status_code=401, detail="Matching Apple public key not found")

        claims = jwt.decode(
            token,
            key_data,
            algorithms=["RS256"],
            audience=settings.APPLE_CLIENT_ID if settings.APPLE_CLIENT_ID else None,
            issuer="https://appleid.apple.com"
        )
        return claims
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Apple token verification failed: {str(e)}")

@router.post("/google", response_model=TokenResponse)
async def login_with_google(req: OAuthLoginRequest, db: Session = Depends(get_db)):
    profile = await verify_google_id_token(req.id_token)
    email = profile.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Google account did not return an email address")
    sub = profile.get("sub", "")
    name = profile.get("name") or profile.get("given_name") or email.split("@")[0]

    user = db.query(User).filter((User.email == email) | ((User.provider_id == sub) & (User.auth_provider == "google"))).first()
    if not user:
        clean_name = "".join(c for c in name.replace(" ", "_").lower() if c.isalnum() or c in "_-")[:20] or "google_listener"
        username = clean_name
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{clean_name}_{counter}"
            counter += 1

        user = User(
            username=username,
            email=email,
            hashed_password=f"oauth:google:{sub}",
            auth_provider="google",
            provider_id=sub
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not user.provider_id:
        user.auth_provider = "google"
        user.provider_id = sub
        db.commit()

    token = create_access_token({"sub": str(user.id), "username": user.username})
    return TokenResponse(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))

@router.post("/apple", response_model=TokenResponse)
async def login_with_apple(req: OAuthLoginRequest, db: Session = Depends(get_db)):
    profile = await verify_apple_id_token(req.id_token)
    email = profile.get("email", "").strip().lower()
    sub = profile.get("sub", "")
    if not sub:
        raise HTTPException(status_code=400, detail="Apple token has no subject identifier")
    if not email:
        email = f"{sub[:12]}@privaterelay.appleid.com"

    user = db.query(User).filter(((User.provider_id == sub) & (User.auth_provider == "apple")) | (User.email == email)).first()
    if not user:
        base_username = "apple_" + sub[:8]
        username = base_username
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}_{counter}"
            counter += 1

        user = User(
            username=username,
            email=email,
            hashed_password=f"oauth:apple:{sub}",
            auth_provider="apple",
            provider_id=sub
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not user.provider_id:
        user.auth_provider = "apple"
        user.provider_id = sub
        db.commit()

    token = create_access_token({"sub": str(user.id), "username": user.username})
    return TokenResponse(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))