import { useState,useEffect} from "react";
import {
  initializeGame,
  startRound,
  playTurn,
  refillChambers,
  skipIfCuffed
} from "./logic/gameEngine";
import type { ActionMessage,ItemType, Contestant, GameState } from "./utils/types";
import { automatonTakeTurn } from "./logic/aiLogic";
import { set } from "react-hook-form";

function GameUI() {
  const [players, setPlayers] = useState<Contestant[]>([]);
  const [game, setGame] = useState<GameState | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [canStealItem, setCanStealItem] = useState<boolean>(false);


function checkDeathsAndAdvance(game: GameState, setGame: (g: GameState) => void, addLog: (msg: string) => void) {
  const deadPlayers = game.players.filter(p => p.lives <= 0);

  if (deadPlayers.length > 0) {
      const nextround = game.currentRound.round + 1;
      addLog(`Eliminated: ${deadPlayers.map(p => p.name).join(", ")}`);
      addLog(`Round ${nextround} begins!`);
      setGame(startRound(game, nextround ));
  } else {
    setGame(game); // No one died, just update state normally
  }
}

function renderGameLogMessage(msg: ActionMessage, players: Contestant[]): string {
  const user = players.find(p => p.id === msg.userId);
  const target = msg.targetId ? players.find(p => p.id === msg.targetId) : null;

  if(msg.type === 'skip') {
    return `${user?.name} is cuffed. Turn skipped.`;
  }
  if (msg.type === 'shoot') {
    if (msg.userId === msg.targetId) {
      return `${user?.name} shot themselves with a ${msg.result?.toLowerCase()} round.`;
    } else {
      return `${user?.name} shot ${target?.name} with a ${msg.result?.toLowerCase()} round.`;
    }
  }

  if (msg.type === 'item_used' && msg.item) {
    switch (msg.item) {
      case 'ejector_tool':
        return `${user?.name} ejected a ${msg.result?.toLowerCase()} shell.`;
      case 'restraining_cuffs':
        return `${user?.name} cuffed ${target?.name}, skipping their next turn.`;
      case 'first_aid_kit':
        return `${user?.name} used a First Aid Kit to heal.`;
      case 'magnifying_scope':
        return `${user?.name} inspected the chamber — it's ${msg.result?.toLowerCase()}.`;
      case 'scout_report':
        return `${user?.name} scouted a random shell — it's ${msg.result?.toLowerCase()}.`;
      case 'shell_inverter':
        return `${user?.name} flipped the shell in the chamber.`;
      case 'sawed_off_kit':
        return `${user?.name} loaded the Sawed-Off Kit for double damage.`;
      case 'adrenaline_shot':
        return `${user?.name} injected an Adrenaline Shot.`;
      default:
        return `${user?.name} used an unknown item.`;
    }
  }
  return 'Unknown action.';
}


useEffect(() => {
  if (!game) return;

  const active = game.players[game.activePlayerIndex];

  // 1. Handle cuffed skip
  const skipResult = skipIfCuffed(game, active);
  if (skipResult) {
    const { updatedGame, actionMessage } = skipResult;
    setGame(updatedGame);
    setLog(prev => [...prev, renderGameLogMessage(actionMessage, updatedGame.players)]);
    checkDeathsAndAdvance(updatedGame, setGame, (msg) =>
      setLog(prev => [...prev, msg])
    );
    return; // important: prevents AI logic from running
  }

  if(active.statusEffects.includes("adrenaline")) {
    setCanStealItem(true);
  }
  // 2. Handle refill
  if (game.shellsRemaining === 0 && game.gameState === "playing") {
    setLog(prev => [...prev, "🔁 Shotgun empty! Refilling..."]);
    setGame(refillChambers(game));
    return;
  }

  // 3. AI Turn (only happens if not skipped or refilled)
  if (
    game.gameState === "playing" &&
    active.isAI &&
    game.shellsRemaining > 0
  ) {
    setLog(prev => [...prev, "Automaton is taking its turn..."]);

    setTimeout(() => {
      const { updatedGame, actionMessage } = automatonTakeTurn(game);

      setLog(prev => [
        ...prev,
        renderGameLogMessage(actionMessage, updatedGame.players),
        ...(updatedGame.gameState === "round_over"
          ? [`Round ${updatedGame.currentRound.round} is over.`]
          : []),
        ...(updatedGame.gameState === "game_over" ? ["Game Over!"] : [])
      ]);

      setGame(updatedGame);

      checkDeathsAndAdvance(updatedGame, setGame, (msg) =>
        setLog((prev) => [...prev, msg])
      );
    }, 1000);
  }
}, [game]);





useEffect(() => {
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
    id: "automaton",
    name: "Automaton Enforcer",
    lives: 3,
    items: [],
    isAI: true,
    isOnline: false,
    statusEffects: [],
  };

  const gamePlayers = [humanPlayer, automatonPlayer];
  setPlayers(gamePlayers);

  const initialized = initializeGame(gamePlayers);
  const started = startRound(initialized,2);
  setGame(started);

  const liveShells = started.shotgunChambers.filter(Boolean).length;
  const blankShells = started.shotgunChambers.filter(s => !s).length;

  let logMessages = [
    'Game started.',
    `Round ${started.currentRound.round} started with ${liveShells} live shells and ${blankShells} blank shells.`
  ];

  const active = started.players[started.activePlayerIndex];
  if (!active.isAI) {
    logMessages.push("It's your turn!");
    setLog(logMessages);
  }
}, []);



    function getShellText(shell: boolean | null, index: number): string {
    if (shell === true) {
        return "LIVE";
    } else if (shell === false) {
        return "BLANK";
    } else {
        return `?`;
    }
    }

