import random
import time
from typing import Dict, List, Any
from fastapi import WebSocket
from backend.database import SessionLocal
from backend.models import Room

MAX_ROOM_CAPACITY = 20

RANDOM_ROOM_NAMES = [
    "Midnight Lo-Fi",
    "Neon Arcade",
    "Pixel Drift",
    "Starlight Lounge",
    "Cyber Oasis",
    "Velvet Echo",
    "Retro Wave",
    "Lunar Studio",
    "Synth Horizon",
    "Cloud Nine",
    "Electric Dreams",
    "Sunset Stereo",
]

class ConnectionManager:
    def __init__(self):
        self.active_rooms: Dict[str, List[WebSocket]] = {}
        self.room_members: Dict[str, List[Dict[str, Any]]] = {}
        self.room_hosts: Dict[str, str] = {}
        self.room_names: Dict[str, str] = {}
        self.room_ids: Dict[str, str] = {}
        self.room_kicked_users: Dict[str, List[Dict[str, str]]] = {}
        self.room_queue_requests: Dict[str, List[Dict[str, Any]]] = {}
        self.room_playback_state: Dict[str, Dict[str, Any]] = {}
        self.room_chats: Dict[str, List[Dict[str, Any]]] = {}

    def get_or_create_state(self, room_code: str) -> Dict[str, Any]:
        if room_code not in self.room_playback_state:
            self.room_playback_state[room_code] = {
                "track": {"id": "track-1", "title": "Lobby Pixel Loop", "artist": "Columbina", "duration": "03:45", "src": "/lobby-loop.mp3", "cover": "/pixel-0.gif", "sourceLabel": "ROOM LOOP"},
                "is_playing": False, "current_time": 0.0, "last_sync_timestamp": time.time(), "queue": [], "wallpaper": "",
            }
        return self.room_playback_state[room_code]

    def generate_unique_code(self) -> str:
        chars = "0123456789abcdef"
        db = SessionLocal()
        try:
            while True:
                code = "".join(random.choice(chars) for _ in range(8))
                if code not in self.active_rooms and not db.query(Room).filter(Room.code == code).first():
                    return code
        finally:
            db.close()

    def generate_unique_room_id(self) -> str:
        chars = "0123456789ABCDEF"
        existing_ids = set(self.room_ids.values())
        db = SessionLocal()
        try:
            while True:
                rid = "RM-" + "".join(random.choice(chars) for _ in range(8))
                if rid not in existing_ids and not db.query(Room).filter(Room.room_uid == rid).first():
                    return rid
        finally:
            db.close()

    def _delete_room_from_db(self, room_code: str):
        db = SessionLocal()
        try:
            db.query(Room).filter(Room.code == room_code).delete()
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

    async def connect(self, websocket: WebSocket, room_code: str, username: str = "Anonymous", room_name: str = "", is_create: bool = False, user_id: str = "", room_id: str = ""):
        # Enforce unique room code & unique RoomID in DB and memory when creating a new room
        if is_create:
            db = SessionLocal()
            try:
                existing_code = (room_code in self.active_rooms) or bool(db.query(Room).filter(Room.code == room_code).first())
                if existing_code:
                    await websocket.accept()
                    await websocket.send_json({
                        "type": "ROOM_ERROR",
                        "detail": f"Room code #{room_code} is already taken."
                    })
                    await websocket.close(code=1008)
                    return
                if room_id and room_id.strip():
                    clean_rid = room_id.strip().upper()
                    existing_rid = (clean_rid in self.room_ids.values()) or bool(db.query(Room).filter(Room.room_uid == clean_rid).first())
                    if existing_rid:
                        await websocket.accept()
                        await websocket.send_json({
                            "type": "ROOM_ERROR",
                            "detail": f"A room already exists with the same RoomID ({clean_rid})."
                        })
                        await websocket.close(code=1008)
                        return
            finally:
                db.close()
        else:
            # Joining: require an active room that was newly created
            if room_code not in self.active_rooms:
                await websocket.accept()
                await websocket.send_json({
                    "type": "ROOM_ERROR",
                    "detail": f"Room #{room_code} does not exist or has already closed."
                })
                await websocket.close(code=1008)
                return

        # Enforce kick/ban list: kicked users cannot rejoin unless allowed by host
        kicked_list = self.room_kicked_users.get(room_code, [])
        is_kicked = any(
            (user_id and k.get("user_id") and k.get("user_id") == user_id)
            or (k.get("username", "").lower() == username.strip().lower())
            for k in kicked_list
        )
        if is_kicked:
            await websocket.accept()
            await websocket.send_json({
                "type": "ROOM_ERROR",
                "detail": "You were kicked from this room. You can only rejoin if the host allows you."
            })
            await websocket.close(code=1008)
            return

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
            final_name = room_name.strip() if room_name and room_name.strip() else random.choice(RANDOM_ROOM_NAMES)
            final_rid = room_id.strip().upper() if (room_id and room_id.strip()) else self.generate_unique_room_id()
            self.active_rooms[room_code] = []
            self.room_members[room_code] = []
            self.room_hosts[room_code] = username
            self.room_names[room_code] = final_name
            self.room_ids[room_code] = final_rid
            self.room_kicked_users[room_code] = []
            self.room_queue_requests[room_code] = []
            self.room_chats[room_code] = []

            db = SessionLocal()
            try:
                db.add(Room(room_uid=final_rid, code=room_code, name=final_name))
                db.commit()
            except Exception:
                db.rollback()
            finally:
                db.close()
        elif room_name and room_name.strip() and not self.room_names.get(room_code):
            self.room_names[room_code] = room_name.strip()

        # Replace any stale/duplicate connection for the same user instead of appending _1
        clean_username = username.strip() or "Anonymous"
        stale_members = [
            m for m in self.room_members[room_code]
            if (user_id and m.get("user_id") == user_id) or (m.get("name", "").lower() == clean_username.lower())
        ]
        for stale in stale_members:
            stale_ws = next((ws for ws in self.active_rooms[room_code] if id(ws) == stale["id"]), None)
            if stale_ws:
                self.active_rooms[room_code].remove(stale_ws)
                try:
                    await stale_ws.close(code=1000)
                except Exception:
                    pass
            self.room_members[room_code] = [m for m in self.room_members[room_code] if m["id"] != stale["id"]]

        if not self.room_hosts.get(room_code):
            self.room_hosts[room_code] = clean_username
        is_host = (self.room_hosts.get(room_code, "").lower() == clean_username.lower())
        member_info = {"id": id(websocket), "name": clean_username, "user_id": user_id, "is_host": is_host}
        self.active_rooms[room_code].append(websocket)
        self.room_members[room_code].append(member_info)

        # Notify room of user join via chat (only if not a silent reconnect replacing stale ws)
        join_msg = None
        if not stale_members:
            join_msg = {
                "id": f"sys-{now}-{len(self.room_members[room_code])}",
                "sender": "SYSTEM",
                "text": f"{clean_username} joined the room.",
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
            "room_id": self.room_ids.get(room_code, ""),
            "room_name": self.room_names.get(room_code, "Stereo Lounge"),
            "state": {**state, "current_time": computed_time},
            "host": self.room_hosts.get(room_code),
            "listeners": self.room_members[room_code],
            "kicked_users": self.room_kicked_users.get(room_code, []),
            "queue_requests": self.room_queue_requests.get(room_code, []),
            "server_time": now,
            "my_username": clean_username,
            "chat_history": self.room_chats.get(room_code, []),
        })
        await self.broadcast(
            room_code,
            {
                "type": "LISTENERS_UPDATE",
                "room_id": self.room_ids.get(room_code, ""),
                "room_name": self.room_names.get(room_code, "Stereo Lounge"),
                "host": self.room_hosts.get(room_code),
                "listeners": self.room_members[room_code],
                "kicked_users": self.room_kicked_users.get(room_code, []),
            },
            exclude=websocket,
        )
        if join_msg:
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
                if room_code in self.room_ids:
                    del self.room_ids[room_code]
                if room_code in self.room_kicked_users:
                    del self.room_kicked_users[room_code]
                if room_code in self.room_queue_requests:
                    del self.room_queue_requests[room_code]
                if room_code in self.room_playback_state:
                    del self.room_playback_state[room_code]
                if room_code in self.room_chats:
                    del self.room_chats[room_code]
                self._delete_room_from_db(room_code)
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
                    "avatar_url": data.get("avatar_url") or "",
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

        # Handle Queue Song Requests (any room user can request, edit, or cancel their own pending request)
        if action == "REQUEST_QUEUE_ADD":
            track = data.get("track")
            if isinstance(track, dict) and track.get("id"):
                member = next((m for m in self.room_members.get(room_code, []) if m["id"] == id(sender)), None)
                sender_name = member["name"] if member else "Anonymous"
                reqs = self.room_queue_requests.setdefault(room_code, [])
                req_item = {
                    "id": f"req-{int(now * 1000)}-{id(sender)}",
                    "requester": sender_name,
                    "requester_uid": member.get("user_id", "") if member else "",
                    "track": track,
                    "status": "pending",
                    "created_at": now,
                }
                reqs.append(req_item)
                if len(reqs) > 50:
                    self.room_queue_requests[room_code] = reqs[-50:]
                await self.broadcast(room_code, {"type": "QUEUE_REQUESTS_UPDATE", "queue_requests": self.room_queue_requests[room_code]})
            return

        if action == "EDIT_QUEUE_REQUEST":
            req_id = data.get("request_id")
            new_track = data.get("track")
            if req_id and isinstance(new_track, dict) and new_track.get("id"):
                member = next((m for m in self.room_members.get(room_code, []) if m["id"] == id(sender)), None)
                sender_name = (member["name"] if member else "").lower()
                sender_uid = member.get("user_id", "") if member else ""
                for r in self.room_queue_requests.get(room_code, []):
                    is_owner = (sender_uid and r.get("requester_uid") == sender_uid) or (r.get("requester", "").lower() == sender_name)
                    if r["id"] == req_id and is_owner and r["status"] == "pending":
                        r["track"] = new_track
                        break
                await self.broadcast(room_code, {"type": "QUEUE_REQUESTS_UPDATE", "queue_requests": self.room_queue_requests.get(room_code, [])})
            return

        if action == "CANCEL_QUEUE_REQUEST":
            req_id = data.get("request_id")
            if req_id:
                member = next((m for m in self.room_members.get(room_code, []) if m["id"] == id(sender)), None)
                sender_name = (member["name"] if member else "").lower()
                sender_uid = member.get("user_id", "") if member else ""
                self.room_queue_requests[room_code] = [
                    r for r in self.room_queue_requests.get(room_code, [])
                    if not (
                        r["id"] == req_id
                        and ((sender_uid and r.get("requester_uid") == sender_uid) or (r.get("requester", "").lower() == sender_name))
                    )
                ]
                await self.broadcast(room_code, {"type": "QUEUE_REQUESTS_UPDATE", "queue_requests": self.room_queue_requests.get(room_code, [])})
            return

        # Host-only controls: non-hosts cannot affect playback of the room
        HOST_ONLY_ACTIONS = {"PLAY", "PAUSE", "SEEK", "CHANGE_TRACK", "CHANGE_WALLPAPER", "GIVE_LEADERSHIP", "KICK_USER", "ALLOW_USER", "RESOLVE_QUEUE_REQUEST"}
        
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
                    kicked_list = self.room_kicked_users.setdefault(room_code, [])
                    if not any(k.get("username", "").lower() == target_member["name"].lower() for k in kicked_list):
                        kicked_list.append({
                            "username": target_member["name"],
                            "user_id": target_member.get("user_id", ""),
                        })
                    target_ws = next((ws for ws in self.active_rooms.get(room_code, []) if id(ws) == target_member["id"]), None)
                    if target_ws:
                        try:
                            await target_ws.send_json({"type": "KICKED", "reason": f"Kicked from {room_code} by room host. You cannot rejoin unless allowed by the host."})
                            await target_ws.close()
                            self.disconnect(target_ws, room_code)
                            await self.broadcast(
                                room_code,
                                {
                                    "type": "LISTENERS_UPDATE",
                                    "room_id": self.room_ids.get(room_code, ""),
                                    "room_name": self.room_names.get(room_code, "Stereo Lounge"),
                                    "host": self.room_hosts.get(room_code),
                                    "listeners": self.room_members[room_code],
                                    "kicked_users": self.room_kicked_users.get(room_code, []),
                                },
                            )
                        except Exception:
                            pass
                return
        elif action == "ALLOW_USER":
            target_name = (data.get("target_name") or "").strip()
            if target_name and room_code in self.room_kicked_users:
                self.room_kicked_users[room_code] = [
                    k for k in self.room_kicked_users[room_code]
                    if k.get("username", "").lower() != target_name.lower()
                ]
                allow_msg = {
                    "id": f"sys-{now}-allow",
                    "sender": "SYSTEM",
                    "text": f"{target_name} was allowed back into the room by the host.",
                    "timestamp": now,
                    "is_system": True,
                }
                if room_code in self.room_chats:
                    self.room_chats[room_code].append(allow_msg)
                await self.broadcast(
                    room_code,
                    {
                        "type": "LISTENERS_UPDATE",
                        "room_id": self.room_ids.get(room_code, ""),
                        "room_name": self.room_names.get(room_code, "Stereo Lounge"),
                        "host": self.room_hosts.get(room_code),
                        "listeners": self.room_members.get(room_code, []),
                        "kicked_users": self.room_kicked_users.get(room_code, []),
                    },
                )
                await self.broadcast(room_code, {"type": "CHAT_MESSAGE", "message": allow_msg})
                return
        elif action == "CHANGE_WALLPAPER":
            wallpaper = data.get("wallpaper")
            if wallpaper:
                state["wallpaper"] = wallpaper
                await self.broadcast(room_code, {"type": "SYNC_WALLPAPER", "wallpaper": wallpaper})
                return
        elif action == "RESOLVE_QUEUE_REQUEST":
            req_id = data.get("request_id")
            decision = data.get("decision")
            reqs = self.room_queue_requests.get(room_code, [])
            target_req = next((r for r in reqs if r["id"] == req_id and r["status"] == "pending"), None)
            if target_req:
                if decision == "accept":
                    target_req["status"] = "accepted"
                    state["queue"].append(target_req["track"])
                    await self.broadcast(room_code, {"type": "SYNC_UPDATE_QUEUE", "state": state, "server_time": now})
                else:
                    target_req["status"] = "denied"
                await self.broadcast(room_code, {"type": "QUEUE_REQUESTS_UPDATE", "queue_requests": reqs})
            return

        await self.broadcast(room_code, {"type": f"SYNC_{action}", "state": state, "server_time": now}, exclude=sender)

manager = ConnectionManager()