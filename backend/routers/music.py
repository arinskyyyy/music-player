import json
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
import httpx
from backend.database import get_db
from backend.models import FavoriteTrack, SavedPlaylist, User, GlobalTrackPlay
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
    play_count: Optional[int] = 0

class PlaylistCreate(BaseModel):
    name: str

class AddTrackRequest(BaseModel):
    track: TrackSchema

PUBLIC_CATALOG = [
  {"id": "track-1", "title": "Lobby Pixel Loop", "artist": "Columbina", "duration": "03:45", "src": "/lobby-loop.mp3", "cover": "/pixel-0.gif", "sourceLabel": "ROOM LOOP"},
  {"id": "track-2", "title": "80s Cyber Vibe", "artist": "Howler Arcade", "duration": "01:25", "src": "https://raw.githubusercontent.com/goldfire/howler.js/master/examples/player/audio/80s_vibe.mp3", "cover": "/pixel-1.jpg", "sourceLabel": "STREAM"},
  {"id": "track-3", "title": "Rave Digger", "artist": "Pixel Synth", "duration": "01:40", "src": "https://raw.githubusercontent.com/goldfire/howler.js/master/examples/player/audio/rave_digger.mp3", "cover": "/pixel-7.gif", "sourceLabel": "STREAM"},
  {"id": "track-4", "title": "Running Out of Time", "artist": "Retro Wave", "duration": "01:30", "src": "https://raw.githubusercontent.com/goldfire/howler.js/master/examples/player/audio/running_out.mp3", "cover": "/pixel-8.gif", "sourceLabel": "STREAM"},
  {"id": "track-5", "title": "Viper Synth", "artist": "MDN WebAudio", "duration": "00:58", "src": "https://raw.githubusercontent.com/mdn/webaudio-examples/main/audio-analyser/viper.mp3", "cover": "/pixel-14.jpg", "sourceLabel": "STREAM"},
  {"id": "track-6", "title": "Neon City Rain", "artist": "Sample Beats", "duration": "02:45", "src": "https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3", "cover": "/pixel-11.jpg", "sourceLabel": "STREAM"},
]

@router.get("/catalog")
def get_catalog():
    return {"tracks": PUBLIC_CATALOG}

@router.get("/search")
def search_tracks(q: str = ""):
    query = q.strip().lower()
    if not query:
        return {"tracks": PUBLIC_CATALOG}
    matches = [t for t in PUBLIC_CATALOG if query in t["title"].lower() or query in t["artist"].lower()]
    return {"tracks": matches}

