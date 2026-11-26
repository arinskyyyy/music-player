# Illusion

> **Live App:** [illusionn.pages.dev](https://illusionn.pages.dev) *(Still in active development)*

**Illusion** is a real-time synchronized music streaming and listening room web application. Search across 50+ music API endpoints prioritizing full-length tracks, create or join live listening rooms with up to 20 listeners, chat with custom room wallpapers, request songs for the room queue, and customize the entire site's appearance.

---

## Features

- **Multi-API Music Search (54 Endpoints):** Queries JioSaavn mirrors, Piped, Invidious, Audius discovery nodes, Internet Archive, Deezer, and iTunes concurrently, ranking full-length songs and community-played tracks at the top.
- **Real-Time Synchronized Rooms:** Host-controlled playback (`play`, `pause`, `seek`, `track change`, `Space` key, and hardware media keys) over WebSockets with automatic drift/refresh recovery (`15s` grace period) and independent local pause/resume resync for listeners.
- **In-Room Chat & Wallpapers:** Real-time room chat with join/leave notifications, circular user avatars, and customizable pixel-art room wallpapers.
- **Collaborative Room Queue & Requests:** Batch-import from Favorites, Playlists, or Local Files; listeners can search, send, edit, and cancel song requests for the host to accept or deny.
- **Host Controls & Moderation:** Transfer host leadership, kick and block users by account `UserID` (with host-only unblock controls), and cap rooms at 20 listeners.
- **Accounts, Security & Email Resets:** JWT + bcrypt authentication, circular profile picture uploads, account/password settings, and password reset codes delivered via Resend or SMTP.
- **Theme Engine:** Black Mode, White Mode, System Default, and Custom Mode with customizable background, accent, and text colors.
- **Local Audio Playback:** Load MP3, WAV, OGG, FLAC, and M4A files directly from your device.

---

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, HTML5 Audio & Media Session API
- **Backend:** FastAPI, Uvicorn, WebSockets, SQLAlchemy, `httpx`
- **Database:** PostgreSQL (`psycopg` / `psycopg2`, with automatic SQLite fallback locally)
- **Auth & Email:** JWT (`python-jose`), `bcrypt`, Resend API / SMTP
- **Deployment:** Cloudflare Pages (Frontend), Render (Backend), Neon (PostgreSQL)

---

## Getting Started (Local Development)

### Prerequisites
- **Node.js** 18+
- **Python** 3.11+
- **PostgreSQL** (optional — falls back to SQLite `syncroom.db` if unreachable)

### 1. Clone & Configure Environment
```bash
git clone https://github.com/arinskyyyy/music-player.git
cd music-player
cp backend/.env.example .env
```
Edit `.env` with your `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`, and optional `RESEND_API_KEY` / `SMTP_*` values.

### 2. Backend Setup
```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

### 3. Frontend Setup
In a separate terminal:
```bash
npm install
npm run dev
```
Open `http://localhost:5173`.

---

## Deployment

- **Frontend (Cloudflare Pages):** Build command `npm run build`, output directory `dist`, environment variable `VITE_API_BASE=https://your-backend-url`.
- **Backend (Render):** Blueprint configured in [render.yaml](render.yaml) (`uvicorn backend.main:app --host 0.0.0.0 --port $PORT --workers 1`).
- **Database (Neon):** Managed PostgreSQL connected via `DATABASE_URL`.

---

## Creator

Created by **arinskyyyy** — [GitHub](https://github.com/arinskyyyy) · [Linktree](https://linktr.ee/arinskyyyy)
