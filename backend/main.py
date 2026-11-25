from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.database import engine, Base, SessionLocal
from backend.models import Room
from backend.connection_manager import manager
from backend.routers import auth, music, user

Base.metadata.create_all(bind=engine)

# Clear any orphaned rooms from previous server runs (0 active listeners)
try:
    _db = SessionLocal()
    _db.query(Room).delete()
    _db.commit()
    _db.close()
except Exception:
    pass

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, description="SyncRoom Audio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(music.router)
app.include_router(user.router)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME, "version": settings.VERSION}

@app.get("/api/rooms/generate")
def generate_room_code():
    return {
        "room_code": manager.generate_unique_code(),
        "room_id": manager.generate_unique_room_id(),
    }

@app.get("/api/rooms/check/{room_code}")
def check_room_code(room_code: str):
    normalized = room_code.strip().lstrip("#").lower()
    return {
        "exists": normalized in manager.active_rooms,
        "room_id": manager.room_ids.get(normalized, ""),
        "room_name": manager.room_names.get(normalized, ""),
        "listeners_count": len(manager.active_rooms.get(normalized, [])),
    }

@app.websocket("/ws/rooms/{room_code}")
async def room_websocket_endpoint(
    websocket: WebSocket,
    room_code: str,
    username: str = "Anonymous",
    room_name: str = "",
    is_create: bool = False,
    user_id: str = "",
    room_id: str = "",
):
    await manager.connect(
        websocket,
        room_code=room_code,
        username=username,
        room_name=room_name,
        is_create=is_create,
        user_id=user_id,
        room_id=room_id,
    )
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            payload = data.get("payload", {})
            if action:
                await manager.update_playback(room_code=room_code, action=action, data=payload, sender=websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_code)
        await manager.broadcast(
            room_code,
            {
                "type": "LISTENERS_UPDATE",
                "room_id": manager.room_ids.get(room_code, ""),
                "room_name": manager.room_names.get(room_code, "Stereo Lounge"),
                "host": manager.room_hosts.get(room_code),
                "listeners": manager.room_members.get(room_code, []),
                "kicked_users": manager.room_kicked_users.get(room_code, []),
            },
        )
    except Exception:
        manager.disconnect(websocket, room_code)
        await manager.broadcast(
            room_code,
            {
                "type": "LISTENERS_UPDATE",
                "room_id": manager.room_ids.get(room_code, ""),
                "room_name": manager.room_names.get(room_code, "Stereo Lounge"),
                "host": manager.room_hosts.get(room_code),
                "listeners": manager.room_members.get(room_code, []),
                "kicked_users": manager.room_kicked_users.get(room_code, []),
            },
        )