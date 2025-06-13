import type { GameState, Contestant, ItemType, GameStatePhase } from '../utils/types';
import { TurnOrderDirection } from '../utils/types';

// Initialize a new game
export function initializeGame(players: Contestant[]): GameState {
  return {
    players,
    currentRound: 1,
    activePlayerIndex: Math.floor(Math.random() * players.length),
    automatonLives: null,
    shotgunChambers: [],
    currentChamberIndex: 0,
    shellsRemaining: 0,
    turnOrderDirection: TurnOrderDirection.Clockwise,
    gunDamageMultiplier: 1,
    gameState: 'loading',
  };
}

// Start a new round
export function startRound(game: GameState): GameState {
  const { currentRound } = game;
  let liveShells: number;
  let blankShells: number;

  // Determine shells based on round
  switch (currentRound) {
    case 1:
      liveShells = 1;
      blankShells = 1;
      break;
    case 2:
      liveShells = 2;
      blankShells = 2;
      break;
    case 3:
      liveShells = 3;
      blankShells = 2;
      break;
    default:
      liveShells = 1;
      blankShells = 1;
  }

  // Load shotgun chambers
  const chambers: boolean[] = [];
  for (let i = 0; i < liveShells; i++) chambers.push(true);
  for (let i = 0; i < blankShells; i++) chambers.push(false);
  shuffleArray(chambers);

  // Distribute items based on round
  const itemsPerPlayer = currentRound === 1 ? 0 : currentRound === 2 ? 2 : 4;
  const updatedPlayers = game.players.map(player => ({
    ...player,
    items: getRandomItems(itemsPerPlayer),
    hasUsedItemThisTurn: false,
    statusEffects: [],
  }));

  return {
    ...game,
    shotgunChambers: chambers,
    currentChamberIndex: 0,
    shellsRemaining: chambers.length,
    players: updatedPlayers,
    gameState: 'playing',
  };
}

// Play a turn
export function playTurn(game: GameState, action: { type: 'shoot' | 'use_item'; targetPlayerId?: string; itemType?: ItemType }): GameState {
  const { activePlayerIndex, players, shotgunChambers, currentChamberIndex, gunDamageMultiplier, turnOrderDirection } = game;
  const activePlayer = players[activePlayerIndex];

  if (action.type === 'shoot') {
    const targetPlayerId = action.targetPlayerId;
    const targetPlayer = players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) return game;

    const isLiveShell = shotgunChambers[currentChamberIndex];
    if (isLiveShell) {
      targetPlayer.lives -= gunDamageMultiplier;
      if (targetPlayer.lives <= 0) {
        // Eliminate player
        const updatedPlayers = players.filter(p => p.id !== targetPlayerId);
        return {
          ...game,
          players: updatedPlayers,
          gunDamageMultiplier: 1,
          currentChamberIndex: (currentChamberIndex + 1) % shotgunChambers.length,
          shellsRemaining: game.shellsRemaining - 1,
          activePlayerIndex: getNextPlayerIndex(activePlayerIndex, updatedPlayers.length, turnOrderDirection),
        };
      }
    } else {
      // Blank shell
      if (targetPlayerId === activePlayer.id) {
        // Self-shot with blank, player gets another turn
        return {
          ...game,
          currentChamberIndex: (currentChamberIndex + 1) % shotgunChambers.length,
          shellsRemaining: game.shellsRemaining - 1,
        };
      }
    }
    // Pass turn to next player
    return {
      ...game,
      currentChamberIndex: (currentChamberIndex + 1) % shotgunChambers.length,
      shellsRemaining: game.shellsRemaining - 1,
      activePlayerIndex: getNextPlayerIndex(activePlayerIndex, players.length, turnOrderDirection),
    };
  } else if (action.type === 'use_item' && action.itemType) {
    // Handle item usage
    const itemType = action.itemType;
    if (!activePlayer.items.includes(itemType) || activePlayer.hasUsedItemThisTurn) return game;

    // Remove item and mark as used
    const updatedItems = activePlayer.items.filter(item => item !== itemType);
    const updatedPlayer = { ...activePlayer, items: updatedItems, hasUsedItemThisTurn: true };
    const updatedPlayers = [...players];
    updatedPlayers[activePlayerIndex] = updatedPlayer;

    // Apply item effect (placeholder)
    // TODO: Implement item effects

    // Pass turn to next player
    return {
      ...game,
      players: updatedPlayers,
      activePlayerIndex: getNextPlayerIndex(activePlayerIndex, players.length, turnOrderDirection),
    };
  }

  return game;
}

// End a round
export function endRound(game: GameState): GameState {
  const { players, currentRound } = game;
  if (players.length <= 1) {
    return { ...game, gameState: 'game_over' };
  }

  return {
    ...game,
    currentRound: currentRound + 1,
    gameState: 'loading',
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
function getNextPlayerIndex(currentIndex: number, totalPlayers: number, direction: TurnOrderDirection): number {
  if (direction === TurnOrderDirection.Clockwise) {
    return (currentIndex + 1) % totalPlayers;
  } else {
    return (currentIndex - 1 + totalPlayers) % totalPlayers;
  }
}
