from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict
import json
from backend.database import get_db
from backend.models import User
from backend.routers.auth import get_current_user

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