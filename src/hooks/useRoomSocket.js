import { useEffect, useRef, useState, useCallback } from "react";

export function useRoomSocket({
  roomCode = "ROOM-808",
  username = "Listener",
  onSyncPlay,
  onSyncPause,
  onSyncSeek,
  onSyncChangeTrack,
  onSyncQueue,
  onListenersUpdate,
  onHostUpdate,
  onKicked,
  onWallpaperUpdate,
}) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef({
    onSyncPlay,
    onSyncPause,
    onSyncSeek,
    onSyncChangeTrack,
    onSyncQueue,
    onListenersUpdate,
    onHostUpdate,
    onKicked,
    onWallpaperUpdate,
  });

  // Keep latest callbacks in ref without triggering reconnects
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
    };
  });

  useEffect(() => {
    if (!roomCode) {
      return;
    }

    // If running in development without backend, fail silently and allow standalone playback
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname || "localhost";
    const wsUrl = `${protocol}//${host}:8000/ws/rooms/${roomCode}?username=${encodeURIComponent(username)}`;

    let ws;
    try {
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const cbs = callbacksRef.current;
          switch (data.type) {
            case "ROOM_STATE_INIT":
              if (data.host && cbs.onHostUpdate) {
                cbs.onHostUpdate(data.host);
              }
              if (data.listeners && cbs.onListenersUpdate) {
                cbs.onListenersUpdate(data.listeners);
              }
              if (data.state) {
                if (data.state.wallpaper && cbs.onWallpaperUpdate) {
                  cbs.onWallpaperUpdate(data.state.wallpaper);
                }
                if (data.state.track && cbs.onSyncChangeTrack) {
                  cbs.onSyncChangeTrack(data.state.track);
                }
                if (data.state.current_time !== undefined && cbs.onSyncSeek) {
                  cbs.onSyncSeek(data.state.current_time);
                }
                if (data.state.is_playing && cbs.onSyncPlay) {
                  cbs.onSyncPlay(data.state.current_time);
                }
                if (data.state.queue && cbs.onSyncQueue) {
                  cbs.onSyncQueue(data.state.queue);
                }
              }
              break;

            case "HOST_UPDATE":
              if (cbs.onHostUpdate && data.host) {
                cbs.onHostUpdate(data.host);
              }
              if (cbs.onListenersUpdate && data.listeners) {
                cbs.onListenersUpdate(data.listeners);
              }
              break;

            case "LISTENERS_UPDATE":
              if (cbs.onListenersUpdate && data.listeners) {
                cbs.onListenersUpdate(data.listeners);
              }
              if (cbs.onHostUpdate && data.host) {
                cbs.onHostUpdate(data.host);
              }
              break;

            case "KICKED":
              if (cbs.onKicked) {
                cbs.onKicked(data.reason || "Kicked from room");
              }
              break;

            case "SYNC_WALLPAPER":
              if (cbs.onWallpaperUpdate && data.wallpaper) {
                cbs.onWallpaperUpdate(data.wallpaper);
              }
              break;

            case "SYNC_PLAY":
              if (cbs.onSyncPlay && data.state) {
                cbs.onSyncPlay(data.state.current_time);
              }
              break;

            case "SYNC_PAUSE":
              if (cbs.onSyncPause && data.state) {
                cbs.onSyncPause(data.state.current_time);
              }
              break;

            case "SYNC_SEEK":
              if (cbs.onSyncSeek && data.state) {
                cbs.onSyncSeek(data.state.current_time);
              }
              break;

            case "SYNC_CHANGE_TRACK":
              if (cbs.onSyncChangeTrack && data.state?.track) {
                cbs.onSyncChangeTrack(data.state.track);
              }
              break;

            case "SYNC_UPDATE_QUEUE":
              if (cbs.onSyncQueue && data.state?.queue) {
                cbs.onSyncQueue(data.state.queue);
              }
              break;

            default:
              break;
          }
        } catch {
          // Ignore invalid JSON
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.warn("[WebSocket] Could not connect to room sync:", err);
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [roomCode, username]);

  const sendAction = useCallback((action, payload = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          action,
          payload,
        })
      );
    }
  }, []);

  return {
    isConnected,
    sendAction,
  };
}
