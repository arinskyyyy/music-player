import { useEffect, useRef, useState } from "react";
import { PixelHeartIcon } from "./PlayerBar";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function SearchDropdown({ isFavorite, onToggleFavorite, onSelectTrack, playlists = [], onAddToPlaylist, onSearchEnter, effectiveSiteColor = "#ffffff", effectiveTextColor = "#ffffff", surfaceBg = "#000000" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      const timer = setTimeout(() => {
        setResults([]);
        setLoading(false);
        setOpenMenuId(null);
      }, 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/music/external-search?q=${encodeURIComponent(q)}&limit=10`);
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        setResults(data.tracks || []);
      } catch {
        /* ignore */
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onClick(e) { if (containerRef.current && !containerRef.current.contains(e.target)) { setOpenMenuId(null); setResults([]); } }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && query.trim() !== "") {
      e.preventDefault();
      const q = query.trim(); setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/music/external-search?q=${encodeURIComponent(q)}&limit=50`);
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        onSearchEnter(data.tracks || [], q); setResults([]); setQuery(""); 
      } catch { onSearchEnter([], q); } finally { setLoading(false); }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full sm:w-72">
      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="Search and press Enter..."
        style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", color: effectiveTextColor }}
        className="w-full rounded-xl px-3.5 py-2 text-xs placeholder-neutral-500 focus:outline-none border border-neutral-800 transition-colors focus:border-neutral-500"
      />
      {query.trim() !== "" && (
        <div style={{ backgroundColor: surfaceBg === "#000000" ? "#141414" : "#ffffff", color: effectiveTextColor }} className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-neutral-800 p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          {loading && <p className="px-3 py-3 text-xs opacity-50">Searching...</p>}
          {!loading && results.length === 0 && <p className="px-3 py-3 text-xs opacity-50">No results found.</p>}
          {!loading && results.map((t) => {
            const fav = isFavorite(t.id);
            return (
              <div key={t.id} className="flex items-center gap-2 rounded-xl p-2 hover:bg-neutral-900/60 transition-colors">
                <button type="button" onClick={() => { onSelectTrack(t, results); setQuery(""); setResults([]); }} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-900">{t.cover ? <img src={t.cover} alt={t.title} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center font-medium" style={{ color: effectiveSiteColor }}>♪</div>}</div>
                  <div className="min-w-0"><p className="truncate text-xs font-medium">{t.title}</p><p className="truncate text-[10px] opacity-50">{t.artist}</p></div>
                </button>
                <button type="button" onClick={() => onToggleFavorite(t)} className={`pixel-btn flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${fav ? "text-pink-500" : "opacity-40 hover:opacity-100"}`}><PixelHeartIcon filled={fav} className="h-4 w-4" /></button>
                <div className="relative shrink-0">
                  <button type="button" onClick={() => setOpenMenuId((prev) => (prev === t.id ? null : t.id))} className="pixel-btn flex h-7 w-7 items-center justify-center rounded-lg opacity-60 hover:opacity-100 transition-colors duration-200">⋮</button>
                  {openMenuId === t.id && (
                    <div style={{ backgroundColor: surfaceBg === "#000000" ? "#1f1f1f" : "#ffffff" }} className="absolute right-0 z-40 mt-1 w-44 rounded-xl border border-neutral-800 p-1.5 shadow-2xl animate-in fade-in slide-in-from-top-2">
                      <p className="px-2 py-1 text-[9px] font-medium opacity-50">Add to playlist</p>
                      {playlists.length === 0 ? <p className="px-2 py-1 text-[10px] opacity-40">No playlists yet</p> : playlists.map((pl) => (
                        <button key={pl.id} type="button" onClick={() => { onAddToPlaylist?.(pl.id, t); setOpenMenuId(null); }} className="block w-full rounded-lg px-2 py-1.5 text-left text-[11px] hover:bg-neutral-800 transition-colors">{pl.name}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}