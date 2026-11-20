from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.database import engine, Base
from backend.connection_manager import manager
from backend.routers import auth, music

# Create PostgreSQL database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Real-time synchronized audio rooms & music streaming backend",
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API Routers
app.include_router(auth.router)
app.include_router(music.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }

# Real-Time WebSocket Synchronization Endpoint
@app.websocket("/ws/rooms/{room_code}")
async def room_websocket_endpoint(websocket: WebSocket, room_code: str, username: str = "Anonymous"):
    await manager.connect(websocket, room_code=room_code, username=username)
    try:
        while True:
            # Receive real-time client actions (PLAY, PAUSE, SEEK, CHANGE_TRACK, UPDATE_QUEUE)
            data = await websocket.receive_json()
            action = data.get("action")
            payload = data.get("payload", {})
            if action:
                await manager.update_playback(
                    room_code=room_code,
                    action=action,
                    data=payload,
                    sender=websocket
                )
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_code)
        # Notify room members that user left
        await manager.broadcast(room_code, {
            "type": "LISTENERS_UPDATE",
            "listeners": manager.room_members.get(room_code, []),
        })
    except Exception:
        manager.disconnect(websocket, room_code)
