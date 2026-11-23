# SyncRoom System Architecture

SyncRoom is a real-time multiplayer music streaming player with a retro pixel aesthetic.

## Architecture Diagram

```
+-------------------------------------------------------------+
|                      React Frontend (Vite)                  |
|  [App.jsx] -> [Sidebar] | [TrackList] | [PlayerBar]         |
|  [useRoomSocket] WebSocket Hook                             |
+------------------------------+------------------------------+
                               | WebSockets & REST APIs
+------------------------------v------------------------------+
|                    FastAPI Backend Service                  |
|  - Auth Router (JWT, bcrypt)                                 |
|  - Music Router (Catalog, Audius, Deezer, iTunes, Favorites) |
|  - User Router (Stats, Play History, Play Counts)            |
|  - Connection Manager (Broadcast, Time Drift Sync)           |
+------------------------------+------------------------------+
                               | SQLAlchemy ORM
+------------------------------v------------------------------+
|                    PostgreSQL / SQLite Database              |
|  - users, rooms, favorite_tracks, saved_playlists           |
+-------------------------------------------------------------+
```
