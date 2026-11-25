from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Dict, Optional
import json
from backend.database import get_db
from backend.models import User
from backend.routers.auth import get_current_user, verify_password, get_password_hash, create_access_token, UserResponse

router = APIRouter(prefix="/api/user", tags=["user"])

class StatsRequest(BaseModel):
    recent_tracks: List[dict]
    play_counts: Dict[str, int]

@router.get("/stats")
def get_stats(current_user: User = Depends(get_current_user)):
    try:
        recent = json.loads(current_user.recent_tracks_json or "[]")
    except Exception:
        recent = []
    try:
        counts = json.loads(current_user.play_counts_json or "{}")
    except Exception:
        counts = {}
    return {
        "recent_tracks": recent,
        "play_counts": counts,
    }

@router.post("/stats")
def update_stats(req: StatsRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.recent_tracks_json = json.dumps(req.recent_tracks)
    current_user.play_counts_json = json.dumps(req.play_counts)
    db.commit()
    return {"status": "ok"}

class AvatarRequest(BaseModel):
    avatar_url: str

@router.post("/avatar")
def update_avatar(req: AvatarRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.avatar_url = req.avatar_url
    db.commit()
    return {"status": "ok", "avatar_url": current_user.avatar_url}

class UpdateProfileRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None

@router.put("/profile")
def update_profile(req: UpdateProfileRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.username is not None:
        new_username = req.username.strip()
        if not new_username:
            raise HTTPException(status_code=400, detail="Username cannot be empty.")
        existing_u = db.query(User).filter(func.lower(User.username) == new_username.lower(), User.id != current_user.id).first()
        if existing_u:
            raise HTTPException(status_code=400, detail="An account already exists with this username.")
        current_user.username = new_username

    if req.email is not None:
        new_email = req.email.strip().lower()
        if not new_email or "@" not in new_email:
            raise HTTPException(status_code=400, detail="Please enter a valid email address.")
        existing_e = db.query(User).filter(User.email == new_email, User.id != current_user.id).first()
        if existing_e:
            raise HTTPException(status_code=400, detail="An account already exists with this email.")
        current_user.email = new_email

    db.commit()
    db.refresh(current_user)
    token = create_access_token({"sub": str(current_user.id), "uid": current_user.uid, "username": current_user.username})
    return {"status": "ok", "access_token": token, "user": UserResponse.model_validate(current_user)}

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
def change_password(req: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.hashed_password and not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect.")
    if not req.new_password or len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")
    current_user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return {"status": "ok"}