import '../styles/TrackBar.css';

export default function TrackBar({ currentTime = "01:50", totalTime = "03:00", progress = 60 }) {
    return (
    <div className="trackbar-container">
        <span className="timestamp">{currentTime}</span>
        
        <div className="track-wrapper">
        {/* The dark empty background track */}
        <div className="track-base"></div>
        
        {/* The segmented bright progress fill */}
        <div 
            className="track-progress" 
            style={{ width: `${progress}%` }}
        ></div>
        
        {/* The blocky draggable scrubber knob */}
        <div 
            className="scrubber-knob" 
            style={{ left: `${progress}%` }}
        >
            <div className="knob-grip"></div>
            <div className="knob-grip"></div>
        </div>
        </div>

        <span className="timestamp">{totalTime}</span>
    </div>
    );
}