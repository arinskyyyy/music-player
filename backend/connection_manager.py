import time
from typing import Dict, List, Any
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Maps room_code -> list of active WebSockets
        self.active_rooms: Dict[str, List[WebSocket]] = {}
        # Maps room_code -> list of user metadata dicts: [{"id": ws_id, "name": "..."}]
        self.room_members: Dict[str, List[Dict[str, Any]]] = {}
        # Maps room_code -> playback state
        self.room_playback_state: Dict[str, Dict[str, Any]] = {}

    def get_or_create_state(self, room_code: str) -> Dict[str, Any]:
        if room_code not in self.room_playback_state:
            self.room_playback_state[room_code] = {
                "track": {
                    "id": "track-1",
                    "title": "Lobby Pixel Loop",
                    "artist": "Columbina",
                    "duration": "03:45",
                    "src": "/lobby-loop.mp3",
                    "cover": "/pixel-0.gif",
                    "sourceLabel": "ROOM LOOP",
                },
                "is_playing": False,
                "current_time": 0.0,
                "last_sync_timestamp": time.time(),
                "queue": [],
            }
        return self.room_playback_state[room_code]

    async def connect(self, websocket: WebSocket, room_code: str, username: str = "Anonymous"):
        await websocket.accept()
        if room_code not in self.active_rooms:
            self.active_rooms[room_code] = []
            self.room_members[room_code] = []

        self.active_rooms[room_code].append(websocket)
        member_info = {"id": id(websocket), "name": username}
        self.room_members[room_code].append(member_info)

        # Send initial room state to the newly connected user
        state = self.get_or_create_state(room_code)
        # Compute elapsed time if playing
        computed_time = state["current_time"]
        if state["is_playing"]:
            elapsed = time.time() - state["last_sync_timestamp"]
            computed_time += elapsed

        await websocket.send_json({
            "type": "ROOM_STATE_INIT",
            "room_code": room_code,
            "state": {
                **state,
                "current_time": computed_time,
            },
            "listeners": self.room_members[room_code],
            "server_time": time.time(),
        })

        # Broadcast updated listener list to all room members
        await self.broadcast(room_code, {
            "type": "LISTENERS_UPDATE",
            "listeners": self.room_members[room_code],
        })

    def disconnect(self, websocket: WebSocket, room_code: str):
        if room_code in self.active_rooms:
            if websocket in self.active_rooms[room_code]:
                self.active_rooms[room_code].remove(websocket)
            
            # Remove member info
            self.room_members[room_code] = [
                m for m in self.room_members[room_code] if m["id"] != id(websocket)
            ]

            if not self.active_rooms[room_code]:
                del self.active_rooms[room_code]
                del self.room_members[room_code]

    async def broadcast(self, room_code: str, message: dict, exclude: WebSocket = None):
        if room_code in self.active_rooms:
            for connection in self.active_rooms[room_code]:
                if connection != exclude:
                    try:
                        await connection.send_json(message)
                    except Exception:
                        pass

    async def update_playback(self, room_code: str, action: str, data: dict, sender: WebSocket):
        state = self.get_or_create_state(room_code)
        now = time.time()

        if action == "PLAY":
            state["is_playing"] = True
            state["current_time"] = float(data.get("time", state["current_time"]))
            state["last_sync_timestamp"] = now

        elif action == "PAUSE":
            state["is_playing"] = False
            state["current_time"] = float(data.get("time", state["current_time"]))
            state["last_sync_timestamp"] = now

        elif action == "SEEK":
            state["current_time"] = float(data.get("time", 0))
            state["last_sync_timestamp"] = now

        elif action == "CHANGE_TRACK":
            state["track"] = data.get("track")
            state["current_time"] = 0.0
            state["is_playing"] = True
            state["last_sync_timestamp"] = now

        elif action == "UPDATE_QUEUE":
            state["queue"] = data.get("queue", [])

        # Broadcast sync event to all room members
        await self.broadcast(room_code, {
            "type": f"SYNC_{action}",
            "state": state,
            "server_time": now,
        })

manager = ConnectionManager()
