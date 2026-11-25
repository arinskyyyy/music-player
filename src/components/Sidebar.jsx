import { useState, useRef, useEffect, useCallback } from "react";
import { formatRoomCode } from "../roomCode";

const WALLPAPER_PRESETS = [
  { name: "Pixel 00", src: "/pixel-0.gif" }, { name: "Pixel 01", src: "/pixel-1.jpg" }, { name: "Pixel 02", src: "/pixel-2.jpg" },
  { name: "Pixel 03", src: "/pixel-3.jpg" }, { name: "Pixel 04", src: "/pixel-4.jpg" }, { name: "Pixel 05", src: "/pixel-5.jpg" },
  { name: "Pixel 06", src: "/pixel-6.jpg" }, { name: "Pixel 07", src: "/pixel-7.gif" }, { name: "Pixel 08", src: "/pixel-8.gif" },
  { name: "Pixel 09", src: "/pixel-9.jpg" }, { name: "Pixel 10", src: "/pixel-10.jpg" }, { name: "Pixel 11", src: "/pixel-11.jpg" },
  { name: "Pixel 12", src: "/pixel-12.jpg" }, { name: "Pixel 13", src: "/pixel-13.jpg" }, { name: "Pixel 14", src: "/pixel-14.jpg" },
  { name: "Pixel 15", src: "/pixel-15.png" }, { name: "Pixel 16", src: "/pixel-16.jpg" }, { name: "Pixel 17", src: "/pixel-17.jpg" }, { name: "Pixel 18", src: "/pixel-18.png" },
];

