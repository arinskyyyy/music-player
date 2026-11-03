import '../styles/PlayerControls.css';
// Import YOUR custom SVGs here
import playIcon from '../assets/play.svg';
import pauseIcon from '../assets/pause.svg';
import forwardIcon from '../assets/forward.svg';
import backwardIcon from '../assets/backward.svg';
import repeatIcon from '../assets/repeat.svg';
import heartIcon from '../assets/heart.svg';

export default function PlayerControls({ isPlaying, togglePlay }) {
    return (
    <div className="player-controls-container">
        <button className="side-btn">
            <img src={repeatIcon} alt="Repeat" className="custom-icon" />
        </button>

        <div className="main-playback-group">
            <button className="control-btn">
                <img src={backwardIcon} alt="Rewind" className="custom-icon" />
            </button>
        
            <button className="control-btn play-btn" onClick={togglePlay}>
          {/* Swaps your custom Play and Pause SVGs dynamically */}
            <img 
            src={isPlaying ? pauseIcon : playIcon} 
            alt="Play/Pause" 
            className="custom-icon play-pause-icon" 
            />
        </button>
        
        <button className="control-btn">
            <img src={forwardIcon} alt="Forward" className="custom-icon" />
        </button>
        </div>

        <button className="side-btn">
            <img src={heartIcon} alt="Like" className="custom-icon" />
        </button>
    </div>
    );
}