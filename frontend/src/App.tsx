import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import HomeScreen from './pages/HomeScreen';
import SinglePlayerMode from './pages/SinglePlayerMode';
import MultiplayerLobby from './pages/MultiPlayerLobby';
import MultiPlayerMode from './pages/MultiPlayerMode';
import { useState } from 'react';
import type { RoomData } from '../../shared/types/types';
import HowToPlay from './pages/HotToPlay';
import Lore from './pages/Lore';
import Credits from './pages/Credits';
import { VoiceChatProvider } from './context/VoiceChatContext';
// Import other pages as needed (e.g., Multiplayer, HowToPlay, Lore, About)

function App() {

  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  return (
    <Router>
      <VoiceChatProvider roomId={roomData?.id ?? ""} voiceChatEnabled={roomData?.voiceChatEnabled ?? false}>
      <Routes>
        <Route path="/" element={<HomeRouteHandler />} />
        <Route path="/singleplayer" element={<SinglePlayerMode />} />
          <Route path='/multiplayerlobby' element={<MultiplayerLobby setMyPlayerId={setMyPlayerId} setRoomData={setRoomData} />} />
          <Route path='/multiplayer' element={<MultiPlayerMode myPlayerId={myPlayerId} room={roomData} />} />
        <Route path='/how-to-play' element={<HowToPlay />} />
        <Route path='/lore' element={<Lore />} />
        <Route path='/credits' element={<Credits />} /> 
        {/* Add other routes here */}
      </Routes>
        </VoiceChatProvider>
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
      case 'Multi Player':
        navigate('/multiplayerlobby'); // Add route/component later
        break;
      case 'How to Play':
        navigate('/how-to-play');
        break;
      case 'Lore':
        navigate('/lore');
        break;
      case 'Credits':
        navigate('/credits'); // Add route/component later
        break;
      default:
        break;
    }
  };

  return <HomeScreen onSelect={handleSelect} />;
}

export default App;
