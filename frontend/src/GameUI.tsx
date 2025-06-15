import { useState, useEffect } from "react";
import {
  initializeGame,
  startRound,
  playTurn,
  refillChambers,
  skipIfChained
} from "./logic/gameEngine";
import type { ActionMessage, ItemType, Contestant, GameState } from "./utils/types";
import { automatonTakeTurn } from "./logic/aiLogic";

function GameUI() {
  const [players, setPlayers] = useState<Contestant[]>([]);
  const [game, setGame] = useState<GameState | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [canStealItem, setCanStealItem] = useState<boolean>(false);

  function checkDeathsAndAdvance(game: GameState, setGame: (g: GameState) => void, addLog: (msg: string) => void) {
    const deadPlayers = game.players.filter(p => p.lives <= 0);
    if (deadPlayers.length > 0) {
      const nextround = game.currentRound.round + 1;
      addLog(`☠️ Eliminated: ${deadPlayers.map(p => p.name).join(", ")}`);
      addLog(`🕯️ Round ${nextround} begins in the royal court.`);
      setGame(startRound(game, nextround));
    } else {
      setGame(game);
    }
  }

  function renderGameLogMessage(msg: ActionMessage, players: Contestant[]): string {
    const user = players.find(p => p.id === msg.userId);
    const target = msg.targetId ? players.find(p => p.id === msg.targetId) : null;

    if (msg.type === 'skip') {
      return `${user?.name} was bound by royal chains. Turn forfeited.`;
    }

    if (msg.type === 'drink') {
      if (msg.userId === msg.targetId) {
        return `${user?.name} sipped their goblet — it was ${msg.result?.toLowerCase()}.`;
      } else {
        return `${user?.name} forced ${target?.name} to drink — it was ${msg.result?.toLowerCase()}.`;
      }
    }

    if (msg.type === 'artifact_used' && msg.item) {
      switch (msg.item) {
        case 'royal_scrutiny_glass':
          return `${user?.name} examined a goblet using the Royal Scrutiny Glass — it is ${msg.result?.toLowerCase()}.`;
        case 'verdict_amplifier':
          return `${user?.name} invoked the Verdict Amplifier — the effect intensifies.`;
        case 'crown_disavowal':
          return `${user?.name} vaporized the goblet’s contents with the Crown Disavowal.`;
        case 'royal_chain_order':
          return `${user?.name} bound ${target?.name} with a Royal Chain Order.`;
        case 'sovereign_potion':
          return `${user?.name} consumed a Sovereign Potion and regained strength.`;
        case 'chronicle_ledger':
          return `${user?.name} consulted the Chronicle Ledger — the future goblet is ${msg.result?.toLowerCase()}.`;
        case 'paradox_dial':
          return `${user?.name} twisted the Paradox Dial — fate has reversed.`;
        case 'thief_tooth':
          return `${user?.name} used the Thief’s Tooth to steal an artifact from ${target?.name}.`;
        default:
          return `${user?.name} invoked an unknown artifact.`;
      }
    }

    return '⚠️ Unknown royal action.';
  }

  useEffect(() => {
    if (!game) return;

    const active = game.players[game.activePlayerIndex];

    const skipResult = skipIfChained(game, active);
    if (skipResult) {
      const { updatedGame, actionMessage } = skipResult;
      setGame(updatedGame);
      setLog(prev => [...prev, renderGameLogMessage(actionMessage, updatedGame.players)]);
      checkDeathsAndAdvance(updatedGame, setGame, msg =>
        setLog(prev => [...prev, msg])
      );
      return;
    }

    if (active.statusEffects.includes("thief")) {
      setCanStealItem(true);
    }

    if (game.gobletsRemaining === 0 && game.gameState === "playing") {
      setLog(prev => [...prev, "🔁 Goblets have been emptied. Refilling with new fate..."]);
      setGame(refillChambers(game));
      return;
    }

    if (
      game.gameState === "playing" &&
      active.isAI &&
      game.gobletsRemaining > 0
    ) {
      setLog(prev => [...prev, "🤖 The Court Automaton is deciding its move..."]);

      setTimeout(() => {
        const { updatedGame, actionMessage } = automatonTakeTurn(game);

        setLog(prev => [
          ...prev,
          renderGameLogMessage(actionMessage, updatedGame.players),
          ...(updatedGame.gameState === "round_over"
            ? [`📜 Round ${updatedGame.currentRound.round} concludes.`]
            : []),
          ...(updatedGame.gameState === "game_over" ? ["🏁 The Court has spoken. Game Over."] : [])
        ]);

        setGame(updatedGame);
        checkDeathsAndAdvance(updatedGame, setGame, msg =>
          setLog(prev => [...prev, msg])
        );
      }, 1000);
    }
  }, [game]);

  useEffect(() => {
    const humanPlayer: Contestant = {
      id: "human",
      name: "You, The Accused",
      lives: 3,
      items: [],
      isAI: false,
      isOnline: true,
      statusEffects: [],
    };

    const automatonPlayer: Contestant = {
      id: "automaton",
      name: "Court Automaton",
      lives: 3,
      items: [],
      isAI: true,
      isOnline: false,
      statusEffects: [],
    };

    const gamePlayers = [humanPlayer, automatonPlayer];
    setPlayers(gamePlayers);

    const initialized = initializeGame(gamePlayers);
    const started = startRound(initialized, 2);
    setGame(started);

    const poisonGoblets = started.goblets.filter(Boolean).length;
    const holyGoblets = started.goblets.filter((s:boolean) => !s).length;

    const logMessages = [
      '🏰 The King’s Court has assembled.',
      `📜 Round ${started.currentRound.round} begins with ${poisonGoblets} poisonous and ${holyGoblets} holy goblets.`
    ];

    const active = started.players[started.activePlayerIndex];
    if (!active.isAI) {
      logMessages.push("🫵 It is your turn, noble accused.");
    }
    setLog(logMessages);
  }, []);

  const getGobletText = (goblet: boolean | null): string => {
    if (goblet === true) return "☠️ Poisonous";
    if (goblet === false) return "✨ Holy";
    return "❓ Unknown";
  };

  const handleDrink = (targetIndex: number) => {
    if (!game || game.gameState !== "playing") return;

    const targetPlayer = game.players[targetIndex];
    const action = {
      type: "drink",
      targetPlayerId: targetPlayer.id,
    };

    const { updatedGame, actionMessage } = playTurn(game, action);
    setLog(prev => [...prev, renderGameLogMessage(actionMessage, updatedGame.players)]);
    setGame(updatedGame);

    checkDeathsAndAdvance(updatedGame, setGame, msg =>
      setLog(prev => [...prev, msg])
    );

    if (updatedGame.gameState === "round_over") {
      setLog(prev => [...prev, `📜 Round ${updatedGame.currentRound.round} ends.`]);
    } else if (updatedGame.gameState === "game_over") {
      setLog(prev => [...prev, "🏁 Justice has been served."]);
    }
  };

  const handleUseItem = (item: ItemType, targetIndex: number) => {
    if (!game || game.gameState !== "playing") return;
    const targetPlayer = game.players[targetIndex];
    const action = {
      type: "use_item",
      itemType: item,
      targetPlayerId: targetPlayer.id,
    };

    const { updatedGame, actionMessage } = playTurn(game, action);
    setLog(prev => [
      ...prev,
      `📦 You used ${item.replace(/_/g, " ")}.`,
      renderGameLogMessage(actionMessage, updatedGame.players)
    ]);
    setGame(updatedGame);
  };

  const stealItem = (item: ItemType, targetIndex: number) => {
    const currentGame = structuredClone(game);
    if(!currentGame) return;
    const activePlayer = currentGame.players[currentGame.activePlayerIndex];
    const targetPlayer = currentGame.players[targetIndex];

    const itemIndex = targetPlayer.items.indexOf(item);
    if (itemIndex === -1) return;

    targetPlayer.items.splice(itemIndex, 1);
    activePlayer.items.push(item);

    const action = {
      type: "use_item",
      itemType: item,
      targetPlayerId: targetPlayer.id,
    };

    const { updatedGame, actionMessage } = playTurn(currentGame, action);
    setLog(prev => [...prev, renderGameLogMessage(actionMessage, updatedGame.players)]);
    setGame(updatedGame);
    setCanStealItem(false);
  };




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
            Shells Remaining: {game.gobletsRemaining}
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
                game.players[0].items.map((item:ItemType, index:number) => (
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
                game.players[1].items.map((item:ItemType, index:number) => (
                  <button
                    disabled={!canStealItem || item === "thief_tooth"}
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
            {game.goblets
              .slice(game.currentGobletIndex)
              .map((goblet:boolean, index:number) => (
                <div
                  key={index + game.currentGobletIndex}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-xs font-bold text-gray-900 transition-colors duration-200 `}
                >
                  {getGobletText(
                    goblet
                  )}
                </div>
              ))}
          </div>
          {game.gobletsRemaining === 0 && (
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
                  onClick={() => handleDrink(0)}
                  disabled={
                     game.gobletsRemaining === 0
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Shoot Self
                </button>
                <button
                  onClick={() => handleDrink(1)}
                  disabled={
                    game.gobletsRemaining === 0
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
                    {game.players[game.activePlayerIndex].items.map((item:ItemType) => (
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
