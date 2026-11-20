import { useState } from "react";

const WALLPAPER_PRESETS = [
  { name: "Pixel 0", src: "/pixel-0.gif" },
  { name: "Pixel 1", src: "/pixel-1.jpg" },
  { name: "Pixel 7", src: "/pixel-7.gif" },
  { name: "Pixel 14", src: "/pixel-14.jpg" },
];

export default function Sidebar({
  user,
  roomCode = "ROOM-808",
  activeTab,
  setActiveTab,
  listeners = [],
  currentHost = "",
  onOpenSettings,
  onExitRoom,
  onGiveLeadership,
  onKickUser,
  onChangeWallpaper,
  isMobileOpen,
  setIsMobileOpen,
  effectiveSiteColor = "#ffffff",
  effectiveTextColor = "#ffffff",
  surfaceBg = "#000000",
}) {
  const [isListenersExpanded, setIsListenersExpanded] = useState(false);
  const [isRoomOptionsOpen, setIsRoomOptionsOpen] = useState(false);

  const isUserHost = Boolean(
    user?.username &&
    (currentHost ? user.username.toLowerCase() === currentHost.toLowerCase() : listeners[0]?.name === user.username)
  );

  const navItems = [
    { id: "discover", code: "01", label: "CATALOG // STREAM" },
    { id: "rooms", code: "02", label: "ROOMS // MULTIPLAYER" },
    { id: "queue", code: "03", label: "QUEUE // ROOM SYNC" },
    { id: "profile", code: "04", label: "LOCAL PC // STORAGE" },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 md:hidden"
        />
      )}

      <aside
        style={{
          backgroundColor: surfaceBg,
          color: effectiveTextColor,
        }}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between p-5 transition-transform duration-200 md:static md:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-5 overflow-y-auto">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-1">
            <div>
              <div className="flex items-center gap-2">
                <span
                  style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }}
                  className="rounded px-1.5 py-0.5 text-xs font-bold"
                >
                  8-BIT
                </span>
                <h1 className="text-lg font-bold tracking-wider">SYNCROOM</h1>
              </div>
              <p className="text-[11px] uppercase opacity-50">STEREO DESKTOP UI</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-md bg-neutral-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider opacity-80">
                {roomCode || "LOBBY"}
              </span>
              {/* Mobile Close Button */}
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="pixel-btn rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-bold md:hidden"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1.5">
            <p className="px-1 text-[10px] font-bold uppercase tracking-widest opacity-40">NAVIGATION</p>
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
                      ? {
                          backgroundColor: effectiveSiteColor,
                          color: surfaceBg,
                        }
                      : {
                          backgroundColor: "transparent",
                          color: effectiveTextColor,
                        }
                  }
                  className={`pixel-btn flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-bold tracking-wider uppercase transition-colors ${
                    !isActive ? "hover:bg-neutral-900/60 opacity-80 hover:opacity-100" : ""
                  }`}
                >
                  <span className="opacity-60">[{item.code}]</span>
                  <span className="flex-1 px-2.5">{item.label}</span>
                  {isActive && <span>◀</span>}
                </button>
              );
            })}
          </nav>

          {/* Active Listeners in Room (with white light text & max 5 users) */}
          <div className="flex flex-col gap-2 rounded-2xl bg-neutral-900/40 p-4">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <span className="opacity-70">IN ROOM</span>
                <span className="font-mono text-xs font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] tracking-wider">
                  [{roomCode || "LOBBY"}]
                </span>
              </div>
              <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                {listeners.length} ONLINE
              </span>
            </div>

            <ul className="flex flex-col gap-1.5 text-xs">
              {(isListenersExpanded ? listeners : listeners.slice(0, 5)).map((person) => {
                const isHost = person.is_host || (currentHost && person.name.toLowerCase() === currentHost.toLowerCase());
                return (
                  <li key={person.id} className="flex items-center justify-between opacity-80">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`h-1.5 w-1.5 rounded-full ${isHost ? "bg-amber-400" : "bg-neutral-500"}`} />
                      <span className="truncate">{person.name}</span>
                    </div>
                    {isHost && (
                      <span className="rounded bg-amber-400/20 px-1 py-0.5 text-[8px] font-bold text-amber-300">
                        HOST
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {listeners.length > 5 && (
              <button
                type="button"
                onClick={() => setIsListenersExpanded((prev) => !prev)}
                className="mt-1 text-left text-[10px] font-bold uppercase text-neutral-400 hover:text-white"
              >
                {isListenersExpanded ? "▲ COLLAPSE" : `▼ +${listeners.length - 5} MORE LISTENERS`}
              </button>
            )}
          </div>
        </div>

        {/* User Account / Controls Footer */}
        <div className="relative mt-4 rounded-2xl bg-neutral-900/40 p-3">
          <div className="flex items-center justify-between gap-2">
            {/* User Profile Badge & Info */}
            <div className="flex items-center gap-2 min-w-0">
              <div
                style={{
                  borderColor: isUserHost ? "#fbbf24" : "rgba(255,255,255,0.15)",
                }}
                className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-950 font-bold text-xs"
              >
                <span style={{ color: isUserHost ? "#fbbf24" : effectiveSiteColor }}>
                  {user?.username ? user.username.charAt(0).toUpperCase() : "P"}
                </span>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-black ${
                    isUserHost ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-xs font-bold uppercase">
                    {user?.username || "GUEST"}
                  </p>
                  <span
                    className={`rounded px-1 text-[8px] font-bold uppercase ${
                      isUserHost
                        ? "bg-amber-400/20 text-amber-300"
                        : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {isUserHost ? "HOST" : "VIP"}
                  </span>
                </div>
                <p className="truncate text-[10px] opacity-50">
                  {user?.email || "offline"}
                </p>
              </div>
            </div>

            {/* Controls: Settings Icon (borderless, larger) + Exit Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Settings Dropdown Button - BORDERLESS with larger SVG */}
              <button
                type="button"
                onClick={() => setIsRoomOptionsOpen((prev) => !prev)}
                title="Room Options & Controls"
                className="pixel-btn flex h-7 w-7 items-center justify-center rounded-lg bg-transparent border-0 text-neutral-300 hover:text-white transition-colors"
              >
                <svg
                  viewBox="0 0 16 16"
                  className="h-5 w-5 [shape-rendering:crispEdges]"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <rect x="6" y="1" width="4" height="2" />
                  <rect x="6" y="13" width="4" height="2" />
                  <rect x="1" y="6" width="2" height="4" />
                  <rect x="13" y="6" width="2" height="4" />
                  <rect x="3" y="3" width="2" height="2" />
                  <rect x="11" y="3" width="2" height="2" />
                  <rect x="3" y="11" width="2" height="2" />
                  <rect x="11" y="11" width="2" height="2" />
                  <rect x="4" y="4" width="8" height="8" />
                  <rect x="6" y="6" width="4" height="4" fill="#000000" />
                </svg>
              </button>

              {/* Exit Button */}
              <button
                type="button"
                onClick={onExitRoom}
                style={{
                  backgroundColor: effectiveSiteColor,
                  color: surfaceBg,
                }}
                className="pixel-btn rounded-lg px-2.5 py-1 text-xs font-bold uppercase shrink-0"
              >
                EXIT
              </button>
            </div>
          </div>

          {/* Dropdown Options Popup (drop-options) */}
          {isRoomOptionsOpen && (
            <div
              style={{
                backgroundColor: surfaceBg === "#000000" ? "#141414" : "#ffffff",
                color: effectiveTextColor,
              }}
              className="auth-soft-enter absolute bottom-full left-0 mb-2 w-72 rounded-2xl p-4 shadow-2xl z-50 border border-neutral-800"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">ROOM CONTROLS</span>
                <span className="text-[10px] font-bold text-amber-400">
                  {isUserHost ? "★ YOU ARE HOST" : `HOST: ${currentHost || "Unknown"}`}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 pt-3 text-xs">
                {/* 1. Give Leadership */}
                <div>
                  <p className="text-[10px] uppercase font-bold opacity-60 mb-1">GIVE LEADERSHIP</p>
                  {isUserHost ? (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          onGiveLeadership?.(e.target.value);
                          setIsRoomOptionsOpen(false);
                        }
                      }}
                      defaultValue=""
                      className="w-full rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="" disabled>Select Member to Transfer Host...</option>
                      {listeners
                        .filter((m) => m.name !== user?.username)
                        .map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <p className="text-[11px] opacity-40">Host only — Ask {currentHost || "host"} for leadership.</p>
                  )}
                </div>

                {/* 2. Moderator Actions (Kick/Ban) */}
                <div>
                  <p className="text-[10px] uppercase font-bold opacity-60 mb-1">MODERATION (KICK LISTENER)</p>
                  {isUserHost ? (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          onKickUser?.(e.target.value);
                          setIsRoomOptionsOpen(false);
                        }
                      }}
                      defaultValue=""
                      className="w-full rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs text-red-400 focus:outline-none"
                    >
                      <option value="" disabled>Select Member to Kick...</option>
                      {listeners
                        .filter((m) => m.name !== user?.username)
                        .map((m) => (
                          <option key={m.id} value={m.name}>
                            Kick {m.name}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <p className="text-[11px] opacity-40">Host only — Cannot moderate without leadership.</p>
                  )}
                </div>

                {/* 3. Change Room Wallpaper */}
                <div>
                  <p className="text-[10px] uppercase font-bold opacity-60 mb-1">ROOM WALLPAPER</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {WALLPAPER_PRESETS.map((wp) => (
                      <button
                        key={wp.src}
                        type="button"
                        onClick={() => {
                          onChangeWallpaper?.(wp.src);
                          setIsRoomOptionsOpen(false);
                        }}
                        title={wp.name}
                        className="h-9 w-full overflow-hidden rounded-md border border-neutral-700/60 hover:border-white transition-colors"
                      >
                        <img src={wp.src} alt={wp.name} className="h-full w-full object-cover [image-rendering:pixelated]" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Preferences Link */}
                <div className="pt-2 border-t border-neutral-800 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenSettings?.();
                      setIsRoomOptionsOpen(false);
                    }}
                    className="text-[11px] font-bold uppercase opacity-70 hover:opacity-100"
                  >
                    ⚙ Appearance Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRoomOptionsOpen(false)}
                    className="text-[11px] font-bold uppercase opacity-50 hover:opacity-100"
                  >
                    Close ✕
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
