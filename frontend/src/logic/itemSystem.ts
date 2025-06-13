import type { GameState, ItemType } from '../utils/types';

// Magnifying Scope: Reveals the type (Live/Blank) of the current chamber
export function useMagnifyingScope(game: GameState): GameState {
  const { shotgunChambers, currentChamberIndex } = game;
  const isLiveShell = shotgunChambers[currentChamberIndex];
  console.log(`Current chamber is a ${isLiveShell ? 'Live' : 'Blank'} shell.`);
  return game; // No state change, just reveals info
}

// Sawed-Off Kit: Increases gunDamageMultiplier to 2 for the next successful Live Shell shot
export function useSawedOffKit(game: GameState): GameState {
  return { ...game, gunDamageMultiplier: 2 };
}

// Ejector Tool: Ejects the shell at currentChamberIndex
export function useEjectorTool(game: GameState): GameState {
  const { shotgunChambers, currentChamberIndex, shellsRemaining } = game;
  const updatedChambers = [...shotgunChambers];
  updatedChambers.splice(currentChamberIndex, 1);
  return {
    ...game,
    shotgunChambers: updatedChambers,
    shellsRemaining: shellsRemaining - 1,
  };
}

// Restraining Cuffs: Prevents target opponent from taking their next turn
export function useRestrainingCuffs(game: GameState, targetPlayerId: string): GameState {
  const { players } = game;
  const updatedPlayers = players.map(player => {
    if (player.id === targetPlayerId) {
      return { ...player, statusEffects: [...player.statusEffects, 'cuffed'] };
    }
    return player;
  });
  return { ...game, players: updatedPlayers };
}

// First-Aid Kit: Restores 1 life to the active player
export function useFirstAidKit(game: GameState): GameState {
  const { players, activePlayerIndex } = game;
  const updatedPlayers = [...players];
  updatedPlayers[activePlayerIndex] = {
    ...updatedPlayers[activePlayerIndex],
    lives: updatedPlayers[activePlayerIndex].lives + 1,
  };
  return { ...game, players: updatedPlayers };
}

// Scout Report: Reveals the type (Live/Blank) of a random non-current shell
export function useScoutReport(game: GameState): GameState {
  const { shotgunChambers, currentChamberIndex } = game;
  const availableIndices = shotgunChambers
    .map((_, index) => index)
    .filter(index => index !== currentChamberIndex);
  const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  const isLiveShell = shotgunChambers[randomIndex];
  console.log(`Random chamber ${randomIndex} is a ${isLiveShell ? 'Live' : 'Blank'} shell.`);
  return game; // No state change, just reveals info
}

// Shell Inverter: Flips the type of the current chamber (Live becomes Blank, Blank becomes Live)
export function useShellInverter(game: GameState): GameState {
  const { shotgunChambers, currentChamberIndex } = game;
  const updatedChambers = [...shotgunChambers];
  updatedChambers[currentChamberIndex] = !updatedChambers[currentChamberIndex];
  return { ...game, shotgunChambers: updatedChambers };
}

// Adrenaline Shot: If the next shot is a Blank Shell and you shoot yourself, you get to choose whether to take another action or pass the turn
export function useAdrenalineShot(game: GameState): GameState {
  const { players, activePlayerIndex } = game;
  const updatedPlayers = [...players];
  updatedPlayers[activePlayerIndex] = {
    ...updatedPlayers[activePlayerIndex],
    statusEffects: [...updatedPlayers[activePlayerIndex].statusEffects, 'adrenaline'],
  };
  return { ...game, players: updatedPlayers };
}

// Generic function to use an item
export function useItem(game: GameState, itemType: ItemType, targetPlayerId?: string): GameState {
  switch (itemType) {
    case 'magnifying_scope':
      return useMagnifyingScope(game);
    case 'sawed_off_kit':
      return useSawedOffKit(game);
    case 'ejector_tool':
      return useEjectorTool(game);
    case 'restraining_cuffs':
      if (!targetPlayerId) throw new Error('Target player ID required for restraining cuffs');
      return useRestrainingCuffs(game, targetPlayerId);
    case 'first_aid_kit':
      return useFirstAidKit(game);
    case 'scout_report':
      return useScoutReport(game);
    case 'shell_inverter':
      return useShellInverter(game);
    case 'adrenaline_shot':
      return useAdrenalineShot(game);
    default:
      throw new Error(`Unknown item type: ${itemType}`);
  }
} 