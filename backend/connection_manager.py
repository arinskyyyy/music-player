import time
from typing import Dict, List, Any
from fastapi import WebSocket

MAX_ROOM_CAPACITY = 20

class ConnectionManager:
    def __init__(self):
        self.active_rooms: Dict[str, List[WebSocket]] = {}
        self.room_members: Dict[str, List[Dict[str, Any]]] = {}
        self.room_hosts: Dict[str, str] = {}
        self.room_names: Dict[str, str] = {}
        self.room_playback_state: Dict[str, Dict[str, Any]] = {}
        self.room_chats: Dict[str, List[Dict[str, Any]]] = {}

    def get_or_create_state(self, room_code: str) -> Dict[str, Any]:
        if room_code not in self.room_playback_state:
            self.room_playback_state[room_code] = {
                "track": {"id": "track-1", "title": "Lobby Pixel Loop", "artist": "Columbina", "duration": "03:45", "src": "/lobby-loop.mp3", "cover": "/pixel-0.gif", "sourceLabel": "ROOM LOOP"},
                "is_playing": False, "current_time": 0.0, "last_sync_timestamp": time.time(), "queue": [], "wallpaper": "/pixel-0.gif",
            }
        return self.room_playback_state[room_code]

    async def connect(self, websocket: WebSocket, room_code: str, username: str = "Anonymous", room_name: str = ""):
        # Enforce room capacity limit: max 20 users per room
        if room_code in self.active_rooms and len(self.active_rooms[room_code]) >= MAX_ROOM_CAPACITY:
            await websocket.accept()
            await websocket.send_json({
                "type": "ROOM_FULL",
                "detail": f"Room {room_code} has reached its maximum capacity of {MAX_ROOM_CAPACITY} listeners."
            })
            await websocket.close(code=1008)
            return

        await websocket.accept()
        now = time.time()

        if room_code not in self.active_rooms:
            self.active_rooms[room_code] = []
            self.room_members[room_code] = []
            self.room_hosts[room_code] = username
            self.room_names[room_code] = room_name.strip() if room_name and room_name.strip() else "Stereo Lounge"
            self.room_chats[room_code] = []
        elif room_name and room_name.strip() and not self.room_names.get(room_code):
            self.room_names[room_code] = room_name.strip()

        base_username = username
        counter = 1
        existing_names = [m["name"] for m in self.room_members[room_code]]
        while username in existing_names:
            username = f"{base_username}_{counter}"
            counter += 1

        if not self.room_hosts.get(room_code):
            self.room_hosts[room_code] = username
        is_host = (self.room_hosts.get(room_code) == username)
        member_info = {"id": id(websocket), "name": username, "is_host": is_host}
        self.active_rooms[room_code].append(websocket)
        self.room_members[room_code].append(member_info)

        # Notify room of user join via chat
        join_msg = {
            "id": f"sys-{now}-{len(self.room_members[room_code])}",
            "sender": "SYSTEM",
            "text": f"{username} joined the room.",
            "timestamp": now,
            "is_system": True,
        }
        if room_code in self.room_chats:
            self.room_chats[room_code].append(join_msg)
            if len(self.room_chats[room_code]) > 100:
                self.room_chats[room_code] = self.room_chats[room_code][-100:]

        state = self.get_or_create_state(room_code)
        computed_time = state["current_time"]
        if state["is_playing"]:
            computed_time += (now - state["last_sync_timestamp"])

        await websocket.send_json({
            "type": "ROOM_STATE_INIT",
            "room_code": room_code,
            "room_name": self.room_names.get(room_code, "Stereo Lounge"),
            "state": {**state, "current_time": computed_time},
            "host": self.room_hosts.get(room_code),
            "listeners": self.room_members[room_code],
            "server_time": now,
            "my_username": username,
            "chat_history": self.room_chats.get(room_code, []),
        })
        await self.broadcast(
            room_code,
            {
                "type": "LISTENERS_UPDATE",
                "room_name": self.room_names.get(room_code, "Stereo Lounge"),
                "host": self.room_hosts.get(room_code),
                "listeners": self.room_members[room_code],
            },
            exclude=websocket,
        )
        await self.broadcast(room_code, {"type": "CHAT_MESSAGE", "message": join_msg}, exclude=websocket)

    def disconnect(self, websocket: WebSocket, room_code: str):
        if room_code in self.active_rooms:
            now = time.time()
            leaving_member = next((m for m in self.room_members.get(room_code, []) if m["id"] == id(websocket)), None)
            if websocket in self.active_rooms[room_code]:
                self.active_rooms[room_code].remove(websocket)
            self.room_members[room_code] = [m for m in self.room_members.get(room_code, []) if m["id"] != id(websocket)]

            if not self.active_rooms[room_code]:
                del self.active_rooms[room_code]
                del self.room_members[room_code]
                if room_code in self.room_hosts:
                    del self.room_hosts[room_code]
                if room_code in self.room_names:
                    del self.room_names[room_code]
                if room_code in self.room_playback_state:
                    del self.room_playback_state[room_code]
                if room_code in self.room_chats:
                    del self.room_chats[room_code]
            else:
                if leaving_member:
                    leaving_name = leaving_member.get("name", "Someone")
                    leave_msg = {
                        "id": f"sys-{now}",
                        "sender": "SYSTEM",
                        "text": f"{leaving_name} left the room.",
                        "timestamp": now,
                        "is_system": True,
                    }
                    if room_code in self.room_chats:
                        self.room_chats[room_code].append(leave_msg)
                        if len(self.room_chats[room_code]) > 100:
                            self.room_chats[room_code] = self.room_chats[room_code][-100:]
                    # Note: broadcast is async, so in disconnect where loop might be closing, ignore errors
                    for conn in self.active_rooms.get(room_code, []):
                        try:
                            import asyncio
                            asyncio.create_task(conn.send_json({"type": "CHAT_MESSAGE", "message": leave_msg}))
                        except Exception:
                            pass

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

        # Handle In-Room Chat message
        if action == "SEND_CHAT":
            text = (data.get("text") or "").strip()
            if text:
                member = next((m for m in self.room_members.get(room_code, []) if m["id"] == id(sender)), None)
                sender_name = member["name"] if member else "Anonymous"
                is_host = (self.room_hosts.get(room_code) == sender_name)
                chat_msg = {
                    "id": f"chat-{now}-{id(sender)}",
                    "sender": sender_name,
                    "text": text,
                    "timestamp": now,
                    "is_system": False,
                    "is_host": is_host,
                }
                if room_code in self.room_chats:
                    self.room_chats[room_code].append(chat_msg)
                    if len(self.room_chats[room_code]) > 100:
                        self.room_chats[room_code] = self.room_chats[room_code][-100:]
                await self.broadcast(room_code, {"type": "CHAT_MESSAGE", "message": chat_msg})
            return

        # Handle Resynchronize with Host request
        if action == "REQUEST_SYNC":
            computed_time = state["current_time"]
            if state["is_playing"]:
                computed_time += (now - state["last_sync_timestamp"])
            try:
                await sender.send_json({
                    "type": "SYNC_STATE",
                    "state": {**state, "current_time": computed_time},
                    "host": self.room_hosts.get(room_code),
                    "room_name": self.room_names.get(room_code, "Stereo Lounge"),
                    "server_time": now,
                })
            except Exception:
                pass
            return

        # Host-only controls: non-hosts cannot affect playback of the room
        HOST_ONLY_ACTIONS = {"PLAY", "PAUSE", "SEEK", "CHANGE_TRACK", "CHANGE_WALLPAPER", "GIVE_LEADERSHIP", "KICK_USER"}
        
        if action in HOST_ONLY_ACTIONS:
            member = next((m for m in self.room_members.get(room_code, []) if m["id"] == id(sender)), None)
            if not member or not member.get("is_host"):
                # Non-host tried to send global playback control - reply with current host state to resync
                try:
                    computed_time = state["current_time"]
                    if state["is_playing"]:
                        computed_time += (now - state["last_sync_timestamp"])
                    await sender.send_json({
                        "type": "SYNC_STATE",
                        "detail": "Playback is controlled by the room host.",
                        "state": {**state, "current_time": computed_time},
                        "host": self.room_hosts.get(room_code),
                    })
                except Exception:
                    pass
                return

        if action == "PLAY":
            state["is_playing"] = True
            state["current_time"] = float(data.get("current_time", state["current_time"]))
            state["last_sync_timestamp"] = now
        elif action == "PAUSE":
            state["is_playing"] = False
            state["current_time"] = float(data.get("current_time", state["current_time"]))
            state["last_sync_timestamp"] = now
        elif action == "SEEK":
            state["current_time"] = float(data.get("current_time", 0))
            state["last_sync_timestamp"] = now
        elif action == "CHANGE_TRACK":
            track = data.get("track")
            if not isinstance(track, dict) or not track.get("id"):
                return
            state["track"] = track
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
                await self.broadcast(
                    room_code,
                    {
                        "type": "HOST_UPDATE",
                        "host": target_name,
                        "room_name": self.room_names.get(room_code, "Stereo Lounge"),
                        "listeners": self.room_members[room_code],
                    },
                )
                return
        elif action == "KICK_USER":
            target_name = data.get("target_name")
            if target_name and room_code in self.room_members:
                target_member = next((m for m in self.room_members[room_code] if m["name"] == target_name), None)
                if target_member:
                    target_ws = next((ws for ws in self.active_rooms.get(room_code, []) if id(ws) == target_member["id"]), None)
                    if target_ws:
                        try:
                            await target_ws.send_json({"type": "KICKED", "reason": f"Kicked from {room_code} by room host"})
                            await target_ws.close()
                            self.disconnect(target_ws, room_code)
                            await self.broadcast(
                                room_code,
                                {
                                    "type": "LISTENERS_UPDATE",
                                    "room_name": self.room_names.get(room_code, "Stereo Lounge"),
                                    "host": self.room_hosts.get(room_code),
                                    "listeners": self.room_members[room_code],
                                },
                            )
                        except Exception:
                            pass
                return
        elif action == "CHANGE_WALLPAPER":
            wallpaper = data.get("wallpaper")
            if wallpaper:
                state["wallpaper"] = wallpaper
                await self.broadcast(room_code, {"type": "SYNC_WALLPAPER", "wallpaper": wallpaper})
                return

        await self.broadcast(room_code, {"type": f"SYNC_{action}", "state": state, "server_time": now}, exclude=sender)

manager = ConnectionManager()