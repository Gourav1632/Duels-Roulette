import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import HomeScreen from './pages/HomeScreen';
import SinglePlayerMode from './pages/SinglePlayerMode';
// Import other pages as needed (e.g., Multiplayer, HowToPlay, Lore, About)

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeRouteHandler />} />
        <Route path="/singleplayer" element={<SinglePlayerMode />} />
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
        navigate('/multiplayer'); // Add route/component later
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
