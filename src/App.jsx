import { useEffect, useRef, useState, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import PlayerBar from "./components/PlayerBar";
import TrackList from "./components/TrackList";
import { useRoomSocket } from "./hooks/useRoomSocket";
import { generateRoomCode, normalizeRoomCode } from "./roomCode";

const PIXEL_MEDIA = [
  { src: "/pixel-0.gif", alt: "Pixel music looping animation 0" }, { src: "/pixel-1.jpg", alt: "Pixel music looping animation 1" },
  { src: "/pixel-2.jpg", alt: "Pixel music artwork 2" }, { src: "/pixel-4.jpg", alt: "Pixel music artwork 4" },
  { src: "/pixel-6.jpg", alt: "Pixel music artwork 6" }, { src: "/pixel-7.gif", alt: "Pixel music artwork 7" },
  { src: "/pixel-9.jpg", alt: "Pixel music artwork 9" }, { src: "/pixel-10.jpg", alt: "Pixel music artwork 10" },
  { src: "/pixel-11.jpg", alt: "Pixel music artwork 11" }, { src: "/pixel-13.jpg", alt: "Pixel music artwork 13" },
  { src: "/pixel-14.jpg", alt: "Pixel music artwork 14" }, { src: "/pixel-15.png", alt: "Pixel music artwork 15" },
  { src: "/pixel-16.jpg", alt: "Pixel music artwork 16" }, { src: "/pixel-17.jpg", alt: "Pixel music artwork 17" },
  { src: "/pixel-18.png", alt: "Pixel music artwork 18" },
];

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const LAST_MEDIA_KEY = "syncroom_last_media_index";
const BG_MUSIC_SRC = "/lobby-loop.mp3";
const DARK_SILVER_BORDER = "#525252";

const DEFAULT_CATALOG = [
  { id: "track-1", title: "Lobby Pixel Loop", artist: "Columbina", duration: "03:45", src: BG_MUSIC_SRC, cover: "/pixel-0.gif", sourceLabel: "ROOM LOOP" },
  { id: "track-2", title: "80s Cyber Vibe", artist: "Howler Arcade", duration: "01:25", src: "https://raw.githubusercontent.com/goldfire/howler.js/master/examples/player/audio/80s_vibe.mp3", cover: "/pixel-1.jpg", sourceLabel: "STREAM" },
  { id: "track-3", title: "Rave Digger", artist: "Pixel Synth", duration: "01:40", src: "https://raw.githubusercontent.com/goldfire/howler.js/master/examples/player/audio/rave_digger.mp3", cover: "/pixel-7.gif", sourceLabel: "STREAM" },
  { id: "track-4", title: "Running Out of Time", artist: "Retro Wave", duration: "01:30", src: "https://raw.githubusercontent.com/goldfire/howler.js/master/examples/player/audio/running_out.mp3", cover: "/pixel-8.gif", sourceLabel: "STREAM" },
  { id: "track-5", title: "Viper Synth", artist: "MDN WebAudio", duration: "00:58", src: "https://raw.githubusercontent.com/mdn/webaudio-examples/main/audio-analyser/viper.mp3", cover: "/pixel-14.jpg", sourceLabel: "STREAM" },
  { id: "track-6", title: "Neon City Rain", artist: "Sample Beats", duration: "02:45", src: "https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3", cover: "/pixel-11.jpg", sourceLabel: "STREAM" },
];

const RANDOM_ROOM_NAMES = [
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
];
const pickRandomRoomName = () => RANDOM_ROOM_NAMES[Math.floor(Math.random() * RANDOM_ROOM_NAMES.length)];

const ROOM_LISTENERS = [{ id: 1, name: "NeonSamurai" }, { id: 2, name: "PixelWanderer" }, { id: 3, name: "CyberColumbina" }];
const BG_COLOR_PRESETS = [{ name: "Pure Black", value: "#000000" }, { name: "Obsidian", value: "#121212" }, { name: "Midnight", value: "#0a0f1e" }, { name: "Deep Forest", value: "#071a12" }, { name: "Deep Plum", value: "#160b1c" }, { name: "Pure White", value: "#ffffff" }];
const COLOR_PRESETS = [{ name: "White", value: "#ffffff" }, { name: "Cyan", value: "#22d3ee" }, { name: "Violet", value: "#a855f7" }, { name: "Amber", value: "#facc15" }, { name: "Emerald", value: "#4ade80" }, { name: "Rose", value: "#fb7185" }];
const TEXT_COLOR_PRESETS = [{ name: "Pure White", value: "#ffffff" }, { name: "Soft Silver", value: "#d4d4d4" }, { name: "Ice Cyan", value: "#67e8f9" }, { name: "Lemon", value: "#fef08a" }, { name: "Mint", value: "#86efac" }, { name: "Blush", value: "#f9a8d4" }];

function getNonRepeatingMedia(items) {
  if (items.length === 0) return { src: "", alt: "" };
  if (items.length === 1) return items[0];
  let lastIndex = -1;
  try { const saved = sessionStorage.getItem(LAST_MEDIA_KEY); if (saved !== null) lastIndex = Number(saved); } catch { /* ignore */ }
  const candidateIndices = items.map((_, idx) => idx).filter((idx) => idx !== lastIndex);
  const chosenIndex = candidateIndices[Math.floor(Math.random() * candidateIndices.length)];
  try { sessionStorage.setItem(LAST_MEDIA_KEY, String(chosenIndex)); } catch { /* ignore */ }
  return items[chosenIndex];
}

function PixelGearIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 [shape-rendering:crispEdges]" aria-hidden="true">
      <rect x="6" y="1" width="4" height="2" fill="currentColor" /><rect x="6" y="13" width="4" height="2" fill="currentColor" />
      <rect x="1" y="6" width="2" height="4" fill="currentColor" /><rect x="13" y="6" width="2" height="4" fill="currentColor" />
      <rect x="3" y="3" width="2" height="2" fill="currentColor" /><rect x="11" y="3" width="2" height="2" fill="currentColor" />
      <rect x="3" y="11" width="2" height="2" fill="currentColor" /><rect x="11" y="11" width="2" height="2" fill="currentColor" />
      <rect x="4" y="4" width="8" height="8" fill="currentColor" /><rect x="6" y="6" width="4" height="4" fill="#000000" />
    </svg>
  );
}

