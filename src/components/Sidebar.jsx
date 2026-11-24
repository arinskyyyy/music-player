import { useState } from "react";
import { formatRoomCode } from "../roomCode";

const WALLPAPER_PRESETS = [
  { name: "Pixel 00", src: "/pixel-0.gif" }, { name: "Pixel 01", src: "/pixel-1.jpg" }, { name: "Pixel 02", src: "/pixel-2.jpg" },
  { name: "Pixel 03", src: "/pixel-3.jpg" }, { name: "Pixel 04", src: "/pixel-4.jpg" }, { name: "Pixel 05", src: "/pixel-5.jpg" },
  { name: "Pixel 06", src: "/pixel-6.jpg" }, { name: "Pixel 07", src: "/pixel-7.gif" }, { name: "Pixel 08", src: "/pixel-8.gif" },
  { name: "Pixel 09", src: "/pixel-9.jpg" }, { name: "Pixel 10", src: "/pixel-10.jpg" }, { name: "Pixel 11", src: "/pixel-11.jpg" },
  { name: "Pixel 12", src: "/pixel-12.jpg" }, { name: "Pixel 13", src: "/pixel-13.jpg" }, { name: "Pixel 14", src: "/pixel-14.jpg" },
  { name: "Pixel 15", src: "/pixel-15.png" }, { name: "Pixel 16", src: "/pixel-16.jpg" }, { name: "Pixel 17", src: "/pixel-17.jpg" }, { name: "Pixel 18", src: "/pixel-18.png" },
];

