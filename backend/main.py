from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.database import engine, Base
from backend.connection_manager import manager
from backend.routers import auth, music, user

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, description="SyncRoom Audio API")

app.add_middleware(
    CORSMiddleware, allow_origins=settings.CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(music.router)
app.include_router(user.router)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME, "version": settings.VERSION}

@app.websocket("/ws/rooms/{room_code}")
async def room_websocket_endpoint(websocket: WebSocket, room_code: str, username: str = "Anonymous"):
    await manager.connect(websocket, room_code=room_code, username=username)
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            payload = data.get("payload", {})
            if action:
                await manager.update_playback(room_code=room_code, action=action, data=payload, sender=websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_code)
        await manager.broadcast(room_code, {"type": "LISTENERS_UPDATE", "host": manager.room_hosts.get(room_code), "listeners": manager.room_members.get(room_code, [])})
    except Exception:
        manager.disconnect(websocket, room_code)
        await manager.broadcast(room_code, {"type": "LISTENERS_UPDATE", "host": manager.room_hosts.get(room_code), "listeners": manager.room_members.get(room_code, [])})