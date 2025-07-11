import { useState, useEffect } from "react";
import EventArea from '../components/GameUI/EventArea';
import PlayingArea from '../components/GameUI/PlayingArea';

import {
  initializeGame,
  startRound,
  playTurn,
  refillChambers,
  skipIfChained
} from "../../../shared/logic/gameEngine";

import type { ActionMessage, ItemType, Contestant, GameState } from "../../../shared/types/types";
import { automatonTakeTurn } from "../../../shared/logic/aiLogic";

function SinglePlayerMode() {
  const [game, setGame] = useState<GameState | null>(null);
  const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null);
  const [gameMessage, setGameMessage] = useState<string | null>(null);
  const [canStealItem, setCanStealItem] = useState<boolean>(false);
  const [canDrink, setCanDrink] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(()=>{
    if(!game || game.gameState == 'loading') return;
    const active = game.players[game.activePlayerIndex]
    const introMessage: ActionMessage = {
      type: 'message',
      userId: active.id,
      result: `It is ${active.name === 'You' ? 'your' :`${active.name}'s`} turn.`
    };
    if(game.activePlayerIndex === 0){
      triggerEvent(introMessage,2000,()=>{
        handlePlayerTurn(game);
      })
    }else{
      triggerEvent(introMessage,2000,()=>{
        handleAITurn(game);
      })
    }
  },[game?.activePlayerIndex]);

  useEffect(() => {
  if (!game || game.activePlayerIndex !== 0) return;
  handlePlayerTurn(game);
}, [game?.players[0].statusEffects?.join(",")]);


  // Utility to trigger an event and pause game logic until EventArea finishes
  function triggerEvent(action: ActionMessage, delay: number, next?: () => void) {
    setActionMessage(action); // Show the message
    setCanDrink(false) // disable player interaction when event
    setTimeout(() => {
      if (next) next();       // Continue the game logic after delay
    }, delay);
  }


  function checkDeathsAndAdvance(game: GameState) {
    const deadPlayers = game.players.filter(p => p.lives <= 0);
    if (deadPlayers.length > 0) {
      setLoading(true);
      const nextround = game.currentRound.round + 1;
      setGameMessage(`${deadPlayers.map(p => p.name).join(', ')} lost the round. Round ${nextround} begins!!!`);
      setTimeout(() => {
        setLoading(false);
        setGame(startRound(game, nextround));
      }, 5000);
    } else {
      setGame(game);
    }
  }

  useEffect(() => {
    setLoading(true);
    const humanPlayer: Contestant = {
      id: "human",
      name: "You",
      lives: 3,
      items: [],
      isAI: false,
      isOnline: true,
      statusEffects: [],
    };

    const automatonPlayer: Contestant = {
      id: "Revenant",
      name: "Revenant",
      lives: 3,
      items: [],
      isAI: true,
      isOnline: false,
      statusEffects: [],
    };


    const gamePlayers = [humanPlayer, automatonPlayer];
    const initialized = initializeGame(gamePlayers);
    const started = startRound(initialized, 2);
    // fetch round config
    const { poisnousGoblets, holyGoblets } = started.currentRound;
    const roundStartMessage: ActionMessage = {
      type: 'announce',
      result: `Round ${started.currentRound.round} starts with ${poisnousGoblets} poisoned and ${holyGoblets} holy goblets.`
    };
    setGameMessage(roundStartMessage.result ?? "");

      setTimeout(() => {
        setLoading(false);
        setGame(started);
      }, 5000);
  }, []);


  function handlePlayerTurn(game:GameState){
    const active = game.players[game.activePlayerIndex];

    // check if player is chained
    const skipResult = skipIfChained(game, active);
    if (skipResult) {
      const { updatedGame, actionMessage } = skipResult;
      triggerEvent(actionMessage,5000, ()=>{
        setGame(updatedGame);
        checkDeathsAndAdvance(updatedGame);
      });
      return;
    }

    // player status is thief 
    if (active.statusEffects.includes("thief")) {
      setCanStealItem(true);
      return;
    }

    // check if all goblets are over
    if (game.gobletsRemaining === 0 && game.gameState === "playing") {
      const updatedGame = refillChambers(game);
      const message: ActionMessage = {
        type: 'refill',
        userId: game.players[game.activePlayerIndex].id,
        result: `Guard refills the goblets. It has ${updatedGame.currentRound.holyGoblets} holy and ${updatedGame.currentRound.poisnousGoblets} poisoned goblets.`
        };
      triggerEvent(message,5000,()=>{
        setGame(updatedGame);
        handlePlayerTurn(updatedGame);
      });
      return;
    }

    setCanDrink(true);
  }

  function handleAITurn(game:GameState){
    setCanDrink(false);
    const active = game.players[game.activePlayerIndex];
    // check if player is chained
    const skipResult = skipIfChained(game, active);
    if (skipResult) {
      const { updatedGame, actionMessage } = skipResult;
      triggerEvent(actionMessage,5000, ()=>{
        setGame(updatedGame);
        checkDeathsAndAdvance(updatedGame);
      });
      return;
    }

    // check if all goblets are over
    if (game.gobletsRemaining === 0 && game.gameState === "playing") {
      const updatedGame = refillChambers(game);
      const message: ActionMessage = {
        type: 'refill',
        userId: game.players[game.activePlayerIndex].id,
        result: `Guard refills the goblets. It has ${updatedGame.currentRound.holyGoblets} holy and ${updatedGame.currentRound.poisnousGoblets} poisoned goblets.`
        };
      triggerEvent(message,5000,()=>{
        setGame(updatedGame);
        handleAITurn(updatedGame);
      });

      return;
    }
    const {updatedGame,actionMessage} = automatonTakeTurn(game);
    triggerEvent(actionMessage,5000,()=>{
      setGame(updatedGame);

      // Only continue turn if AI used item and it's still their turn
      const AIUsedArtifact = actionMessage.type === "artifact_used"
      const AISurvivedSelfShot = actionMessage.type === 'drink' && actionMessage.targetId == actionMessage.userId && actionMessage.result === 'HOLY'
      if ( (AIUsedArtifact || AISurvivedSelfShot)  && updatedGame.players[updatedGame.activePlayerIndex].isAI) {
        handleAITurn(updatedGame); // Recursively call for next step
      } else {
        checkDeathsAndAdvance(updatedGame);
      }
      }
    )

  }


  const handleDrink = (targetId: string) => {
    if (!game || game.gameState !== "playing") return;

    const { updatedGame, actionMessage } = playTurn(game, {
      type: "drink",
      targetPlayerId: targetId
    });

    triggerEvent(actionMessage,5000,()=>{
      setGame(updatedGame);
      checkDeathsAndAdvance(updatedGame);
      setCanDrink(true);
    });

    if (updatedGame.gameState === "round_over") {
      setGameMessage(`Round ${updatedGame.currentRound.round} ends.`);
    } else if (updatedGame.gameState === "game_over") {
      setGameMessage(`Justice has been served.`);
    }
  };

  const handleUseItem = (item: ItemType, targetId: string) => {
    if (!game || game.gameState !== "playing") return;

    const { updatedGame, actionMessage } = playTurn(game, {
      type: "use_item",
      itemType: item,
      targetPlayerId: targetId
    });

    triggerEvent(actionMessage,5000,()=>{
      setGame(updatedGame);
      setCanDrink(true);
    });
  };

  const handleStealItem = (item: ItemType, targetId: string) => {
    if (!game) return;

    const { updatedGame, actionMessage } = playTurn(game, {
      type: "use_item",
      itemType: item,
      targetPlayerId: targetId
    });

    setCanStealItem(false);
    triggerEvent(actionMessage,5000,()=>{
      setGame(updatedGame);
      setCanDrink(true);
    });
  };

