from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import FavoriteTrack, User

router = APIRouter(prefix="/api/music", tags=["music"])

class TrackSchema(BaseModel):
    id: str
    title: str
    artist: str
    duration: str
    src: str
    cover: Optional[str] = None
    sourceLabel: Optional[str] = None

# Curated Stream Catalog
PUBLIC_CATALOG: List[dict] = [
  {
    "id": "track-1",
    "title": "Lobby Pixel Loop",
    "artist": "Columbina",
    "duration": "03:45",
    "src": "/lobby-loop.mp3",
    "cover": "/pixel-0.gif",
    "sourceLabel": "ROOM LOOP",
  },
  {
    "id": "track-2",
    "title": "Midnight Stroll",
    "artist": "Snail's House",
    "duration": "02:50",
    "src": "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
    "cover": "/pixel-1.jpg",
    "sourceLabel": "STREAM",
  },
  {
    "id": "track-3",
    "title": "Neon City Rain",
    "artist": "Purrple Cat",
    "duration": "03:15",
    "src": "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=tea-time-19416.mp3",
    "cover": "/pixel-7.gif",
    "sourceLabel": "STREAM",
  },
  {
    "id": "track-4",
    "title": "Retro Arcade Glow",
    "artist": "Bit Byte",
    "duration": "02:30",
    "src": "https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=lofi-chill-medium-version-159456.mp3",
    "cover": "/pixel-8.gif",
    "sourceLabel": "STREAM",
  },
  {
    "id": "track-5",
    "title": "Cyber Moonlight",
    "artist": "Pixel Sound",
    "duration": "03:00",
    "src": "https://cdn.pixabay.com/download/audio/2021/09/06/audio_73a5a415a9.mp3?filename=chill-abstract-intention-12099.mp3",
    "cover": "/pixel-14.jpg",
    "sourceLabel": "STREAM",
  },
  {
    "id": "track-6",
    "title": "Pixel Coffee Shop",
    "artist": "Lofi Beats",
    "duration": "02:40",
    "src": "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=lofi-chill-31853.mp3",
    "cover": "/pixel-11.jpg",
    "sourceLabel": "STREAM",
  },
]

@router.get("/catalog")
def get_catalog():
    return {"tracks": PUBLIC_CATALOG}

@router.get("/search")
def search_tracks(q: str = ""):
    query = q.strip().lower()
    if not query:
        return {"tracks": PUBLIC_CATALOG}
    
    matches = [
        t for t in PUBLIC_CATALOG
        if query in t["title"].lower() or query in t["artist"].lower()
    ]
    return {"tracks": matches}

@router.post("/favorites/{user_id}")
def add_favorite(user_id: int, track: TrackSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(FavoriteTrack).filter(
        FavoriteTrack.user_id == user_id, 
        FavoriteTrack.track_id == track.id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"status": "removed", "track_id": track.id}

    fav = FavoriteTrack(
        user_id=user_id,
        track_id=track.id,
        title=track.title,
        artist=track.artist,
        duration=track.duration,
        src=track.src,
        cover=track.cover,
    )
    db.add(fav)
    db.commit()
    return {"status": "added", "track_id": track.id}

@router.get("/favorites/{user_id}")
def get_favorites(user_id: int, db: Session = Depends(get_db)):
    favs = db.query(FavoriteTrack).filter(FavoriteTrack.user_id == user_id).all()
    return {
        "favorites": [
            {
                "id": f.track_id,
                "title": f.title,
                "artist": f.artist,
                "duration": f.duration,
                "src": f.src,
                "cover": f.cover,
            }
            for f in favs
        ]
    }
