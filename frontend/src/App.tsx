import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import HomeScreen from './pages/HomeScreen';
import SinglePlayerMode from './pages/SinglePlayerMode';
import MultiplayerLobby from './pages/MultiPlayerLobby';
import MultiPlayerMode from './pages/MultiPlayerMode';
import { useState } from 'react';
import type { RoomData } from '../../shared/types/types';
// Import other pages as needed (e.g., Multiplayer, HowToPlay, Lore, About)

function App() {

  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeRouteHandler />} />
        <Route path="/singleplayer" element={<SinglePlayerMode />} />
        <Route path='/multiplayerlobby' element={<MultiplayerLobby setMyPlayerId={setMyPlayerId} setRoomData={setRoomData} />} />
        <Route path='/multiplayer' element={<MultiPlayerMode myPlayerId={myPlayerId} room={roomData}/>} />
        {/* Add other routes here */}
      </Routes>
    </Router>
  );
}

function HomeRouteHandler() {
  const navigate = useNavigate();

  const handleSelect = (mode: string) => {
    switch (mode) {
      case 'Single Player':
        navigate('/singleplayer');
        break;
      case 'Multiplayer':
        navigate('/multiplayerlobby'); // Add route/component later
        break;
      case 'How to Play':
        navigate('/how-to-play');
        break;
      case 'Lore':
        navigate('/lore');
        break;
      case 'About':
        navigate('/about');
        break;
      default:
        break;
    }
  };

  return <HomeScreen onSelect={handleSelect} />;
}

export default App;