if (loading) return (
  <div
    className="fixed p-4 inset-0 w-full h-full z-0 bg-cover bg-center flex items-center justify-center font-gothic"
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
      <div className={` ${ canDrink || canStealItem ? 'w-[100%]' : 'w-0'} lg:hidden relative bg-table-pattern`}>
        {game && game.players && gameMessage &&
          <PlayingArea
            handleDrink={handleDrink}
            handleStealItem={handleStealItem}
            canStealItem={canStealItem}
            canDrink={canDrink}
            myPlayerId={game.players[0].id}
            handleUseItem={handleUseItem}
            players={game.players}
          />
        }
      </div>

      {/* Right Panel - Event Log / Animations */}
      <div className={` ${ !canDrink && !canStealItem ? 'w-[100%]' : 'w-0'}  lg:hidden overflow-y-auto bg-zinc-900 border-l border-gray-700`}>
        {game && actionMessage &&
          <EventArea
            myPlayerId={game.players[0].id}
            players={game.players}
            actionMessage={actionMessage}
          />
        }
      </div>


      {/* Desktop view  */}
      {/* Left Panel - Game Scene */}
      <div className={` w-[60%] hidden lg:flex relative bg-table-pattern`}>
        {game && game.players && gameMessage &&
          <PlayingArea
            handleDrink={handleDrink}
            handleStealItem={handleStealItem}
            canStealItem={canStealItem}
            canDrink={canDrink}
            myPlayerId={game.players[0].id}
            handleUseItem={handleUseItem}
            players={game.players}
          />
        }
      </div>

      {/* Right Panel - Event Log / Animations */}
      <div className={`w-[40%] hidden lg:flex overflow-y-auto bg-zinc-900 border-l border-gray-700`}>
        {game && actionMessage &&
          <EventArea
            myPlayerId={game.players[0].id}
            players={game.players}
            actionMessage={actionMessage}
          />
        }
      </div>

      
    </div>
  );
}

export default SinglePlayerMode;