export default function Sidebar({ user, roomCode = "", activeTab, setActiveTab, listeners = [], currentHost = "", isInRoom = false, onOpenSettings, onExitRoom, onGiveLeadership, onKickUser, onChangeWallpaper, isMobileOpen, setIsMobileOpen, effectiveSiteColor = "#ffffff", effectiveTextColor = "#ffffff", surfaceBg = "#000000" }) {
  const [isRoomOptionsOpen, setIsRoomOptionsOpen] = useState(false);
  const [isWallpaperExpanded, setIsWallpaperExpanded] = useState(false);

  const isUserHost = Boolean(isInRoom && user?.username && (currentHost ? user.username.toLowerCase() === currentHost.toLowerCase() : listeners[0]?.name === user.username));
  const navItems = [{ id: "discover", label: "Home" }, { id: "rooms", label: "Rooms" }, { id: "queue", label: "Queue" }, { id: "profile", label: "Profile" }, { id: "storage", label: "Local Files" }];

  return (
    <>
      {isMobileOpen && <div onClick={() => setIsMobileOpen(false)} className="fixed inset-0 z-40 bg-black/80 md:hidden" />}
      <aside style={{ backgroundColor: surfaceBg, color: effectiveTextColor }} className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between p-5 transition-transform duration-200 md:static md:translate-x-0 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col gap-5 overflow-y-auto">
          <div className="flex justify-end md:hidden"><button type="button" onClick={() => setIsMobileOpen(false)} className="pixel-btn rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium">✕</button></div>
          <nav className="flex flex-col gap-1.5">
            <p className="px-1 text-[10px] font-medium opacity-40">NAVIGATION</p>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button key={item.id} type="button" onClick={() => { setActiveTab(item.id); setIsMobileOpen(false); }} style={isActive ? { backgroundColor: effectiveSiteColor, color: surfaceBg } : { backgroundColor: "transparent", color: effectiveTextColor }}
                  className={`pixel-btn flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-medium transition-colors duration-200 ${!isActive ? "hover:bg-neutral-900/60 opacity-80 hover:opacity-100" : ""}`}>
                  <span className="flex-1">{item.label}</span>{isActive && <span>◀</span>}
                </button>
              );
            })}
          </nav>

          {isInRoom && (
            <div className="flex flex-col gap-2 rounded-2xl bg-neutral-900/40 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between text-[11px] font-medium">
                <span className="opacity-70 font-mono text-[10px]">{formatRoomCode(roomCode)}</span>
                <span className="flex items-center gap-1 text-emerald-400 text-[10px]"><span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />{listeners.length} ONLINE</span>
              </div>
              <ul className="flex flex-col gap-1.5 text-xs">
                {listeners.slice(0, 5).map((person) => {
                  const isHost = person.is_host || (currentHost && person.name.toLowerCase() === currentHost.toLowerCase());
                  return (
                    <li key={person.id} className="flex items-center justify-between opacity-80">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`h-1.5 w-1.5 rounded-full ${isHost ? "bg-amber-400" : "bg-neutral-500"}`} />
                        <span className="truncate">{person.name}</span>
                      </div>
                      {isHost && <span className="rounded bg-amber-400/20 px-1 py-0.5 text-[8px] font-medium text-amber-300">HOST</span>}
                    </li>
                  );
                })}
              </ul>
              {listeners.length > 5 && <p className="mt-1 text-left text-[10px] font-medium text-neutral-400">+{listeners.length - 5} more</p>}
            </div>
          )}
        </div>

        <div className="relative mt-4 rounded-2xl bg-neutral-900/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-950 font-medium text-xs"><span style={{ color: effectiveSiteColor }}>{user?.username ? user.username.charAt(0).toUpperCase() : "P"}</span></div>
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{user?.username || "User"}</p><p className="truncate text-[10px] opacity-50">{user?.email || ""}</p></div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button type="button" onClick={() => setIsRoomOptionsOpen((prev) => !prev)} title="Room Options & Controls" className="pixel-btn flex h-7 w-7 items-center justify-center rounded-lg bg-transparent border-0 text-neutral-300 hover:text-white transition-colors duration-200">
                <svg viewBox="0 0 16 16" className="h-5 w-5 [shape-rendering:crispEdges]" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="1" width="4" height="2" /><rect x="6" y="13" width="4" height="2" /><rect x="1" y="6" width="2" height="4" /><rect x="13" y="6" width="2" height="4" />
                  <rect x="3" y="3" width="2" height="2" /><rect x="11" y="3" width="2" height="2" /><rect x="3" y="11" width="2" height="2" /><rect x="11" y="11" width="2" height="2" />
                  <rect x="4" y="4" width="8" height="8" /><rect x="6" y="6" width="4" height="4" fill="#000000" />
                </svg>
              </button>
              <button type="button" onClick={onExitRoom} style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }} className="pixel-btn rounded-lg px-2.5 py-1 text-xs font-medium shrink-0 transition-colors duration-200 hover:opacity-80">EXIT</button>
            </div>
          </div>

          {isRoomOptionsOpen && (
            <div style={{ backgroundColor: surfaceBg === "#000000" ? "#141414" : "#ffffff", color: effectiveTextColor }} className="auth-soft-enter absolute bottom-full left-0 mb-2 w-72 rounded-2xl p-4 shadow-2xl z-50 border border-neutral-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-[10px] font-medium opacity-60">ROOM CONTROLS</span>
                {isInRoom && <span className="text-[10px] font-medium text-amber-400">{isUserHost ? "★ YOU ARE HOST" : `HOST: ${currentHost || "Unknown"}`}</span>}
              </div>
              <div className="flex flex-col gap-2.5 pt-3 text-xs">
                <div>
                  <p className="text-[10px] font-medium opacity-60 mb-1">TRANSFER LEADERSHIP</p>
                  {isUserHost ? (
                    <select onChange={(e) => { if (e.target.value) { onGiveLeadership?.(e.target.value); setIsRoomOptionsOpen(false); } }} defaultValue="" className="w-full rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs text-white focus:outline-none">
                      <option value="" disabled>Select Member...</option>{listeners.filter((m) => m.name !== user?.username).map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                    </select>
                  ) : <p className="text-[11px] opacity-40">Host only.</p>}
                </div>
                <div>
                  <p className="text-[10px] font-medium opacity-60 mb-1">KICK LISTENER</p>
                  {isUserHost ? (
                    <select onChange={(e) => { if (e.target.value) { onKickUser?.(e.target.value); setIsRoomOptionsOpen(false); } }} defaultValue="" className="w-full rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs text-red-400 focus:outline-none">
                      <option value="" disabled>Select Member...</option>{listeners.filter((m) => m.name !== user?.username).map((m) => <option key={m.id} value={m.name}>Kick {m.name}</option>)}
                    </select>
                  ) : <p className="text-[11px] opacity-40">Host only.</p>}
                </div>
                <div>
                  <button type="button" onClick={() => setIsWallpaperExpanded((prev) => !prev)} className="mb-1 flex w-full items-center justify-between text-[10px] font-medium opacity-60 hover:opacity-100 transition-opacity duration-200">
                    <span>ROOM WALLPAPER</span><span className="opacity-70">{isWallpaperExpanded ? "▲ HIDE" : "▼ CHOOSE"}</span>
                  </button>
                  {isWallpaperExpanded && (
                    <div className="grid max-h-40 grid-cols-4 gap-1.5 overflow-y-auto pr-1">
                      {WALLPAPER_PRESETS.map((wp) => (
                        <button key={wp.src} type="button" onClick={() => { onChangeWallpaper?.(wp.src); setIsRoomOptionsOpen(false); }} title={wp.name} className="h-9 w-full overflow-hidden rounded-md border border-neutral-700/60 transition-colors duration-200 hover:border-white">
                          <img src={wp.src} alt={wp.name} className="h-full w-full object-cover [image-rendering:pixelated]" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800 pt-2">
                  <button type="button" onClick={() => { setActiveTab("profile"); setIsRoomOptionsOpen(false); setIsMobileOpen(false); }} className="text-[11px] font-medium opacity-70 hover:opacity-100 transition-opacity duration-200">Profile</button>
                  <button type="button" onClick={() => { onOpenSettings?.(); setIsRoomOptionsOpen(false); }} className="text-[11px] font-medium opacity-70 hover:opacity-100 transition-opacity duration-200">Appearance</button>
                  <button type="button" onClick={() => setIsRoomOptionsOpen(false)} className="text-[11px] font-medium opacity-50 hover:opacity-100 transition-opacity duration-200">Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}