export default function App() {
  const [selectedMedia] = useState(() => getNonRepeatingMedia(PIXEL_MEDIA));
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showAudioPrompt, setShowAudioPrompt] = useState(false);

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("syncroom_user");
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && (!parsed.token || parsed.offline)) {
        localStorage.removeItem("syncroom_user");
        localStorage.removeItem("syncroom_active_username");
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!user);
  const [activeView, setActiveView] = useState("workspace");

  const [themeMode, setThemeMode] = useState(() => {
    try {
      const saved = localStorage.getItem("syncroom_theme_mode");
      if (!saved || saved === "bw") return "black";
      return saved;
    } catch {
      return "black";
    }
  });
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)").matches : true);
  const [bgColor, setBgColor] = useState(() => { try { return localStorage.getItem("syncroom_bg_color") || "#000000"; } catch { return "#000000"; } });
  const [siteColor, setSiteColor] = useState(() => { try { return localStorage.getItem("syncroom_site_color") || "#ffffff"; } catch { return "#ffffff"; } });
  const [textColor, setTextColor] = useState(() => { try { return localStorage.getItem("syncroom_text_color") || "#ffffff"; } catch { return "#ffffff"; } });

  const [mode, setMode] = useState("login");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submittedUser, setSubmittedUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [forgotStep, setForgotStep] = useState(0);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => { try { const v = localStorage.getItem("syncroom_volume"); return v !== null ? Number(v) : 80; } catch { return 80; } });
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  const [savedRoom] = useState(() => {
    try {
      const raw = sessionStorage.getItem("syncroom_active_room");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState("discover");
  const [roomCode, setRoomCode] = useState(() => savedRoom?.isInRoom && savedRoom?.roomCode ? savedRoom.roomCode : generateRoomCode());
  const [roomId, setRoomId] = useState(() => (savedRoom?.isInRoom && savedRoom?.roomId) || "");
  const [roomName, setRoomName] = useState(() => (savedRoom?.isInRoom && savedRoom?.roomName) || "");
  const [kickedUsers, setKickedUsers] = useState([]);
  const [queueRequests, setQueueRequests] = useState([]);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [chatWallpaper, setChatWallpaper] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [isLocallyPaused, setIsLocallyPaused] = useState(false);
  const [currentHost, setCurrentHost] = useState("");
  const [isInRoom, setIsInRoom] = useState(() => Boolean(savedRoom?.isInRoom && savedRoom?.roomCode));

  useEffect(() => {
    try {
      if (isInRoom && roomCode && roomCode !== "LOBBY") {
        sessionStorage.setItem("syncroom_active_room", JSON.stringify({ isInRoom: true, roomCode, roomId, roomName }));
      } else {
        sessionStorage.removeItem("syncroom_active_room");
      }
    } catch { /* ignore */ }
  }, [isInRoom, roomCode, roomId, roomName]);
  const [wallpaper, setWallpaper] = useState(() => selectedMedia.src);
  const [searchQuery, setSearchQuery] = useState("");
  const [catalog, setCatalog] = useState(DEFAULT_CATALOG);
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(DEFAULT_CATALOG[0]);
  const [currentPlaybackList, setCurrentPlaybackList] = useState(DEFAULT_CATALOG);
  const [queue, setQueue] = useState([]);
  const [localTracks, setLocalTracks] = useState([]);
  const [listeners, setListeners] = useState(ROOM_LISTENERS);
  const [playlists, setPlaylists] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentTracks, setRecentTracks] = useState([]);
  const [playCounts, setPlayCounts] = useState({});

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isRemoteAction = useRef(false);
  const isLocallyPausedRef = useRef(false);
  const pendingSyncTimeRef = useRef(null);
  const settingsAvatarInputRef = useRef(null);
  const [settingsUsername, setSettingsUsername] = useState(() => user?.username || "");
  const [settingsEmail, setSettingsEmail] = useState(() => user?.email || "");
  const [settingsCurrentPassword, setSettingsCurrentPassword] = useState("");
  const [settingsNewPassword, setSettingsNewPassword] = useState("");
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState("");
  const [showSettingsPasswords, setShowSettingsPasswords] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Load Stats on Login
  useEffect(() => {
    if (!user?.token) return;
    let isMounted = true;
    fetch(`${API_BASE}/api/user/stats`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (isMounted) {
          setRecentTracks(data.recent_tracks || []);
          setPlayCounts(data.play_counts || {});
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [user?.token]);

  // Debounced Save Stats
  useEffect(() => {
    if (!user?.token) return;
    const timer = setTimeout(() => {
      fetch(`${API_BASE}/api/user/stats`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ recent_tracks: recentTracks, play_counts: playCounts })
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [recentTracks, playCounts, user?.token]);

  const addToRecents = (track) => setRecentTracks(prev => { const filtered = prev.filter(t => t.id !== track.id); return [track, ...filtered].slice(0, 50); });
  const incrementPlayCount = (track) => setPlayCounts(prev => ({ ...prev, [track.id]: (prev[track.id] || 0) + 1 }));

  const fetchTrendingTracks = useCallback(() => {
    fetch(`${API_BASE}/api/music/trending?limit=5`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data?.tracks) setTrendingTracks(data.tracks);
      })
      .catch(() => {});
  }, []);

  const recordGlobalPlay = (track) => {
    if (!track?.id || !track?.src || (typeof track.src === "string" && track.src.startsWith("blob:"))) return;
    fetch(`${API_BASE}/api/music/record-play`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(track),
    })
      .then(() => fetchTrendingTracks())
      .catch(() => {});
  };

  const allKnownTracks = [...catalog, ...localTracks, ...recentTracks];
  const uniqueTracks = Array.from(new Map(allKnownTracks.map(t => [t.id, t])).values());
  const topPlayedTracks = uniqueTracks.filter(t => playCounts[t.id] > 0).sort((a, b) => playCounts[b.id] - playCounts[a.id]).slice(0, 5);

  const handleToggleFavorite = async (track) => {
    if (!track?.id) return;
    const exists = favorites.some(f => f.id === track.id);
    if (exists) setFavorites(prev => prev.filter(f => f.id !== track.id));
    else setFavorites(prev => [track, ...prev]);
    const token = user?.token;
    if (!token || (typeof track.src === "string" && track.src.startsWith("blob:"))) return;
    try {
      await fetch(`${API_BASE}/api/music/favorites`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(track) });
    } catch {
      if (exists) setFavorites(prev => [track, ...prev]);
      else setFavorites(prev => prev.filter(f => f.id !== track.id));
    }
  };

  const handleAddToPlaylist = async (playlistId, track) => {
    if (!user?.token) return;
    try {
      const res = await fetch(`${API_BASE}/api/music/playlists/${playlistId}/tracks`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` }, body: JSON.stringify({ track }) });
      if (res.ok) fetch(`${API_BASE}/api/music/playlists`, { headers: { Authorization: `Bearer ${user.token}` } }).then(r => r.json()).then(data => setPlaylists(data.playlists || [])).catch(() => {});
    } catch { /* ignore */ }
  };

  const handleCreatePlaylist = async () => {
    if (!user?.token) return null;
    try {
      const res = await fetch(`${API_BASE}/api/music/playlists`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` }, body: JSON.stringify({ name: "New playlist" }) });
      if (res.ok) { const newPlaylist = await res.json(); setPlaylists(prev => [...prev, newPlaylist]); return newPlaylist.id; }
    } catch { /* ignore */ }
    return null;
  };

  const handleRenamePlaylist = async (playlistId, newName) => {
    if (!user?.token) return;
    try {
      await fetch(`${API_BASE}/api/music/playlists/${playlistId}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` }, body: JSON.stringify({ name: newName }) });
      setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, name: newName } : p));
    } catch { /* ignore */ }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!user?.token || !window.confirm("Delete this playlist?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/music/playlists/${playlistId}`, { method: "DELETE", headers: { Authorization: `Bearer ${user.token}` } });
      if (res.ok) setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    } catch { /* ignore */ }
  };

  const handleRemoveTrackFromPlaylist = async (playlistId, trackId) => {
    if (!user?.token) return;
    try {
      const res = await fetch(`${API_BASE}/api/music/playlists/${playlistId}/tracks/${trackId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        setPlaylists(prev => prev.map(p => {
          if (p.id === playlistId) {
            return { ...p, tracks: (p.tracks || []).filter(t => t.id !== trackId) };
          }
          return p;
        }));
      }
    } catch { /* ignore */ }
  };

  const isFavorite = (trackId) => favorites.some(f => f.id === trackId);

  useEffect(() => { let isMounted = true; fetch(`${API_BASE}/api/music/catalog`).then((res) => res.ok ? res.json() : Promise.reject()).then((data) => { if (isMounted && data?.tracks?.length > 0) setCatalog(data.tracks); }).catch(() => {}); return () => { isMounted = false; }; }, []);
  useEffect(() => { fetchTrendingTracks(); }, [fetchTrendingTracks]);
  useEffect(() => { const token = user?.token; if (!token) return; let cancelled = false; fetch(`${API_BASE}/api/music/favorites`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.ok ? res.json() : Promise.reject()).then((data) => { if (cancelled) return; setFavorites(data.favorites || []); }).catch(() => {}); return () => { cancelled = true; }; }, [user?.token, user?.id]);
  useEffect(() => { if (!user?.token) return; fetch(`${API_BASE}/api/music/playlists`, { headers: { Authorization: `Bearer ${user.token}` } }).then(res => res.json()).then(data => setPlaylists(data.playlists || [])).catch(() => {}); }, [user?.token]);

  useEffect(() => {
    if (!user?.token || (user?.uid && user?.avatar_url !== undefined)) return;
    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((me) => {
        if (me?.uid || me?.avatar_url !== undefined) {
          setUser((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, uid: me.uid || prev.uid, avatar_url: me.avatar_url || "" };
            try { localStorage.setItem("syncroom_user", JSON.stringify(updated)); } catch { /* ignore */ }
            return updated;
          });
        }
      })
      .catch(() => {});
  }, [user?.token, user?.uid, user?.avatar_url]);

  const handleUploadAvatar = (file) => {
    if (!file || !user?.token) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setUser((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, avatar_url: dataUrl };
          try { localStorage.setItem("syncroom_user", JSON.stringify(updated)); } catch { /* ignore */ }
          return updated;
        });
        fetch(`${API_BASE}/api/user/avatar`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
          body: JSON.stringify({ avatar_url: dataUrl }),
        }).catch(() => {});
      };
      img.src = ev.target?.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    if (!user?.token) return;
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, avatar_url: "" };
      try { localStorage.setItem("syncroom_user", JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
    fetch(`${API_BASE}/api/user/avatar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ avatar_url: "" }),
    }).catch(() => {});
  };

  const handleSaveProfileSettings = async (e) => {
    e.preventDefault();
    if (!user?.token) return;
    setSettingsError("");
    setSettingsMessage("");
    setIsSavingSettings(true);
    try {
      const res = await fetch(`${API_BASE}/api/user/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ username: settingsUsername.trim(), email: settingsEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.user) {
        const updated = {
          ...user,
          username: data.user.username,
          email: data.user.email,
          token: data.access_token || user.token,
        };
        setUser(updated);
        try {
          localStorage.setItem("syncroom_user", JSON.stringify(updated));
          localStorage.setItem("syncroom_active_username", updated.username);
        } catch { /* ignore */ }
        setSettingsMessage("Account details updated successfully.");
      } else {
        setSettingsError(data.detail || "Failed to update account details.");
      }
    } catch {
      setSettingsError("Network error updating account details.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleChangePasswordSettings = async (e) => {
    e.preventDefault();
    if (!user?.token) return;
    setSettingsError("");
    setSettingsMessage("");
    if (settingsNewPassword !== settingsConfirmPassword) {
      setSettingsError("New passwords do not match.");
      return;
    }
    setIsSavingSettings(true);
    try {
      const res = await fetch(`${API_BASE}/api/user/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ current_password: settingsCurrentPassword, new_password: settingsNewPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSettingsCurrentPassword("");
        setSettingsNewPassword("");
        setSettingsConfirmPassword("");
        setSettingsMessage("Password updated successfully.");
      } else {
        setSettingsError(data.detail || "Failed to update password.");
      }
    } catch {
      setSettingsError("Network error updating password.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePermitAudio = () => {
    setShowAudioPrompt(false);
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
      }
    } catch { /* ignore */ }
    if (audioRef.current && currentTrack?.src) {
      if (!audioRef.current.src) audioRef.current.src = currentTrack.src;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const resolveAudioUrl = (src) => {
    try { return new URL(src, window.location.href).href; } catch { return src; }
  };

  const handleRemotePlay = useCallback((serverTime) => {
    if (isLocallyPausedRef.current) return;
    isRemoteAction.current = true;
    if (audioRef.current) {
      if (serverTime !== undefined && Math.abs(audioRef.current.currentTime - serverTime) > 1.0) {
        pendingSyncTimeRef.current = serverTime;
        audioRef.current.currentTime = serverTime;
        setCurrentTime(serverTime);
      }
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setShowAudioPrompt(false);
        if (pendingSyncTimeRef.current !== null && audioRef.current && Math.abs(audioRef.current.currentTime - pendingSyncTimeRef.current) > 0.8) {
          audioRef.current.currentTime = pendingSyncTimeRef.current;
          setCurrentTime(pendingSyncTimeRef.current);
          pendingSyncTimeRef.current = null;
        }
      }).catch(() => {
        setShowAudioPrompt(true);
      });
    }
    setTimeout(() => { isRemoteAction.current = false; }, 150);
  }, []);

  const handleRemotePause = useCallback((serverTime) => {
    isRemoteAction.current = true;
    isLocallyPausedRef.current = false;
    setIsLocallyPaused(false);
    if (audioRef.current) {
      if (serverTime !== undefined) {
        audioRef.current.currentTime = serverTime;
        setCurrentTime(serverTime);
      }
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setTimeout(() => { isRemoteAction.current = false; }, 150);
  }, []);

  const handleRemoteSeek = useCallback((seekTime) => {
    if (isLocallyPausedRef.current) return;
    isRemoteAction.current = true;
    if (audioRef.current && Math.abs(audioRef.current.currentTime - seekTime) > 0.5) {
      pendingSyncTimeRef.current = seekTime;
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
    setTimeout(() => { isRemoteAction.current = false; }, 150);
  }, []);

  const handleRemoteChangeTrack = useCallback((syncTrack, syncState) => {
    if (!syncTrack) return;
    const isNewTrack = syncTrack.id !== currentTrack?.id;
    const targetTime = syncState?.current_time ?? 0;
    const shouldPlay = Boolean(syncState?.is_playing) && !isLocallyPausedRef.current;

    if (isNewTrack) {
      isRemoteAction.current = true;
      setCurrentTrack(syncTrack);
      addToRecents(syncTrack);
      incrementPlayCount(syncTrack);
      setCurrentPlaybackList(catalog);
    }

    if (audioRef.current) {
      const targetUrl = resolveAudioUrl(syncTrack.src);
      if (audioRef.current.src !== targetUrl) {
        audioRef.current.src = syncTrack.src;
      }
      pendingSyncTimeRef.current = targetTime;
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);

      if (shouldPlay) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          setShowAudioPrompt(false);
          if (pendingSyncTimeRef.current !== null && audioRef.current && Math.abs(audioRef.current.currentTime - pendingSyncTimeRef.current) > 0.8) {
            audioRef.current.currentTime = pendingSyncTimeRef.current;
            setCurrentTime(pendingSyncTimeRef.current);
            pendingSyncTimeRef.current = null;
          }
        }).catch(() => {
          setShowAudioPrompt(true);
        });
      }
    }
    if (isNewTrack) {
      setTimeout(() => { isRemoteAction.current = false; }, 150);
    }
  }, [currentTrack?.id, catalog]);

  const handleRemoteQueue = useCallback((syncQueue) => { if (Array.isArray(syncQueue)) setQueue(syncQueue); }, []);
  const handleRemoteListeners = useCallback((updatedListeners) => { if (Array.isArray(updatedListeners)) setListeners(updatedListeners); }, []);
  const handleHostUpdate = useCallback((newHost) => { if (newHost) setCurrentHost(newHost); }, []);
  const handleKicked = useCallback((reason) => { alert(reason || "You were removed from the room by the host."); setIsInRoom(false); setIsCreatingRoom(false); setChatWallpaper(null); setKickedUsers([]); setRoomId(""); setRoomCode("LOBBY"); setActiveTab("rooms"); if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); } }, []);
  const handleWallpaperUpdate = useCallback((newWallpaper) => {
    if (newWallpaper) {
      setWallpaper(newWallpaper);
      setChatWallpaper(newWallpaper);
    }
  }, []);
  const activeUsername = user?.username || "PlayerOne";

  const isUserHost = Boolean(
    isInRoom &&
      user?.username &&
      (currentHost ? user.username.toLowerCase() === currentHost.toLowerCase() : listeners[0]?.name === user.username)
  );

  const handleChatMessage = useCallback((message) => {
    if (message) {
      setChatMessages((prev) => [...prev, message]);
    }
  }, []);

  const handleChatHistory = useCallback((history) => {
    if (Array.isArray(history)) {
      setChatMessages(history);
    }
  }, []);

  const handleRoomNameUpdate = useCallback((name) => {
    if (name) setRoomName(name);
  }, []);

  const handleRoomIdUpdate = useCallback((rid) => {
    if (rid) setRoomId(rid);
  }, []);

  const handleKickedUsersUpdate = useCallback((list) => {
    if (Array.isArray(list)) setKickedUsers(list);
  }, []);

  const handleQueueRequestsUpdate = useCallback((list) => {
    if (Array.isArray(list)) setQueueRequests(list);
  }, []);

  const handleRoomFull = useCallback((detail) => {
    alert(detail || "Room has reached its maximum capacity of 20 users.");
    setIsInRoom(false);
    setIsCreatingRoom(false);
    setChatWallpaper(null);
    setKickedUsers([]);
    setRoomId("");
    setRoomCode("LOBBY");
    setActiveTab("rooms");
  }, []);

  const handleRoomError = useCallback((detail) => {
    alert(detail || "Unable to connect to room.");
    setIsInRoom(false);
    setIsCreatingRoom(false);
    setChatWallpaper(null);
    setKickedUsers([]);
    setRoomId("");
    setRoomCode(generateRoomCode());
    setActiveTab("rooms");
  }, []);

  const handleSyncState = useCallback((syncData) => {
    const state = syncData?.state;
    if (!state) return;
    isRemoteAction.current = true;
    isLocallyPausedRef.current = false;
    setIsLocallyPaused(false);

    if (state.track) {
      setCurrentTrack(state.track);
      if (audioRef.current) {
        const targetUrl = resolveAudioUrl(state.track.src);
        if (audioRef.current.src !== targetUrl) {
          audioRef.current.src = state.track.src;
        }
      }
    }
    const targetTime = state.current_time ?? 0;
    if (audioRef.current) {
      pendingSyncTimeRef.current = targetTime;
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
    if (state.is_playing) {
      audioRef.current?.play().then(() => {
        setIsPlaying(true);
        setShowAudioPrompt(false);
        if (pendingSyncTimeRef.current !== null && audioRef.current && Math.abs(audioRef.current.currentTime - pendingSyncTimeRef.current) > 0.8) {
          audioRef.current.currentTime = pendingSyncTimeRef.current;
          setCurrentTime(pendingSyncTimeRef.current);
          pendingSyncTimeRef.current = null;
        }
      }).catch(() => {
        setShowAudioPrompt(true);
      });
    } else {
      audioRef.current?.pause();
      setIsPlaying(false);
      pendingSyncTimeRef.current = null;
    }
    setTimeout(() => { isRemoteAction.current = false; }, 150);
  }, []);

  const { sendAction, sendChatMessage, requestSync } = useRoomSocket({
    roomCode: isAuthenticated && isInRoom ? roomCode : "",
    username: activeUsername,
    userId: user?.uid || "",
    roomName: roomName,
    roomId: roomId,
    isCreate: isCreatingRoom,
    onSyncPlay: handleRemotePlay,
    onSyncPause: handleRemotePause,
    onSyncSeek: handleRemoteSeek,
    onSyncChangeTrack: handleRemoteChangeTrack,
    onSyncQueue: handleRemoteQueue,
    onListenersUpdate: handleRemoteListeners,
    onHostUpdate: handleHostUpdate,
    onKicked: handleKicked,
    onWallpaperUpdate: handleWallpaperUpdate,
    onChatMessage: handleChatMessage,
    onChatHistory: handleChatHistory,
    onRoomNameUpdate: handleRoomNameUpdate,
    onRoomIdUpdate: handleRoomIdUpdate,
    onKickedUsersUpdate: handleKickedUsersUpdate,
    onQueueRequestsUpdate: handleQueueRequestsUpdate,
    onRoomFull: handleRoomFull,
    onRoomError: handleRoomError,
    onSyncState: handleSyncState,
  });

  const handleExitRoom = () => {
    if (isUserHost && audioRef.current) {
      sendAction("PAUSE", { current_time: audioRef.current.currentTime });
    }
    setRoomCode(generateRoomCode());
    setRoomId("");
    setRoomName("");
    setKickedUsers([]);
    setQueueRequests([]);
    setIsCreatingRoom(false);
    setChatWallpaper(null);
    setChatMessages([]);
    setIsInRoom(false);
    if (activeTab === "chat") setActiveTab("rooms");
  };

  const handleJoinRoom = (code) => {
    const normalized = normalizeRoomCode(code);
    if (!normalized) return;
    setRoomCode(normalized);
    setRoomId("");
    setRoomName("");
    setKickedUsers([]);
    setQueueRequests([]);
    setIsCreatingRoom(false);
    setChatWallpaper(null);
    setChatMessages([]);
    setIsInRoom(true);
  };

  const handleCreateRoom = async (code, name, customRoomId = "") => {
    let targetCode = normalizeRoomCode(code);
    let targetRoomId = (customRoomId || "").trim().toUpperCase();
    if (!targetCode || !targetRoomId) {
      try {
        const res = await fetch(`${API_BASE}/api/rooms/generate`);
        if (res.ok) {
          const data = await res.json();
          if (!targetCode && data?.room_code) targetCode = data.room_code;
          if (!targetRoomId && data?.room_id) targetRoomId = data.room_id;
        }
      } catch { /* fallback below */ }
      if (!targetCode) targetCode = generateRoomCode();
    }
    const targetName = (name && name.trim()) ? name.trim() : pickRandomRoomName();
    setRoomCode(targetCode);
    setRoomId(targetRoomId);
    setRoomName(targetName);
    setKickedUsers([]);
    setQueueRequests([]);
    setIsCreatingRoom(true);
    setChatWallpaper(null);
    setCurrentHost(activeUsername);
    setChatMessages([]);
    setIsInRoom(true);
  };

  const handleGiveLeadership = (targetName) => sendAction("GIVE_LEADERSHIP", { target_name: targetName });
  const handleKickUser = (targetName) => sendAction("KICK_USER", { target_name: targetName });
  const handleAllowUser = (targetName) => sendAction("ALLOW_USER", { target_name: targetName });
  const handleRequestQueueAdd = (track) => sendAction("REQUEST_QUEUE_ADD", { track });
  const handleEditQueueRequest = (requestId, track) => sendAction("EDIT_QUEUE_REQUEST", { request_id: requestId, track });
  const handleCancelQueueRequest = (requestId) => sendAction("CANCEL_QUEUE_REQUEST", { request_id: requestId });
  const handleResolveQueueRequest = (requestId, decision) => sendAction("RESOLVE_QUEUE_REQUEST", { request_id: requestId, decision });
  const handleChangeWallpaper = (newWp) => {
    setWallpaper(newWp);
    setChatWallpaper(newWp);
    sendAction("CHANGE_WALLPAPER", { wallpaper: newWp });
  };

  useEffect(() => { if (!window.matchMedia) return; const mq = window.matchMedia("(prefers-color-scheme: dark)"); const handleChange = (e) => setSystemPrefersDark(e.matches); mq.addEventListener("change", handleChange); return () => mq.removeEventListener("change", handleChange); }, []);
  useEffect(() => { PIXEL_MEDIA.forEach((item) => { if (item.src !== selectedMedia.src) { const img = new Image(); img.src = item.src; } }); }, [selectedMedia.src]);
  useEffect(() => { if (audioRef.current) { audioRef.current.volume = volume / 100; audioRef.current.muted = isMuted; } try { localStorage.setItem("syncroom_volume", String(volume)); } catch { /* ignore */ } }, [volume, isMuted]);
  useEffect(() => { try { localStorage.setItem("syncroom_theme_mode", themeMode); localStorage.setItem("syncroom_bg_color", bgColor); localStorage.setItem("syncroom_site_color", siteColor); localStorage.setItem("syncroom_text_color", textColor); } catch { /* ignore */ } }, [themeMode, bgColor, siteColor, textColor]);

  const handleTimeUpdate = () => { if (audioRef.current) { setCurrentTime(audioRef.current.currentTime); if (audioRef.current.duration) setDuration(audioRef.current.duration); } };
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      if (audioRef.current.duration) setDuration(audioRef.current.duration);
      if (pendingSyncTimeRef.current !== null) {
        audioRef.current.currentTime = pendingSyncTimeRef.current;
        setCurrentTime(pendingSyncTimeRef.current);
        pendingSyncTimeRef.current = null;
      }
    }
  };

  const playTrackNow = (track) => {
    setCurrentTrack(track); addToRecents(track); incrementPlayCount(track); recordGlobalPlay(track);
    if (!isRemoteAction.current && (!isInRoom || isUserHost)) sendAction("CHANGE_TRACK", { track, current_time: 0 });
    const audio = audioRef.current;
    if (audio) { audio.src = track.src; audio.currentTime = 0; audio.play().then(() => { setIsPlaying(true); setIsLocallyPaused(false); setShowAudioPrompt(false); }).catch(() => {}); }
  };

  const handleNext = () => {
    if (queue.length > 0) { const nextTrack = queue[0]; const updatedQueue = queue.slice(1); setQueue(updatedQueue); if (!isRemoteAction.current) sendAction("UPDATE_QUEUE", { queue: updatedQueue }); playTrackNow(nextTrack); return; }
    if (currentPlaybackList && currentPlaybackList.length > 0) {
      const currentIdx = currentPlaybackList.findIndex((t) => t.id === currentTrack?.id);
      let nextIdx;
      if (isShuffle) {
        nextIdx = Math.floor(Math.random() * currentPlaybackList.length);
        if (currentPlaybackList.length > 1 && nextIdx === currentIdx) {
          nextIdx = (nextIdx + 1) % currentPlaybackList.length;
        }
      } else {
        if (currentIdx === -1 || currentIdx >= currentPlaybackList.length - 1) {
          if (isLooping) {
            nextIdx = 0;
          } else {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
              setCurrentTime(0);
              setIsPlaying(false);
              if (!isRemoteAction.current && (!isInRoom || isUserHost)) sendAction("PAUSE", { current_time: 0 });
            }
            return;
          }
        } else {
          nextIdx = currentIdx + 1;
        }
      }
      playTrackNow(currentPlaybackList[nextIdx]);
    }
  };

  const handlePrev = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) { audioRef.current.currentTime = 0; setCurrentTime(0); if (!isRemoteAction.current && (!isInRoom || isUserHost)) sendAction("SEEK", { current_time: 0 }); return; }
    if (currentPlaybackList && currentPlaybackList.length > 0) {
      const currentIdx = currentPlaybackList.findIndex((t) => t.id === currentTrack?.id);
      const prevIdx = currentIdx > 0 ? currentIdx - 1 : currentPlaybackList.length - 1;
      playTrackNow(currentPlaybackList[prevIdx]);
    }
  };

  const handleAudioEnded = () => { if (isLooping) { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); if (!isRemoteAction.current && (!isInRoom || isUserHost)) sendAction("PLAY", { current_time: 0 }); } } else { handleNext(); } };
  
  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      if (isInRoom && !isUserHost) {
        // Automatically synchronize the listener with the host!
        isLocallyPausedRef.current = false;
        setIsLocallyPaused(false);
        requestSync();
        return;
      }
      if (!audio.src && currentTrack?.src) audio.src = currentTrack.src;
      audio.play().then(() => {
        setIsPlaying(true);
        setShowAudioPrompt(false);
        isLocallyPausedRef.current = false;
        setIsLocallyPaused(false);
        if (!isRemoteAction.current) sendAction("PLAY", { current_time: audio.currentTime });
      }).catch(() => {});
    } else {
      if (isInRoom && !isUserHost) {
        // Listener pauses only for themselves, not the whole room
        isLocallyPausedRef.current = true;
        setIsLocallyPaused(true);
        audio.pause();
        setIsPlaying(false);
        return;
      }
      audio.pause();
      setIsPlaying(false);
      if (!isRemoteAction.current) sendAction("PAUSE", { current_time: audio.currentTime });
    }
  };
  
  const handleSelectTrack = (track, listContext = null) => {
    if (listContext && Array.isArray(listContext)) setCurrentPlaybackList(listContext);
    if (currentTrack?.id === track.id) { if (audioRef.current) { audioRef.current.currentTime = 0; setCurrentTime(0); if (!isRemoteAction.current) sendAction("SEEK", { current_time: 0 }); if (audioRef.current.paused) handleTogglePlay(); } return; }
    playTrackNow(track);
  };

  const handleSeek = (timeSeconds) => { if (audioRef.current) { audioRef.current.currentTime = timeSeconds; setCurrentTime(timeSeconds); if (!isRemoteAction.current) sendAction("SEEK", { current_time: timeSeconds }); } };
  const handleAddToQueue = (track) => { const nextQ = [...queue, track]; setQueue(nextQ); if (!isRemoteAction.current) sendAction("UPDATE_QUEUE", { queue: nextQ }); };
  const handleAddTracksToQueue = (tracksToAdd) => {
    if (!Array.isArray(tracksToAdd) || tracksToAdd.length === 0) return;
    const nextQ = [...queue, ...tracksToAdd];
    setQueue(nextQ);
    if (!isRemoteAction.current) sendAction("UPDATE_QUEUE", { queue: nextQ });
  };
  const handleRemoveFromQueue = (index) => { const nextQ = queue.filter((_, i) => i !== index); setQueue(nextQ); if (!isRemoteAction.current) sendAction("UPDATE_QUEUE", { queue: nextQ }); };
  const handleClearQueue = () => { setQueue([]); if (!isRemoteAction.current) sendAction("UPDATE_QUEUE", { queue: [] }); };
  const handleLoadAllToQueue = () => { const all = [...catalog]; setQueue(all); setCurrentPlaybackList(all); if (!isRemoteAction.current) sendAction("UPDATE_QUEUE", { queue: all }); };
  const handleImportLocalFiles = (e) => { const files = Array.from(e.target.files || []); if (files.length === 0) return; const imported = files.map((file, i) => ({ id: `local-${Date.now()}-${i}`, title: file.name.replace(/\.[^/.]+$/, ""), artist: "Local Storage", duration: "03:00", src: URL.createObjectURL(file), cover: "/pixel-18.png", sourceLabel: "LOCAL FILE" })); setLocalTracks((prev) => [...prev, ...imported]); };

  async function completeEntry() {
    setAuthError(""); setIsSubmitting(true);
    const isSignupMode = mode === "signup";
    if (!password.trim()) return setAuthError("Password is required."), setIsSubmitting(false);
    if (isSignupMode && (!username.trim() || !email.trim())) return setAuthError("Username and Email are required."), setIsSubmitting(false);
    if (!isSignupMode && !loginIdentifier.trim()) return setAuthError("Username/Email is required."), setIsSubmitting(false);
    try {
      const endpoint = isSignupMode ? `${API_BASE}/api/auth/register` : `${API_BASE}/api/auth/login`;
      const payload = isSignupMode ? { username: username.trim(), email: email.trim(), password } : { identifier: loginIdentifier.trim(), password };
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        if (isSignupMode) { setMode("login"); setPassword(""); setAuthError("Account created successfully. Please login."); setIsSubmitting(false); }
        else {
          const data = await res.json(); const resolvedUser = { id: data.user?.id, uid: data.user?.uid, username: data.user?.username, email: data.user?.email, avatar_url: data.user?.avatar_url || "", token: data.access_token, mode };
          localStorage.setItem("syncroom_user", JSON.stringify(resolvedUser)); localStorage.setItem("syncroom_active_username", resolvedUser.username);
          setUser(resolvedUser); setActiveTab("discover"); setActiveView("workspace"); setIsAuthenticated(true); setIsSubmitting(false);
        }
      } else { const errData = await res.json().catch(() => ({})); setAuthError(errData.detail || "Authentication error occurred"); setIsSubmitting(false); }
    } catch { setAuthError("Server is unreachable. Please verify the backend is running on port 8000."); setIsSubmitting(false); }
  }

  const handleSendCode = async () => { if (!forgotEmail.trim()) return setAuthError("Enter your email first."); try { const res = await fetch(`${API_BASE}/api/auth/forgot-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: forgotEmail }) }); const data = await res.json(); if (res.ok) { setForgotStep(2); setAuthError(`Code sent. (DEV: ${data.dev_code})`); } else { setAuthError(data.detail || "Error sending code."); } } catch { setAuthError("Network error."); } };
  const handleResetPassword = async () => { if (!resetCode.trim() || !newPassword.trim()) return setAuthError("Code and new password required."); try { const res = await fetch(`${API_BASE}/api/auth/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: forgotEmail, code: resetCode, new_password: newPassword }) }); const data = await res.json(); if (res.ok) { setForgotStep(0); setMode("login"); setAuthError("Password reset! Please login."); setResetCode(""); setNewPassword(""); } else { setAuthError(data.detail || "Invalid code."); } } catch { setAuthError("Network error."); } };

  /* ==========================================================================
     GOOGLE & APPLE OAUTH HANDLERS (Uncomment when ready to enable in production)
     --------------------------------------------------------------------------
     const handleGoogleLogin = () => {
       const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
       if (!googleClientId) {
         setAuthError("Google Client ID not configured in .env (VITE_GOOGLE_CLIENT_ID).");
         return;
       }
       if (!window.google?.accounts?.id) {
         setAuthError("Google Sign-In SDK is still loading, please try again.");
         return;
       }
       window.google.accounts.id.initialize({
         client_id: googleClientId,
         callback: async (response) => {
           if (!response.credential) return;
           setIsSubmitting(true);
           setAuthError("");
           try {
             const res = await fetch(`${API_BASE}/api/auth/google`, {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ id_token: response.credential }),
             });
             const data = await res.json();
             if (res.ok) {
               const resolvedUser = { id: data.user?.id, username: data.user?.username, email: data.user?.email, token: data.access_token, mode: "google" };
               localStorage.setItem("syncroom_user", JSON.stringify(resolvedUser));
               localStorage.setItem("syncroom_active_username", resolvedUser.username);
               setUser(resolvedUser);
               setIsAuthenticated(true);
             } else {
               setAuthError(data.detail || "Google authentication failed.");
             }
           } catch {
             setAuthError("Network error during Google login.");
           } finally {
             setIsSubmitting(false);
           }
         },
       });
       window.google.accounts.id.prompt();
     };

     const handleAppleLogin = async () => {
       const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID;
       if (!appleClientId) {
         setAuthError("Apple Client ID not configured in .env (VITE_APPLE_CLIENT_ID).");
         return;
       }
       if (!window.AppleID?.auth) {
         setAuthError("Apple Sign-In SDK is still loading, please try again.");
         return;
       }
       try {
         window.AppleID.auth.init({
           clientId: appleClientId,
           scope: "name email",
           redirectURI: window.location.origin,
           usePopup: true,
         });
         const response = await window.AppleID.auth.signIn();
         const idToken = response?.authorization?.id_token;
         if (!idToken) return;

         setIsSubmitting(true);
         setAuthError("");
         const res = await fetch(`${API_BASE}/api/auth/apple`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ id_token: idToken }),
         });
         const data = await res.json();
         if (res.ok) {
           const resolvedUser = { id: data.user?.id, username: data.user?.username, email: data.user?.email, token: data.access_token, mode: "apple" };
           localStorage.setItem("syncroom_user", JSON.stringify(resolvedUser));
           localStorage.setItem("syncroom_active_username", resolvedUser.username);
           setUser(resolvedUser);
           setIsAuthenticated(true);
         } else {
           setAuthError(data.detail || "Apple authentication failed.");
         }
       } catch (err) {
         if (err?.error !== "popup_closed_by_user") {
           setAuthError(err?.error || "Apple authentication error.");
         }
       } finally {
         setIsSubmitting(false);
       }
     };
     ========================================================================== */
  
  function handleSubmit(e) { e.preventDefault(); completeEntry(); }
  function handleInputKeyDown(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); completeEntry(); } }

  async function handleLogout() {
    if (user?.token) {
      try { await fetch(`${API_BASE}/api/user/stats`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` }, body: JSON.stringify({ recent_tracks: recentTracks, play_counts: playCounts }) }); } catch { /* ignore */ }
    }
    try { localStorage.removeItem("syncroom_user"); localStorage.removeItem("syncroom_active_username"); } catch { /* ignore */ }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setRecentTracks([]);
    setPlayCounts({});
    setIsPlaying(false); setRoomCode(generateRoomCode()); setIsInRoom(false); setIsAuthenticated(false); setUser(null); setSubmittedUser(null); setActiveView("workspace");
  }

  const isSignup = mode === "signup";
  const isSystemLight = themeMode === "white" || (themeMode === "system" && !systemPrefersDark);
  const surfaceBg = themeMode === "custom" ? bgColor : (isSystemLight ? "#ffffff" : "#000000");
  const effectiveSiteColor = themeMode === "custom" ? siteColor : (isSystemLight ? "#000000" : "#ffffff");
  const effectiveTextColor = themeMode === "custom" ? textColor : (isSystemLight ? "#000000" : "#ffffff");
  const globalThemeStyle = { backgroundColor: surfaceBg, color: effectiveTextColor, "--site-accent": effectiveSiteColor, "--site-text": effectiveTextColor };

  return (
    <>
      <audio ref={audioRef} preload="auto" onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={handleAudioEnded} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onError={(e) => console.warn("[SyncRoom Audio] Playback error:", e)} />

      {isAuthenticated && showAudioPrompt && (
        <div
          style={{ backgroundColor: surfaceBg === "#000000" ? "#141414" : "#f5f5f5", color: effectiveTextColor }}
          className="fixed top-3 left-3 z-[60] flex items-center gap-2.5 rounded-xl border border-neutral-800 px-3 py-2 text-xs shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="font-medium opacity-85">Allow audio playback?</span>
          <button
            type="button"
            onClick={handlePermitAudio}
            style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }}
            className="pixel-btn rounded-lg px-2.5 py-1 text-[11px] font-medium transition-opacity hover:opacity-80"
          >
            Allow
          </button>
          <button
            type="button"
            onClick={() => setShowAudioPrompt(false)}
            className="text-neutral-400 hover:text-white px-1 text-xs"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {!isAuthenticated ? (
        <main style={globalThemeStyle} className="relative flex h-dvh w-full flex-col justify-center overflow-hidden py-10 sm:py-20">
          <div style={{ backgroundColor: surfaceBg }} className="relative h-full w-full overflow-hidden">
            <img src={selectedMedia.src} alt={selectedMedia.alt} decoding="async" onLoad={() => setImageLoaded(true)} className={`h-full w-full object-cover transition-opacity duration-500 [image-rendering:pixelated] ${imageLoaded ? "opacity-100" : "opacity-0"}`} />
          </div>

          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4 sm:px-6">
            <div style={{ backgroundColor: surfaceBg, color: effectiveTextColor }} className="auth-soft-enter pointer-events-auto w-full max-w-md rounded-3xl shadow-2xl px-6 py-7 sm:px-8 sm:py-8">
              <div className="mb-6 text-center"><span className="text-3xl font-semibold">Illusion</span></div>

              {forgotStep > 0 ? (
                <div className="auth-soft-enter">
                  <h1 className="mb-4 text-xl font-medium sm:text-2xl">{forgotStep === 1 ? "Reset Password" : "Enter Reset Code"}</h1>
                  
                  {forgotStep === 1 && (
                    <div className="space-y-3">
                      <p className="text-xs opacity-75">Enter your email to receive a 6-digit code.</p>
                      <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@example.com" style={{ backgroundColor: surfaceBg, color: effectiveTextColor, borderColor: DARK_SILVER_BORDER, borderRadius: "12px" }} className="w-full rounded-xl border px-3.5 py-2 text-xs focus:outline-none" />
                      <button type="button" onClick={handleSendCode} style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }} className="pixel-btn w-full rounded-xl py-2.5 text-xs font-medium mt-2">Send Code</button>
                    </div>
                  )}

                  {forgotStep === 2 && (
                    <div className="space-y-3">
                      <p className="text-xs opacity-75">Enter the code sent to {forgotEmail} and your new password.</p>
                      <input type="text" value={resetCode} onChange={(e) => setResetCode(e.target.value)} placeholder="6-digit code" style={{ backgroundColor: surfaceBg, color: effectiveTextColor, borderColor: DARK_SILVER_BORDER, borderRadius: "12px" }} className="w-full rounded-xl border px-3.5 py-2 text-xs focus:outline-none" />
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" style={{ backgroundColor: surfaceBg, color: effectiveTextColor, borderColor: DARK_SILVER_BORDER, borderRadius: "12px" }} className="w-full rounded-xl border px-3.5 py-2 pr-10 text-xs focus:outline-none" />
                        <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity" title={showPassword ? "Hide password" : "Show password"} aria-label={showPassword ? "Hide password" : "Show password"}>
                          {showPassword ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <button type="button" onClick={handleResetPassword} style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }} className="pixel-btn w-full rounded-xl py-2.5 text-xs font-medium mt-2">Reset Password</button>
                    </div>
                  )}

                  {authError && <div style={{ borderColor: "#ef4444", color: "#f87171" }} className="auth-soft-enter rounded-xl border bg-red-950/40 px-3.5 py-2 text-center text-xs font-semibold mt-3">{authError}</div>}
                  <button type="button" onClick={() => { setForgotStep(0); setAuthError(""); }} className="mt-4 text-xs opacity-60 hover:opacity-100 block text-center w-full">Back to Login</button>
                </div>
              ) : (
                <>
                  <div className="mb-5 flex gap-3">
                    <button type="button" onClick={() => { setMode("login"); setAuthError(""); }} style={!isSignup ? { backgroundColor: effectiveSiteColor, color: surfaceBg, borderColor: DARK_SILVER_BORDER, borderRadius: "14px" } : { backgroundColor: surfaceBg, color: effectiveTextColor, borderColor: DARK_SILVER_BORDER, borderRadius: "14px" }} className="pixel-btn flex-1 rounded-xl border px-4 py-2 text-xs font-medium sm:text-sm">Login</button>
                    <button type="button" onClick={() => { setMode("signup"); setAuthError(""); }} style={isSignup ? { backgroundColor: effectiveSiteColor, color: surfaceBg, borderColor: DARK_SILVER_BORDER, borderRadius: "14px" } : { backgroundColor: surfaceBg, color: effectiveTextColor, borderColor: DARK_SILVER_BORDER, borderRadius: "14px" }} className="pixel-btn flex-1 rounded-xl border px-4 py-2 text-xs font-medium sm:text-sm">Sign Up</button>
                  </div>

                  <div key={mode} className="auth-soft-enter">
                    <h1 style={{ color: effectiveTextColor }} className="mb-4 text-xl font-medium sm:text-2xl">{isSignup ? "Create account" : "Sign in"}</h1>

                    <form onSubmit={handleSubmit} className="space-y-3.5">
                      {!isSignup ? (
                        <div>
                          <label style={{ color: effectiveTextColor }} className="mb-1.5 block text-xs font-semibold opacity-75">Username or Email</label>
                          <input type="text" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} onKeyDown={handleInputKeyDown} placeholder="pixel_listener or you@example.com" style={{ backgroundColor: surfaceBg, color: effectiveTextColor, borderColor: DARK_SILVER_BORDER, borderRadius: "12px" }} className="w-full rounded-xl border px-3.5 py-2 text-xs sm:text-sm placeholder-neutral-600 focus:outline-none" />
                        </div>
                      ) : (
                        <>
                          <div>
                            <label style={{ color: effectiveTextColor }} className="mb-1.5 block text-xs font-semibold opacity-75">Username</label>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={handleInputKeyDown} placeholder="pixel_listener" style={{ backgroundColor: surfaceBg, color: effectiveTextColor, borderColor: DARK_SILVER_BORDER, borderRadius: "12px" }} className="w-full rounded-xl border px-3.5 py-2 text-xs sm:text-sm placeholder-neutral-600 focus:outline-none" />
                          </div>
                          <div>
                            <label style={{ color: effectiveTextColor }} className="mb-1.5 block text-xs font-semibold opacity-75">Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleInputKeyDown} placeholder="you@example.com" style={{ backgroundColor: surfaceBg, color: effectiveTextColor, borderColor: DARK_SILVER_BORDER, borderRadius: "12px" }} className="w-full rounded-xl border px-3.5 py-2 text-xs sm:text-sm placeholder-neutral-600 focus:outline-none" />
                          </div>
                        </>
                      )}

                      <div>
                        <label style={{ color: effectiveTextColor }} className="mb-1.5 block text-xs font-semibold opacity-75">Password</label>
                        <div className="relative">
                          <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleInputKeyDown} placeholder="••••••••" style={{ backgroundColor: surfaceBg, color: effectiveTextColor, borderColor: DARK_SILVER_BORDER, borderRadius: "12px" }} className="w-full rounded-xl border px-3.5 py-2 pr-10 text-xs sm:text-sm placeholder-neutral-600 focus:outline-none" />
                          <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity" title={showPassword ? "Hide password" : "Show password"} aria-label={showPassword ? "Hide password" : "Show password"}>
                            {showPassword ? (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      {authError && <div style={{ borderColor: "#ef4444", color: "#f87171" }} className="auth-soft-enter rounded-xl border bg-red-950/40 px-3.5 py-2 text-center text-xs font-semibold">{authError}</div>}

                      <div className="flex items-center gap-3 pt-1">
                        <button type="submit" disabled={isSubmitting} style={{ backgroundColor: effectiveSiteColor, color: surfaceBg, borderColor: DARK_SILVER_BORDER, borderRadius: "14px" }} className="pixel-btn flex-1 rounded-xl border py-2.5 text-xs font-medium sm:text-sm disabled:opacity-50">
                          {isSubmitting ? "Connecting..." : isSignup ? "Create Account" : "Enter"}
                        </button>
                        <button type="button" onClick={() => setIsMuted((prev) => !prev)} style={{ backgroundColor: surfaceBg, color: effectiveTextColor, borderColor: DARK_SILVER_BORDER, borderRadius: "14px" }} className="pixel-btn rounded-xl border px-3 py-2.5 text-xs font-medium">
                          {isMuted ? "Unmute" : "Mute"}
                        </button>
                      </div>

                      {/* ==========================================================================
                          SOCIAL LOGINS (Google / Apple)
                          Uncomment below and the handlers above when ready for production!
                          --------------------------------------------------------------------------
                      <div className="relative my-3.5 flex items-center justify-center">
                        <div className="w-full border-t" style={{ borderColor: `${DARK_SILVER_BORDER}50` }} />
                        <span style={{ backgroundColor: surfaceBg, color: effectiveTextColor }} className="absolute px-2 text-[10px] font-medium uppercase opacity-50 tracking-wider">or continue with</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleGoogleLogin}
                          disabled={isSubmitting}
                          style={{ borderColor: DARK_SILVER_BORDER, borderRadius: "12px" }}
                          className="pixel-btn flex items-center justify-center gap-2 rounded-xl border bg-neutral-900/60 hover:bg-neutral-800 py-2 text-xs font-medium transition-colors"
                        >
                          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                          </svg>
                          <span>Google</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleAppleLogin}
                          disabled={isSubmitting}
                          style={{ borderColor: DARK_SILVER_BORDER, borderRadius: "12px" }}
                          className="pixel-btn flex items-center justify-center gap-2 rounded-xl border bg-neutral-900/60 hover:bg-neutral-800 py-2 text-xs font-medium transition-colors"
                        >
                          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 170 170" fill="currentColor">
                            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.66-7.8-11.89-14.28-6.19-9.56-11.1-20.73-14.73-33.51-3.63-12.78-5.45-24.36-5.45-34.74 0-14.46 3.73-26.68 11.19-36.66 7.46-9.98 16.9-15.08 28.32-15.3 4.9 0 10.51 1.25 16.83 3.76 6.32 2.51 10.3 3.82 11.95 3.93 2.13-.22 6.38-1.58 12.74-4.09 6.36-2.51 11.75-3.65 16.18-3.44 12.53.65 22.42 5.12 29.67 13.41-10.9 6.64-16.23 15.68-16.01 27.12.22 9.04 3.65 16.71 10.29 23.01 6.64 6.3 14.59 10.02 23.86 11.16-2.18 6.54-4.8 13.1-7.86 19.68zM119.22 31.97c0-7.41 2.67-14.41 8.01-21 5.34-6.59 11.93-10.62 19.78-12.09.22 1.09.33 2.18.33 3.27 0 7.3-2.83 14.42-8.49 21.36-5.66 6.94-12.2 11.02-19.63 12.24z"/>
                          </svg>
                          <span>Apple</span>
                        </button>
                      </div>
                      ========================================================================== */}
                    </form>

                    <div className="mt-5 flex items-center justify-between border-t pt-3 text-xs opacity-75" style={{ borderColor: `${DARK_SILVER_BORDER}60` }}>
                      <button type="button" onClick={() => { setForgotStep(1); setAuthError(""); setForgotEmail(email || loginIdentifier); }} className="cursor-pointer text-xs underline-offset-4 hover:underline">Forgot Password?</button>
                      <span className="text-[10px] opacity-60">SyncRoom Stereo</span>
                    </div>

                    {submittedUser && (
                      <p style={{ backgroundColor: surfaceBg, color: effectiveTextColor, borderColor: DARK_SILVER_BORDER }} className="auth-soft-enter mt-3 rounded-lg border px-3 py-2 text-xs">
                        Signed in as {submittedUser.username}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      ) : (
        <div key="workspace-view" style={globalThemeStyle} className="workspace-smooth-enter relative flex h-dvh w-full flex-col overflow-hidden">
          {wallpaper && <div className="pointer-events-none absolute inset-0 z-0 opacity-10" style={{ backgroundImage: `url(${wallpaper})`, backgroundSize: "cover", backgroundPosition: "center" }} aria-hidden="true" />}
          
          <header style={{ backgroundColor: surfaceBg, color: effectiveTextColor }} className="z-20 flex h-16 shrink-0 items-start justify-between px-4 pt-2.5 sm:px-6">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setIsMobileOpen(true)} className="pixel-btn flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 font-medium md:hidden">☰</button>
              <span className="text-2xl sm:text-3xl font-semibold leading-none tracking-tight">Illusion</span>
            </div>

            <div className="mt-1.5 flex items-center gap-2 sm:gap-3">
              <button type="button" onClick={() => setIsMuted((prev) => !prev)} className="pixel-btn hidden rounded-lg bg-neutral-900/60 px-3 py-1 text-[11px] font-medium sm:inline-block transition-colors duration-200 hover:bg-neutral-800">
                {isMuted ? "unmute" : "mute"}
              </button>
              <button type="button" onClick={() => { setSettingsUsername(user?.username || ""); setSettingsEmail(user?.email || ""); setSettingsMessage(""); setSettingsError(""); setActiveView((prev) => prev === "settings" ? "workspace" : "settings"); }} aria-label="Settings" style={activeView === "settings" ? { backgroundColor: effectiveSiteColor, color: surfaceBg } : {}} className={`pixel-btn flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200 ${activeView !== "settings" ? "bg-neutral-900/60 hover:bg-neutral-800" : ""}`}><PixelGearIcon /></button>
              <button type="button" onClick={handleLogout} style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }} className="pixel-btn rounded-lg px-3 py-1 text-[11px] font-medium transition-colors duration-200 hover:opacity-80">
                logout
              </button>
            </div>
          </header>

          <div className="relative flex flex-1 overflow-hidden min-h-0">
            <Sidebar
              user={user} roomCode={roomCode} roomId={roomId} roomName={roomName} activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setActiveView("workspace"); }}
              listeners={listeners} kickedUsers={kickedUsers} currentHost={currentHost} isInRoom={isInRoom} onOpenSettings={() => setActiveView("settings")}
              onExitRoom={handleExitRoom} onGiveLeadership={handleGiveLeadership} onKickUser={handleKickUser} onAllowUser={handleAllowUser} onChangeWallpaper={handleChangeWallpaper}
              isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} effectiveSiteColor={effectiveSiteColor} effectiveTextColor={effectiveTextColor} surfaceBg={surfaceBg}
            />

            {activeView === "settings" ? (
              <main key="settings-panel" style={{ backgroundColor: surfaceBg, color: effectiveTextColor }} className="auth-soft-enter flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                <div className="flex flex-col gap-8 max-w-3xl pb-10">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-neutral-800/70">
                    <div><p className="text-[10px] opacity-50">ACCOUNT & PREFERENCES</p><h2 className="text-xl font-medium sm:text-2xl">Settings</h2></div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => { setThemeMode("black"); setBgColor("#000000"); setSiteColor("#ffffff"); setTextColor("#ffffff"); }} className="pixel-btn rounded-lg bg-neutral-900/60 px-3 py-1.5 text-xs font-medium hover:bg-neutral-800 transition-colors duration-200">Reset theme</button>
                      <button type="button" onClick={() => setActiveView("workspace")} style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }} className="pixel-btn rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 hover:opacity-80">Back to Player</button>
                    </div>
                  </div>

                  {settingsMessage && (
                    <p className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 px-4 py-2 text-xs font-medium text-emerald-400">
                      {settingsMessage}
                    </p>
                  )}
                  {settingsError && (
                    <p className="rounded-xl border border-red-500/40 bg-red-950/20 px-4 py-2 text-xs font-medium text-red-400">
                      {settingsError}
                    </p>
                  )}

                  {/* ACCOUNT & PROFILE SETTINGS */}
                  <div className="rounded-2xl bg-neutral-900/40 p-5 sm:p-6 flex flex-col gap-5">
                    <div>
                      <h3 className="text-sm font-medium">Account & Profile</h3>
                      <p className="text-[11px] opacity-55">Update your profile picture, username, and email address.</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <input
                        ref={settingsAvatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadAvatar(file);
                          e.target.value = "";
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => settingsAvatarInputRef.current?.click()}
                        style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }}
                        className="group relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full overflow-hidden text-xl font-medium cursor-pointer"
                        title="Change profile icon"
                      >
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username || "User"} className="h-full w-full object-cover" />
                        ) : (
                          <span>{user?.username ? user.username.charAt(0).toUpperCase() : "P"}</span>
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          EDIT
                        </span>
                      </button>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => settingsAvatarInputRef.current?.click()}
                          className="pixel-btn rounded-xl bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 text-xs font-medium text-white transition-colors"
                        >
                          Change Profile Icon
                        </button>
                        {user?.avatar_url && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="pixel-btn rounded-xl bg-red-500/15 hover:bg-red-500/25 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    <form onSubmit={handleSaveProfileSettings} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium opacity-70">Username</label>
                        <input
                          type="text"
                          required
                          value={settingsUsername}
                          onChange={(e) => setSettingsUsername(e.target.value)}
                          className="w-full rounded-xl bg-neutral-950/80 px-3 py-2 text-xs focus:outline-none border border-neutral-800"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium opacity-70">Email</label>
                        <input
                          type="email"
                          required
                          value={settingsEmail}
                          onChange={(e) => setSettingsEmail(e.target.value)}
                          className="w-full rounded-xl bg-neutral-950/80 px-3 py-2 text-xs focus:outline-none border border-neutral-800"
                        />
                      </div>
                      <div className="sm:col-span-2 flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={isSavingSettings}
                          style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }}
                          className="pixel-btn rounded-xl px-4 py-2 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                        >
                          {isSavingSettings ? "Saving..." : "Save Account Details"}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* PASSWORD & SECURITY */}
                  <div className="rounded-2xl bg-neutral-900/40 p-5 sm:p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium">Change Password</h3>
                        <p className="text-[11px] opacity-55">Update your account password.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSettingsPasswords((prev) => !prev)}
                        className="text-[11px] opacity-60 hover:opacity-100 underline underline-offset-2"
                      >
                        {showSettingsPasswords ? "Hide" : "Show"}
                      </button>
                    </div>
                    <form onSubmit={handleChangePasswordSettings} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium opacity-70">Current Password</label>
                        <input
                          type={showSettingsPasswords ? "text" : "password"}
                          required
                          value={settingsCurrentPassword}
                          onChange={(e) => setSettingsCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl bg-neutral-950/80 px-3 py-2 text-xs focus:outline-none border border-neutral-800"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium opacity-70">New Password</label>
                        <input
                          type={showSettingsPasswords ? "text" : "password"}
                          required
                          value={settingsNewPassword}
                          onChange={(e) => setSettingsNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full rounded-xl bg-neutral-950/80 px-3 py-2 text-xs focus:outline-none border border-neutral-800"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium opacity-70">Confirm Password</label>
                        <input
                          type={showSettingsPasswords ? "text" : "password"}
                          required
                          value={settingsConfirmPassword}
                          onChange={(e) => setSettingsConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full rounded-xl bg-neutral-950/80 px-3 py-2 text-xs focus:outline-none border border-neutral-800"
                        />
                      </div>
                      <div className="sm:col-span-3 flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={isSavingSettings}
                          style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }}
                          className="pixel-btn rounded-xl px-4 py-2 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                        >
                          Update Password
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* APPEARANCE & THEME */}
                  <div className="rounded-2xl bg-neutral-900/40 p-5 sm:p-6 flex flex-col gap-5">
                    <div>
                      <h3 className="text-sm font-medium">Appearance & Theme</h3>
                      <p className="text-[11px] opacity-55">Choose Black, White, System Default, or Custom mode.</p>
                    </div>
                  <div className="space-y-2.5">
                    <p className="text-xs font-medium opacity-70">BASE THEME MODE</p>
                    <div className="flex flex-wrap gap-2.5">
                      <button type="button" onClick={() => setThemeMode("black")} style={themeMode === "black" ? { backgroundColor: effectiveSiteColor, color: surfaceBg } : {}} className={`pixel-btn rounded-xl px-4 py-2 text-xs font-medium transition-colors duration-200 ${themeMode !== "black" ? "bg-neutral-900/60 hover:bg-neutral-800" : ""}`}>Black Mode</button>
                      <button type="button" onClick={() => setThemeMode("white")} style={themeMode === "white" ? { backgroundColor: effectiveSiteColor, color: surfaceBg } : {}} className={`pixel-btn rounded-xl px-4 py-2 text-xs font-medium transition-colors duration-200 ${themeMode !== "white" ? "bg-neutral-900/60 hover:bg-neutral-800" : ""}`}>White Mode</button>
                      <button type="button" onClick={() => setThemeMode("system")} style={themeMode === "system" ? { backgroundColor: effectiveSiteColor, color: surfaceBg } : {}} className={`pixel-btn rounded-xl px-4 py-2 text-xs font-medium transition-colors duration-200 ${themeMode !== "system" ? "bg-neutral-900/60 hover:bg-neutral-800" : ""}`}>System Default ({systemPrefersDark ? "Dark" : "Light"})</button>
                      <button type="button" onClick={() => setThemeMode("custom")} style={themeMode === "custom" ? { backgroundColor: effectiveSiteColor, color: surfaceBg } : {}} className={`pixel-btn rounded-xl px-4 py-2 text-xs font-medium transition-colors duration-200 ${themeMode !== "custom" ? "bg-neutral-900/60 hover:bg-neutral-800" : ""}`}>Custom Mode</button>
                    </div>
                  </div>

                  {themeMode === "custom" && (
                    <>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between"><p className="text-xs font-medium opacity-70">WEBSITE BACKGROUND COLOR</p><span className="text-xs opacity-50">{bgColor}</span></div>
                        <div className="flex flex-wrap items-center gap-2">
                          {BG_COLOR_PRESETS.map((preset) => (
                            <button key={preset.value} type="button" onClick={() => { setThemeMode("custom"); setBgColor(preset.value); }} style={{ backgroundColor: preset.value, color: preset.value === "#ffffff" ? "#000000" : "#ffffff" }} className="pixel-btn rounded-xl border border-neutral-700/60 px-3 py-1.5 text-xs font-medium transition-colors duration-200 hover:opacity-80">{preset.name}</button>
                          ))}
                          <label className="pixel-btn flex cursor-pointer items-center gap-2 rounded-xl bg-neutral-900/60 px-3 py-1.5 text-xs font-medium hover:bg-neutral-800 transition-colors duration-200"><span>Bg Custom</span><input type="color" value={bgColor} onChange={(e) => { setThemeMode("custom"); setBgColor(e.target.value); }} className="h-4 w-5 cursor-pointer border-0 bg-transparent p-0" /></label>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between"><p className="text-xs font-medium opacity-70">WEBSITE ACCENT COLOR</p><span className="text-xs opacity-50">{effectiveSiteColor}</span></div>
                        <div className="flex flex-wrap items-center gap-2">
                          {COLOR_PRESETS.map((preset) => (
                            <button key={preset.value} type="button" onClick={() => { setThemeMode("custom"); setSiteColor(preset.value); }} style={{ backgroundColor: preset.value, color: "#000000" }} className="pixel-btn rounded-xl px-3 py-1.5 text-xs font-medium transition-colors duration-200 hover:opacity-80">{preset.name}</button>
                          ))}
                          <label className="pixel-btn flex cursor-pointer items-center gap-2 rounded-xl bg-neutral-900/60 px-3 py-1.5 text-xs font-medium hover:bg-neutral-800 transition-colors duration-200"><span>Custom</span><input type="color" value={siteColor} onChange={(e) => { setThemeMode("custom"); setSiteColor(e.target.value); }} className="h-4 w-5 cursor-pointer border-0 bg-transparent p-0" /></label>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between"><p className="text-xs font-medium opacity-70">TEXT COLOR THEME (SEPARATE)</p><span className="text-xs opacity-50">{effectiveTextColor}</span></div>
                        <div className="flex flex-wrap items-center gap-2">
                          {TEXT_COLOR_PRESETS.map((preset) => (
                            <button key={preset.value} type="button" onClick={() => { setThemeMode("custom"); setTextColor(preset.value); }} style={{ backgroundColor: surfaceBg, color: preset.value }} className="pixel-btn rounded-xl bg-neutral-900/60 hover:bg-neutral-800 px-3 py-1.5 text-xs font-medium transition-colors duration-200">{preset.name}</button>
                          ))}
                          <label className="pixel-btn flex cursor-pointer items-center gap-2 rounded-xl bg-neutral-900/60 px-3 py-1.5 text-xs font-medium hover:bg-neutral-800 transition-colors duration-200"><span>Text Custom</span><input type="color" value={textColor} onChange={(e) => { setThemeMode("custom"); setTextColor(e.target.value); }} className="h-4 w-5 cursor-pointer border-0 bg-transparent p-0" /></label>
                        </div>
                      </div>
                    </>
                  )}
                  </div>
                </div>
              </main>
            ) : (
              <TrackList
                tracks={catalog} queue={queue} currentTrack={currentTrack} isPlaying={isPlaying} activeTab={activeTab}
                searchQuery={searchQuery} onSearchChange={setSearchQuery} onSelectTrack={handleSelectTrack} onAddToQueue={handleAddToQueue}
                onRemoveFromQueue={handleRemoveFromQueue} onClearQueue={handleClearQueue} onLoadAllToQueue={handleLoadAllToQueue}
                localTracks={localTracks} onImportLocalFiles={handleImportLocalFiles} favorites={favorites} onToggleFavorite={handleToggleFavorite}
                currentRoomCode={roomCode} roomId={roomId} roomName={roomName} isInRoom={isInRoom} onJoinRoom={handleJoinRoom} onCreateRoom={handleCreateRoom} onExitRoom={handleExitRoom}
                listeners={listeners} kickedUsers={kickedUsers} onAllowUser={handleAllowUser} currentHost={currentHost} user={user} onLogout={handleLogout} effectiveSiteColor={effectiveSiteColor} effectiveTextColor={effectiveTextColor} surfaceBg={surfaceBg}
                playlists={playlists} onAddToPlaylist={handleAddToPlaylist} onDeletePlaylist={handleDeletePlaylist} 
                onRenamePlaylist={handleRenamePlaylist} onCreatePlaylist={handleCreatePlaylist} onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist} recentTracks={recentTracks}
                topPlayedTracks={topPlayedTracks} trendingTracks={trendingTracks}
                chatMessages={chatMessages} onSendChatMessage={(text) => sendChatMessage(text, user?.avatar_url || "")} onResyncWithHost={requestSync} isUserHost={isUserHost}
                isLocallyPaused={isLocallyPaused} chatWallpaper={chatWallpaper} onUploadAvatar={handleUploadAvatar}
                onAddTracksToQueue={handleAddTracksToQueue} onNavigateTab={setActiveTab}
                queueRequests={queueRequests} onRequestQueueAdd={handleRequestQueueAdd} onEditQueueRequest={handleEditQueueRequest}
                onCancelQueueRequest={handleCancelQueueRequest} onResolveQueueRequest={handleResolveQueueRequest}
              />
            )}
          </div>

          <PlayerBar
            track={currentTrack} isPlaying={isPlaying} currentTime={currentTime} duration={duration}
            volume={volume} isMuted={isMuted} isLooping={isLooping} isShuffle={isShuffle} isFavorite={isFavorite(currentTrack?.id)}
            onToggleFavorite={handleToggleFavorite} onTogglePlay={handleTogglePlay} onSeekChange={handleSeek}
            onVolumeChange={setVolume} onToggleMute={() => setIsMuted((prev) => !prev)} onToggleLoop={() => setIsLooping((prev) => !prev)}
            onToggleShuffle={() => setIsShuffle((prev) => !prev)} onPrev={handlePrev} onNext={handleNext}
            effectiveSiteColor={effectiveSiteColor} effectiveTextColor={effectiveTextColor} surfaceBg={surfaceBg}
          />
        </div>
      )}
    </>
  );
}