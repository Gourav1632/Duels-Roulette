  import type { GameState, ItemType, ActionMessage } from '../utils/types';
  import {  shellCountMemory, shellMemory } from './aiLogic';

  // Magnifying Scope: Reveals the type (Live/Blank) of the current chamber
 export function useMagnifyingScope(game: GameState) {
  const { shotgunChambers, currentChamberIndex } = game;
  const isLiveShell = shotgunChambers[currentChamberIndex];
  if(game.players[game.activePlayerIndex].isAI) {
    shellMemory[currentChamberIndex] = isLiveShell?'live':'blank'; // Store the shell type in memory
  }
  const actionMessage: ActionMessage = {
    type: 'item_used',
    item: 'magnifying_scope',
    userId: game.players[game.activePlayerIndex].id,
    result: isLiveShell ? 'LIVE' : 'BLANK',
    };
  return { updatedGame: game, actionMessage: actionMessage};
}


  // Sawed-Off Kit: Increases gunDamageMultiplier to 2 for the next successful Live Shell shot
export function useSawedOffKit(game: GameState) {
  const {players, activePlayerIndex} = game;
    const updatedPlayer = {
    ...players[activePlayerIndex],
    statusEffects: [...players[activePlayerIndex].statusEffects, 'sawed_off'],
  };
  const updatedPlayers = [...players];
  updatedPlayers[activePlayerIndex] = updatedPlayer;
  const updatedGame = { ...game, players: updatedPlayers };
  
  const actionMessage: ActionMessage = {
    type: 'item_used',
    item: 'sawed_off_kit',
    userId: game.players[game.activePlayerIndex].id,
    result: 'SAWED_OFF',
  };
  return { updatedGame, actionMessage: actionMessage};
}


  // Ejector Tool: Ejects the shell at currentChamberIndex
export function useEjectorTool(game: GameState) {
  const { shotgunChambers, currentChamberIndex, shellsRemaining } = game;
  const updatedChambers = [...shotgunChambers];
  const removedShell = updatedChambers.splice(currentChamberIndex, 1)[0];
  const updatedGame = {
    ...game,
    shotgunChambers: updatedChambers,
    shellsRemaining: shellsRemaining - 1,
  };
  if(removedShell){
    shellCountMemory.live--;
  }else{
    shellCountMemory.blank--;
  }
  const actionMessage: ActionMessage = {
    type: 'item_used',
    item: 'ejector_tool',
    userId: game.players[game.activePlayerIndex].id,
    result: `${removedShell ? 'LIVE' : 'BLANK'}`,
  };
  return { updatedGame, actionMessage: actionMessage};
}


  // Restraining Cuffs: Prevents target opponent from taking their next turn
export function useRestrainingCuffs(game: GameState, targetPlayerId: string) {
  const updatedPlayers = game.players.map(player =>
    player.id === targetPlayerId
      ? { ...player, statusEffects: [...player.statusEffects, 'cuffed'] }
      : player
  );
  const updatedGame = { ...game, players: updatedPlayers };
  const actionMessage: ActionMessage = {
    type: 'item_used',
    item: 'restraining_cuffs',
    userId: game.players[game.activePlayerIndex].id,
    targetId: targetPlayerId,
    result: 'CUFFED',
  };
  return { updatedGame, actionMessage: actionMessage};
}


  // First-Aid Kit: Restores 1 life to the active player
export function useFirstAidKit(game: GameState) {
  const { players, activePlayerIndex } = game;
  const updatedPlayers = [...players];
  updatedPlayers[activePlayerIndex] = {
    ...updatedPlayers[activePlayerIndex],
    lives: updatedPlayers[activePlayerIndex].lives + 1,
  };
  const updatedGame = { ...game, players: updatedPlayers };
  const actionMessage: ActionMessage = {
    type: 'item_used',
    item: 'first_aid_kit',
    userId: game.players[game.activePlayerIndex].id,
    result: 'HEALED',
  };

  return { updatedGame, actionMessage: actionMessage};
}


  // Scout Report: Reveals the type (Live/Blank) of a random non-current shell
