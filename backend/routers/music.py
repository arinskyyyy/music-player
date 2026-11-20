from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import FavoriteTrack, User
from backend.routers.auth import get_current_user

router = APIRouter(prefix="/api/music", tags=["music"])

class TrackSchema(BaseModel):
    id: str
    title: str
    artist: str
    duration: str
    src: str
    cover: Optional[str] = None
    sourceLabel: Optional[str] = None

# Curated Stream Catalog (Guaranteed CORS-accessible streams)
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
    "title": "80s Cyber Vibe",
    "artist": "Howler Arcade",
    "duration": "01:25",
    "src": "https://raw.githubusercontent.com/goldfire/howler.js/master/examples/player/audio/80s_vibe.mp3",
    "cover": "/pixel-1.jpg",
    "sourceLabel": "STREAM",
  },
  {
    "id": "track-3",
    "title": "Rave Digger",
    "artist": "Pixel Synth",
    "duration": "01:40",
    "src": "https://raw.githubusercontent.com/goldfire/howler.js/master/examples/player/audio/rave_digger.mp3",
    "cover": "/pixel-7.gif",
    "sourceLabel": "STREAM",
  },
  {
    "id": "track-4",
    "title": "Running Out of Time",
    "artist": "Retro Wave",
    "duration": "01:30",
    "src": "https://raw.githubusercontent.com/goldfire/howler.js/master/examples/player/audio/running_out.mp3",
    "cover": "/pixel-8.gif",
    "sourceLabel": "STREAM",
  },
  {
    "id": "track-5",
    "title": "Viper Synth",
    "artist": "MDN WebAudio",
    "duration": "00:58",
    "src": "https://raw.githubusercontent.com/mdn/webaudio-examples/main/audio-analyser/viper.mp3",
    "cover": "/pixel-14.jpg",
    "sourceLabel": "STREAM",
  },
  {
    "id": "track-6",
    "title": "Neon City Rain",
    "artist": "Sample Beats",
    "duration": "02:45",
    "src": "https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3",
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

@router.post("/favorites")
def toggle_favorite(
    track: TrackSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user.id

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

@router.get("/favorites")
def get_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    favs = db.query(FavoriteTrack).filter(FavoriteTrack.user_id == current_user.id).all()
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
