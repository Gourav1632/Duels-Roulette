import { use } from 'react';
import type { RoundConfig,GameState, Contestant, ItemType, GameStatePhase, ActionMessage } from '../utils/types';
import { TurnOrderDirection } from '../utils/types';
import { useItem } from './itemSystem';
import { shellCountMemory } from './aiLogic';


// Initialize a new game
export function initializeGame(players: Contestant[]): GameState {
  return {
    players,
    currentRound: generateRoundConfig(1),
    activePlayerIndex: Math.floor(Math.random() * players.length),
    shotgunChambers: [],
    currentChamberIndex: 0,
    shellsRemaining: 0,
    turnOrderDirection: TurnOrderDirection.Clockwise,
    gameState: 'loading',
  };
}

// Start a new round
export function startRound(game: GameState, roundNumber: number): GameState {
  const roundConfig = generateRoundConfig(roundNumber);
  if (!roundConfig) throw new Error(`Invalid round number: ${roundNumber}`);
  
  const { liveShells, blankShells, lives } = roundConfig;
  
  shellCountMemory.live = liveShells;
  shellCountMemory.blank = blankShells

  const chambers: boolean[] = [];
  for (let i = 0; i < liveShells; i++) chambers.push(true);
  for (let i = 0; i < blankShells; i++) chambers.push(false);
  shuffleArray(chambers);

  // Distribute items based on round
  const itemsPerPlayer = roundConfig.itemCount;
  const updatedPlayers = game.players.map(player => ({
    ...player,
    lives: roundConfig.lives,
    items: getRandomItems(itemsPerPlayer),
    statusEffects: [],
  }));

  return {
    ...game,
    shotgunChambers: chambers,
    currentChamberIndex: 0,
    shellsRemaining: chambers.length,
    players: updatedPlayers,
    gameState: 'playing',
    currentRound: roundConfig,
  };
}

// Play a turn
export function playTurn(game: GameState, action: { type: 'shoot' | 'use_item' | string; targetPlayerId?: string; itemType?: ItemType }):  { updatedGame: GameState, actionMessage: ActionMessage } {
  const { activePlayerIndex, players, shotgunChambers, currentChamberIndex, turnOrderDirection } = game;
  const activePlayer = players[activePlayerIndex];


  if (action.type === 'shoot') {
    const targetPlayerId = action.targetPlayerId;
    const targetPlayerIndex = players.findIndex(p => p.id === targetPlayerId);
    if (targetPlayerIndex === -1) {
      return { updatedGame: game, actionMessage: { type: 'shoot', userId: activePlayer.id, result: 'Target player not found.' } };
    }

    let updatedPlayers = [...players];
    const hasSawedOff = activePlayer.statusEffects.includes('sawed_off');

    // 1️⃣ Consume sawed_off unconditionally
    if (hasSawedOff) {
      updatedPlayers[activePlayerIndex] = {
        ...activePlayer,
        statusEffects: activePlayer.statusEffects.filter(e => e !== 'sawed_off'),
      };
    }

    const isLiveShell = shotgunChambers[currentChamberIndex];
      if (isLiveShell) {
      // Live: apply damage (2 if sawed_off was present, else 1)
      const damage = hasSawedOff ? 2 : 1;
      updatedPlayers[targetPlayerIndex] = {
        ...updatedPlayers[targetPlayerIndex],
        lives: updatedPlayers[targetPlayerIndex].lives - damage,
      };
    } else {
      // Blank shell
      if (targetPlayerIndex === activePlayerIndex) {
        // Self‑shot blank → extra turn
        const nextGame = {
          ...game,
          players: updatedPlayers,
          currentChamberIndex: (currentChamberIndex + 1) % shotgunChambers.length,
          shellsRemaining: game.shellsRemaining - 1,
        };
        return {
          updatedGame: nextGame,
          actionMessage: {
            type: 'shoot',
            userId: activePlayer.id,
            targetId: targetPlayerId,
            result: 'BLANK',
          },
        };
      }
    }
    // Pass turn to next player
    let UpdatedGame = {
      ...game,
      players: updatedPlayers,
      currentChamberIndex: (currentChamberIndex + 1) % shotgunChambers.length,
      shellsRemaining: game.shellsRemaining - 1,
      activePlayerIndex: getNextPlayerIndex(activePlayerIndex, players.length, turnOrderDirection),
    };

    if(isLiveShell){
      shellCountMemory.live--;
    }else{
      shellCountMemory.blank--;
    }

    return {
      updatedGame: UpdatedGame,
      actionMessage: {
        type: 'shoot',
        userId: activePlayer.id,
        targetId: targetPlayerId,
        result: isLiveShell ? `LIVE`:`BLANK`,
        }
    }
  } else if (action.type === 'use_item' && action.itemType) {
    // Handle item usage
    const itemType = action.itemType;
    if (!activePlayer.items.includes(itemType)) return { updatedGame: game, actionMessage: { type: 'item_used', userId: activePlayer.id, result: `Item ${itemType} not found in inventory.` } };

    let updatedGame = useItem(game, itemType, action.targetPlayerId);

    return updatedGame;
  }

  return { updatedGame: game, actionMessage: { type: 'shoot', userId: activePlayer.id, result: 'Invalid action type.' } };
}

