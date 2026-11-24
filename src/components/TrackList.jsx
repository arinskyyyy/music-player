import { useRef, useState, useEffect } from "react";
import { PixelHeartIcon } from "./PlayerBar";
import { generateRoomCode, normalizeRoomCode, formatRoomCode } from "../roomCode";
import SearchDropdown from "./SearchDropdown";

const ChevronIcon = ({ isOpen }) => (
  <svg className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default function TrackList({
  queue = [], currentTrack, isPlaying, activeTab = "discover",
  searchQuery = "", onSearchChange, onSelectTrack, onAddToQueue, onRemoveFromQueue,
  onClearQueue, onLoadAllToQueue, localTracks = [], onImportLocalFiles,
  favorites = [], onToggleFavorite, currentRoomCode = "LOBBY", onJoinRoom,
  onCreateRoom, onExitRoom, listeners = [], user = null, onLogout,
  playlists = [], onAddToPlaylist, onDeletePlaylist, onRenamePlaylist, onCreatePlaylist, recentTracks = [],
  topPlayedTracks = [], trendingTracks = [],
  effectiveSiteColor = "#ffffff", effectiveTextColor = "#ffffff", surfaceBg = "#000000",
}) {
  const fileInputRef = useRef(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [customRoomCode, setCustomRoomCode] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [roomNotice, setRoomNotice] = useState("");
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [expandedFavs, setExpandedFavs] = useState(true);
  const [showAllFavs, setShowAllFavs] = useState(false);
  
  const [expandedPlaylists, setExpandedPlaylists] = useState(true);
  const [expandedPlaylistId, setExpandedPlaylistId] = useState(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState(null);
  const [editName, setEditName] = useState("");
  
  const [expandedRecents, setExpandedRecents] = useState(true);
  const [showAllRecents, setShowAllRecents] = useState(false);

  const [openFavMenu, setOpenFavMenu] = useState(null);
  const [openPlaylistMenu, setOpenPlaylistMenu] = useState(null);
  const [openSearchMenu, setOpenSearchMenu] = useState(null);

  useEffect(() => {
    const handleClick = () => { setOpenFavMenu(null); setOpenPlaylistMenu(null); setOpenSearchMenu(null); };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const isFavorite = (id) => favorites.some((f) => (typeof f === "string" ? f === id : f?.id === id));

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const code = normalizeRoomCode(customRoomCode) || generateRoomCode();
    onCreateRoom?.(code, newRoomName.trim() || "Retro Pixel Lounge");
    setRoomNotice(`Created room!`); setNewRoomName(""); setCustomRoomCode("");
    setTimeout(() => setRoomNotice(""), 3000);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    const code = normalizeRoomCode(joinCodeInput);
    if (!code) return;
    onJoinRoom?.(code);
    setRoomNotice(`Joined room!`); setJoinCodeInput("");
    setTimeout(() => setRoomNotice(""), 3000);
  };

  const handleSearchEnter = (results, query) => {
    setSearchResults(results);
    setIsSearching(true);
    onSearchChange(query); 
  };

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const offset = searchResults.length;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/api/music/external-search?q=${encodeURIComponent(searchQuery)}&limit=50&offset=${offset}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(prev => [...prev, ...(data.tracks || [])]);
      }
    } catch {
      /* ignore */
    }
    setLoadingMore(false);
  };

  const handleCreatePlaylistClick = async () => {
    const newId = await onCreatePlaylist();
    if (newId) {
      setEditingPlaylistId(newId); setEditName("New playlist"); setExpandedPlaylists(true);
    }
  };

  const handleRenameSubmit = async (id) => {
    if (editName.trim()) { await onRenamePlaylist(id, editName.trim()); }
    setEditingPlaylistId(null);
  };

  const renderTrackRow = (track, idx, listContext, isSearchResult = false) => {
    const isCurrent = currentTrack?.id === track.id;
    const isFav = isFavorite(track.id);
    return (
      <div key={`${track.id}-${idx}`} style={isCurrent ? { backgroundColor: `${effectiveSiteColor}15` } : {}} className={`flex flex-col sm:grid sm:grid-cols-[2.5rem_3.5rem_1.5fr_1fr_4.5rem_14rem] items-start sm:items-center rounded-xl p-2.5 sm:px-4 sm:py-3 transition-colors duration-200 ${!isCurrent ? "hover:bg-neutral-900/40" : ""}`}>
        <span className="hidden sm:inline text-center font-medium text-xs opacity-50">{String(idx + 1).padStart(2, "0")}</span>
        <div className="flex items-center gap-3 sm:block">
          <div className="h-10 w-10 overflow-hidden rounded-xl bg-neutral-900 shrink-0">{track.cover ? <img src={track.cover} alt={track.title} className="h-full w-full object-cover [image-rendering:pixelated]" /> : <div className="flex h-full w-full items-center justify-center font-medium text-xs">♪</div>}</div>
          <div className="sm:hidden flex flex-col min-w-0"><span className="font-medium text-xs truncate">{isCurrent && isPlaying ? "▶ " : ""}{track.title}</span><span className="text-[10px] opacity-60 truncate">{track.artist}</span></div>
        </div>
        <div className="hidden sm:flex flex-col min-w-0 pr-4">
          <span className="font-medium text-xs truncate">{isCurrent && isPlaying ? "▶ " : ""}{track.title}</span>
          {track.sourceLabel && <span className="text-[9px] opacity-40">{track.sourceLabel}</span>}
        </div>
        <span className="hidden sm:inline text-xs opacity-75 truncate pr-3">{track.artist}</span>
        <span className="hidden sm:inline text-right font-mono text-xs tabular-nums opacity-60 w-14 shrink-0 pr-2">{track.duration}</span>
        <div className="mt-2 flex w-full items-center justify-between sm:mt-0 sm:w-auto sm:justify-end gap-1.5 shrink-0">
          <span className="font-mono text-[11px] tabular-nums opacity-60 sm:hidden">{track.duration}</span>
          <div className="flex items-center gap-1.5 shrink-0 relative">
            <button type="button" onClick={() => onToggleFavorite?.(track)} className={`pixel-btn flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-200 shrink-0 ${isFav ? "text-pink-500" : "opacity-40 hover:opacity-100"}`}><PixelHeartIcon filled={isFav} className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => onSelectTrack(track, listContext)} style={isCurrent ? { backgroundColor: effectiveSiteColor, color: surfaceBg } : {}} className={`pixel-btn w-20 flex items-center justify-center rounded-lg py-1.5 text-[11px] font-medium transition-colors duration-200 shrink-0 ${!isCurrent ? "bg-neutral-900/60 hover:bg-neutral-800" : ""}`}>{isCurrent && isPlaying ? "PLAYING" : "PLAY"}</button>
            <button type="button" onClick={() => onAddToQueue(track)} className="pixel-btn rounded-lg bg-neutral-900/60 hover:bg-neutral-800 px-2.5 py-1.5 text-[11px] font-medium shrink-0 transition-colors duration-200">+QUEUE</button>
            {isSearchResult && (
              <div className="relative shrink-0 ml-1">
                <button onClick={(e) => { e.stopPropagation(); setOpenSearchMenu(prev => prev === track.id ? null : track.id); }} className="pixel-btn px-2 py-1.5 text-neutral-400 hover:text-white transition-colors duration-200">⋮</button>
                {openSearchMenu === track.id && (
                  <div style={{ backgroundColor: surfaceBg === "#000000" ? "#1f1f1f" : "#ffffff" }} className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-neutral-800 shadow-xl p-1 z-[100] animate-in fade-in zoom-in-95 duration-100">
                    <p className="px-2 py-1 text-[9px] font-medium opacity-50">Add to playlist</p>
                    {playlists.length === 0 ? <p className="px-2 py-1 text-[10px] opacity-40">No playlists yet</p> : playlists.map((pl) => (
                      <button key={pl.id} onClick={() => { onAddToPlaylist?.(pl.id, track); setOpenSearchMenu(null); }} className="block w-full rounded-lg px-2 py-1.5 text-left text-[11px] hover:bg-neutral-800 transition-colors">{pl.name}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section style={{ backgroundColor: surfaceBg, color: effectiveTextColor }} className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
      <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        {activeTab === "discover" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col justify-between gap-4 pb-2 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-xl font-medium sm:text-2xl capitalize">{isSearching ? "Search Results" : "Internet catalog"}</h2>
                <p className="mt-1 text-xs opacity-65">{isSearching ? "Smart ranked results matching description and community plays." : "Search the web, play trending songs, or upload your music."}</p>
              </div>
              <div className="flex items-center gap-2">
                {isSearching && <button onClick={() => { setIsSearching(false); onSearchChange?.(""); }} className="pixel-btn rounded-xl bg-neutral-800 hover:bg-neutral-700 px-3.5 py-2 text-xs font-medium transition-colors duration-200">← Back to Home</button>}
                <SearchDropdown isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} onSelectTrack={onSelectTrack} playlists={playlists} onAddToPlaylist={onAddToPlaylist} onSearchEnter={handleSearchEnter} effectiveSiteColor={effectiveSiteColor} effectiveTextColor={effectiveTextColor} surfaceBg={surfaceBg} />
              </div>
            </div>

            {isSearching ? (
              <div className="flex flex-col gap-1">
                <div className="hidden grid-cols-[2.5rem_3.5rem_1.5fr_1fr_4.5rem_14rem] items-center px-4 py-2 text-[10px] font-medium opacity-50 sm:grid"><span className="text-center">#</span><span>COVER</span><span>TITLE</span><span>ARTIST</span><span className="text-right">TIME</span><span className="text-right pr-2">ACTIONS</span></div>
                {searchResults.map((t, i) => renderTrackRow(t, i, searchResults, true))}
                {searchResults.length === 0 && <div className="py-12 text-center text-xs opacity-50">NO TRACKS FOUND.</div>}
                {searchResults.length > 0 && <div className="mt-4 flex justify-center pb-8"><button onClick={handleLoadMore} disabled={loadingMore} className="pixel-btn rounded-xl bg-neutral-800 hover:bg-neutral-700 px-6 py-2 text-xs font-medium transition-colors duration-200 disabled:opacity-50">{loadingMore ? "Loading..." : "Load More Results"}</button></div>}
              </div>
            ) : (
              <div className="flex flex-col gap-4 mt-2">
                {/* FAVORITES */}
                <div className="rounded-2xl bg-neutral-900/40 p-4 transition-all duration-300">
                  <button onClick={() => setExpandedFavs(!expandedFavs)} className="flex w-full items-center justify-between text-sm font-medium mb-2 group"><span>Your Favorites</span><span className="opacity-50 group-hover:opacity-100 transition-opacity duration-200"><ChevronIcon isOpen={expandedFavs} /></span></button>
                  <div className={`overflow-hidden transition-all duration-300 ${expandedFavs ? "max-h-[800px] opacity-100 mt-3" : "max-h-0 opacity-0"}`}>
                    {favorites.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {(showAllFavs ? favorites : favorites.slice(0, 5)).map(t => (
                          <div key={t.id} className="flex items-center justify-between text-xs group relative">
                            <div className="flex items-center gap-2 cursor-pointer flex-1 hover:opacity-80 transition-opacity duration-200" onClick={() => onSelectTrack(t, favorites)}><span className="truncate pr-2">{t.title}</span><span className="opacity-50 text-[10px]">{t.artist}</span></div>
                            <div className="relative shrink-0">
                              <button onClick={(e) => { e.stopPropagation(); setOpenFavMenu(prev => prev === t.id ? null : t.id); }} className="pixel-btn px-2 py-1 text-neutral-400 hover:text-white transition-colors duration-200">⋯</button>
                              {openFavMenu === t.id && <div style={{ backgroundColor: surfaceBg === "#000000" ? "#1f1f1f" : "#ffffff" }} className="absolute right-0 top-full mt-1 w-32 rounded-lg border border-neutral-800 shadow-xl p-1 z-[100] animate-in fade-in zoom-in-95 duration-100"><button onClick={(e) => { e.stopPropagation(); onToggleFavorite(t); setOpenFavMenu(null); }} className="block w-full text-left px-2 py-1.5 text-[10px] text-red-400 hover:bg-neutral-800 rounded transition-colors duration-200">Remove</button></div>}
                            </div>
                          </div>
                        ))}
                        {favorites.length > 5 && !showAllFavs && <button onClick={() => setShowAllFavs(true)} className="text-[10px] text-left text-neutral-400 hover:text-white mt-1 transition-colors duration-200">Show all {favorites.length} favorites</button>}
                        {showAllFavs && favorites.length > 5 && <button onClick={() => setShowAllFavs(false)} className="text-[10px] text-left text-neutral-400 hover:text-white mt-1 transition-colors duration-200">Show less</button>}
                      </div>
                    ) : <p className="text-xs opacity-50">No favorites yet.</p>}
                  </div>
                </div>

                {/* PLAYLISTS */}
                <div className="rounded-2xl bg-neutral-900/40 p-4 transition-all duration-300">
                  <div className="flex w-full items-center justify-between text-sm font-medium mb-2">
                    <span className="flex-1">Your Playlists</span>
                    <div className="flex items-center gap-2">
                      <button onClick={handleCreatePlaylistClick} title="Create New Playlist" className="pixel-btn flex h-6 w-6 items-center justify-center rounded bg-neutral-800 hover:bg-neutral-700 text-white transition-colors duration-200">+</button>
                      <button onClick={() => setExpandedPlaylists(!expandedPlaylists)} className="opacity-50 hover:opacity-100 group transition-opacity duration-200"><ChevronIcon isOpen={expandedPlaylists} /></button>
                    </div>
                  </div>
                  <div className={`transition-all duration-300 ${expandedPlaylists ? "opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"}`}>
                    {playlists.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {playlists.map(p => (
                          <div key={p.id} className="flex flex-col">
                            <div className="flex items-center justify-between text-xs group relative">
                              <div className="flex items-center gap-2 flex-1 cursor-pointer hover:opacity-80 transition-opacity duration-200" onClick={() => setExpandedPlaylistId(expandedPlaylistId === p.id ? null : p.id)}>
                                {editingPlaylistId === p.id ? <input autoFocus type="text" value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={() => handleRenameSubmit(p.id)} onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit(p.id)} className="bg-neutral-800 px-1 py-0.5 rounded text-xs w-full outline-none border border-neutral-600" onClick={(e) => e.stopPropagation()} /> : <span className="truncate pr-2 flex-1">{p.name}</span>}
                                <span className="opacity-50 text-[10px]">{p.tracks?.length || 0} tracks</span>
                              </div>
                              <div className="relative shrink-0">
                                <button onClick={(e) => { e.stopPropagation(); setOpenPlaylistMenu(prev => prev === p.id ? null : p.id); }} className="pixel-btn px-2 py-1 text-neutral-400 hover:text-white transition-colors duration-200">⋯</button>
                                {openPlaylistMenu === p.id && (
                                  <div style={{ backgroundColor: surfaceBg === "#000000" ? "#1f1f1f" : "#ffffff" }} className="absolute right-0 top-full mt-1 w-32 rounded-lg border border-neutral-800 shadow-xl p-1 z-[100] animate-in fade-in zoom-in-95 duration-100">
                                    <button onClick={() => { setEditingPlaylistId(p.id); setEditName(p.name); setOpenPlaylistMenu(null); }} className="block w-full text-left px-2 py-1.5 text-[10px] text-neutral-300 hover:bg-neutral-800 rounded transition-colors duration-200">Rename</button>
                                    <button onClick={() => { onDeletePlaylist?.(p.id); setOpenPlaylistMenu(null); }} className="block w-full text-left px-2 py-1.5 text-[10px] text-red-400 hover:bg-neutral-800 rounded transition-colors duration-200">Delete Playlist</button>
                                  </div>
                                )}
                              </div>
                            </div>
                            {expandedPlaylistId === p.id && (
                              <div className="mt-2 pl-3 border-l border-neutral-700 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1">
                                {p.tracks && p.tracks.length > 0 ? p.tracks.map((track, i) => <div key={i} className="flex items-center justify-between text-[10px] text-neutral-400 hover:text-white cursor-pointer transition-colors duration-200" onClick={() => onSelectTrack(track, p.tracks)}><span className="truncate pr-2">{track.title}</span><span className="truncate opacity-50">{track.artist}</span></div>) : <p className="text-[10px] opacity-40">Empty playlist.</p>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-xs opacity-50">No playlists created.</p>}
                  </div>
                </div>

                {/* RECENTS */}
                <div className="rounded-2xl bg-neutral-900/40 p-4 transition-all duration-300">
                  <button onClick={() => setExpandedRecents(!expandedRecents)} className="flex w-full items-center justify-between text-sm font-medium mb-2 group"><span>Recents</span><span className="opacity-50 group-hover:opacity-100 transition-opacity duration-200"><ChevronIcon isOpen={expandedRecents} /></span></button>
                  <div className={`overflow-hidden transition-all duration-300 ${expandedRecents ? "max-h-[800px] opacity-100 mt-3" : "max-h-0 opacity-0"}`}>
                    {recentTracks.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {(showAllRecents ? recentTracks : recentTracks.slice(0, 5)).map(t => <div key={`recent-${t.id}`} className="flex items-center justify-between text-xs cursor-pointer hover:opacity-80 transition-opacity duration-200" onClick={() => onSelectTrack(t, recentTracks)}><span className="truncate pr-2">{t.title}</span><span className="opacity-50 text-[10px]">{t.artist}</span></div>)}
                        {recentTracks.length > 5 && !showAllRecents && <button onClick={() => setShowAllRecents(true)} className="text-[10px] text-left text-neutral-400 hover:text-white mt-1 transition-colors duration-200">Show all {recentTracks.length} recents</button>}
                        {showAllRecents && recentTracks.length > 5 && <button onClick={() => setShowAllRecents(false)} className="text-[10px] text-left text-neutral-400 hover:text-white mt-1 transition-colors duration-200">Show less</button>}
                      </div>
                    ) : <p className="text-xs opacity-50">No recent history.</p>}
                  </div>
                </div>

                {/* TOP 5 MOST PLAYED / COMMUNITY TRENDING */}
                {(() => {
                  const displayTracks = trendingTracks.length > 0 ? trendingTracks : topPlayedTracks;
                  return (
                    <div className="flex flex-col gap-1 mt-6">
                      <div className="flex items-center justify-between mb-1 px-1">
                        <h3 className="text-sm font-medium">Most Played</h3>
                        <span className="text-[10px] opacity-40">Top 5 community trending</span>
                      </div>
                      {displayTracks.length > 0 ? (
                        <>
                          <div className="hidden grid-cols-[2.5rem_3.5rem_1.5fr_1fr_4.5rem_14rem] items-center px-4 py-2 text-[10px] font-medium opacity-50 sm:grid"><span className="text-center">#</span><span>COVER</span><span>TITLE</span><span>ARTIST</span><span className="text-right">TIME</span><span className="text-right pr-2">ACTIONS</span></div>
                          {displayTracks.slice(0, 5).map((track, idx) => renderTrackRow(track, idx, displayTracks))}
                        </>
                      ) : (
                        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 p-6 text-center">
                          <p className="text-xs font-medium text-neutral-300">No trending songs yet</p>
                          <p className="mt-1 text-[11px] opacity-50">Search and play any song to start the community leaderboard!</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {activeTab === "rooms" && (
          <div className="flex flex-col gap-6 max-w-4xl">
            <div>
              <h2 className="text-xl font-medium sm:text-2xl">Rooms & Synced Sessions</h2>
              <p className="mt-1 text-xs opacity-65">Host your own synchronized audio room or join an active session.</p>
            </div>
            <div className="rounded-2xl bg-neutral-900/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-medium opacity-50">CURRENT ACTIVE ROOM</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <h3 className="text-base font-medium text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">{formatRoomCode(currentRoomCode)}</h3>
                  <span className="text-xs opacity-60">({listeners.length} online)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { navigator.clipboard?.writeText(formatRoomCode(currentRoomCode)); setRoomNotice("Room code copied!"); setTimeout(() => setRoomNotice(""), 2500); }} className="pixel-btn rounded-xl bg-neutral-800/80 px-3 py-1.5 text-xs font-medium hover:bg-neutral-700 transition-colors duration-200">COPY CODE</button>
                <button type="button" onClick={onExitRoom} style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }} className="pixel-btn rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 hover:opacity-80">EXIT ROOM</button>
              </div>
            </div>
            {roomNotice && <p className="auth-soft-enter rounded-xl border border-emerald-500/40 bg-emerald-950/20 px-4 py-2 text-center text-xs font-medium text-emerald-400">{roomNotice}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="rounded-2xl bg-neutral-900/40 p-5 sm:p-6 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2"><h3 className="text-base font-medium">Create Room</h3></div>
                  <p className="text-xs opacity-70">Generate your own broadcast room. You become the host.</p>
                </div>
                <form onSubmit={handleCreateSubmit} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold opacity-75">Room Name</label>
                    <input type="text" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="e.g. Cyber Lounge" className="w-full rounded-xl bg-neutral-950/80 px-3 py-2 text-xs focus:outline-none placeholder-neutral-600" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold opacity-75">Code (Optional)</label>
                    <input type="text" value={customRoomCode} onChange={(e) => setCustomRoomCode(e.target.value)} placeholder="e.g. #a1b2c3d4" className="w-full rounded-xl bg-neutral-950/80 px-3 py-2 text-xs font-mono focus:outline-none placeholder-neutral-600" />
                  </div>
                  <button type="submit" style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }} className="pixel-btn w-full rounded-xl py-2.5 text-xs font-medium transition-colors duration-200 hover:opacity-80">CREATE ROOM</button>
                </form>
              </div>
              <div className="rounded-2xl bg-neutral-900/40 p-5 sm:p-6 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2"><h3 className="text-base font-medium">Join Room</h3></div>
                  <p className="text-xs opacity-70">Enter a code to synchronize music playback and queue in real-time.</p>
                </div>
                <form onSubmit={handleJoinSubmit} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold opacity-75">Room Code</label>
                    <input type="text" required value={joinCodeInput} onChange={(e) => setJoinCodeInput(e.target.value)} placeholder="e.g. #a1b2c3d4" className="w-full rounded-xl bg-neutral-950/80 px-3 py-2 text-xs font-mono focus:outline-none placeholder-neutral-600" />
                  </div>
                  <button type="submit" style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }} className="pixel-btn w-full rounded-xl py-2.5 text-xs font-medium transition-colors duration-200 hover:opacity-80">ENTER ROOM</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === "queue" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h2 className="text-xl font-medium sm:text-2xl">Room Queue</h2>
                <p className="mt-1 text-xs opacity-65">Tracks scheduled to play in order.</p>
              </div>
              {queue.length > 0 && <button type="button" onClick={onClearQueue} className="pixel-btn rounded-lg bg-neutral-900/60 hover:bg-neutral-800 px-3.5 py-1.5 text-xs font-medium transition-colors duration-200">CLEAR ALL</button>}
            </div>
            {currentTrack && (
              <div className="flex items-center gap-4 rounded-2xl bg-neutral-900/40 p-4 sm:p-5">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-900">{currentTrack.cover ? <img src={currentTrack.cover} alt={currentTrack.title} className="h-full w-full object-cover [image-rendering:pixelated]" /> : <div className="flex h-full w-full items-center justify-center font-medium">♪</div>}</div>
                <div className="min-w-0">
                  <span style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }} className="rounded px-1.5 py-0.5 text-[9px] font-medium">NOW PLAYING</span>
                  <h3 className="mt-1 truncate text-base font-medium">{currentTrack.title}</h3>
                  <p className="truncate text-xs opacity-60">{currentTrack.artist} // {currentTrack.duration}</p>
                </div>
              </div>
            )}
            {queue.length > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="px-2 text-[10px] font-medium opacity-50">UP NEXT ({queue.length} TRACKS)</div>
                {queue.map((track, i) => (
                  <div key={`${track.id}-${i}`} className="flex items-center justify-between rounded-xl bg-neutral-900/20 hover:bg-neutral-900/50 p-3 text-xs transition-colors duration-200">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <span className="font-medium opacity-50">#{i + 1}</span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{track.title}</p>
                        <p className="truncate text-[10px] opacity-50">{track.artist}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs opacity-60">{track.duration}</span>
                      <button type="button" onClick={() => onSelectTrack(track, queue)} className="pixel-btn rounded-lg bg-neutral-900/60 hover:bg-neutral-800 px-2.5 py-1 text-[10px] font-medium transition-colors duration-200">PLAY NOW</button>
                      <button type="button" onClick={() => onRemoveFromQueue(i)} title="Remove" className="pixel-btn rounded-lg bg-neutral-900/60 hover:bg-neutral-800 px-2 py-1 text-[10px] font-medium transition-colors duration-200">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-neutral-900/20 p-8 text-center">
                <p className="text-xs font-medium opacity-50">QUEUE IS EMPTY</p>
                <p className="max-w-md text-xs opacity-65">Add songs from the catalog or local files.</p>
                <button type="button" onClick={onLoadAllToQueue} style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }} className="pixel-btn rounded-xl px-4 py-2 text-xs font-medium transition-colors duration-200 hover:opacity-80">QUEUE ALL SONGS</button>
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="flex flex-col gap-6">
            <div className="pb-2"><h2 className="text-xl font-medium sm:text-2xl">Your Profile</h2></div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl bg-neutral-900/40 p-5 sm:p-6">
              <div style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }} className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-medium">{user?.username ? user.username.charAt(0).toUpperCase() : "P"}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-lg font-medium">{user?.username || "User"}</h3>
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-medium bg-emerald-400/20 text-emerald-300">SYNCED ACCOUNT</span>
                </div>
                <p className="truncate text-xs opacity-60">{user?.email || ""}</p>
              </div>
              <button type="button" onClick={onLogout} style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }} className="pixel-btn shrink-0 rounded-xl px-4 py-2 text-xs font-medium transition-colors duration-200 hover:opacity-80">LOGOUT</button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[{ label: "FAVORITES", value: favorites.length }, { label: "LOCAL TRACKS", value: localTracks.length }, { label: "IN QUEUE", value: queue.length }, { label: "ONLINE", value: listeners.length }].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-neutral-900/40 p-4 text-center">
                  <p className="text-2xl font-medium" style={{ color: effectiveSiteColor }}>{stat.value}</p>
                  <p className="mt-1 text-[10px] font-medium opacity-50">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "storage" && (
          <div className="flex flex-col gap-6">
            <div className="pb-2"><h2 className="text-xl font-medium sm:text-2xl">Local Storage</h2></div>
            <div onClick={() => fileInputRef.current?.click()} className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl bg-neutral-900/30 hover:bg-neutral-900/60 p-8 text-center transition-colors duration-200">
              <input ref={fileInputRef} type="file" accept="audio/*" multiple onChange={onImportLocalFiles} className="hidden" />
              <div style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }} className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-medium">+</div>
              <div><p className="text-sm font-medium">CLICK TO IMPORT AUDIO FILES</p><p className="mt-1 text-xs opacity-55">Supports MP3, WAV, OGG, FLAC, M4A.</p></div>
              <button type="button" style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }} className="pixel-btn rounded-xl px-4 py-2 text-xs font-medium transition-colors duration-200 hover:opacity-80">BROWSE FILES</button>
            </div>
            {localTracks.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="px-2 text-[10px] font-medium opacity-50">IMPORTED TRACKS ({localTracks.length})</div>
                {localTracks.map((track) => {
                  const isCurrent = currentTrack?.id === track.id;
                  return (
                    <div key={track.id} className="flex items-center justify-between rounded-xl bg-neutral-900/30 hover:bg-neutral-900/60 p-3 text-xs transition-colors duration-200">
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <span className="font-medium opacity-50">♪</span>
                        <div className="min-w-0"><p className="truncate font-medium">{track.title}</p><p className="text-[10px] opacity-50">{track.artist} // LOCAL DISK</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => onSelectTrack(track, localTracks)} style={isCurrent ? { backgroundColor: effectiveSiteColor, color: surfaceBg } : {}} className={`pixel-btn rounded-lg px-3 py-1 text-[11px] font-medium transition-colors duration-200 ${!isCurrent ? "bg-neutral-900/60 hover:bg-neutral-800" : ""}`}>{isCurrent && isPlaying ? "PLAYING" : "PLAY"}</button>
                        <button type="button" onClick={() => onAddToQueue(track)} className="pixel-btn rounded-lg bg-neutral-900/60 hover:bg-neutral-800 px-2.5 py-1 text-[11px] font-medium transition-colors duration-200">+QUEUE</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}