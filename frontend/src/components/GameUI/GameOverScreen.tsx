import type { Contestant } from "../../../../shared/types/types";
import { useNavigate } from "react-router-dom";

type Props = {
  players: Contestant[];
  onRestart: () => void;
};

const GameOverScreen = ({ players, onRestart }: Props) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const navigate = useNavigate();

  return (
    <div className="relative w-full min-h-screen overflow-hidden font-medievalsharp">
      {/* Background Image */}
      <img
        src="/game_ui/homescreen.jpg"
        alt="Game Background"
        className="fixed inset-0 w-full h-full object-cover z-0"
      />

      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-10" />

      {/* Centered Foreground Content */}
      <div className="relative z-20 flex items-center justify-center min-h-screen p-4">
        <div className="relative max-w-3xl w-full mx-auto">
          {/* Glowing Corners */}
          <div className="absolute w-2 h-2 bg-white top-[6px] left-[6px] shadow-[0_0_6px_#ffffff]" />
          <div className="absolute w-2 h-2 bg-white top-[6px] right-[6px] shadow-[0_0_6px_#ffffff]" />
          <div className="absolute w-2 h-2 bg-white bottom-[6px] left-[6px] shadow-[0_0_6px_#ffffff]" />
          <div className="absolute w-2 h-2 bg-white bottom-[6px] right-[6px] shadow-[0_0_6px_#ffffff]" />

          {/* Content Box */}
          <div className="bg-[#2a2a2a] border-[6px] border-[#363636] shadow-[inset_0_0_8px_#000] p-6 space-y-6 text-lg leading-relaxed text-gray-200">
            <h1 className="text-5xl md:text-6xl text-center font-medievalsharp font-bold text-yellow-400 drop-shadow-[0_0_12px_#d4af37] mb-6">
              Game Over
            </h1>
            <p className="italic text-center text-gray-400">Justice has been served.</p>

            <h2 className="text-2xl text-yellow-300 font-semibold text-center mt-4">Scores</h2>
            <ul className="mt-4 space-y-2 max-w-md mx-auto">
              {sorted.map((player: Contestant) => (
                <li
                  key={player.id}
                  className="flex font-cinzel justify-between pb-2 text-lg"
                >
                  <span className="font-semibold text-white">{player.name}</span>
                  <span className="text-yellow-300 font-semibold">{player.score}</span>
                </li>
              ))}
            </ul>

            <div className="text-center mt-8">
              <button
                onClick={onRestart}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-cinzel font-semibold px-6 py-2 rounded shadow-lg transition duration-200"
              >
                Restart
              </button>
              <button
                onClick={() => navigate("/")}
                className="ml-4 bg-gray-700 hover:bg-gray-600 text-white font-cinzel font-semibold px-6 py-2 rounded shadow-lg transition duration-200"
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen;
