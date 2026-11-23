# SyncRoom — Pixel Music Player

A synchronized, real-time multiplayer music player with a retro pixel-art aesthetic. Built with React, Vite, Tailwind CSS, FastAPI, and WebSockets.

## Features

- **Real-Time Room Sync:** Create or join rooms. Play, pause, seek, and change tracks simultaneously across all connected listeners.
- **Host Controls:** The room host can kick users, transfer leadership, and change the room wallpaper.
- **Local PC Storage:** Load your own MP3/WAV files directly from your machine into the player.
- **Search & Favorites:** Search the iTunes API for tracks, and save your favorites to your account.
- **Theme Engine:** Customizable site accent colors, text colors, and wallpapers.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, HTML5 Web Audio
- **Backend:** FastAPI, Uvicorn, SQLAlchemy
- **Database:** PostgreSQL (falls back to SQLite locally)
- **Auth:** JWT (JSON Web Tokens), bcrypt

---

## Getting Started

### 1. Backend Setup

Make sure you have Python 3.10+ installed.

```bash
# Navigate to the project root
cd music-player

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your PostgreSQL credentials, or leave it empty to use SQLite