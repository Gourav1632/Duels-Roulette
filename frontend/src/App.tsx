import GameUI from './GameUI';
import PlayingArea from './components/GameUI/PlayingArea';


function App() {

  return (
    <div className="flex w-full h-screen bg-black text-white">
  {/* Left Panel - Game Scene */}
  <div className="w-[60%] relative bg-table-pattern">
    {/* Table and players go here */}
    <PlayingArea />
  </div>
{/* 
    Right Panel - Event Log / Animations
    <div className="w-[40%] p-4 overflow-y-auto bg-zinc-900 border-l border-gray-700">
      <EventDisplay events={gameEvents} />
      <AnimationLayer currentAction={currentAction} />
    </div> */}
  </div>

  );
}

export default App;
