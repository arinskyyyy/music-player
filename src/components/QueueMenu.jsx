import '../styles/QueueMenu.css';
import SongRow from './SongRow';
import placeholderThumb from '../assets/disc.svg'; // Using your disc as a temp thumbnail

export default function QueueMenu({ isOpen, toggleMenu }) {
    return (
    <div className={`queue-overlay ${isOpen ? 'open' : ''}`}>
      {/* A drag handle to close the menu */}
        <div className="drag-handle" onClick={toggleMenu}>
            <div className="handle-bar"></div>
        </div>

        <div className="queue-tabs">
            <span className="tab active">Queue</span>
            <span className="tab">Favorites</span>
            <span className="tab">Import</span>
        </div>

        <div className="queue-list">
            {/* We map multiple SongRows to simulate the queue */}
            <SongRow title="Jade Chimes" artist="By Columbina" thumbnail={placeholderThumb} />
            <SongRow title="Night Running" artist="By BNA" thumbnail={placeholderThumb} />
            <SongRow title="Pixel Galaxy" artist="By Snail's House" thumbnail={placeholderThumb} />
        </div>
    </div>
    );
}