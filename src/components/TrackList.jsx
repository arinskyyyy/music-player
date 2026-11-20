import { useRef, useState } from "react";
import { PixelHeartIcon } from "./PlayerBar";

export default function TrackList({
  tracks = [],
  queue = [],
  currentTrack,
  isPlaying,
  activeTab = "discover",
  searchQuery = "",
  onSearchChange,
  onSelectTrack,
  onAddToQueue,
  onRemoveFromQueue,
  onClearQueue,
  onLoadAllToQueue,
  localTracks = [],
  onImportLocalFiles,
  favorites = [],
  onToggleFavorite,
  currentRoomCode = "ROOM-808",
  onJoinRoom,
  onCreateRoom,
  onExitRoom,
  listeners = [],
  effectiveSiteColor = "#ffffff",
  effectiveTextColor = "#ffffff",
  surfaceBg = "#000000",
}) {
  const fileInputRef = useRef(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [customRoomCode, setCustomRoomCode] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [roomNotice, setRoomNotice] = useState("");

  const isFavorite = (id) => favorites.some((f) => (typeof f === "string" ? f === id : f?.id === id));

  const filteredTracks = tracks.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      (t.sourceLabel && t.sourceLabel.toLowerCase().includes(q))
    );
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const code = (customRoomCode.trim() || `ROOM-${Math.floor(100 + Math.random() * 900)}`).toUpperCase();
    const name = newRoomName.trim() || "Retro Pixel Lounge";
    onCreateRoom?.(code, name);
    setRoomNotice(`Created and joined ${code} (${name})!`);
    setNewRoomName("");
    setCustomRoomCode("");
    setTimeout(() => setRoomNotice(""), 3000);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;
    onJoinRoom?.(code);
    setRoomNotice(`Joined room ${code}!`);
    setJoinCodeInput("");
    setTimeout(() => setRoomNotice(""), 3000);
  };

  return (
    <section
      style={{
        backgroundColor: surfaceBg,
        color: effectiveTextColor,
      }}
      className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8"
    >
      {/* 1. DISCOVER / INTERNET CATALOG TAB */}
      {activeTab === "discover" && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col justify-between gap-4 pb-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">STREAM MATRIX</p>
              <h2 className="text-xl font-bold tracking-wider sm:text-2xl">INTERNET CATALOG</h2>
              <p className="mt-1 text-xs opacity-65">
                Curated pixel streams and lofi tracks ready for synchronized room playback.
              </p>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="SEARCH SONG, ARTIST..."
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  color: effectiveTextColor,
                }}
                className="w-full rounded-xl px-3.5 py-2 text-xs uppercase placeholder-neutral-500 focus:outline-none sm:w-64"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="pixel-btn rounded-xl bg-neutral-800/60 px-3 py-2 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Track List */}
          <div className="flex flex-col gap-1">
            <div className="hidden grid-cols-[2.5rem_3.5rem_1.6fr_1.1fr_4.5rem_11.5rem] items-center px-4 py-2 text-[10px] font-bold uppercase tracking-wider opacity-50 sm:grid">
              <span className="text-center">#</span>
              <span>COVER</span>
              <span>TITLE</span>
              <span>ARTIST</span>
              <span className="text-right">TIME</span>
              <span className="text-right">ACTIONS</span>
            </div>

            {filteredTracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isFav = isFavorite(track.id);
              return (
                <div
                  key={track.id}
                  style={
                    isCurrent
                      ? { backgroundColor: `${effectiveSiteColor}15` }
                      : {}
                  }
                  className={`flex flex-col sm:grid sm:grid-cols-[2.5rem_3.5rem_1.6fr_1.1fr_4.5rem_11.5rem] items-start sm:items-center rounded-xl p-2.5 sm:px-4 sm:py-3 transition-colors ${
                    !isCurrent ? "hover:bg-neutral-900/40" : ""
                  }`}
                >
                  <span className="hidden sm:inline text-center font-bold text-xs opacity-50">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="flex items-center gap-3 sm:block">
                    <div className="h-10 w-10 overflow-hidden rounded-xl bg-neutral-900 shrink-0">
                      {track.cover ? (
                        <img
                          src={track.cover}
                          alt={track.title}
                          className="h-full w-full object-cover [image-rendering:pixelated]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-bold text-xs">♪</div>
                      )}
                    </div>
                    <div className="sm:hidden flex flex-col min-w-0">
                      <span className="font-bold text-xs uppercase truncate">
                        {isCurrent && isPlaying ? "▶ " : ""}
                        {track.title}
                      </span>
                      <span className="text-[10px] opacity-60 truncate">
                        {track.artist}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col min-w-0 pr-4">
                    <span className="font-bold text-xs uppercase tracking-wider truncate">
                      {isCurrent && isPlaying ? "▶ " : ""}
                      {track.title}
                    </span>
                    {track.sourceLabel && (
                      <span className="text-[9px] uppercase tracking-wider opacity-40">
                        {track.sourceLabel}
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:inline text-xs opacity-75 truncate pr-3">
                    {track.artist}
                  </span>
                  <span className="hidden sm:inline text-right font-mono text-xs tabular-nums opacity-60 w-14 shrink-0">
                    {track.duration}
                  </span>
                  <div className="mt-2 flex w-full items-center justify-between sm:mt-0 sm:w-auto sm:justify-end gap-1.5 shrink-0">
                    <span className="font-mono text-[11px] tabular-nums opacity-60 sm:hidden">
                      {track.duration}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Heart Favorite Button */}
                      <button
                        type="button"
                        onClick={() => onToggleFavorite?.(track)}
                        title={isFav ? "Favorited (Remove)" : "Add to Favorites"}
                        className={`pixel-btn flex h-7 w-7 items-center justify-center rounded-lg transition-transform hover:scale-110 shrink-0 ${
                          isFav ? "text-pink-500" : "opacity-40 hover:opacity-100"
                        }`}
                      >
                        <PixelHeartIcon filled={isFav} className="h-3.5 w-3.5" />
                      </button>

                      {/* Play button with fixed width so it NEVER overflows timestamp */}
                      <button
                        type="button"
                        onClick={() => onSelectTrack(track)}
                        style={
                          isCurrent
                            ? {
                                backgroundColor: effectiveSiteColor,
                                color: surfaceBg,
                              }
                            : {}
                        }
                        className={`pixel-btn w-20 flex items-center justify-center rounded-lg py-1.5 text-[11px] font-bold uppercase transition-colors shrink-0 ${
                          !isCurrent ? "bg-neutral-900/60 hover:bg-neutral-800" : ""
                        }`}
                      >
                        {isCurrent && isPlaying ? "PLAYING" : "PLAY"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onAddToQueue(track)}
                        title="Add to Room Queue"
                        className="pixel-btn rounded-lg bg-neutral-900/60 hover:bg-neutral-800 px-2.5 py-1.5 text-[11px] font-bold uppercase shrink-0"
                      >
                        +QUEUE
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTracks.length === 0 && (
              <div className="py-12 text-center text-xs opacity-50">
                NO TRACKS MATCHING &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ROOMS & MULTIPLAYER TAB */}
      {activeTab === "rooms" && (
        <div className="flex flex-col gap-6 max-w-4xl">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">MULTIPLAYER MATRIX</p>
            <h2 className="text-xl font-bold tracking-wider sm:text-2xl">ROOMS & SYNCED SESSIONS</h2>
            <p className="mt-1 text-xs opacity-65">
              Host your own synchronized audio room or join an active room session using a specific code.
            </p>
          </div>

          {/* Current Room Banner */}
          <div className="rounded-2xl bg-neutral-900/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">CURRENT ACTIVE ROOM</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <h3 className="text-base font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] tracking-wider">
                  {currentRoomCode || "LOBBY"}
                </h3>
                <span className="text-xs opacity-60">({listeners.length} online)</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(currentRoomCode || "ROOM-808");
                  setRoomNotice("Room code copied to clipboard!");
                  setTimeout(() => setRoomNotice(""), 2500);
                }}
                className="pixel-btn rounded-xl bg-neutral-800/80 px-3 py-1.5 text-xs font-bold uppercase hover:bg-neutral-700"
              >
                COPY CODE
              </button>
              <button
                type="button"
                onClick={onExitRoom}
                style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }}
                className="pixel-btn rounded-xl px-3.5 py-1.5 text-xs font-bold uppercase"
              >
                EXIT ROOM
              </button>
            </div>
          </div>

          {roomNotice && (
            <p className="auth-soft-enter rounded-xl border border-emerald-500/40 bg-emerald-950/20 px-4 py-2 text-center text-xs font-bold text-emerald-400">
              {roomNotice}
            </p>
          )}

          {/* 2 Options: Create Room & Join Room */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* OPTION 1: CREATE A ROOM */}
            <div className="rounded-2xl bg-neutral-900/40 p-5 sm:p-6 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    01 // HOST
                  </span>
                  <h3 className="text-base font-bold uppercase tracking-wider">CREATE A ROOM</h3>
                </div>
                <p className="text-xs opacity-70">
                  Generate your own broadcast room. You will become the host with leadership transfer & moderation controls.
                </p>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase opacity-75">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="e.g. Cyber Cyber Lounge"
                    className="w-full rounded-xl bg-neutral-950/80 px-3 py-2 text-xs uppercase focus:outline-none placeholder-neutral-600"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase opacity-75">
                    Specific Room Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={customRoomCode}
                    onChange={(e) => setCustomRoomCode(e.target.value)}
                    placeholder="e.g. ROOM-909"
                    className="w-full rounded-xl bg-neutral-950/80 px-3 py-2 text-xs uppercase font-mono focus:outline-none placeholder-neutral-600"
                  />
                </div>
                <button
                  type="submit"
                  style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }}
                  className="pixel-btn w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider"
                >
                  CREATE ROOM
                </button>
              </form>
            </div>

            {/* OPTION 2: JOIN A ROOM */}
            <div className="rounded-2xl bg-neutral-900/40 p-5 sm:p-6 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    02 // CONNECT
                  </span>
                  <h3 className="text-base font-bold uppercase tracking-wider">JOIN A ROOM</h3>
                </div>
                <p className="text-xs opacity-70">
                  Enter a specific room code provided by a room host to synchronize music playback and queue in real-time.
                </p>
              </div>

              <form onSubmit={handleJoinSubmit} className="space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase opacity-75">
                    Enter Specific Room Code
                  </label>
                  <input
                    type="text"
                    required
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    placeholder="e.g. ROOM-808"
                    className="w-full rounded-xl bg-neutral-950/80 px-3 py-2 text-xs uppercase font-mono focus:outline-none placeholder-neutral-600"
                  />
                </div>
                <button
                  type="submit"
                  style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }}
                  className="pixel-btn w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider"
                >
                  ENTER ROOM
                </button>
              </form>

              {/* Quick Preset Buttons */}
              <div className="pt-1">
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-50 mb-2">POPULAR ROOM PRESETS</p>
                <div className="flex flex-wrap gap-2">
                  {["ROOM-808", "ROOM-101", "ROOM-404"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => onJoinRoom?.(preset)}
                      className={`pixel-btn rounded-lg px-2.5 py-1 text-[11px] font-mono font-bold uppercase ${
                        currentRoomCode === preset ? "bg-white text-black" : "bg-neutral-800 hover:bg-neutral-700"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. QUEUE / ROOM SYNC TAB */}
      {activeTab === "queue" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between pb-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">SYNCED BUFFER</p>
              <h2 className="text-xl font-bold tracking-wider sm:text-2xl">ROOM PLAYLIST QUEUE</h2>
              <p className="mt-1 text-xs opacity-65">
                Tracks scheduled to play in order across all room listeners.
              </p>
            </div>
            {queue.length > 0 && (
              <button
                type="button"
                onClick={onClearQueue}
                className="pixel-btn rounded-lg bg-neutral-900/60 hover:bg-neutral-800 px-3.5 py-1.5 text-xs font-bold uppercase"
              >
                CLEAR ALL
              </button>
            )}
          </div>

          {/* Currently Playing Spotlight Card */}
          {currentTrack && (
            <div className="flex items-center gap-4 rounded-2xl bg-neutral-900/40 p-4 sm:p-5">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-900">
                {currentTrack.cover ? (
                  <img
                    src={currentTrack.cover}
                    alt={currentTrack.title}
                    className="h-full w-full object-cover [image-rendering:pixelated]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-bold">♪</div>
                )}
              </div>
              <div className="min-w-0">
                <span
                  style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }}
                  className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                >
                  NOW PLAYING
                </span>
                <h3 className="mt-1 truncate text-base font-bold uppercase tracking-wider">{currentTrack.title}</h3>
                <p className="truncate text-xs opacity-60">{currentTrack.artist} // {currentTrack.duration}</p>
              </div>
            </div>
          )}

          {/* Queue List */}
          {queue.length > 0 ? (
            <div className="flex flex-col gap-2">
              <div className="px-2 text-[10px] font-bold uppercase opacity-50">
                UP NEXT ({queue.length} TRACKS)
              </div>
              {queue.map((track, i) => (
                <div
                  key={`${track.id}-${i}`}
                  className="flex items-center justify-between rounded-xl bg-neutral-900/20 hover:bg-neutral-900/50 p-3 text-xs transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="font-bold opacity-50">#{i + 1}</span>
                    <div className="min-w-0">
                      <p className="truncate font-bold uppercase">{track.title}</p>
                      <p className="truncate text-[10px] opacity-50">{track.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs opacity-60">{track.duration}</span>
                    <button
                      type="button"
                      onClick={() => onSelectTrack(track)}
                      className="pixel-btn rounded-lg bg-neutral-900/60 hover:bg-neutral-800 px-2.5 py-1 text-[10px] font-bold uppercase"
                    >
                      PLAY NOW
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveFromQueue(i)}
                      title="Remove from queue"
                      className="pixel-btn rounded-lg bg-neutral-900/60 hover:bg-neutral-800 px-2 py-1 text-[10px] font-bold"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-neutral-900/20 p-8 text-center">
              <p className="text-xs font-bold uppercase opacity-50">THE QUEUE IS CURRENTLY EMPTY</p>
              <p className="max-w-md text-xs opacity-65">
                Add songs from the Catalog or load local PC music to keep the room queue moving.
              </p>
              <button
                type="button"
                onClick={onLoadAllToQueue}
                style={{
                  backgroundColor: effectiveSiteColor,
                  color: surfaceBg,
                }}
                className="pixel-btn rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider"
              >
                QUEUE ALL CATALOG SONGS
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. LOCAL PC STORAGE TAB */}
      {activeTab === "profile" && (
        <div className="flex flex-col gap-6">
          <div className="pb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">HARDWARE DRIVE</p>
            <h2 className="text-xl font-bold tracking-wider sm:text-2xl">LOCAL PC STORAGE</h2>
            <p className="mt-1 text-xs opacity-65">
              Load your personal offline MP3/WAV tracks from this machine into the player session.
            </p>
          </div>

          {/* File Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl bg-neutral-900/30 hover:bg-neutral-900/60 p-8 text-center transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={onImportLocalFiles}
              className="hidden"
            />
            <div
              style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }}
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-bold"
            >
              +
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider">
                CLICK TO IMPORT AUDIO FILES OR DRAG & DROP
              </p>
              <p className="mt-1 text-xs opacity-55">
                Supports MP3, WAV, OGG, FLAC, M4A — stays private on your PC.
              </p>
            </div>
            <button
              type="button"
              style={{
                backgroundColor: effectiveSiteColor,
                color: surfaceBg,
              }}
              className="pixel-btn rounded-xl px-4 py-2 text-xs font-bold uppercase"
            >
              BROWSE FILES
            </button>
          </div>

          {/* Imported Local Files List */}
          {localTracks.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="px-2 text-[10px] font-bold uppercase opacity-50">
                IMPORTED LOCAL TRACKS ({localTracks.length})
              </div>
              {localTracks.map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    className="flex items-center justify-between rounded-xl bg-neutral-900/30 hover:bg-neutral-900/60 p-3 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <span className="font-bold opacity-50">♪</span>
                      <div className="min-w-0">
                        <p className="truncate font-bold uppercase">{track.title}</p>
                        <p className="text-[10px] opacity-50">{track.artist} // LOCAL DISK</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs opacity-60">{track.duration}</span>
                      <button
                        type="button"
                        onClick={() => onSelectTrack(track)}
                        style={
                          isCurrent
                            ? { backgroundColor: effectiveSiteColor, color: surfaceBg }
                            : {}
                        }
                        className={`pixel-btn rounded-lg px-3 py-1 text-[11px] font-bold uppercase transition-colors ${
                          !isCurrent ? "bg-neutral-900/60 hover:bg-neutral-800" : ""
                        }`}
                      >
                        {isCurrent && isPlaying ? "PLAYING" : "PLAY"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onAddToQueue(track)}
                        className="pixel-btn rounded-lg bg-neutral-900/60 hover:bg-neutral-800 px-2.5 py-1 text-[11px] font-bold uppercase"
                      >
                        +QUEUE
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Local Settings / Storage Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-neutral-900/40 p-5">
              <p className="text-[10px] font-bold uppercase opacity-50">SESSION CACHE</p>
              <h4 className="mt-1 text-sm font-bold uppercase">LOCAL CLIENT STATE</h4>
              <p className="mt-1 text-xs opacity-65">
                User room keys, appearance settings, volume, and playback parameters are stored in this browser.
              </p>
            </div>
            <div className="rounded-2xl bg-neutral-900/40 p-5">
              <p className="text-[10px] font-bold uppercase opacity-50">DEVICE AUDIO PIPELINE</p>
              <h4 className="mt-1 text-sm font-bold uppercase">HTML5 WEB AUDIO READY</h4>
              <p className="mt-1 text-xs opacity-65">
                Direct hardware output support with latency-free seeking and seamless loop continuation.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
