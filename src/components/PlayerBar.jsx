function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function PixelHeartIcon({ filled = false, className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 16 16" className={`${className} [shape-rendering:crispEdges]`} fill="none" aria-hidden="true">
      {filled ? <path d="M2 5h2v-2h3v2h2v-2h3v2h2v4h-2v2h-2v2h-2v2h-2v-2h-2v-2h-2v-2h-2v-4z" fill="#ec4899" /> : <path d="M4 3h3v2h2v-2h3v2h2v4h-2v2h-2v2h-2v2h-2v-2h-2v-2h-2v-2h-2v-4h2v-2h2zm0 2v4h2v2h2v2h2v-2h2v-2h2v-4h-2v-2h-1v2h-4v-2h-1z" fill="currentColor" />}
    </svg>
  );
}

export default function PlayerBar({ track, isPlaying, currentTime = 0, duration = 0, volume = 80, isMuted = false, isLooping = false, isShuffle = false, isFavorite = false, onToggleFavorite, onTogglePlay, onSeekChange, onVolumeChange, onToggleMute, onToggleLoop, onToggleShuffle, onPrev, onNext, effectiveSiteColor = "#ffffff", effectiveTextColor = "#ffffff", surfaceBg = "#000000" }) {
  return (
    <footer style={{ backgroundColor: surfaceBg, color: effectiveTextColor }} className="z-30 shrink-0 flex flex-col gap-2.5 px-3 py-2.5 sm:px-6 md:h-24 md:flex-row md:items-center md:justify-between md:py-0 border-t border-neutral-800/50">
      <div className="flex items-center gap-3 min-w-0 md:w-64 lg:w-72">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-900 text-xs font-medium">
          {track?.cover ? <img src={track.cover} alt={track.title} className="h-full w-full object-cover [image-rendering:pixelated]" /> : <span style={{ color: effectiveSiteColor }}>♪</span>}
          {isPlaying && <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-emerald-400" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{track ? track.title : "NO TRACK SELECTED"}</p>
          <div className="flex items-center gap-2 text-[10px] opacity-60">
            <span className="truncate">{track ? track.artist : "SELECT FROM CATALOG"}</span>
            {track?.sourceLabel && <span className="rounded bg-neutral-900 px-1.5 py-0.5 text-[9px]">{track.sourceLabel}</span>}
          </div>
        </div>
        {track && (
          <button type="button" onClick={() => onToggleFavorite?.(track)} title={isFavorite ? "Favorited" : "Add to Favorites"} className={`pixel-btn flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${isFavorite ? "text-pink-500" : "opacity-60 hover:opacity-100"}`}>
            <PixelHeartIcon filled={isFavorite} className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center gap-2 w-full md:max-w-xl">
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3">
          <button type="button" onClick={onToggleShuffle} title={isShuffle ? "Shuffle: ON" : "Shuffle: OFF"} style={isShuffle ? { backgroundColor: effectiveSiteColor, color: surfaceBg } : {}} className={`pixel-btn rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors duration-200 ${!isShuffle ? "bg-neutral-900/60 hover:bg-neutral-800 opacity-70 hover:opacity-100" : ""}`}>SHUF</button>
          <button type="button" onClick={onPrev} title="Previous Track" className="pixel-btn rounded-lg bg-neutral-900/60 px-3 py-1 text-xs font-medium hover:bg-neutral-800 transition-colors duration-200">|◀</button>
          <button type="button" onClick={onTogglePlay} title={isPlaying ? "Pause" : "Play"} style={{ backgroundColor: effectiveSiteColor, color: surfaceBg }} className="pixel-btn flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold shadow-lg transition-colors duration-200 hover:opacity-80">{isPlaying ? "❚❚" : "▶"}</button>
          <button type="button" onClick={onNext} title="Next Track" className="pixel-btn rounded-lg bg-neutral-900/60 px-3 py-1 text-xs font-medium hover:bg-neutral-800 transition-colors duration-200">▶|</button>
          <button type="button" onClick={onToggleLoop} title={isLooping ? "Repeat: ON" : "Repeat: OFF"} style={isLooping ? { backgroundColor: effectiveSiteColor, color: surfaceBg } : {}} className={`pixel-btn rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors duration-200 ${!isLooping ? "bg-neutral-900/60 hover:bg-neutral-800 opacity-70 hover:opacity-100" : ""}`}>LOOP</button>
        </div>
        <div className="flex w-full items-center gap-2.5 text-[10px] font-medium opacity-75">
          <span className="w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
          <div className="relative flex-1"><input type="range" min={0} max={duration || 100} value={currentTime || 0} onChange={(e) => onSeekChange(Number(e.target.value))} aria-label="Seek track" className="w-full" /></div>
          <span className="w-10 text-left tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 w-full md:w-64 md:justify-end lg:w-72">
        <div className="hidden items-end gap-0.5 sm:flex h-5" aria-hidden="true">
          {[40, 70, 95, 60, 85, 30, 75].map((h, i) => (
            <span
              key={i}
              style={{
                backgroundColor: isPlaying ? effectiveSiteColor : "#333333",
                height: isPlaying ? `${Math.max(4, (h * ((i % 3) + 1)) % 18)}px` : "3px",
                animationDelay: `${i * 95}ms`,
                animationDuration: `${500 + (i % 4) * 120}ms`,
              }}
              className={`w-1 rounded-t-sm ${isPlaying ? "eq-bar-playing" : ""}`}
            />
          ))}
        </div>
        <div className="flex flex-1 md:flex-none items-center gap-2">
          <button type="button" onClick={onToggleMute} title={isMuted ? "Unmute" : "Mute"} className="pixel-btn shrink-0 rounded-lg bg-neutral-900/60 px-2.5 py-1 text-[11px] font-medium hover:bg-neutral-800 transition-colors duration-200">{isMuted || volume === 0 ? "MUTE" : "VOL"}</button>
          <input type="range" min={0} max={100} value={isMuted ? 0 : volume} onChange={(e) => { onVolumeChange(Number(e.target.value)); if (isMuted) onToggleMute(); }} aria-label="Volume slider" className="w-full md:w-20" />
          <span className="w-7 shrink-0 text-right text-[10px] tabular-nums opacity-60">{isMuted ? "0%" : `${Math.round(volume)}%`}</span>
        </div>
      </div>
    </footer>
  );
}