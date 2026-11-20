import { useEffect, useRef, useState, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import PlayerBar from "./components/PlayerBar";
import TrackList from "./components/TrackList";
import { useRoomSocket } from "./hooks/useRoomSocket";

const PIXEL_MEDIA = [
  { src: "/pixel-0.gif", alt: "Pixel music looping animation 0" },
  { src: "/pixel-1.jpg", alt: "Pixel music looping animation 1" },
  { src: "/pixel-2.jpg", alt: "Pixel music artwork 2" },
  { src: "/pixel-4.jpg", alt: "Pixel music artwork 4" },
  { src: "/pixel-6.jpg", alt: "Pixel music artwork 6" },
  { src: "/pixel-7.gif", alt: "Pixel music artwork 7" },
  { src: "/pixel-9.jpg", alt: "Pixel music artwork 9" },
  { src: "/pixel-10.jpg", alt: "Pixel music artwork 10" },
  { src: "/pixel-11.jpg", alt: "Pixel music artwork 11" },
  { src: "/pixel-13.jpg", alt: "Pixel music artwork 13" },
  { src: "/pixel-14.jpg", alt: "Pixel music artwork 14" },
  { src: "/pixel-15.png", alt: "Pixel music artwork 15" },
  { src: "/pixel-16.jpg", alt: "Pixel music artwork 16" },
  { src: "/pixel-17.jpg", alt: "Pixel music artwork 17" },
  { src: "/pixel-18.png", alt: "Pixel music artwork 18" },
];

const LAST_MEDIA_KEY = "syncroom_last_media_index";
const BG_MUSIC_SRC = "/lobby-loop.mp3";
const DARK_SILVER_BORDER = "#525252";

const DEFAULT_CATALOG = [
  {
    id: "track-1",
    title: "Lobby Pixel Loop",
    artist: "Columbina",
    duration: "03:45",
    src: BG_MUSIC_SRC,
    cover: "/pixel-0.gif",
    sourceLabel: "ROOM LOOP",
  },
  {
    id: "track-2",
    title: "80s Cyber Vibe",
    artist: "Howler Arcade",
    duration: "01:25",
    src: "https://raw.githubusercontent.com/goldfire/howler.js/master/examples/player/audio/80s_vibe.mp3",
    cover: "/pixel-1.jpg",
    sourceLabel: "STREAM",
  },
  {
    id: "track-3",
    title: "Rave Digger",
    artist: "Pixel Synth",
    duration: "01:40",
    src: "https://raw.githubusercontent.com/goldfire/howler.js/master/examples/player/audio/rave_digger.mp3",
    cover: "/pixel-7.gif",
    sourceLabel: "STREAM",
  },
  {
    id: "track-4",
    title: "Running Out of Time",
    artist: "Retro Wave",
    duration: "01:30",
    src: "https://raw.githubusercontent.com/goldfire/howler.js/master/examples/player/audio/running_out.mp3",
    cover: "/pixel-8.gif",
    sourceLabel: "STREAM",
  },
  {
    id: "track-5",
    title: "Viper Synth",
    artist: "MDN WebAudio",
    duration: "00:58",
    src: "https://raw.githubusercontent.com/mdn/webaudio-examples/main/audio-analyser/viper.mp3",
    cover: "/pixel-14.jpg",
    sourceLabel: "STREAM",
  },
  {
    id: "track-6",
    title: "Neon City Rain",
    artist: "Sample Beats",
    duration: "02:45",
    src: "https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3",
    cover: "/pixel-11.jpg",
    sourceLabel: "STREAM",
  },
];

const ROOM_LISTENERS = [
  { id: 1, name: "NeonSamurai" },
  { id: 2, name: "PixelWanderer" },
  { id: 3, name: "CyberColumbina" },
];

const COLOR_PRESETS = [
  { name: "White", value: "#ffffff" },
  { name: "Cyan", value: "#22d3ee" },
  { name: "Violet", value: "#a855f7" },
  { name: "Amber", value: "#facc15" },
  { name: "Emerald", value: "#4ade80" },
  { name: "Rose", value: "#fb7185" },
];

const TEXT_COLOR_PRESETS = [
  { name: "Pure White", value: "#ffffff" },
  { name: "Soft Silver", value: "#d4d4d4" },
  { name: "Ice Cyan", value: "#67e8f9" },
  { name: "Lemon", value: "#fef08a" },
  { name: "Mint", value: "#86efac" },
  { name: "Blush", value: "#f9a8d4" },
];

function getNonRepeatingMedia(items) {
  if (items.length === 0) return { src: "", alt: "" };
  if (items.length === 1) return items[0];

  let lastIndex = -1;
  try {
    const saved = sessionStorage.getItem(LAST_MEDIA_KEY);
    if (saved !== null) lastIndex = Number(saved);
  } catch {
    // Ignore storage access errors
  }

  const candidateIndices = items
    .map((_, idx) => idx)
    .filter((idx) => idx !== lastIndex);

  const chosenIndex =
    candidateIndices[Math.floor(Math.random() * candidateIndices.length)];

  try {
    sessionStorage.setItem(LAST_MEDIA_KEY, String(chosenIndex));
  } catch {
    // Ignore storage access errors
  }

  return items[chosenIndex];
}

function PixelGearIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4 [shape-rendering:crispEdges]"
      aria-hidden="true"
    >
      <rect x="6" y="1" width="4" height="2" fill="currentColor" />
      <rect x="6" y="13" width="4" height="2" fill="currentColor" />
      <rect x="1" y="6" width="2" height="4" fill="currentColor" />
      <rect x="13" y="6" width="2" height="4" fill="currentColor" />
      <rect x="3" y="3" width="2" height="2" fill="currentColor" />
      <rect x="11" y="3" width="2" height="2" fill="currentColor" />
      <rect x="3" y="11" width="2" height="2" fill="currentColor" />
      <rect x="11" y="11" width="2" height="2" fill="currentColor" />
      <rect x="4" y="4" width="8" height="8" fill="currentColor" />
      <rect x="6" y="6" width="4" height="4" fill="#000000" />
    </svg>
  );
}

