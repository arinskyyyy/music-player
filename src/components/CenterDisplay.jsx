import '../styles/CenterDisplay.css';
import bgImage from '../assets/background.gif'; 
import discImage from '../assets/disc.svg'; 

export default function CenterDisplay({ isConnected, songTitle, artist, isPlaying, toggleQueue }) {
    return (
    <div className="center-display">
        <img src={bgImage} alt="Pixel Night Sky" className="background-scenery" />
        
        <div className="top-nav">
            <div className="profile-placeholder"></div>
            {/* This class toggles between 'connected' (green) and 'disconnected' (red) based on your FastAPI WebSocket state */}
            <div className={`status-light ${isConnected ? 'connected' : 'disconnected'}`}></div>
            <div className="hamburger-menu" onClick={toggleQueue}>☰</div>
        </div>

        <div className="metadata-container">
            <div className="text-stack">
            <h2 className="song-title">{songTitle}</h2>
            <p className="artist-name">{artist}</p>
            </div>
            <img src={discImage} alt="Rotating Vinyl" className="rotating-disc" />
        </div>
        </div>
    );
}