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

const ROOM_LISTENERS = [{ id: 1, name: "NeonSamurai" }, { id: 2, name: "PixelWanderer" }, { id: 3, name: "CyberColumbina" }];
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
  const [isAudioLocked, setIsAudioLocked] = useState(false);

  const [user, setUser] = useState(() => { try { const saved = localStorage.getItem("syncroom_user"); return saved ? JSON.parse(saved) : null; } catch { return null; } });
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!user);
  const [activeView, setActiveView] = useState("workspace");

  const [themeMode, setThemeMode] = useState(() => { try { return localStorage.getItem("syncroom_theme_mode") || "bw"; } catch { return "bw"; } });
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)").matches : true);
  const [siteColor, setSiteColor] = useState(() => { try { return localStorage.getItem("syncroom_site_color") || "#ffffff"; } catch { return "#ffffff"; } });
  const [textColor, setTextColor] = useState(() => { try { return localStorage.getItem("syncroom_text_color") || "#ffffff"; } catch { return "#ffffff"; } });

  const [mode, setMode] = useState("login");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const [activeTab, setActiveTab] = useState("discover");
  const [roomCode, setRoomCode] = useState(() => generateRoomCode());
  const [currentHost, setCurrentHost] = useState("");
  const [isInRoom, setIsInRoom] = useState(false);
  const [wallpaper, setWallpaper] = useState(() => selectedMedia.src);
  const [searchQuery, setSearchQuery] = useState("");
  const [catalog, setCatalog] = useState(DEFAULT_CATALOG);
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

  const allKnownTracks = [...catalog, ...localTracks, ...recentTracks, ...DEFAULT_CATALOG];
  const uniqueTracks = Array.from(new Map(allKnownTracks.map(t => [t.id, t])).values());
  const topPlayedTracks = uniqueTracks.filter(t => playCounts[t.id] > 0).sort((a, b) => playCounts[b.id] - playCounts[a.id]).slice(0, 6);
  if (topPlayedTracks.length < 6) {
    const defaultFill = DEFAULT_CATALOG.filter(t => !topPlayedTracks.some(tp => tp.id === t.id));
    topPlayedTracks.push(...defaultFill.slice(0, 6 - topPlayedTracks.length));
  }

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

  const isFavorite = (trackId) => favorites.some(f => f.id === trackId);

  useEffect(() => { let isMounted = true; fetch(`${API_BASE}/api/music/catalog`).then((res) => res.ok ? res.json() : Promise.reject()).then((data) => { if (isMounted && data?.tracks?.length > 0) setCatalog(data.tracks); }).catch(() => {}); return () => { isMounted = false; }; }, []);
  useEffect(() => { const token = user?.token; if (!token) return; let cancelled = false; fetch(`${API_BASE}/api/music/favorites`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.ok ? res.json() : Promise.reject()).then((data) => { if (cancelled) return; setFavorites(data.favorites || []); }).catch(() => {}); return () => { cancelled = true; }; }, [user?.token, user?.id]);
  useEffect(() => { if (!user?.token) return; fetch(`${API_BASE}/api/music/playlists`, { headers: { Authorization: `Bearer ${user.token}` } }).then(res => res.json()).then(data => setPlaylists(data.playlists || [])).catch(() => {}); }, [user?.token]);

  const handleRemotePlay = useCallback((serverTime) => { isRemoteAction.current = true; if (audioRef.current) { if (serverTime !== undefined && Math.abs(audioRef.current.currentTime - serverTime) > 1.2) { audioRef.current.currentTime = serverTime; setCurrentTime(serverTime); } audioRef.current.play().then(() => { setIsPlaying(true); setIsAudioLocked(false); }).catch(() => { setIsAudioLocked(true); }); } setTimeout(() => { isRemoteAction.current = false; }, 150); }, []);
  const handleRemotePause = useCallback((serverTime) => { isRemoteAction.current = true; if (audioRef.current) { if (serverTime !== undefined) { audioRef.current.currentTime = serverTime; setCurrentTime(serverTime); } audioRef.current.pause(); setIsPlaying(false); } setTimeout(() => { isRemoteAction.current = false; }, 150); }, []);
  const handleRemoteSeek = useCallback((seekTime) => { isRemoteAction.current = true; if (audioRef.current && Math.abs(audioRef.current.currentTime - seekTime) > 0.5) { audioRef.current.currentTime = seekTime; setCurrentTime(seekTime); } setTimeout(() => { isRemoteAction.current = false; }, 150); }, []);
  
  const handleRemoteChangeTrack = useCallback((syncTrack) => {
    if (syncTrack && syncTrack.id !== currentTrack?.id) {
      isRemoteAction.current = true; setCurrentTrack(syncTrack); addToRecents(syncTrack); incrementPlayCount(syncTrack); setCurrentPlaybackList(catalog); 
      if (audioRef.current) { audioRef.current.src = syncTrack.src; audioRef.current.currentTime = 0; audioRef.current.play().then(() => { setIsPlaying(true); setIsAudioLocked(false); }).catch(() => { setIsAudioLocked(true); }); }
      setTimeout(() => { isRemoteAction.current = false; }, 150);
    }
  }, [currentTrack?.id, catalog]);

  const handleRemoteQueue = useCallback((syncQueue) => { if (Array.isArray(syncQueue)) setQueue(syncQueue); }, []);
  const handleRemoteListeners = useCallback((updatedListeners) => { if (Array.isArray(updatedListeners)) setListeners(updatedListeners); }, []);
  const handleHostUpdate = useCallback((newHost) => { if (newHost) setCurrentHost(newHost); }, []);
  const handleKicked = useCallback((reason) => { alert(reason || "You were removed from the room by the host."); setIsInRoom(false); setRoomCode("LOBBY"); setActiveTab("rooms"); if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); } }, []);
  const handleWallpaperUpdate = useCallback((newWallpaper) => { if (newWallpaper) setWallpaper(newWallpaper); }, []);
  const activeUsername = localStorage.getItem("syncroom_active_username") || user?.username || "PlayerOne";

  const { sendAction } = useRoomSocket({ roomCode: isAuthenticated && isInRoom ? roomCode : "", username: activeUsername, onSyncPlay: handleRemotePlay, onSyncPause: handleRemotePause, onSyncSeek: handleRemoteSeek, onSyncChangeTrack: handleRemoteChangeTrack, onSyncQueue: handleRemoteQueue, onListenersUpdate: handleRemoteListeners, onHostUpdate: handleHostUpdate, onKicked: handleKicked, onWallpaperUpdate: handleWallpaperUpdate });

  const handleExitRoom = () => { if (audioRef.current) sendAction("PAUSE", { current_time: audioRef.current.currentTime }); setRoomCode(generateRoomCode()); setIsInRoom(false); };
  const handleJoinRoom = (code) => { const normalized = normalizeRoomCode(code); if (!normalized) return; setRoomCode(normalized); setIsInRoom(true); setActiveTab("discover"); };
  const handleCreateRoom = (code) => { const targetCode = normalizeRoomCode(code) || generateRoomCode(); setRoomCode(targetCode); setCurrentHost(activeUsername); setIsInRoom(true); setActiveTab("discover"); };
  const handleGiveLeadership = (targetName) => sendAction("GIVE_LEADERSHIP", { target_name: targetName });
  const handleKickUser = (targetName) => sendAction("KICK_USER", { target_name: targetName });
  const handleChangeWallpaper = (newWp) => { setWallpaper(newWp); sendAction("CHANGE_WALLPAPER", { wallpaper: newWp }); };

  useEffect(() => { if (!window.matchMedia) return; const mq = window.matchMedia("(prefers-color-scheme: dark)"); const handleChange = (e) => setSystemPrefersDark(e.matches); mq.addEventListener("change", handleChange); return () => mq.removeEventListener("change", handleChange); }, []);
  useEffect(() => { PIXEL_MEDIA.forEach((item) => { if (item.src !== selectedMedia.src) { const img = new Image(); img.src = item.src; } }); }, [selectedMedia.src]);
  useEffect(() => { if (audioRef.current) { audioRef.current.volume = volume / 100; audioRef.current.muted = isMuted; } try { localStorage.setItem("syncroom_volume", String(volume)); } catch { /* ignore */ } }, [volume, isMuted]);
  useEffect(() => { try { localStorage.setItem("syncroom_theme_mode", themeMode); localStorage.setItem("syncroom_site_color", siteColor); localStorage.setItem("syncroom_text_color", textColor); } catch { /* ignore */ } }, [themeMode, siteColor, textColor]);

  const handleTimeUpdate = () => { if (audioRef.current) { setCurrentTime(audioRef.current.currentTime); if (audioRef.current.duration) setDuration(audioRef.current.duration); } };
  const handleLoadedMetadata = () => { if (audioRef.current && audioRef.current.duration) setDuration(audioRef.current.duration); };

  const playTrackNow = (track) => {
    setCurrentTrack(track); addToRecents(track); incrementPlayCount(track); 
    if (!isRemoteAction.current) sendAction("CHANGE_TRACK", { track, current_time: 0 });
    const audio = audioRef.current;
    if (audio) { audio.src = track.src; audio.currentTime = 0; audio.play().then(() => setIsPlaying(true)).catch(() => setIsAudioLocked(true)); }
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
              if (!isRemoteAction.current) sendAction("PAUSE", { current_time: 0 });
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
    if (audioRef.current && audioRef.current.currentTime > 3) { audioRef.current.currentTime = 0; setCurrentTime(0); if (!isRemoteAction.current) sendAction("SEEK", { current_time: 0 }); return; }
    if (currentPlaybackList && currentPlaybackList.length > 0) {
      const currentIdx = currentPlaybackList.findIndex((t) => t.id === currentTrack?.id);
      const prevIdx = currentIdx > 0 ? currentIdx - 1 : currentPlaybackList.length - 1;
      playTrackNow(currentPlaybackList[prevIdx]);
    }
  };

  const handleAudioEnded = () => { if (isLooping) { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => setIsAudioLocked(true)); if (!isRemoteAction.current) sendAction("PLAY", { current_time: 0 }); } } else { handleNext(); } };
  const handleTogglePlay = () => { const audio = audioRef.current; if (!audio) return; if (audio.paused) { if (!audio.src && currentTrack?.src) audio.src = currentTrack.src; audio.play().then(() => { setIsPlaying(true); setIsAudioLocked(false); if (!isRemoteAction.current) sendAction("PLAY", { current_time: audio.currentTime }); }).catch(() => setIsAudioLocked(true)); } else { audio.pause(); setIsPlaying(false); if (!isRemoteAction.current) sendAction("PAUSE", { current_time: audio.currentTime }); } };
  
  const handleSelectTrack = (track, listContext = null) => {
    if (listContext && Array.isArray(listContext)) setCurrentPlaybackList(listContext);
    if (currentTrack?.id === track.id) { if (audioRef.current) { audioRef.current.currentTime = 0; setCurrentTime(0); if (!isRemoteAction.current) sendAction("SEEK", { current_time: 0 }); if (audioRef.current.paused) handleTogglePlay(); } return; }
    playTrackNow(track);
  };

  const handleSeek = (timeSeconds) => { if (audioRef.current) { audioRef.current.currentTime = timeSeconds; setCurrentTime(timeSeconds); if (!isRemoteAction.current) sendAction("SEEK", { current_time: timeSeconds }); } };
  const handleAddToQueue = (track) => { const nextQ = [...queue, track]; setQueue(nextQ); if (!isRemoteAction.current) sendAction("UPDATE_QUEUE", { queue: nextQ }); };
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
          const data = await res.json(); const resolvedUser = { id: data.user?.id, username: data.user?.username, email: data.user?.email, token: data.access_token, mode };
          localStorage.setItem("syncroom_user", JSON.stringify(resolvedUser)); localStorage.setItem("syncroom_active_username", resolvedUser.username);
          setUser(resolvedUser); setIsAuthenticated(true); setIsSubmitting(false);
        }
      } else { const errData = await res.json().catch(() => ({})); setAuthError(errData.detail || "Authentication error occurred"); setIsSubmitting(false); }
    } catch { setAuthError("Network error. Please try again."); setIsSubmitting(false); }
  }

  const handleSendCode = async () => { if (!forgotEmail.trim()) return setAuthError("Enter your email first."); try { const res = await fetch(`${API_BASE}/api/auth/forgot-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: forgotEmail }) }); const data = await res.json(); if (res.ok) { setForgotStep(2); setAuthError(`Code sent. (DEV: ${data.dev_code})`); } else { setAuthError(data.detail || "Error sending code."); } } catch { setAuthError("Network error."); } };
  const handleResetPassword = async () => { if (!resetCode.trim() || !newPassword.trim()) return setAuthError("Code and new password required."); try { const res = await fetch(`${API_BASE}/api/auth/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: forgotEmail, code: resetCode, new_password: newPassword }) }); const data = await res.json(); if (res.ok) { setForgotStep(0); setMode("login"); setAuthError("Password reset! Please login."); setResetCode(""); setNewPassword(""); } else { setAuthError(data.detail || "Invalid code."); } } catch { setAuthError("Network error."); } };
  
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
  const isSystemLight = themeMode === "system" && !systemPrefersDark;
  const effectiveSiteColor = themeMode === "bw" ? (isSystemLight ? "#000000" : "#ffffff") : siteColor;
  const effectiveTextColor = themeMode === "bw" ? (isSystemLight ? "#000000" : "#ffffff") : textColor;
  const surfaceBg = isSystemLight ? "#ffffff" : "#000000";
  const globalThemeStyle = { backgroundColor: surfaceBg, color: effectiveTextColor, "--site-accent": effectiveSiteColor, "--site-text": effectiveTextColor };

  return (
    <>
      <audio ref={audioRef} preload="auto" onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={handleAudioEnded} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onError={(e) => console.warn("[SyncRoom Audio] Playback error:", e)} />

      {isAudioLocked && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer" onClick={() => {
          if (audioRef.current) {
            if (!audioRef.current.src && currentTrack?.src) {
              audioRef.current.src = currentTrack.src;
            }
            audioRef.current.play().then(() => setIsAudioLocked(false)).catch(console.warn);
          }
        }}>
          <div className="rounded-2xl bg-neutral-900 px-8 py-6 text-center shadow-2xl border border-neutral-700 animate-in fade-in zoom-in-95 duration-200">
            <p className="text-xl font-medium text-white mb-2">Tap anywhere to enable audio</p>
            <p className="text-sm text-neutral-400">Browser autoplay policy requires a user interaction.</p>
          </div>
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
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" style={{ backgroundColor: surfaceBg, color: effectiveTextColor, borderColor: DARK_SILVER_BORDER, borderRadius: "12px" }} className="w-full rounded-xl border px-3.5 py-2 text-xs focus:outline-none" />
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
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleInputKeyDown} placeholder="••••••••" style={{ backgroundColor: surfaceBg, color: effectiveTextColor, borderColor: DARK_SILVER_BORDER, borderRadius: "12px" }} className="w-full rounded-xl border px-3.5 py-2 text-xs sm:text-sm placeholder-neutral-600 focus:outline-none" />
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
                    </form>

                    <div className="mt-5 flex items-center justify-between border-t pt-3 text-xs opacity-75" style={{ borderColor: `${DARK_SILVER_BORDER}60` }}>
                      <button type="button" onClick={() => { setForgotStep(1); setAuthError(""); setForgotEmail(email || loginIdentifier); }} className="cursor-pointer text-xs underline-offset-4 hover:underline">Forgot Password?</button>
                      <button type="button" onClick={() => {
                        const guestUser = { id: 0, username: "GuestListener", email: "guest@offline", token: null, offline: true };
                        localStorage.setItem("syncroom_user", JSON.stringify(guestUser));
                        localStorage.setItem("syncroom_active_username", guestUser.username);
                        setUser(guestUser);
                        setIsAuthenticated(true);
                      }} className="cursor-pointer text-xs opacity-80 hover:opacity-100 underline-offset-4 hover:underline">
                        Guest Mode
                      </button>
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
              <span className="text-3xl font-semibold leading-none tracking-tight">Illusion</span>
            </div>

            <div className="mt-1.5 flex items-center gap-2 sm:gap-3">
              <button type="button" onClick={() => setIsMuted((prev) => !prev)} className="pixel-btn hidden rounded-lg bg-neutral-900/60 px-3 py-1 text-[11px] font-medium sm:inline-block transition-colors duration-200 hover:bg-neutral-800">
                {isMuted ? "unmute" : "mute"}
              </button>
              <button type="button" onClick={() => setActiveView((prev) => prev === "settings" ? "workspace" : "settings")} aria-label="Settings" style={activeView === "settings" ? { backgroundColor: effectiveSiteColor, color: surfaceBg } : {}} className={`pixel-btn flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200 ${activeView !== "settings" ? "bg-neutral-900/60 hover:bg-neutral-800" : ""}`}><PixelGearIcon /></button>
              <button type="button" onClick={handleLogout} style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }} className="pixel-btn rounded-lg px-3 py-1 text-[11px] font-medium transition-colors duration-200 hover:opacity-80">
                logout
              </button>
            </div>
          </header>

          <div className="relative flex flex-1 overflow-hidden">
            <Sidebar
              user={user} roomCode={roomCode} activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setActiveView("workspace"); }}
              listeners={listeners} currentHost={currentHost} isInRoom={isInRoom} onOpenSettings={() => setActiveView("settings")}
              onExitRoom={handleExitRoom} onGiveLeadership={handleGiveLeadership} onKickUser={handleKickUser} onChangeWallpaper={handleChangeWallpaper}
              isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} effectiveSiteColor={effectiveSiteColor} effectiveTextColor={effectiveTextColor} surfaceBg={surfaceBg}
            />

            {activeView === "settings" ? (
              <main key="settings-panel" style={{ backgroundColor: surfaceBg, color: effectiveTextColor }} className="auth-soft-enter flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                <div className="flex flex-col gap-6 max-w-3xl">
                  <div className="flex items-center justify-between pb-2">
                    <div><p className="text-[10px] opacity-50">PREFERENCES MATRIX</p><h2 className="text-xl font-medium sm:text-2xl">APPEARANCE & THEME</h2></div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => { setThemeMode("bw"); setSiteColor("#ffffff"); setTextColor("#ffffff"); }} className="pixel-btn rounded-lg bg-neutral-900/60 px-3 py-1.5 text-xs font-medium hover:bg-neutral-800 transition-colors duration-200">RESET</button>
                      <button type="button" onClick={() => setActiveView("workspace")} style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }} className="pixel-btn rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 hover:opacity-80">BACK TO PLAYER</button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <p className="text-xs font-medium opacity-70">BASE THEME MODE</p>
                    <div className="flex flex-wrap gap-2.5">
                      <button type="button" onClick={() => setThemeMode("bw")} style={themeMode === "bw" ? { backgroundColor: effectiveSiteColor, color: surfaceBg } : {}} className={`pixel-btn rounded-xl px-4 py-2 text-xs font-medium transition-colors duration-200 ${themeMode !== "bw" ? "bg-neutral-900/60 hover:bg-neutral-800" : ""}`}>Black and White</button>
                      <button type="button" onClick={() => setThemeMode("system")} style={themeMode === "system" ? { backgroundColor: effectiveSiteColor, color: surfaceBg } : {}} className={`pixel-btn rounded-xl px-4 py-2 text-xs font-medium transition-colors duration-200 ${themeMode !== "system" ? "bg-neutral-900/60 hover:bg-neutral-800" : ""}`}>Use System ({systemPrefersDark ? "Dark" : "Light"})</button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between"><p className="text-xs font-medium opacity-70">WEBSITE ACCENT COLOR</p><span className="text-xs opacity-50">{effectiveSiteColor}</span></div>
                    <div className="flex flex-wrap items-center gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <button key={preset.value} type="button" onClick={() => { setThemeMode("system"); setSiteColor(preset.value); }} style={{ backgroundColor: preset.value, color: "#000000" }} className="pixel-btn rounded-xl px-3 py-1.5 text-xs font-medium transition-colors duration-200 hover:opacity-80">{preset.name}</button>
                      ))}
                      <label className="pixel-btn flex cursor-pointer items-center gap-2 rounded-xl bg-neutral-900/60 px-3 py-1.5 text-xs font-medium hover:bg-neutral-800 transition-colors duration-200"><span>Custom</span><input type="color" value={siteColor} onChange={(e) => { setThemeMode("system"); setSiteColor(e.target.value); }} className="h-4 w-5 cursor-pointer border-0 bg-transparent p-0" /></label>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between"><p className="text-xs font-medium opacity-70">TEXT COLOR THEME (SEPARATE)</p><span className="text-xs opacity-50">{effectiveTextColor}</span></div>
                    <div className="flex flex-wrap items-center gap-2">
                      {TEXT_COLOR_PRESETS.map((preset) => (
                        <button key={preset.value} type="button" onClick={() => { setThemeMode("system"); setTextColor(preset.value); }} style={{ backgroundColor: surfaceBg, color: preset.value }} className="pixel-btn rounded-xl bg-neutral-900/60 hover:bg-neutral-800 px-3 py-1.5 text-xs font-medium transition-colors duration-200">{preset.name}</button>
                      ))}
                      <label className="pixel-btn flex cursor-pointer items-center gap-2 rounded-xl bg-neutral-900/60 px-3 py-1.5 text-xs font-medium hover:bg-neutral-800 transition-colors duration-200"><span>Text Custom</span><input type="color" value={textColor} onChange={(e) => { setThemeMode("system"); setTextColor(e.target.value); }} className="h-4 w-5 cursor-pointer border-0 bg-transparent p-0" /></label>
                    </div>
                  </div>
                </div>
              </main>
            ) : (
              <TrackList
                tracks={catalog} queue={queue} currentTrack={currentTrack} isPlaying={isPlaying} activeTab={activeTab}
                searchQuery={searchQuery} onSearchChange={setSearchQuery} onSelectTrack={handleSelectTrack} onAddToQueue={handleAddToQueue}
                onRemoveFromQueue={handleRemoveFromQueue} onClearQueue={handleClearQueue} onLoadAllToQueue={handleLoadAllToQueue}
                localTracks={localTracks} onImportLocalFiles={handleImportLocalFiles} favorites={favorites} onToggleFavorite={handleToggleFavorite}
                currentRoomCode={roomCode} onJoinRoom={handleJoinRoom} onCreateRoom={handleCreateRoom} onExitRoom={handleExitRoom}
                listeners={listeners} user={user} onLogout={handleLogout} effectiveSiteColor={effectiveSiteColor} effectiveTextColor={effectiveTextColor} surfaceBg={surfaceBg}
                playlists={playlists} onAddToPlaylist={handleAddToPlaylist} onDeletePlaylist={handleDeletePlaylist} 
                onRenamePlaylist={handleRenamePlaylist} onCreatePlaylist={handleCreatePlaylist} recentTracks={recentTracks}
                topPlayedTracks={topPlayedTracks}
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