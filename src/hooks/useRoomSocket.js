import { useEffect, useRef, useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function getWebSocketUrl(roomCode, username, roomName = "", isCreate = false, userId = "", roomId = "") {
  const query = `username=${encodeURIComponent(username)}&room_name=${encodeURIComponent(roomName || "")}&is_create=${isCreate ? "true" : "false"}&user_id=${encodeURIComponent(userId || "")}&room_id=${encodeURIComponent(roomId || "")}`;
  try {
    const parsed = new URL(API_BASE);
    const wsProto = parsed.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProto}//${parsed.host}/ws/rooms/${roomCode}?${query}`;
  } catch {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname || "localhost";
    const port = window.location.port === "5173" ? ":8000" : (window.location.port ? `:${window.location.port}` : "");
    return `${protocol}//${host}${port}/ws/rooms/${roomCode}?${query}`;
  }
}

export function useRoomSocket({
  roomCode = "",
  username = "Listener",
  userId = "",
  roomName = "",
  roomId = "",
  isCreate = false,
  isConnected: externalIsConnected,
  onSyncPlay,
  onSyncPause,
  onSyncSeek,
  onSyncChangeTrack,
  onSyncQueue,
  onListenersUpdate,
  onHostUpdate,
  onKicked,
  onWallpaperUpdate,
  onChatMessage,
  onChatHistory,
  onRoomNameUpdate,
  onRoomIdUpdate,
  onKickedUsersUpdate,
  onQueueRequestsUpdate,
  onRoomFull,
  onRoomError,
  onSyncState,
}) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const messageQueueRef = useRef([]);

  const callbacksRef = useRef({});
  useEffect(() => {
    callbacksRef.current = {
      onSyncPlay,
      onSyncPause,
      onSyncSeek,
      onSyncChangeTrack,
      onSyncQueue,
      onListenersUpdate,
      onHostUpdate,
      onKicked,
      onWallpaperUpdate,
      onChatMessage,
      onChatHistory,
      onRoomNameUpdate,
      onRoomIdUpdate,
      onKickedUsersUpdate,
      onQueueRequestsUpdate,
      onRoomFull,
      onRoomError,
      onSyncState,
    };
  });

  useEffect(() => {
    if (!roomCode || externalIsConnected === false) return;
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      const wsUrl = getWebSocketUrl(roomCode, username, roomName, isCreate, userId, roomId);

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          retryCountRef.current = 0;
          while (messageQueueRef.current.length > 0) ws.send(messageQueueRef.current.shift());
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const cbs = callbacksRef.current;
            switch (data.type) {
              case "ROOM_STATE_INIT":
                if (data.host) cbs.onHostUpdate?.(data.host);
                if (data.listeners) cbs.onListenersUpdate?.(data.listeners);
                if (data.room_name) cbs.onRoomNameUpdate?.(data.room_name);
                if (data.room_id) cbs.onRoomIdUpdate?.(data.room_id);
                if (data.kicked_users) cbs.onKickedUsersUpdate?.(data.kicked_users);
                if (data.queue_requests) cbs.onQueueRequestsUpdate?.(data.queue_requests);
                if (data.chat_history) cbs.onChatHistory?.(data.chat_history);
                if (data.my_username) localStorage.setItem("syncroom_active_username", data.my_username);
                if (data.state) {
                  if (data.state.wallpaper) cbs.onWallpaperUpdate?.(data.state.wallpaper);
                  if (data.state.track) cbs.onSyncChangeTrack?.(data.state.track, data.state);
                  if (data.state.current_time !== undefined) cbs.onSyncSeek?.(data.state.current_time);
                  if (data.state.is_playing) cbs.onSyncPlay?.(data.state.current_time);
                  else cbs.onSyncPause?.(data.state.current_time);
                  if (data.state.queue) cbs.onSyncQueue?.(data.state.queue);
                }
                break;
              case "HOST_UPDATE":
                if (data.host) cbs.onHostUpdate?.(data.host);
                if (data.listeners) cbs.onListenersUpdate?.(data.listeners);
                if (data.room_name) cbs.onRoomNameUpdate?.(data.room_name);
                if (data.room_id) cbs.onRoomIdUpdate?.(data.room_id);
                if (data.kicked_users) cbs.onKickedUsersUpdate?.(data.kicked_users);
                break;
              case "LISTENERS_UPDATE":
                if (data.host) cbs.onHostUpdate?.(data.host);
                if (data.listeners) cbs.onListenersUpdate?.(data.listeners);
                if (data.room_name) cbs.onRoomNameUpdate?.(data.room_name);
                if (data.room_id) cbs.onRoomIdUpdate?.(data.room_id);
                if (data.kicked_users) cbs.onKickedUsersUpdate?.(data.kicked_users);
                break;
              case "CHAT_MESSAGE":
                if (data.message) cbs.onChatMessage?.(data.message);
                break;
              case "QUEUE_REQUESTS_UPDATE":
                if (data.queue_requests) cbs.onQueueRequestsUpdate?.(data.queue_requests);
                break;
              case "ROOM_FULL":
                cbs.onRoomFull?.(data.detail || "Room is full (max 20 listeners)");
                break;
              case "ROOM_ERROR":
                cbs.onRoomError?.(data.detail || "Unable to connect to room.");
                break;
              case "SYNC_STATE":
                if (data.host) cbs.onHostUpdate?.(data.host);
                if (data.room_name) cbs.onRoomNameUpdate?.(data.room_name);
                cbs.onSyncState?.(data);
                break;
              case "KICKED":
                cbs.onKicked?.(data.reason || "Kicked from room");
                break;
              case "SYNC_WALLPAPER":
                if (data.wallpaper) cbs.onWallpaperUpdate?.(data.wallpaper);
                break;
              case "SYNC_PLAY":
                if (data.state) cbs.onSyncPlay?.(data.state.current_time);
                break;
              case "SYNC_PAUSE":
                if (data.state) cbs.onSyncPause?.(data.state.current_time);
                break;
              case "SYNC_SEEK":
                if (data.state) cbs.onSyncSeek?.(data.state.current_time);
                break;
              case "SYNC_CHANGE_TRACK":
                if (data.state?.track) cbs.onSyncChangeTrack?.(data.state.track, data.state);
                break;
              case "SYNC_UPDATE_QUEUE":
                if (data.state?.queue) cbs.onSyncQueue?.(data.state.queue);
                break;
              case "ERROR":
                console.warn("[WebSocket Error]", data.detail);
                if (data.state) {
                  if (data.state.track) cbs.onSyncChangeTrack?.(data.state.track);
                  if (data.state.is_playing) cbs.onSyncPlay?.(data.state.current_time);
                  else cbs.onSyncPause?.(data.state.current_time);
                }
                break;
              default:
                break;
            }
          } catch (err) {
            console.error("WS Parse Error", err);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          socketRef.current = null;
          if (retryCountRef.current < 5) {
            const timeout = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
            retryCountRef.current += 1;
            reconnectTimeoutRef.current = setTimeout(connect, timeout);
          }
        };
        ws.onerror = () => ws.close();
      } catch (err) {
        console.warn("[WebSocket] Failed to construct:", err);
      }
    };

    connect();
    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.close();
      }
    };
  }, [roomCode, username, userId, roomName, roomId, isCreate, externalIsConnected]);

  const sendAction = useCallback((action, payload = {}) => {
    const msg = JSON.stringify({ action, payload });
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(msg);
    } else if (socketRef.current && socketRef.current.readyState === WebSocket.CONNECTING) {
      messageQueueRef.current.push(msg);
    }
  }, []);

  const sendChatMessage = useCallback((text, avatarUrl = "") => {
    sendAction("SEND_CHAT", { text, avatar_url: avatarUrl });
  }, [sendAction]);

  const requestSync = useCallback(() => {
    sendAction("REQUEST_SYNC", {});
  }, [sendAction]);

  return { isConnected, sendAction, sendChatMessage, requestSync };
}
