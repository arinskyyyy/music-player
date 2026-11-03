import { useState } from 'react';
import './styles/global.css';
import CenterDisplay from './components/CenterDisplay';
import TrackBar from './components/TrackBar';
import PlayerControls from './components/PlayerControls';
import QueueMenu from './components/QueueMenu'; // Import the new menu

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false); // New state

  const handleTogglePlay = () => setIsPlaying(!isPlaying);
  const toggleQueue = () => setIsQueueOpen(!isQueueOpen); // Toggles the menu
  
  return (
    <div className="app-viewport">
      <CenterDisplay 
        isConnected={isConnected} 
        songTitle="Playing lullaby" 
        artist="By Columbina"
        isPlaying={isPlaying}
        toggleQueue={toggleQueue} // Pass it down to the hamburger
      />
      <TrackBar currentTime="01:50" totalTime="03:00" progress={61} />
      <PlayerControls isPlaying={isPlaying} togglePlay={handleTogglePlay} />
      
      {/* Render the Queue Menu */}
      <QueueMenu isOpen={isQueueOpen} toggleMenu={toggleQueue} />
    </div>
  );
}

export default App;