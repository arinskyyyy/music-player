function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function PlayerBar({
  track,
  isPlaying,
  currentTime = 0,
  duration = 0,
  volume = 80,
  isMuted = false,
  isLooping = false,
  isShuffle = false,
  onTogglePlay,
  onSeekChange,
  onVolumeChange,
  onToggleMute,
  onToggleLoop,
  onToggleShuffle,
  onPrev,
  onNext,
  effectiveSiteColor = "#ffffff",
  effectiveTextColor = "#ffffff",
  surfaceBg = "#000000",
}) {
  return (
    <footer
      style={{
        backgroundColor: surfaceBg,
        color: effectiveTextColor,
      }}
      className="z-30 flex flex-col gap-2.5 px-4 py-3 sm:px-6 md:h-24 md:flex-row md:items-center md:justify-between md:py-0"
    >
      {/* 1. Track Info & Artwork */}
      <div className="flex items-center gap-3.5 min-w-0 md:w-64 lg:w-72">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-900 text-xs font-bold">
          {track?.cover ? (
            <img
              src={track.cover}
              alt={track.title}
              className="h-full w-full object-cover [image-rendering:pixelated]"
            />
          ) : (
            <span style={{ color: effectiveSiteColor }}>♪</span>
          )}
          {isPlaying && (
            <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-emerald-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold uppercase tracking-wider">
            {track ? track.title : "NO TRACK SELECTED"}
          </p>
          <div className="flex items-center gap-2 text-[10px] opacity-60">
            <span className="truncate">{track ? track.artist : "SELECT FROM CATALOG"}</span>
            {track?.sourceLabel && (
              <span className="rounded bg-neutral-900 px-1.5 py-0.5 text-[9px] uppercase">
                {track.sourceLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Transport Controls & Timeline Scrubber */}
      <div className="flex flex-1 flex-col items-center gap-2 md:max-w-xl">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Shuffle Toggle */}
          <button
            type="button"
            onClick={onToggleShuffle}
            title={isShuffle ? "Shuffle: ON" : "Shuffle: OFF"}
            style={
              isShuffle
                ? { backgroundColor: effectiveSiteColor, color: surfaceBg }
                : {}
            }
            className={`pixel-btn rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase transition-colors ${
              !isShuffle ? "bg-neutral-900/60 hover:bg-neutral-800 opacity-70 hover:opacity-100" : ""
            }`}
          >
            SHUF
          </button>

          {/* Prev */}
          <button
            type="button"
            onClick={onPrev}
            title="Previous Track"
            className="pixel-btn rounded-lg bg-neutral-900/60 px-3 py-1 text-xs font-bold uppercase hover:bg-neutral-800"
          >
            |◀
          </button>

          {/* Play / Pause Primary Button */}
          <button
            type="button"
            onClick={onTogglePlay}
            title={isPlaying ? "Pause" : "Play"}
            style={{
              backgroundColor: effectiveSiteColor,
              color: surfaceBg,
            }}
            className="pixel-btn flex h-10 w-10 items-center justify-center rounded-full text-sm font-black shadow-lg"
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={onNext}
            title="Next Track"
            className="pixel-btn rounded-lg bg-neutral-900/60 px-3 py-1 text-xs font-bold uppercase hover:bg-neutral-800"
          >
            ▶|
          </button>

          {/* Loop Toggle */}
          <button
            type="button"
            onClick={onToggleLoop}
            title={isLooping ? "Repeat: ON" : "Repeat: OFF"}
            style={
              isLooping
                ? { backgroundColor: effectiveSiteColor, color: surfaceBg }
                : {}
            }
            className={`pixel-btn rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase transition-colors ${
              !isLooping ? "bg-neutral-900/60 hover:bg-neutral-800 opacity-70 hover:opacity-100" : ""
            }`}
          >
            LOOP
          </button>
        </div>

        {/* Timeline Progress Bar */}
        <div className="flex w-full items-center gap-2.5 text-[10px] font-bold opacity-75">
          <span className="w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
          <div className="relative flex-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime || 0}
              onChange={(e) => onSeekChange(Number(e.target.value))}
              aria-label="Seek track"
              className="w-full"
            />
          </div>
          <span className="w-10 text-left tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>

      {/* 3. Equalizer Simulation & Volume */}
      <div className="flex items-center justify-between gap-4 md:w-64 md:justify-end lg:w-72">
        {/* Retro Dancing Visualizer Bars */}
        <div className="hidden items-end gap-0.5 sm:flex" aria-hidden="true">
          {[40, 70, 95, 60, 85, 30, 75].map((h, i) => (
            <span
              key={i}
              style={{
                backgroundColor: isPlaying ? effectiveSiteColor : "#333333",
                height: isPlaying ? `${Math.max(4, (h * ((i % 3) + 1)) % 18)}px` : "3px",
                transition: "height 150ms linear",
              }}
              className="w-1 rounded-t-sm"
            />
          ))}
        </div>

        {/* Volume & Mute */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? "Unmute" : "Mute"}
            className="pixel-btn rounded-lg bg-neutral-900/60 px-2.5 py-1 text-[11px] font-bold uppercase hover:bg-neutral-800"
          >
            {isMuted || volume === 0 ? "MUTE" : "VOL"}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            aria-label="Volume slider"
            className="w-20"
          />
          <span className="w-7 text-right text-[10px] tabular-nums opacity-60">
            {isMuted ? "0%" : `${Math.round(volume)}%`}
          </span>
        </div>
      </div>
    </footer>
  );
}
