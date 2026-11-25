import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    uid = Column(String(32), unique=True, index=True, nullable=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    auth_provider = Column(String(20), default="local")
    provider_id = Column(String(255), nullable=True, index=True)
    avatar_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Persist user stats across devices/logins
    recent_tracks_json = Column(Text, default="[]")
    play_counts_json = Column(Text, default="{}")

    favorites = relationship("FavoriteTrack", back_populates="user", cascade="all, delete-orphan")
    playlists = relationship("SavedPlaylist", back_populates="user", cascade="all, delete-orphan")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_uid = Column(String(32), unique=True, index=True, nullable=True)
    code = Column(String(32), unique=True, index=True, nullable=False)
    name = Column(String(100), default="Pixel Stereo Lounge")
    host_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class FavoriteTrack(Base):
    __tablename__ = "favorite_tracks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    track_id = Column(String(64), index=True, nullable=False)
    title = Column(String(200), nullable=False)
    artist = Column(String(200), nullable=False)
    duration = Column(String(20), nullable=False)
    src = Column(Text, nullable=False)
    cover = Column(Text, nullable=True)
    source_label = Column(String(50), nullable=True) # Added to keep badges
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="favorites")

class SavedPlaylist(Base):
    __tablename__ = "saved_playlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    tracks_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="playlists")

class GlobalTrackPlay(Base):
    __tablename__ = "global_track_plays"

    id = Column(Integer, primary_key=True, index=True)
    track_id = Column(String(255), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    artist = Column(String(255), nullable=False)
    duration = Column(String(50), default="03:00")
    src = Column(Text, nullable=False)
    cover = Column(Text, nullable=True)
    source_label = Column(String(50), default="ONLINE")
    play_count = Column(Integer, default=1, index=True)
    last_played_at = Column(DateTime, default=datetime.datetime.utcnow)
