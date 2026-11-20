import time
from typing import Dict, List, Any
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Maps room_code -> list of active WebSockets
        self.active_rooms: Dict[str, List[WebSocket]] = {}
        # Maps room_code -> list of user metadata dicts: [{"id": ws_id, "name": "...", "is_host": bool}]
        self.room_members: Dict[str, List[Dict[str, Any]]] = {}
        # Maps room_code -> host username
        self.room_hosts: Dict[str, str] = {}
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
                "wallpaper": "/pixel-0.gif",
            }
        return self.room_playback_state[room_code]

    async def connect(self, websocket: WebSocket, room_code: str, username: str = "Anonymous"):
        await websocket.accept()
        if room_code not in self.active_rooms:
            self.active_rooms[room_code] = []
            self.room_members[room_code] = []
            self.room_hosts[room_code] = username

        # If no host is assigned, assign this user as host
        if not self.room_hosts.get(room_code):
            self.room_hosts[room_code] = username

        is_host = (self.room_hosts.get(room_code) == username)
        member_info = {
            "id": id(websocket),
            "name": username,
            "is_host": is_host,
        }
        self.active_rooms[room_code].append(websocket)
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
            "host": self.room_hosts.get(room_code),
            "listeners": self.room_members[room_code],
            "server_time": time.time(),
        })

        # Broadcast updated listener list to all room members
        await self.broadcast(room_code, {
            "type": "LISTENERS_UPDATE",
            "host": self.room_hosts.get(room_code),
            "listeners": self.room_members[room_code],
        })

    def disconnect(self, websocket: WebSocket, room_code: str):
        if room_code in self.active_rooms:
            leaving_member = next(
                (m for m in self.room_members.get(room_code, []) if m["id"] == id(websocket)),
                None
            )
            if websocket in self.active_rooms[room_code]:
                self.active_rooms[room_code].remove(websocket)

            self.room_members[room_code] = [
                m for m in self.room_members.get(room_code, []) if m["id"] != id(websocket)
            ]

            if not self.active_rooms[room_code]:
                del self.active_rooms[room_code]
                del self.room_members[room_code]
                if room_code in self.room_hosts:
                    del self.room_hosts[room_code]
            else:
                # If host left, assign host to the second most connected user (first in remaining members)
                if leaving_member and leaving_member.get("name") == self.room_hosts.get(room_code):
                    new_host = self.room_members[room_code][0]["name"]
                    self.room_hosts[room_code] = new_host
                    for m in self.room_members[room_code]:
                        m["is_host"] = (m["name"] == new_host)

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

        elif action == "GIVE_LEADERSHIP":
            target_name = data.get("target_name")
            if target_name and room_code in self.room_members:
                self.room_hosts[room_code] = target_name
                for m in self.room_members[room_code]:
                    m["is_host"] = (m["name"] == target_name)
                await self.broadcast(room_code, {
                    "type": "HOST_UPDATE",
                    "host": target_name,
                    "listeners": self.room_members[room_code],
                })
                return

        elif action == "KICK_USER":
            target_name = data.get("target_name")
            if target_name and room_code in self.active_rooms:
                target_idx = None
                for idx, m in enumerate(self.room_members[room_code]):
                    if m["name"] == target_name:
                        target_idx = idx
                        break
                if target_idx is not None and target_idx < len(self.active_rooms[room_code]):
                    target_ws = self.active_rooms[room_code][target_idx]
                    try:
                        await target_ws.send_json({
                            "type": "KICKED",
                            "reason": f"Kicked from {room_code} by room host",
                        })
                        await target_ws.close()
                    except Exception:
                        pass
                return

        elif action == "CHANGE_WALLPAPER":
            wallpaper = data.get("wallpaper")
            if wallpaper:
                state["wallpaper"] = wallpaper
                await self.broadcast(room_code, {
                    "type": "SYNC_WALLPAPER",
                    "wallpaper": wallpaper,
                })
                return

        # Broadcast sync event to all room members
        await self.broadcast(room_code, {
            "type": f"SYNC_{action}",
            "state": state,
            "server_time": now,
        })

manager = ConnectionManager()