export default function App() {
  const [selectedMedia] = useState(() => getNonRepeatingMedia(PIXEL_MEDIA));
  const [imageLoaded, setImageLoaded] = useState(false);

  // User & Auth State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("syncroom_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!user);
  const [activeView, setActiveView] = useState("workspace"); // "workspace" | "settings"

  // Theme Settings
  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem("syncroom_theme_mode") || "bw";
    } catch {
      return "bw";
    }
  });
  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : true
  );
  const [siteColor, setSiteColor] = useState(() => {
    try {
      return localStorage.getItem("syncroom_site_color") || "#ffffff";
    } catch {
      return "#ffffff";
    }
  });
  const [textColor, setTextColor] = useState(() => {
    try {
      return localStorage.getItem("syncroom_text_color") || "#ffffff";
    } catch {
      return "#ffffff";
    }
  });

  // Auth Form Fields
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submittedUser, setSubmittedUser] = useState(null);
  const [forgotNotice, setForgotNotice] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audio Engine State
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    try {
      const v = localStorage.getItem("syncroom_volume");
      return v !== null ? Number(v) : 80;
    } catch {
      return 80;
    }
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  // Navigation & Track Management
  const [activeTab, setActiveTab] = useState("discover"); // "discover" | "rooms" | "queue" | "profile"
  const [roomCode, setRoomCode] = useState("ROOM-808");
  const [currentHost, setCurrentHost] = useState("");
  const [wallpaper, setWallpaper] = useState(() => selectedMedia.src);
  const [searchQuery, setSearchQuery] = useState("");
  const [catalog, setCatalog] = useState(DEFAULT_CATALOG);
  const [currentTrack, setCurrentTrack] = useState(DEFAULT_CATALOG[0]);
  const [queue, setQueue] = useState([]);
  const [localTracks, setLocalTracks] = useState([]);
  const [listeners, setListeners] = useState(ROOM_LISTENERS);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("syncroom_favorites");
      return saved ? JSON.parse(saved) : ["track-1"];
    } catch {
      return ["track-1"];
    }
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isRemoteAction = useRef(false);

  const handleToggleFavorite = (track) => {
    if (!track?.id) return;
    setFavorites((prev) => {
      const exists = prev.some((t) => (typeof t === "string" ? t === track.id : t?.id === track.id));
      const updated = exists
        ? prev.filter((t) => (typeof t === "string" ? t !== track.id : t?.id !== track.id))
        : [...prev, track.id];
      try {
        localStorage.setItem("syncroom_favorites", JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const isFavorite = (trackId) =>
    favorites.some((t) => (typeof t === "string" ? t === trackId : t?.id === trackId));

  // Fetch internet catalog from backend on mount
  useEffect(() => {
    let isMounted = true;
    fetch("http://localhost:8000/api/music/catalog")
      .then((res) => {
        if (!res.ok) throw new Error("Catalog fetch failed");
        return res.json();
      })
      .then((data) => {
        if (isMounted && Array.isArray(data?.tracks) && data.tracks.length > 0) {
          setCatalog(data.tracks);
        }
      })
      .catch(() => {
        // Fallback gracefully to default catalog
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Room WebSocket Real-Time Synchronization
  const handleRemotePlay = useCallback((serverTime) => {
    isRemoteAction.current = true;
    if (audioRef.current) {
      if (serverTime !== undefined && Math.abs(audioRef.current.currentTime - serverTime) > 1.2) {
        audioRef.current.currentTime = serverTime;
        setCurrentTime(serverTime);
      }
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
    setTimeout(() => {
      isRemoteAction.current = false;
    }, 150);
  }, []);

  const handleRemotePause = useCallback((serverTime) => {
    isRemoteAction.current = true;
    if (audioRef.current) {
      if (serverTime !== undefined) {
        audioRef.current.currentTime = serverTime;
        setCurrentTime(serverTime);
      }
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setTimeout(() => {
      isRemoteAction.current = false;
    }, 150);
  }, []);

  const handleRemoteSeek = useCallback((seekTime) => {
    isRemoteAction.current = true;
    if (audioRef.current && Math.abs(audioRef.current.currentTime - seekTime) > 0.5) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
    setTimeout(() => {
      isRemoteAction.current = false;
    }, 150);
  }, []);

  const handleRemoteChangeTrack = useCallback((syncTrack) => {
    if (syncTrack && syncTrack.id !== currentTrack?.id) {
      isRemoteAction.current = true;
      setCurrentTrack(syncTrack);
      if (audioRef.current) {
        audioRef.current.src = syncTrack.src;
        audioRef.current.currentTime = 0;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
      setTimeout(() => {
        isRemoteAction.current = false;
      }, 150);
    }
  }, [currentTrack?.id]);

  const handleRemoteQueue = useCallback((syncQueue) => {
    if (Array.isArray(syncQueue)) {
      setQueue(syncQueue);
    }
  }, []);

  const handleRemoteListeners = useCallback((updatedListeners) => {
    if (Array.isArray(updatedListeners) && updatedListeners.length > 0) {
      setListeners(updatedListeners);
    }
  }, []);

  const handleHostUpdate = useCallback((newHost) => {
    if (newHost) setCurrentHost(newHost);
  }, []);

  const handleKicked = useCallback((reason) => {
    alert(reason || "You were removed from the room by the host.");
    setRoomCode("LOBBY");
  }, []);

  const handleWallpaperUpdate = useCallback((newWallpaper) => {
    if (newWallpaper) setWallpaper(newWallpaper);
  }, []);

  const { sendAction } = useRoomSocket({
    roomCode: roomCode,
    username: user?.username || "PlayerOne",
    onSyncPlay: handleRemotePlay,
    onSyncPause: handleRemotePause,
    onSyncSeek: handleRemoteSeek,
    onSyncChangeTrack: handleRemoteChangeTrack,
    onSyncQueue: handleRemoteQueue,
    onListenersUpdate: handleRemoteListeners,
    onHostUpdate: handleHostUpdate,
    onKicked: handleKicked,
    onWallpaperUpdate: handleWallpaperUpdate,
  });

  const handleExitRoom = () => {
    sendAction("PAUSE", { current_time: audioRef.current?.currentTime || 0 });
    setRoomCode("LOBBY");
  };

  const handleJoinRoom = (code) => {
    if (!code) return;
    setRoomCode(code.toUpperCase());
    setActiveTab("discover");
  };

  const handleCreateRoom = (code) => {
    const targetCode = (code || `ROOM-${Math.floor(100 + Math.random() * 900)}`).toUpperCase();
    setRoomCode(targetCode);
    setCurrentHost(user?.username || "PlayerOne");
    setActiveTab("discover");
  };

  const handleGiveLeadership = (targetName) => {
    sendAction("GIVE_LEADERSHIP", { target_name: targetName });
    setCurrentHost(targetName);
  };

  const handleKickUser = (targetName) => {
    sendAction("KICK_USER", { target_name: targetName });
  };

  const handleChangeWallpaper = (newWp) => {
    setWallpaper(newWp);
    sendAction("CHANGE_WALLPAPER", { wallpaper: newWp });
  };

  // System Theme Listener (ESLint error fixed: no synchronous setState in effect)
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setSystemPrefersDark(e.matches);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  // Preload background images
  useEffect(() => {
    PIXEL_MEDIA.forEach((item) => {
      if (item.src !== selectedMedia.src) {
        const img = new Image();
        img.src = item.src;
      }
    });
  }, [selectedMedia.src]);

  // Ensure audio has initial src on mount
  useEffect(() => {
    if (audioRef.current && !audioRef.current.src) {
      audioRef.current.src = currentTrack?.src || BG_MUSIC_SRC;
    }
  }, [currentTrack?.src]);

  // Initial user interaction sound unlock
  useEffect(() => {
    const unlockSound = () => {
      const audio = audioRef.current;
      if (audio && audio.paused) {
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    };

    window.addEventListener("pointerdown", unlockSound, { once: true });
    window.addEventListener("keydown", unlockSound, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockSound);
      window.removeEventListener("keydown", unlockSound);
    };
  }, []);

  // Sync volume & mute state with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      audioRef.current.muted = isMuted;
    }
    try {
      localStorage.setItem("syncroom_volume", String(volume));
    } catch {
      // Ignore
    }
  }, [volume, isMuted]);

  // Persist Theme Changes
  useEffect(() => {
    try {
      localStorage.setItem("syncroom_theme_mode", themeMode);
      localStorage.setItem("syncroom_site_color", siteColor);
      localStorage.setItem("syncroom_text_color", textColor);
    } catch {
      // Ignore
    }
  }, [themeMode, siteColor, textColor]);

  // Audio Event Handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration) {
      setDuration(audioRef.current.duration);
    }
  };

  const allAvailableTracks = [...catalog, ...localTracks];

  const handleNext = () => {
    if (queue.length > 0) {
      const nextTrack = queue[0];
      const updatedQueue = queue.slice(1);
      setQueue(updatedQueue);
      setCurrentTrack(nextTrack);
      if (!isRemoteAction.current) {
        sendAction("CHANGE_TRACK", { track: nextTrack, current_time: 0 });
        sendAction("UPDATE_QUEUE", { queue: updatedQueue });
      }
      if (audioRef.current) {
        audioRef.current.src = nextTrack.src;
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn("[SyncRoom Audio] Next track play error:", err);
          });
      }
      return;
    }

    if (allAvailableTracks.length === 0) return;

    let nextIdx;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * allAvailableTracks.length);
    } else {
      const currentIdx = allAvailableTracks.findIndex((t) => t.id === currentTrack?.id);
      nextIdx = (currentIdx + 1) % allAvailableTracks.length;
    }

    const nextTrack = allAvailableTracks[nextIdx];
    setCurrentTrack(nextTrack);
    if (!isRemoteAction.current) {
      sendAction("CHANGE_TRACK", { track: nextTrack, current_time: 0 });
    }
    if (audioRef.current) {
      audioRef.current.src = nextTrack.src;
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("[SyncRoom Audio] Next track play error:", err);
        });
    }
  };

  const handlePrev = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!isRemoteAction.current) {
        sendAction("SEEK", { current_time: 0 });
      }
      return;
    }

    if (allAvailableTracks.length === 0) return;
    const currentIdx = allAvailableTracks.findIndex((t) => t.id === currentTrack?.id);
    const prevIdx = (currentIdx - 1 + allAvailableTracks.length) % allAvailableTracks.length;
    const prevTrack = allAvailableTracks[prevIdx];
    setCurrentTrack(prevTrack);
    if (!isRemoteAction.current) {
      sendAction("CHANGE_TRACK", { track: prevTrack, current_time: 0 });
    }
    if (audioRef.current) {
      audioRef.current.src = prevTrack.src;
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("[SyncRoom Audio] Prev track play error:", err);
        });
    }
  };

  const handleAudioEnded = () => {
    if (isLooping) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
        if (!isRemoteAction.current) {
          sendAction("SEEK", { current_time: 0 });
        }
      }
    } else {
      handleNext();
    }
  };

  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      if (!audio.src && currentTrack?.src) {
        audio.src = currentTrack.src;
      }
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          if (!isRemoteAction.current) {
            sendAction("PLAY", { current_time: audio.currentTime });
          }
        })
        .catch((err) => {
          console.warn("[SyncRoom Audio] Toggle play error:", err);
        });
    } else {
      audio.pause();
      setIsPlaying(false);
      if (!isRemoteAction.current) {
        sendAction("PAUSE", { current_time: audio.currentTime });
      }
    }
  };

  const handleSelectTrack = (track) => {
    if (currentTrack?.id === track.id) {
      handleTogglePlay();
      return;
    }
    setCurrentTrack(track);
    if (!isRemoteAction.current) {
      sendAction("CHANGE_TRACK", { track, current_time: 0 });
    }
    const audio = audioRef.current;
    if (audio) {
      audio.src = track.src;
      audio.currentTime = 0;
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("[SyncRoom Audio] Track select play error:", err);
        });
    }
  };

  const handleSeek = (timeSeconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timeSeconds;
      setCurrentTime(timeSeconds);
      if (!isRemoteAction.current) {
        sendAction("SEEK", { current_time: timeSeconds });
      }
    }
  };

  const handleAddToQueue = (track) => {
    setQueue((prev) => {
      const nextQ = [...prev, track];
      if (!isRemoteAction.current) {
        sendAction("UPDATE_QUEUE", { queue: nextQ });
      }
      return nextQ;
    });
  };

  const handleRemoveFromQueue = (index) => {
    setQueue((prev) => {
      const nextQ = prev.filter((_, i) => i !== index);
      if (!isRemoteAction.current) {
        sendAction("UPDATE_QUEUE", { queue: nextQ });
      }
      return nextQ;
    });
  };

  const handleClearQueue = () => {
    setQueue([]);
    if (!isRemoteAction.current) {
      sendAction("UPDATE_QUEUE", { queue: [] });
    }
  };

  const handleLoadAllToQueue = () => {
    const all = [...catalog];
    setQueue(all);
    if (!isRemoteAction.current) {
      sendAction("UPDATE_QUEUE", { queue: all });
    }
  };

  const handleImportLocalFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imported = files.map((file, i) => {
      const url = URL.createObjectURL(file);
      const name = file.name.replace(/\.[^/.]+$/, "");
      return {
        id: `local-${Date.now()}-${i}`,
        title: name,
        artist: "Local Storage",
        duration: "03:00",
        src: url,
        cover: "/pixel-18.png",
        sourceLabel: "LOCAL FILE",
      };
    });

    setLocalTracks((prev) => [...prev, ...imported]);
    if (!currentTrack) {
      setCurrentTrack(imported[0]);
    }
  };

  // Auth Handlers with backend API & smooth fallback
  async function completeEntry() {
    setAuthError("");
    setIsSubmitting(true);
    const isSignupMode = mode === "signup";
    const resolvedUsername = isSignupMode
      ? username.trim() || email.split("@")[0] || "PlayerOne"
      : loginIdentifier.trim() || "PlayerOne";
    const resolvedEmail = isSignupMode
      ? email.trim() || "player@pixel.local"
      : loginIdentifier.includes("@")
        ? loginIdentifier.trim()
        : "player@pixel.local";

    try {
      const endpoint = isSignupMode
        ? "http://localhost:8000/api/auth/register"
        : "http://localhost:8000/api/auth/login";
      const payload = isSignupMode
        ? {
            username: resolvedUsername,
            email: resolvedEmail,
            password: password || "retrosecret123",
          }
        : {
            identifier: loginIdentifier.trim() || resolvedUsername,
            password: password || "retrosecret123",
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const resolvedUser = {
          id: data.user?.id,
          username: data.user?.username || resolvedUsername,
          email: data.user?.email || resolvedEmail,
          token: data.access_token,
          mode,
        };
        try {
          localStorage.setItem("syncroom_user", JSON.stringify(resolvedUser));
        } catch {
          // Ignore
        }
        setSubmittedUser(resolvedUser);
        setUser(resolvedUser);
        setActiveView("workspace");
        setIsAuthenticated(true);
        // Stop playing login song upon entering main site
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setIsSubmitting(false);
        return;
      } else {
        const errData = await res.json().catch(() => ({}));
        setAuthError(errData.detail || "Authentication error occurred");
        setIsSubmitting(false);
        return;
      }
    } catch {
      // Backend is offline or unreachable — allow seamless offline entry
      const resolvedUser = {
        mode,
        username: resolvedUsername,
        email: resolvedEmail,
        offline: true,
      };
      try {
        localStorage.setItem("syncroom_user", JSON.stringify(resolvedUser));
      } catch {
        // Ignore
      }
      setSubmittedUser(resolvedUser);
      setUser(resolvedUser);
      setActiveView("workspace");
      setIsAuthenticated(true);
      // Stop playing login song upon entering main site
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setIsSubmitting(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    completeEntry();
  }

  function handleInputKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      completeEntry();
    }
  }

  function handleLogout() {
    try {
      localStorage.removeItem("syncroom_user");
    } catch {
      // Ignore
    }
    setIsAuthenticated(false);
    setUser(null);
    setSubmittedUser(null);
    setActiveView("workspace");
  }

  const isSignup = mode === "signup";
  const isSystemLight = themeMode === "system" && !systemPrefersDark;

  const effectiveSiteColor =
    themeMode === "bw"
      ? isSystemLight
        ? "#000000"
        : "#ffffff"
      : siteColor;

  const effectiveTextColor =
    themeMode === "bw"
      ? isSystemLight
        ? "#000000"
        : "#ffffff"
      : textColor;

  const surfaceBg = isSystemLight ? "#ffffff" : "#000000";

  const globalThemeStyle = {
    backgroundColor: surfaceBg,
    color: effectiveTextColor,
    "--site-accent": effectiveSiteColor,
    "--site-text": effectiveTextColor,
  };

  return (
    <>
      {/* Centralized Audio Pipeline */}
      <audio
        ref={audioRef}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={(e) => console.warn("[SyncRoom Audio] Playback error on audio element:", e)}
      />

      {!isAuthenticated ? (
        /* Login / Sign Up Landing Screen with Retro Pixel Backdrop */
        <main
          style={globalThemeStyle}
          className="relative flex h-dvh w-full flex-col justify-center overflow-hidden py-10 sm:py-20"
        >
          {/* Background animation */}
          <div
            style={{ backgroundColor: surfaceBg }}
            className="relative h-full w-full overflow-hidden"
          >
            <img
              src={selectedMedia.src}
              alt={selectedMedia.alt}
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              className={`h-full w-full object-cover transition-opacity duration-500 [image-rendering:pixelated] ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>

          {/* Foreground Login Card */}
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4 sm:px-6">
            <div
              style={{
                backgroundColor: surfaceBg,
                color: effectiveTextColor,
              }}
              className="auth-soft-enter pointer-events-auto w-full max-w-md rounded-3xl shadow-2xl px-6 py-7 sm:px-8 sm:py-8"
            >
              {/* Mode Switcher */}
              <div className="mb-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setSubmittedUser(null);
                    setForgotNotice("");
                  }}
                  style={
                    !isSignup
                      ? {
                          backgroundColor: effectiveSiteColor,
                          color: surfaceBg,
                          borderColor: DARK_SILVER_BORDER,
                          borderRadius: "14px",
                        }
                      : {
                          backgroundColor: surfaceBg,
                          color: effectiveTextColor,
                          borderColor: DARK_SILVER_BORDER,
                          borderRadius: "14px",
                        }
                  }
                  className="pixel-btn flex-1 rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider sm:text-sm"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setSubmittedUser(null);
                    setForgotNotice("");
                  }}
                  style={
                    isSignup
                      ? {
                          backgroundColor: effectiveSiteColor,
                          color: surfaceBg,
                          borderColor: DARK_SILVER_BORDER,
                          borderRadius: "14px",
                        }
                      : {
                          backgroundColor: surfaceBg,
                          color: effectiveTextColor,
                          borderColor: DARK_SILVER_BORDER,
                          borderRadius: "14px",
                        }
                  }
                  className="pixel-btn flex-1 rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider sm:text-sm"
                >
                  Sign Up
                </button>
              </div>

              <div key={mode} className="auth-soft-enter">
                <h1
                  style={{ color: effectiveTextColor }}
                  className="mb-4 text-xl font-bold tracking-wider sm:text-2xl"
                >
                  {isSignup ? "CREATE ACCOUNT" : "SIGN IN"}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {!isSignup ? (
                    <div>
                      <label
                        style={{ color: effectiveTextColor }}
                        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider opacity-75"
                      >
                        Username or Email
                      </label>
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        placeholder="pixel_listener or you@example.com"
                        style={{
                          backgroundColor: surfaceBg,
                          color: effectiveTextColor,
                          borderColor: DARK_SILVER_BORDER,
                          borderRadius: "12px",
                        }}
                        className="w-full rounded-xl border px-3.5 py-2 text-xs sm:text-sm placeholder-neutral-600 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label
                          style={{ color: effectiveTextColor }}
                          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider opacity-75"
                        >
                          Username
                        </label>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          onKeyDown={handleInputKeyDown}
                          placeholder="pixel_listener"
                          style={{
                            backgroundColor: surfaceBg,
                            color: effectiveTextColor,
                            borderColor: DARK_SILVER_BORDER,
                            borderRadius: "12px",
                          }}
                          className="w-full rounded-xl border px-3.5 py-2 text-xs sm:text-sm placeholder-neutral-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          style={{ color: effectiveTextColor }}
                          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider opacity-75"
                        >
                          Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={handleInputKeyDown}
                          placeholder="you@example.com"
                          style={{
                            backgroundColor: surfaceBg,
                            color: effectiveTextColor,
                            borderColor: DARK_SILVER_BORDER,
                            borderRadius: "12px",
                          }}
                          className="w-full rounded-xl border px-3.5 py-2 text-xs sm:text-sm placeholder-neutral-600 focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label
                      style={{ color: effectiveTextColor }}
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wider opacity-75"
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      placeholder="••••••••"
                      style={{
                        backgroundColor: surfaceBg,
                        color: effectiveTextColor,
                        borderColor: DARK_SILVER_BORDER,
                        borderRadius: "12px",
                      }}
                      className="w-full rounded-xl border px-3.5 py-2 text-xs sm:text-sm placeholder-neutral-600 focus:outline-none"
                    />
                  </div>

                  {authError && (
                    <div
                      style={{ borderColor: "#ef4444", color: "#f87171" }}
                      className="auth-soft-enter rounded-xl border bg-red-950/40 px-3.5 py-2 text-center text-xs font-semibold"
                    >
                      {authError}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        backgroundColor: effectiveSiteColor,
                        color: surfaceBg,
                        borderColor: DARK_SILVER_BORDER,
                        borderRadius: "14px",
                      }}
                      className="pixel-btn flex-1 rounded-xl border py-2.5 text-xs font-bold uppercase tracking-wider sm:text-sm disabled:opacity-50"
                    >
                      {isSubmitting
                        ? "Connecting..."
                        : isSignup
                        ? "Create Account"
                        : "Enter"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMuted((prev) => !prev)}
                      style={{
                        backgroundColor: surfaceBg,
                        color: effectiveTextColor,
                        borderColor: DARK_SILVER_BORDER,
                        borderRadius: "14px",
                      }}
                      className="pixel-btn rounded-xl border px-3 py-2.5 text-xs font-bold uppercase tracking-wider"
                    >
                      {isMuted ? "Unmute" : "Mute"}
                    </button>
                  </div>
                </form>

                {/* Footer with Forgot Password */}
                <div
                  className="mt-5 flex items-center justify-between border-t pt-3 text-xs opacity-75"
                  style={{ borderColor: `${DARK_SILVER_BORDER}60` }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const target =
                        email.trim() ||
                        (loginIdentifier.includes("@") ? loginIdentifier.trim() : "");
                      if (target) {
                        setForgotNotice(`Reset instructions sent to ${target}`);
                      } else {
                        setForgotNotice(
                          "Enter your email above, then click Forgot Password."
                        );
                      }
                    }}
                    className="cursor-pointer text-xs underline-offset-4 hover:underline"
                  >
                    Forgot Password?
                  </button>
                  <span className="text-[10px] uppercase tracking-wider opacity-60">
                    SyncRoom Stereo
                  </span>
                </div>

                {forgotNotice && (
                  <p
                    style={{ borderColor: DARK_SILVER_BORDER }}
                    className="auth-soft-enter mt-3 rounded-lg border px-3 py-2 text-center text-xs"
                  >
                    {forgotNotice}
                  </p>
                )}

                {submittedUser && (
                  <p
                    style={{
                      backgroundColor: surfaceBg,
                      color: effectiveTextColor,
                      borderColor: DARK_SILVER_BORDER,
                    }}
                    className="auth-soft-enter mt-3 rounded-lg border px-3 py-2 text-xs"
                  >
                    Signed in as {submittedUser.username}
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* Authenticated Retro Music Player Workspace */
        <div
          key="workspace-view"
          style={globalThemeStyle}
          className="workspace-smooth-enter relative flex h-dvh w-full flex-col overflow-hidden"
        >
          {/* Subtle room wallpaper backdrop */}
          {wallpaper && (
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-10 [image-rendering:pixelated]"
              style={{
                backgroundImage: `url(${wallpaper})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              aria-hidden="true"
            />
          )}
          {/* Workspace Top Header */}
          <header
            style={{
              backgroundColor: surfaceBg,
              color: effectiveTextColor,
            }}
            className="z-20 flex h-14 shrink-0 items-center justify-between px-4 sm:px-6"
          >
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger Drawer Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="pixel-btn flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 font-bold md:hidden"
                title="Toggle Sidebar Menu"
              >
                ☰
              </button>

              <div>
                <h1 className="text-xs font-bold uppercase tracking-wider sm:text-sm">
                  {activeView === "settings"
                    ? "SYNCROOM // SETTINGS // APPEARANCE"
                    : `SYNCROOM // ${activeTab.toUpperCase()} // ROOM-808`}
                </h1>
                <p className="text-[10px] opacity-60">
                  LISTENER: {user?.username} ({user?.email})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsMuted((prev) => !prev)}
                className="pixel-btn hidden rounded-lg bg-neutral-900/60 px-3 py-1 text-[11px] font-bold uppercase sm:inline-block"
              >
                {isMuted ? "UNMUTE" : "MUTE"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveView((prev) =>
                    prev === "settings" ? "workspace" : "settings"
                  )
                }
                aria-label="Appearance Settings"
                title="Appearance Settings"
                style={
                  activeView === "settings"
                    ? {
                        backgroundColor: effectiveSiteColor,
                        color: surfaceBg,
                      }
                    : {}
                }
                className={`pixel-btn flex h-8 w-8 items-center justify-center rounded-lg ${
                  activeView !== "settings" ? "bg-neutral-900/60" : ""
                }`}
              >
                <PixelGearIcon />
              </button>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  backgroundColor: effectiveSiteColor,
                  color: surfaceBg,
                }}
                className="pixel-btn rounded-lg px-3 py-1 text-[11px] font-bold uppercase"
              >
                LOGOUT
              </button>
            </div>
          </header>

          {/* Main Area: Sidebar + Active View */}
          <div className="relative flex flex-1 overflow-hidden">
            <Sidebar
              user={user}
              roomCode={roomCode}
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setActiveView("workspace");
              }}
              listeners={listeners}
              currentHost={currentHost}
              onOpenSettings={() => setActiveView("settings")}
              onExitRoom={handleExitRoom}
              onGiveLeadership={handleGiveLeadership}
              onKickUser={handleKickUser}
              onChangeWallpaper={handleChangeWallpaper}
              isMobileOpen={isMobileOpen}
              setIsMobileOpen={setIsMobileOpen}
              effectiveSiteColor={effectiveSiteColor}
              effectiveTextColor={effectiveTextColor}
              surfaceBg={surfaceBg}
            />

            {/* Dynamic Panel: Settings or Music TrackList */}
            {activeView === "settings" ? (
              <main
                key="settings-panel"
                style={{
                  backgroundColor: surfaceBg,
                  color: effectiveTextColor,
                }}
                className="auth-soft-enter flex-1 overflow-y-auto p-4 sm:p-6 md:p-8"
              >
                <div className="flex flex-col gap-6 max-w-3xl">
                  <div className="flex items-center justify-between pb-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest opacity-50">
                        PREFERENCES MATRIX
                      </p>
                      <h2 className="text-xl font-bold uppercase tracking-wider sm:text-2xl">
                        APPEARANCE & THEME
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setThemeMode("bw");
                          setSiteColor("#ffffff");
                          setTextColor("#ffffff");
                        }}
                        className="pixel-btn rounded-lg bg-neutral-900/60 px-3 py-1.5 text-xs font-bold uppercase hover:bg-neutral-800"
                      >
                        RESET
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveView("workspace")}
                        style={{
                          backgroundColor: effectiveSiteColor,
                          color: surfaceBg,
                        }}
                        className="pixel-btn rounded-lg px-3.5 py-1.5 text-xs font-bold uppercase"
                      >
                        BACK TO PLAYER
                      </button>
                    </div>
                  </div>

                  {/* 1. Base Theme Mode */}
                  <div className="space-y-2.5">
                    <p className="text-xs font-bold uppercase tracking-wider opacity-70">
                      BASE THEME MODE
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => setThemeMode("bw")}
                        style={
                          themeMode === "bw"
                            ? {
                                backgroundColor: effectiveSiteColor,
                                color: surfaceBg,
                              }
                            : {}
                        }
                        className={`pixel-btn rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider ${
                          themeMode !== "bw" ? "bg-neutral-900/60 hover:bg-neutral-800" : ""
                        }`}
                      >
                        Black and White
                      </button>
                      <button
                        type="button"
                        onClick={() => setThemeMode("system")}
                        style={
                          themeMode === "system"
                            ? {
                                backgroundColor: effectiveSiteColor,
                                color: surfaceBg,
                              }
                            : {}
                        }
                        className={`pixel-btn rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider ${
                          themeMode !== "system" ? "bg-neutral-900/60 hover:bg-neutral-800" : ""
                        }`}
                      >
                        Use System ({systemPrefersDark ? "Dark" : "Light"})
                      </button>
                    </div>
                  </div>

                  {/* 2. Entire Website Color Theme */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider opacity-70">
                        WEBSITE ACCENT COLOR
                      </p>
                      <span className="text-xs uppercase opacity-50">
                        {effectiveSiteColor}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => {
                            setThemeMode("system");
                            setSiteColor(preset.value);
                          }}
                          style={{
                            backgroundColor: preset.value,
                            color: "#000000",
                          }}
                          className="pixel-btn rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
                        >
                          {preset.name}
                        </button>
                      ))}
                      <label className="pixel-btn flex cursor-pointer items-center gap-2 rounded-xl bg-neutral-900/60 px-3 py-1.5 text-xs font-bold uppercase hover:bg-neutral-800">
                        <span>Custom</span>
                        <input
                          type="color"
                          value={siteColor}
                          onChange={(e) => {
                            setThemeMode("system");
                            setSiteColor(e.target.value);
                          }}
                          className="h-4 w-5 cursor-pointer border-0 bg-transparent p-0"
                        />
                      </label>
                    </div>
                  </div>

                  {/* 3. Text Color Theme */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider opacity-70">
                        TEXT COLOR THEME (SEPARATE)
                      </p>
                      <span className="text-xs uppercase opacity-50">
                        {effectiveTextColor}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {TEXT_COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => {
                            setThemeMode("system");
                            setTextColor(preset.value);
                          }}
                          style={{
                            backgroundColor: surfaceBg,
                            color: preset.value,
                          }}
                          className="pixel-btn rounded-xl bg-neutral-900/60 hover:bg-neutral-800 px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
                        >
                          {preset.name}
                        </button>
                      ))}
                      <label className="pixel-btn flex cursor-pointer items-center gap-2 rounded-xl bg-neutral-900/60 px-3 py-1.5 text-xs font-bold uppercase hover:bg-neutral-800">
                        <span>Text Custom</span>
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => {
                            setThemeMode("system");
                            setTextColor(e.target.value);
                          }}
                          className="h-4 w-5 cursor-pointer border-0 bg-transparent p-0"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </main>
            ) : (
              <TrackList
                tracks={catalog}
                queue={queue}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                activeTab={activeTab}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSelectTrack={handleSelectTrack}
                onAddToQueue={handleAddToQueue}
                onRemoveFromQueue={handleRemoveFromQueue}
                onClearQueue={handleClearQueue}
                onLoadAllToQueue={handleLoadAllToQueue}
                localTracks={localTracks}
                onImportLocalFiles={handleImportLocalFiles}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                currentRoomCode={roomCode}
                onJoinRoom={handleJoinRoom}
                onCreateRoom={handleCreateRoom}
                onExitRoom={handleExitRoom}
                listeners={listeners}
                effectiveSiteColor={effectiveSiteColor}
                effectiveTextColor={effectiveTextColor}
                surfaceBg={surfaceBg}
              />
            )}
          </div>

          {/* Sticky Player Bar at Bottom */}
          <PlayerBar
            track={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isMuted={isMuted}
            isLooping={isLooping}
            isShuffle={isShuffle}
            isFavorite={isFavorite(currentTrack?.id)}
            onToggleFavorite={handleToggleFavorite}
            onTogglePlay={handleTogglePlay}
            onSeekChange={handleSeek}
            onVolumeChange={setVolume}
            onToggleMute={() => setIsMuted((prev) => !prev)}
            onToggleLoop={() => setIsLooping((prev) => !prev)}
            onToggleShuffle={() => setIsShuffle((prev) => !prev)}
            onPrev={handlePrev}
            onNext={handleNext}
            effectiveSiteColor={effectiveSiteColor}
            effectiveTextColor={effectiveTextColor}
            surfaceBg={surfaceBg}
          />
        </div>
      )}
    </>
  );
}