export function useScoutReport(game: GameState) {
  const { shotgunChambers, currentChamberIndex } = game;
  const availableIndices = shotgunChambers
    .map((_, index) => index)
    .filter(index => index !== currentChamberIndex);
  const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  const isLiveShell = shotgunChambers[randomIndex];
  if(game.players[game.activePlayerIndex].isAI) {
    shellMemory[randomIndex] = isLiveShell ? 'live' : 'blank'; // Store the shell type in memory
  }
  const actionMessage: ActionMessage = {
    type: 'item_used',
    item: 'scout_report',
    userId: game.players[game.activePlayerIndex].id,
    result: `${isLiveShell ? 'LIVE' : 'BLANK'}:${randomIndex}`,
  };
  
  return { updatedGame: game, actionMessage: actionMessage};
}


  // Shell Inverter: Flips the type of the current chamber (Live becomes Blank, Blank becomes Live)
export function useShellInverter(game: GameState) {
  const { shotgunChambers, currentChamberIndex } = game;
  const updatedChambers = [...shotgunChambers];
  updatedChambers[currentChamberIndex] = !updatedChambers[currentChamberIndex];
  const updatedGame = { ...game, shotgunChambers: updatedChambers };
  const actionMessage: ActionMessage = {
    type: 'item_used',
    item: 'shell_inverter',
    userId: game.players[game.activePlayerIndex].id,
    result: `${updatedChambers[currentChamberIndex] ? 'LIVE' : 'BLANK'}:INVERTED`,
  };
  return { updatedGame, actionMessage: actionMessage};
}


  // Adrenaline Shot: If the next shot is a Blank Shell and you shoot yourself, you get to choose whether to take another action or pass the turn
export function useAdrenalineShot(game: GameState) {
  const { players, activePlayerIndex } = game;
  const updatedPlayers = [...players];
  updatedPlayers[activePlayerIndex] = {
    ...updatedPlayers[activePlayerIndex],
    statusEffects: [...updatedPlayers[activePlayerIndex].statusEffects, 'adrenaline'],
  };
  const updatedGame = { ...game, players: updatedPlayers };
  const actionMessage: ActionMessage = {
    type: 'item_used',
    item: 'adrenaline_shot',
    userId: game.players[activePlayerIndex].id,
    result: 'ADRENALINE',
  };
  return { updatedGame, actionMessage: actionMessage};
}


  // Generic function to use an item
  export function useItem(game: GameState, itemType: ItemType, targetPlayerId?: string):{updatedGame : GameState, actionMessage: ActionMessage} {
    // remove the used item from the player's inventory
    const activePlayer = game.players[game.activePlayerIndex];
    if (!activePlayer.items.includes(itemType)) {
      throw new Error(`Item ${itemType} not available or already used this turn`);
    }
    // Remove only one instance of the item
      const itemIndex = activePlayer.items.findIndex(item => item === itemType);
      if (itemIndex === -1) {
        throw new Error(`Item ${itemType} not found in inventory`);
      }
      const updatedItems = [
        ...activePlayer.items.slice(0, itemIndex),
        ...activePlayer.items.slice(itemIndex + 1)
      ];

    const updatedPlayer = { ...activePlayer, items: updatedItems};
    const updatedPlayers = [...game.players];
    updatedPlayers[game.activePlayerIndex] = updatedPlayer;
    const updatedGame = { ...game, players: updatedPlayers };
    switch (itemType) {
      case 'magnifying_scope':
        return useMagnifyingScope(updatedGame);
      case 'sawed_off_kit':
        return useSawedOffKit(updatedGame);
      case 'ejector_tool':
        return useEjectorTool(updatedGame);
      case 'restraining_cuffs':
        if (!targetPlayerId) throw new Error('Target player ID required for restraining cuffs');
        return useRestrainingCuffs(updatedGame, targetPlayerId);
      case 'first_aid_kit':
        return useFirstAidKit(updatedGame);
      case 'scout_report':
        return useScoutReport(updatedGame);
      case 'shell_inverter':
        return useShellInverter(updatedGame);
      case 'adrenaline_shot':
        return useAdrenalineShot(updatedGame);
      default:
        throw new Error(`Unknown item type: ${itemType}`);
    }
  } 