// End a round
export function nextRound(game: GameState,roundNumber :number): GameState {
  const { players} = game;
  const nextRoundConfig = generateRoundConfig(roundNumber);
  if (!nextRoundConfig) throw new Error(`Invalid round number: ${roundNumber}`);
  if (players.length <= 1) {
    return { ...game, gameState: 'game_over' };
  }

  return {
    ...game,
    currentRound: nextRoundConfig,
    gameState: 'playing',
  };
}

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Helper function to get random items
function getRandomItems(count: number): ItemType[] {
  const allItems: ItemType[] = [
    'magnifying_scope',
    'sawed_off_kit',
    'ejector_tool',
    'restraining_cuffs',
    'first_aid_kit',
    'scout_report',
    'shell_inverter',
    'adrenaline_shot',
  ];
  const shuffled = [...allItems];
  shuffleArray(shuffled);
  return shuffled.slice(0, count);
}

// Helper function to get the next player index
export function getNextPlayerIndex(currentIndex: number, totalPlayers: number, direction: TurnOrderDirection): number {
  if (direction === TurnOrderDirection.Clockwise) {
    return (currentIndex + 1) % totalPlayers;
  } else {
    return (currentIndex - 1 + totalPlayers) % totalPlayers;
  }
}


export function generateRoundConfig(round: number): RoundConfig {
  let liveShells = 1;
  let blankShells = 1;
  let lives = 2;
  let itemCount = 0;
  let suddenDeath = false;

  if (round === 1) {
    liveShells = 1 + Math.floor(Math.random() * 2); // 1 or 2
    blankShells = 1 + Math.floor(Math.random() * 2); // 1 or 2
    lives = 2;
    itemCount = 0;
  } else if (round === 2) {
    liveShells = 2 + Math.floor(Math.random() * 2); // 2 or 3
    blankShells = 2 + Math.floor(Math.random() * 2); // 2 or 3
    lives = 4;
    itemCount = 2;
  } else if (round === 3) {
    liveShells = 3 + Math.floor(Math.random() * 2); // 3 or 4
    blankShells = 3 + Math.floor(Math.random() * 2); // 3 or 4
    lives =5;
    itemCount = 4;
    suddenDeath = true;
  } else {
    // For rounds beyond 3, continue scaling difficulty
    liveShells = 2 + Math.floor(Math.random() * 3); // 3 to 5
    blankShells = 2 + Math.floor(Math.random() * 3); // 2 to 4
    lives = 6;
    itemCount = 2 + Math.floor(round / 2);
    suddenDeath = true;
  }

  return {
    round,
    liveShells,
    blankShells,
    lives,
    itemCount,
    suddenDeath,
  };
}

export function refillChambers(game: GameState): GameState {
  const sameRoundConfig = generateRoundConfig(game.currentRound.round);
  const newChambers: boolean[] = [];

  shellCountMemory.live = sameRoundConfig.liveShells;
  shellCountMemory.blank = sameRoundConfig.blankShells;

  for (let i = 0; i < sameRoundConfig.liveShells; i++) newChambers.push(true);
  for (let i = 0; i < sameRoundConfig.blankShells; i++) newChambers.push(false);
  shuffleArray(newChambers);

  const itemsPerPlayer = sameRoundConfig.itemCount;
  const updatedPlayers = game.players.map(player => ({
    ...player,
    items: getRandomItems(itemsPerPlayer),
    statusEffects: [],
  }));

  return {
    ...game,
    players: updatedPlayers,
    shotgunChambers: newChambers,
    currentChamberIndex: 0,
    shellsRemaining: newChambers.length,
  };
}


export const skipIfCuffed = (
  game: GameState,
  player: Contestant
): { updatedGame: GameState; actionMessage: ActionMessage } | null => {
  if (player.statusEffects.includes('cuffed')) {
    const updatedPlayers = game.players.map((p, idx) =>
      idx === game.activePlayerIndex
        ? { ...p, statusEffects: p.statusEffects.filter(effect => effect !== 'cuffed') } // Remove cuff after 1 turn
        : p
    );

    const updatedGame: GameState = {
      ...game,
      players: updatedPlayers,
      activePlayerIndex: getNextPlayerIndex(
        game.activePlayerIndex,
        game.players.length,
        game.turnOrderDirection
      ),
    };

    return {
      updatedGame,
      actionMessage: {
        type: 'skip',
        userId: player.id,
        result: 'Player is cuffed and skips turn.',
      },
    };
  }

  return null; // Explicitly return null if not cuffed
};