@router.get("/external-search")
def external_search(q: str = "", limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    query = q.strip()
    if not query:
        return {"tracks": []}

    tracks = []
    
    # 1. Audius
    try:
        resp = httpx.get("https://api.audius.co/v1/tracks/search", params={"query": query, "app_name": "SyncRoom", "limit": limit, "offset": offset}, timeout=5.0)
        if resp.status_code == 200:
            data = resp.json()
            for r in data.get("data", []):
                if not r.get("is_streamable", False): continue
                secs = r.get("duration", 0)
                tracks.append({
                    "id": f"audius-{r['id']}", "title": r.get("title", "Unknown"),
                    "artist": r.get("user", {}).get("name", "Unknown Artist"),
                    "duration": f"{secs // 60:02d}:{secs % 60:02d}",
                    "src": f"https://api.audius.co/v1/tracks/{r['id']}/stream?app_name=SyncRoom",
                    "cover": r.get("artwork", {}).get("480x480") or "/pixel-0.gif",
                    "sourceLabel": "AUDIUS",
                })
    except Exception: pass

    # 2. Deezer
    if not tracks:
        try:
            resp = httpx.get("https://api.deezer.com/search", params={"q": query, "limit": limit, "index": offset}, timeout=5.0)
            if resp.status_code == 200:
                data = resp.json()
                for r in data.get("data", []):
                    if not r.get("preview"): continue
                    secs = r.get("duration", 0)
                    tracks.append({
                        "id": f"deezer-{r['id']}", "title": r.get("title", "Unknown"),
                        "artist": r.get("artist", {}).get("name", "Unknown Artist"),
                        "duration": f"{secs // 60:02d}:{secs % 60:02d}", "src": r.get("preview"),
                        "cover": r.get("album", {}).get("cover_medium") or "/pixel-0.gif",
                        "sourceLabel": "DEEZER",
                    })
        except Exception: pass

    # 3. iTunes
    if not tracks:
        try:
            resp = httpx.get("https://itunes.apple.com/search", params={"term": query, "media": "music", "entity": "song", "limit": limit, "offset": offset}, timeout=5.0)
            if resp.status_code == 200:
                data = resp.json()
                for r in data.get("results", []):
                    if r.get("kind") != "song" or not r.get("previewUrl"): continue
                    ms = r.get("trackTimeMillis") or 0
                    tracks.append({
                        "id": f"itunes-{r.get('trackId')}", "title": r.get("trackName", "Unknown"),
                        "artist": r.get("artistName", "Unknown"),
                        "duration": f"{ms // 60000:02d}:{(ms // 1000) % 60:02d}",
                        "src": r.get("previewUrl"), "cover": r.get("artworkUrl100"),
                        "sourceLabel": "ITUNES PREVIEW",
                    })
        except Exception: pass

    q_clean = query.lower()

    # 4. Also check community played tracks in GlobalTrackPlay matching query
    try:
        db_matches = (
            db.query(GlobalTrackPlay)
            .filter(
                (func.lower(GlobalTrackPlay.title).contains(q_clean))
                | (func.lower(GlobalTrackPlay.artist).contains(q_clean))
            )
            .order_by(GlobalTrackPlay.play_count.desc())
            .limit(10)
            .all()
        )
        for dm in db_matches:
            if not any(t["id"] == dm.track_id for t in tracks):
                tracks.append({
                    "id": dm.track_id,
                    "title": dm.title,
                    "artist": dm.artist,
                    "duration": dm.duration,
                    "src": dm.src,
                    "cover": dm.cover or "/pixel-0.gif",
                    "sourceLabel": dm.source_label or "COMMUNITY",
                    "play_count": dm.play_count,
                })
    except Exception:
        pass

    if not tracks:
        tracks = [t.copy() for t in PUBLIC_CATALOG if q_clean in t["title"].lower() or q_clean in t["artist"].lower()]

    # 5. Attach play counts from GlobalTrackPlay
    try:
        track_ids = [t["id"] for t in tracks]
        known_plays = {
            p.track_id: p.play_count
            for p in db.query(GlobalTrackPlay).filter(GlobalTrackPlay.track_id.in_(track_ids)).all()
        }
        for t in tracks:
            if "play_count" not in t or not t["play_count"]:
                t["play_count"] = known_plays.get(t["id"], 0)
    except Exception:
        for t in tracks:
            if "play_count" not in t:
                t["play_count"] = 0

    # 6. Smart Ranking:
    # Boost by match accuracy (exact title > title starts with > title contains > artist match)
    # AND boost by most played (so a matching song that was played the most jumps to the top)
    query_tokens = [tok for tok in q_clean.split() if tok]

    def smart_rank_score(item: dict) -> float:
        title = (item.get("title") or "").lower().strip()
        artist = (item.get("artist") or "").lower().strip()
        plays = item.get("play_count") or 0

        score = 0.0

        # Exact title match
        if title == q_clean:
            score += 1000.0
        elif title.startswith(q_clean):
            score += 600.0
        elif q_clean in title:
            if f" {q_clean} " in f" {title} ":
                score += 400.0
            else:
                score += 250.0

        # Artist match
        if artist == q_clean:
            score += 500.0
        elif artist.startswith(q_clean):
            score += 300.0
        elif q_clean in artist:
            score += 150.0

        # Token overlap
        overlap = sum(1 for tok in query_tokens if tok in title or tok in artist)
        score += overlap * 40.0

        # Most played bonus: community favorite among matching tracks takes the top spot
        score += float(plays) * 50.0

        return score

    tracks.sort(key=smart_rank_score, reverse=True)
    return {"tracks": tracks}

@router.post("/record-play")
def record_play(track: TrackSchema, db: Session = Depends(get_db)):
    if not track.id or not track.title or not track.src:
        return {"status": "ignored"}
    if track.src.startswith("blob:"):
        return {"status": "ignored"}

    rec = db.query(GlobalTrackPlay).filter(GlobalTrackPlay.track_id == track.id).first()
    if rec:
        rec.play_count += 1
        rec.last_played_at = datetime.datetime.utcnow()
        if track.title: rec.title = track.title
        if track.artist: rec.artist = track.artist
        if track.duration: rec.duration = track.duration
        if track.src: rec.src = track.src
        if track.cover: rec.cover = track.cover
        if track.sourceLabel: rec.source_label = track.sourceLabel
    else:
        rec = GlobalTrackPlay(
            track_id=track.id,
            title=track.title,
            artist=track.artist or "Unknown Artist",
            duration=track.duration or "03:00",
            src=track.src,
            cover=track.cover or "/pixel-0.gif",
            source_label=track.sourceLabel or "ONLINE",
            play_count=1,
            last_played_at=datetime.datetime.utcnow(),
        )
        db.add(rec)
    db.commit()
    return {"status": "ok", "play_count": rec.play_count}

@router.get("/trending")
def get_trending(limit: int = 5, db: Session = Depends(get_db)):
    limit = max(1, min(limit, 20))
    tracks = (
        db.query(GlobalTrackPlay)
        .order_by(GlobalTrackPlay.play_count.desc(), GlobalTrackPlay.last_played_at.desc())
        .limit(limit)
        .all()
    )
    return {
        "tracks": [
            {
                "id": t.track_id,
                "title": t.title,
                "artist": t.artist,
                "duration": t.duration,
                "src": t.src,
                "cover": t.cover or "/pixel-0.gif",
                "sourceLabel": t.source_label or "TRENDING",
                "play_count": t.play_count,
            }
            for t in tracks
        ]
    }

@router.post("/favorites")
def toggle_favorite(track: TrackSchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(FavoriteTrack).filter(FavoriteTrack.user_id == current_user.id, FavoriteTrack.track_id == track.id).first()
    if existing:
        db.delete(existing); db.commit()
        return {"status": "removed", "track_id": track.id}
    fav = FavoriteTrack(user_id=current_user.id, track_id=track.id, title=track.title, artist=track.artist, duration=track.duration, src=track.src, cover=track.cover, source_label=track.sourceLabel)
    db.add(fav); db.commit()
    return {"status": "added", "track_id": track.id}

@router.get("/favorites")
def get_favorites(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    favs = db.query(FavoriteTrack).filter(FavoriteTrack.user_id == current_user.id).order_by(FavoriteTrack.id.desc()).all()
    return {"favorites": [{"id": f.track_id, "title": f.title, "artist": f.artist, "duration": f.duration, "src": f.src, "cover": f.cover, "sourceLabel": f.source_label} for f in favs]}

@router.get("/playlists")
def list_playlists(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    playlists = db.query(SavedPlaylist).filter(SavedPlaylist.user_id == current_user.id).order_by(SavedPlaylist.id).all()
    result = []
    for p in playlists:
        try: tracks = json.loads(p.tracks_json or "[]")
        except json.JSONDecodeError: tracks = []
        result.append({"id": p.id, "name": p.name, "tracks": tracks})
    return {"playlists": result}

@router.post("/playlists")
def create_playlist(req: PlaylistCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    name = req.name.strip()
    if not name: raise HTTPException(status_code=400, detail="Name required")
    playlist = SavedPlaylist(user_id=current_user.id, name=name, tracks_json="[]")
    db.add(playlist); db.commit(); db.refresh(playlist)
    return {"id": playlist.id, "name": playlist.name, "tracks": []}

@router.put("/playlists/{playlist_id}")
def rename_playlist(playlist_id: int, req: PlaylistCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    playlist = db.query(SavedPlaylist).filter(SavedPlaylist.id == playlist_id, SavedPlaylist.user_id == current_user.id).first()
    if not playlist: raise HTTPException(status_code=404, detail="Not found")
    playlist.name = req.name.strip(); db.commit()
    return {"id": playlist.id, "name": playlist.name}

@router.delete("/playlists/{playlist_id}")
def delete_playlist(playlist_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    playlist = db.query(SavedPlaylist).filter(SavedPlaylist.id == playlist_id, SavedPlaylist.user_id == current_user.id).first()
    if not playlist: raise HTTPException(status_code=404, detail="Not found")
    db.delete(playlist); db.commit()
    return {"status": "deleted"}

@router.post("/playlists/{playlist_id}/tracks")
def add_track_to_playlist(playlist_id: int, req: AddTrackRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    playlist = db.query(SavedPlaylist).filter(SavedPlaylist.id == playlist_id, SavedPlaylist.user_id == current_user.id).first()
    if not playlist: raise HTTPException(status_code=404, detail="Not found")
    try: tracks = json.loads(playlist.tracks_json or "[]")
    except json.JSONDecodeError: tracks = []
    if not any(t.get("id") == req.track.id for t in tracks): tracks.append(req.track.model_dump())
    playlist.tracks_json = json.dumps(tracks); db.commit()
    return {"id": playlist.id, "name": playlist.name, "tracks": tracks}

@router.delete("/playlists/{playlist_id}/tracks/{track_id}")
def remove_track_from_playlist(playlist_id: int, track_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    playlist = db.query(SavedPlaylist).filter(SavedPlaylist.id == playlist_id, SavedPlaylist.user_id == current_user.id).first()
    if not playlist: raise HTTPException(status_code=404, detail="Not found")
    try: tracks = json.loads(playlist.tracks_json or "[]")
    except json.JSONDecodeError: tracks = []
    tracks = [t for t in tracks if t.get("id") != track_id]
    playlist.tracks_json = json.dumps(tracks); db.commit()
    return {"id": playlist.id, "name": playlist.name, "tracks": tracks}