const handleShoot = (targetIndex: number) => {
  if (!game || game.gameState !== "playing") return;

  const targetPlayer = game.players[targetIndex];
  const action = {
    type: "shoot",
    targetPlayerId: targetPlayer.id,
  };


  const {updatedGame,actionMessage} = playTurn(game, action);

  setLog(prev => [...prev, renderGameLogMessage(actionMessage, updatedGame.players)]);

  // Update game state
  setGame(updatedGame);

    checkDeathsAndAdvance(updatedGame, setGame, (msg) =>
    setLog((prev) => [...prev, msg])
  );

  // Add round/game over messages
  if (updatedGame.gameState === "round_over") {
    setLog(prev => [...prev, `Round ${updatedGame.currentRound.round} is over.`]);
  } else if (updatedGame.gameState === "game_over") {
    setLog(prev => [...prev, "Game Over!"]);
  }

};


    const handleUseItem = (item: string, targetIndex: number) => {
    if (!game || game.gameState !== "playing") return;  
    const targetPlayer = game.players[targetIndex];
    const action = {
        type: "use_item",
        itemType: item as any, // Cast to ItemType
        targetPlayerId: targetPlayer.id,
    };
    setLog(prev => [
        ...prev,
        `You used ${item.replace(/_/g, " ")}.`,
    ]);
    const {updatedGame,actionMessage} = playTurn(game, action);
    setLog(prev => [...prev, renderGameLogMessage(actionMessage, updatedGame.players)]);
    setGame(updatedGame);

}
const getShellColor = (shell, index) => {
  // Your logic to determine shell color (e.g., based on revealedShells or current/next chamber)
  // This example just shows unknown shells
  return 'bg-gray-400';
};

