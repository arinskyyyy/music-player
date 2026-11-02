import { useState } from 'react';
import './styles/global.css';
import CenterDisplay from './components/CenterDisplay';

function App() {
  // In the future, this state will be controlled by your Python backend
  const [isConnected, setIsConnected] = useState(false);
  
  return (
    <div className="app-viewport">
      <CenterDisplay 
        isConnected={isConnected} 
        songTitle="Playing lullaby" 
        artist="By Columbina" 
      />
    </div>
  );
}

export default App;