export default function Sidebar({
  user,
  roomCode = "",
  roomName = "",
  activeTab,
  setActiveTab,
  listeners = [],
  kickedUsers = [],
  currentHost = "",
  isInRoom = false,
  onOpenSettings,
  onExitRoom,
  onGiveLeadership,
  onKickUser,
  onAllowUser,
  onChangeWallpaper,
  isMobileOpen,
  setIsMobileOpen,
  effectiveSiteColor = "#ffffff",
  effectiveTextColor = "#ffffff",
  surfaceBg = "#000000",
}) {
  const [isRoomOptionsOpen, setIsRoomOptionsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isWallpaperExpanded, setIsWallpaperExpanded] = useState(false);
  const roomOptionsRef = useRef(null);

  const handleCloseRoomOptions = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsRoomOptionsOpen(false);
      setIsClosing(false);
    }, 180);
  }, []);

  useEffect(() => {
    if (!isRoomOptionsOpen) return;
    const handleOutside = (e) => {
      if (roomOptionsRef.current && !roomOptionsRef.current.contains(e.target)) {
        handleCloseRoomOptions();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleCloseRoomOptions();
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRoomOptionsOpen, handleCloseRoomOptions]);

  const isUserHost = Boolean(
    isInRoom &&
      user?.username &&
      (currentHost ? user.username.toLowerCase() === currentHost.toLowerCase() : listeners[0]?.name === user.username)
  );

  const navItems = [
    {
      id: "discover",
      label: "Home",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: "rooms",
      label: "Rooms",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      ),
    },
    {
      id: "queue",
      label: "Queue",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
    },
    ...(isInRoom
      ? [
          {
            id: "chat",
            label: "Room Chat",
            icon: (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            ),
          },
        ]
      : []),
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: "storage",
      label: "Local Files",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: "about",
      label: "About Us",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {isMobileOpen && <div onClick={() => setIsMobileOpen(false)} className="fixed inset-0 z-40 bg-black/80 md:hidden" />}
      <aside
        style={{ backgroundColor: surfaceBg, color: effectiveTextColor }}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col justify-between p-4 sm:p-5 transition-transform duration-200 md:static md:translate-x-0 overflow-x-hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-5 overflow-y-auto overflow-x-hidden">
          <div className="flex justify-end md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="pixel-btn rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium"
            >
              ✕
            </button>
          </div>
          <nav className="flex flex-col gap-1.5 overflow-x-hidden">
            <p className="px-1 text-[10px] font-medium opacity-40">NAVIGATION</p>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileOpen(false);
                  }}
                  style={
                    isActive
                      ? { backgroundColor: effectiveSiteColor, color: surfaceBg }
                      : { backgroundColor: "transparent", color: effectiveTextColor }
                  }
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "shadow-sm shadow-white/10 font-semibold"
                      : "hover:bg-neutral-900/60 opacity-70 hover:opacity-100 hover:translate-x-1"
                  }`}
                >
                  <span className={`shrink-0 transition-transform duration-200 ${isActive ? "scale-105" : "group-hover:scale-110"}`}>
                    {item.icon}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {isActive && (
                    <span
                      style={{ backgroundColor: surfaceBg }}
                      className="h-1.5 w-1.5 rounded-full shrink-0 shadow-sm"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {isInRoom && (
            <div className="flex flex-col gap-2 rounded-2xl bg-neutral-900/40 p-4 animate-in fade-in slide-in-from-top-2 duration-200 overflow-x-hidden">
              <div className="flex items-center justify-between text-[11px] font-medium gap-1">
                <span className="opacity-75 font-mono text-[10px] truncate" title={roomName ? `${roomName} • ${formatRoomCode(roomCode)}` : formatRoomCode(roomCode)}>
                  {roomName ? `${roomName} • ` : ""}{formatRoomCode(roomCode)}
                </span>
                <span className="flex items-center gap-1 text-emerald-400 text-[10px] shrink-0 font-mono">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  {listeners.length}/20
                </span>
              </div>
              <ul className="flex flex-col gap-1.5 text-xs overflow-x-hidden">
                {listeners.slice(0, 5).map((person) => {
                  const isHost = person.is_host || (currentHost && person.name.toLowerCase() === currentHost.toLowerCase());
                  return (
                    <li key={person.id} className="flex items-center justify-between opacity-80">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isHost ? "bg-amber-400" : "bg-neutral-500"}`} />
                        <span className="truncate">{person.name}</span>
                      </div>
                      {isHost && (
                        <span className="rounded bg-amber-400/20 px-1 py-0.5 text-[8px] font-medium text-amber-300 shrink-0">
                          HOST
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {listeners.length > 5 && (
                <p className="mt-1 text-left text-[10px] font-medium text-neutral-400">
                  +{listeners.length - 5} more
                </p>
              )}
            </div>
          )}
        </div>

        <div className="relative mt-4 rounded-2xl bg-neutral-900/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden bg-neutral-950 font-medium text-xs">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username || "User"} className="h-full w-full object-cover" />
                ) : (
                  <span style={{ color: effectiveSiteColor }}>
                    {user?.username ? user.username.charAt(0).toUpperCase() : "P"}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{user?.username || "User"}</p>
                <p className="truncate text-[10px] opacity-50">{user?.email || ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (isRoomOptionsOpen) handleCloseRoomOptions();
                  else {
                    setIsRoomOptionsOpen(true);
                    setIsClosing(false);
                  }
                }}
                title="Room Options & Controls"
                style={{ color: effectiveTextColor }}
                className="pixel-btn flex h-7 w-7 items-center justify-center rounded-lg bg-transparent border-0 opacity-75 hover:opacity-100 transition-opacity duration-200"
              >
                <svg viewBox="0 0 16 16" className="h-5 w-5 [shape-rendering:crispEdges]" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="1" width="4" height="2" /><rect x="6" y="13" width="4" height="2" /><rect x="1" y="6" width="2" height="4" /><rect x="13" y="6" width="2" height="4" />
                  <rect x="3" y="3" width="2" height="2" /><rect x="11" y="3" width="2" height="2" /><rect x="3" y="11" width="2" height="2" /><rect x="11" y="11" width="2" height="2" />
                  <rect x="4" y="4" width="8" height="8" /><rect x="6" y="6" width="4" height="4" fill={surfaceBg} />
                </svg>
              </button>
              <button
                type="button"
                onClick={onExitRoom}
                style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }}
                className="pixel-btn rounded-lg px-2.5 py-1 text-xs font-medium shrink-0 transition-colors duration-200 hover:opacity-80"
              >
                EXIT
              </button>
            </div>
          </div>

          {isRoomOptionsOpen && (
            <>
              <div onClick={handleCloseRoomOptions} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" />
              <div
                ref={roomOptionsRef}
                style={{ backgroundColor: surfaceBg === "#000000" ? "#141414" : "#ffffff", color: effectiveTextColor }}
                className={`absolute bottom-full left-0 mb-2 w-full max-h-[70vh] overflow-y-auto overflow-x-hidden rounded-2xl p-4 shadow-2xl z-50 border border-neutral-800 ${
                  isClosing ? "popover-exit" : "popover-enter"
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <span className="text-[10px] font-medium opacity-60">ROOM CONTROLS</span>
                  {isInRoom && (
                    <span className="text-[10px] font-medium text-amber-400">
                      {isUserHost ? "★ YOU ARE HOST" : `HOST: ${currentHost || "Unknown"}`}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2.5 pt-3 text-xs">
                  <div>
                    <p className="text-[10px] font-medium opacity-60 mb-1">TRANSFER LEADERSHIP</p>
                    {isUserHost ? (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            onGiveLeadership?.(e.target.value);
                            handleCloseRoomOptions();
                          }
                        }}
                        defaultValue=""
                        className="w-full rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="" disabled>Select Member...</option>
                        {listeners.filter((m) => m.name !== user?.username).map((m) => (
                          <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-[11px] opacity-40">Host only.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-medium opacity-60 mb-1">KICK LISTENER</p>
                    {isUserHost ? (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            onKickUser?.(e.target.value);
                            handleCloseRoomOptions();
                          }
                        }}
                        defaultValue=""
                        className="w-full rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs text-red-400 focus:outline-none"
                      >
                        <option value="" disabled>Select Member...</option>
                        {listeners.filter((m) => m.name !== user?.username).map((m) => (
                          <option key={m.id} value={m.name}>Kick {m.name}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-[11px] opacity-40">Host only.</p>
                    )}
                  </div>
                  {isInRoom && (
                    <div>
                      <p className="text-[10px] font-medium opacity-60 mb-1">UNBLOCK KICKED USER</p>
                      {isUserHost ? (
                        kickedUsers.length > 0 ? (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                onAllowUser?.(e.target.value);
                                handleCloseRoomOptions();
                              }
                            }}
                            defaultValue=""
                            className="w-full rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs text-emerald-400 focus:outline-none"
                          >
                            <option value="" disabled>Unblock member...</option>
                            {kickedUsers.map((k) => (
                              <option key={k.username} value={k.username}>Unblock {k.username}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-[11px] opacity-40">No blocked users.</p>
                        )
                      ) : (
                        <p className="text-[11px] opacity-40">Host only.</p>
                      )}
                    </div>
                  )}
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsWallpaperExpanded((prev) => !prev)}
                      className="mb-1 flex w-full items-center justify-between text-[10px] font-medium opacity-60 hover:opacity-100 transition-opacity duration-200"
                    >
                      <span>ROOM WALLPAPER</span>
                      <span className="opacity-70">{isWallpaperExpanded ? "▲ HIDE" : "▼ CHOOSE"}</span>
                    </button>
                    {isWallpaperExpanded && (
                      <div className="grid max-h-40 grid-cols-4 gap-1.5 overflow-y-auto pr-1">
                        {WALLPAPER_PRESETS.map((wp) => (
                          <button
                            key={wp.src}
                            type="button"
                            onClick={() => {
                              onChangeWallpaper?.(wp.src);
                              handleCloseRoomOptions();
                            }}
                            title={wp.name}
                            className="h-9 w-full overflow-hidden rounded-md border border-neutral-700/60 transition-colors duration-200 hover:border-white"
                          >
                            <img src={wp.src} alt={wp.name} className="h-full w-full object-cover [image-rendering:pixelated]" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("profile");
                        handleCloseRoomOptions();
                        setIsMobileOpen(false);
                      }}
                      className="text-[11px] font-medium opacity-70 hover:opacity-100 transition-opacity duration-200"
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenSettings?.();
                        handleCloseRoomOptions();
                      }}
                      className="text-[11px] font-medium opacity-70 hover:opacity-100 transition-opacity duration-200"
                    >
                      Appearance
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseRoomOptions}
                      className="text-[11px] font-medium opacity-50 hover:opacity-100 transition-opacity duration-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
