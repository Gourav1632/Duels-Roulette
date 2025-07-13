import { useState, useEffect } from "react";
import EventArea from '../components/GameUI/EventArea';
import PlayingArea from '../components/GameUI/PlayingArea';
import type { ActionMessage, ItemType, GameState, RoomData } from "../../../shared/types/types";
import { emitPlayerAction, gameReady, onGameUpdate } from "../utils/socket";
import { useSocket } from "../context/SocketContext";

function MultiPlayerMode({room, myPlayerId}:{room: RoomData | null, myPlayerId: string | null}) {
  
  const [game, setGame] = useState<GameState | null>(null);
  const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null);
  const [gameMessage, setGameMessage] = useState<string | null>("gamme message tmp");
  const [canStealItem, setCanStealItem] = useState<boolean>(false);
  const [canDrink, setCanDrink] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPlayingArea, setShowPlayingArea] = useState<boolean>(true);
  const socket = useSocket();

  
useEffect(() => {
  if (!room?.id) return;

  function updateTurnState(gameState: GameState) {
    const currentTurn = gameState.players[gameState.activePlayerIndex];

    // Reset interaction states
    setCanDrink(false);
    setCanStealItem(false);

    const isThief = currentTurn.statusEffects.includes("thief");
    const isMyTurn = myPlayerId === currentTurn.id;

    if (isMyTurn && !isThief) {
      setCanDrink(true);
    } else if (isMyTurn && isThief) {
      setCanStealItem(true);
    }
  }

  onGameUpdate(socket,(gameState, action, delay) => {

    if (action.type === "announce" && action.result) {
      setLoading(true);
      setGameMessage(action.result);
      setTimeout(() => {
        setLoading(false);
        setGame(gameState);
        updateTurnState(gameState); // ✅ ensure proper turn state
      }, delay);
    } else {
      triggerEvent(action, delay, () => {
        setGame(gameState);
        updateTurnState(gameState); // ✅ ensure proper turn state
      });
    }
  });

  gameReady(socket,room.id);

  return () => {
    socket.off("game_update");
  };
}, [room?.id, myPlayerId]);



  // Utility to trigger an event and pause game logic until EventArea finishes
  function triggerEvent(action: ActionMessage, delay: number, next?: () => void) {
    setActionMessage(action); // Show the message
    setShowPlayingArea(false); // Hide the playing area
    setCanDrink(false) // disable player interaction when event
    setTimeout(() => {
      setShowPlayingArea(true); // Show the playing area again
      if (next) next();       // Continue the game logic after delay
    }, delay);
  }



  const handleDrink = (targetId: string) => {
    if (!room || !room.gameState) return;

    const actionMessage = {
      type: "drink",
      targetPlayerId: targetId
    };
    
    emitPlayerAction(socket, room?.id, actionMessage ,5000);

  };

  const handleUseItem = (item: ItemType, targetId: string) => {
    if (!room || !room.gameState) return;

    const actionMessage  = {
      type: "use_item",
      itemType: item,
      targetPlayerId: targetId
    };

    emitPlayerAction(socket, room.id, actionMessage, 5000);
  };

  const handleStealItem = (item: ItemType, targetId: string) => {
    if (!room || !room.gameState) return;

    const  actionMessage  = {
      type: "use_item",
      itemType: item,
      targetPlayerId: targetId
    };

    emitPlayerAction(socket, room.id, actionMessage, 5000);
  };

if (loading) return (
  <div
    className="fixed p-4 inset-0 w-full h-full z-0 bg-cover bg-center flex items-center justify-center font-medievalsharp"
    style={{ backgroundImage: "url('/game_ui/intro.webp')" }}
  >
    {/* Main parchment box */}
    <div
      className="relative px-10 py-8 text-black text-center text-3xl md:text-4xl leading-relaxed font-medium shadow-xl max-w-4xl w-full border-[4px] border-[#c49b38] rounded-none"
      style={{
  backgroundColor: 'rgba(225, 201, 122, 0.7)', // slightly see-through
  boxShadow: 'inset 0 0 25px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.35)'
}}

    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-6 h-6 bg-[#c49b38]" />
      <div className="absolute top-0 right-0 w-6 h-6 bg-[#c49b38]" />
      <div className="absolute bottom-0 left-0 w-6 h-6 bg-[#c49b38]" />
      <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#c49b38]" />

      {/* Text Content */}
      <p className="mb-4">
        <span className="text-red-600 font-bold">Remember —</span> {gameMessage}
      </p>
      <p className="italic">
        Choose wisely... <span className="text-red-700">I’d hate to see you die too soon.</span>
      </p>
    </div>
  </div>
);



  return (
    <div className="flex w-full h-screen bg-black text-white">

      {/* Mobile view  */}
      {/* Left Panel - Game Scene */}
      <div className={` ${ showPlayingArea ? 'w-[100%]' : 'w-0'} lg:hidden relative bg-table-pattern`}>
        {game && game.players && myPlayerId &&
          <PlayingArea
            handleDrink={handleDrink}
            handleStealItem={handleStealItem}
            canStealItem={canStealItem}
            canDrink={canDrink}
            myPlayerId={myPlayerId}
            handleUseItem={handleUseItem}
            players={game.players}
          />
        }
      </div>

      {/* Right Panel - Event Log / Animations */}
      <div className={` ${ !showPlayingArea ? 'w-[100%]' : 'w-0'}  lg:hidden overflow-y-auto bg-zinc-900 border-l border-gray-700`}>
        {game && actionMessage && myPlayerId &&
          <EventArea
            myPlayerId={myPlayerId}
            players={game.players}
            actionMessage={actionMessage}
          />
        }
      </div>


      {/* Desktop view  */}
      {/* Left Panel - Game Scene */}
      <div className={` w-[60%] hidden lg:flex relative bg-table-pattern`}>
        {game && game.players && myPlayerId && 
          <PlayingArea
            handleDrink={handleDrink}
            handleStealItem={handleStealItem}
            canStealItem={canStealItem}
            canDrink={canDrink}
            myPlayerId={myPlayerId}
            handleUseItem={handleUseItem}
            players={game.players}
          />
        }
      </div>

      {/* Right Panel - Event Log / Animations */}
      <div className={`w-[40%] hidden lg:flex overflow-y-auto bg-zinc-900 border-l border-gray-700`}>
        {game && actionMessage && myPlayerId &&
          <EventArea
            myPlayerId={myPlayerId}
            players={game.players}
            actionMessage={actionMessage}
          />
        }
      </div>

      
    </div>
  );
}

export default MultiPlayerMode;
