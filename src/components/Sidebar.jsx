export default function Sidebar({
  user,
  roomCode = "ROOM-808",
  activeTab,
  setActiveTab,
  listeners = [],
  onOpenSettings,
  onLogout,
  isMobileOpen,
  setIsMobileOpen,
  effectiveSiteColor = "#ffffff",
  effectiveTextColor = "#ffffff",
  surfaceBg = "#000000",
}) {
  const navItems = [
    { id: "discover", code: "01", label: "CATALOG // STREAM" },
    { id: "queue", code: "02", label: "QUEUE // ROOM SYNC" },
    { id: "profile", code: "03", label: "LOCAL PC // STORAGE" },
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
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-2">
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
                {roomCode}
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

          {/* Active Listeners in Room */}
          <div className="flex flex-col gap-2 rounded-2xl bg-neutral-900/40 p-4">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
              <span className="opacity-70">IN ROOM</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                {listeners.length} ONLINE
              </span>
            </div>
            <ul className="flex flex-col gap-1.5 text-xs">
              {listeners.map((person) => (
                <li key={person.id} className="flex items-center gap-2 opacity-75">
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
                  <span className="truncate">{person.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* User Account / Controls Footer */}
        <div className="flex items-center justify-between rounded-2xl bg-neutral-900/40 p-3.5">
          <div className="min-w-0 pr-2">
            <p className="truncate text-xs font-bold uppercase">{user?.username || "GUEST"}</p>
            <p className="truncate text-[10px] opacity-50">{user?.email || "offline"}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenSettings}
              title="Appearance Settings"
              className="pixel-btn rounded-lg bg-neutral-800/60 px-2.5 py-1 text-xs font-bold uppercase hover:bg-neutral-800"
            >
              ⚙
            </button>
            <button
              type="button"
              onClick={onLogout}
              style={{
                backgroundColor: effectiveSiteColor,
                color: surfaceBg,
              }}
              className="pixel-btn rounded-lg px-3 py-1 text-xs font-bold uppercase"
            >
              EXIT
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