function stealItem(item: ItemType, targetPlayerIndex: number) {
  const currentGame = structuredClone(game);

  const activePlayer = currentGame.players[currentGame.activePlayerIndex];
  const targetPlayer = currentGame.players[targetPlayerIndex];

  const itemIndex = targetPlayer.items.indexOf(item);
  if (itemIndex === -1) return;

  // Transfer the item
  targetPlayer.items.splice(itemIndex, 1);
  activePlayer.items.push(item);

  currentGame.players[currentGame.activePlayerIndex] = activePlayer;
  currentGame.players[targetPlayerIndex] = targetPlayer;

  // Register and log the action
  const action = {
    type: "use_item",
    itemType: item,
    targetPlayerId: targetPlayer.id,
  };
  const { updatedGame, actionMessage } = playTurn(currentGame, action);
  setLog(prev => [...prev, renderGameLogMessage(actionMessage, updatedGame.players)]);
  setGame(updatedGame);
  setCanStealItem(false);
}



  return game && (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-inter">
      <h1 className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-400">
        Game Test UI: Shotgun Strategy
      </h1>

      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-semibold">
            Round: {game.currentRound.round} 
          </div>
          <div className="text-xl font-semibold">
            Shells Remaining: {game.shellsRemaining}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Player 1 (Human) Info */}
          <div
            className={`p-4 rounded-lg border-2 ${
              game.activePlayerIndex === 0
                ? "border-yellow-400"
                : "border-gray-600"
            } bg-gray-700`}
          >
            <h2 className="text-2xl font-bold mb-2">
              {players[0].name}{" "}
              {game.activePlayerIndex === 0 && "(YOUR TURN)"}
            </h2>
            <p className="text-lg">
              Lives:{" "}
              <span className="font-bold text-red-400">
                {game.players[0].lives}
              </span>
            </p>
            <p className="text-md mt-2">Items:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {game.players[0].items.length > 0 ? (
                game.players[0].items.map((item, index) => (
                  <span
                    key={index}
                    className="bg-gray-600 text-gray-200 text-sm px-2 py-1 rounded-md"
                  >
                    {item.replace(/_/g, " ")}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-sm">No items</span>
              )}
            </div>
          </div>

          {/* Player 2 (Automaton) Info */}
          <div
            className={`p-4 rounded-lg border-2 ${
              game.activePlayerIndex === 1
                ? "border-yellow-400"
                : "border-gray-600"
            } bg-gray-700`}
          >
            <h2 className="text-2xl font-bold mb-2">
              {players[1].name}{" "}
              {game.activePlayerIndex === 1 && "(AI TURN)"}
            </h2>
            <p className="text-lg">
              Lives:{" "}
              <span className="font-bold text-red-400">
                {game.players[1].lives}
              </span>
            </p>
            <p className="text-md mt-2">Items:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {game.players[1].items.length > 0 ? (
                game.players[1].items.map((item, index) => (
                  <button
                    disabled={!canStealItem || item === "adrenaline_shot"}
                    onClick={() => stealItem(item,1)}
                    key={index}
                    className={`bg-gray-600 text-gray-200 text-sm px-2 py-1 rounded-md transition-opacity ${
                      canStealItem ? 'hover:bg-gray-500 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                    }`}                  >
                    {item.replace(/_/g, " ")}
                  </button>
                ))
              ) : (
                <span className="text-gray-400 text-sm">No items</span>
              )}
            </div>
          </div>
        </div>

        {/* Shotgun Chambers Display */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Shotgun Chambers</h2>
          <div className="flex justify-center items-center gap-2 flex-wrap">
            {game.shotgunChambers
              .slice(game.currentChamberIndex)
              .map((shell, index) => (
                <div
                  key={index + game.currentChamberIndex}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-xs font-bold text-gray-900 transition-colors duration-200 ${getShellColor(shell, index + game.currentChamberIndex)}`}
                >
                  {getShellText(
                    shell,
                    index + game.currentChamberIndex
                  )}
                </div>
              ))}
          </div>
          {game.shellsRemaining === 0 && (
            <p className="text-red-400 text-lg mt-4">
              All shells used in this round!
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {game.gameState === "playing" &&
          !game.players[game.activePlayerIndex].isAI && 
            !game.players[game.activePlayerIndex].statusEffects.includes("cuffed") && (
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Your Actions</h2>
              <div className="flex justify-center gap-4 flex-wrap mb-4">
                <button
                  onClick={() => handleShoot(0)}
                  disabled={
                     game.shellsRemaining === 0
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Shoot Self
                </button>
                <button
                  onClick={() => handleShoot(1)}
                  disabled={
                    game.shellsRemaining === 0
                  }
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Shoot Dealer
                </button>
              </div>
              {game.players[game.activePlayerIndex].items.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-3">Use Item</h3>
                  <div className="flex justify-center gap-3 flex-wrap">
                    {game.players[game.activePlayerIndex].items.map((item) => (
                      <button
                        key={item}
                        onClick={() => handleUseItem(item,1)} // Default target for some items
                        className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-md shadow-sm transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {item.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {game.players[game.activePlayerIndex].isAI && (
                <p className="text-purple-400 mt-4">
                  Waiting for Automaton Enforcer's move...
                </p>
              )}
            </div>
          )}

        {/* Game Message */}
        <div className="bg-gray-700 p-4 rounded-lg text-center text-lg font-medium border border-gray-600">
          {game.gameState}
        </div>

        {/* Game Over/Round Over */}
        {game.gameState === "game_over" && (
          <div className="mt-8 text-center">
            <h2 className="text-3xl font-bold text-red-500 mb-4">GAME OVER!</h2>
            <button
              onClick={() => console.log("Restart game clicked")} // Your restart logic
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-300"
            >
              Play Again
            </button>
          </div>
        )}

        {/* Debug Info */}
        {/* Debug Log Section */}
            <div className="mt-8 pt-8 border-t border-gray-700 text-sm text-gray-400">
            <h3 className="font-semibold mb-2 text-white">Game Log</h3>
            <div className="max-h-64 overflow-y-auto space-y-1 pr-2">
                {log.map((entry, index) => (
                <p key={index} className="text-sm">
                    • {entry}
                </p>
                ))}
            </div>
            </div>

      </div>
    </div>
  );
}
export default GameUI;
