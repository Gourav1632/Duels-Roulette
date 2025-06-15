import type { GameState, ItemType, ActionMessage } from '../utils/types';
import { gobletCountMemory, gobletMemory } from './aiLogic';

// Royal Scrutiny Glass: Reveals the type (Poisonous/Holy) of the current goblet
export function RoyalScrutinyGlass(game: GameState) {
  const { goblets, currentGobletIndex } = game;
  const isPoisonous = goblets[currentGobletIndex];
  if (game.players[game.activePlayerIndex].isAI) {
    gobletMemory[currentGobletIndex] = isPoisonous ? 'poisonous' : 'holy';
  }
  const actionMessage: ActionMessage = {
    type: 'artifact_used',
    item: 'royal_scrutiny_glass',
    userId: game.players[game.activePlayerIndex].id,
    result: isPoisonous ? 'POISONOUS' : 'HOLY',
  };
  return { updatedGame: game, actionMessage };
}

// Verdict Amplifier: Doubles the effect of the next poisonous/holy goblet
export function VerdictAmplifier(game: GameState) {
  const { players, activePlayerIndex } = game;
  const updatedPlayer = {
    ...players[activePlayerIndex],
    statusEffects: [...players[activePlayerIndex].statusEffects, 'amplified'],
  };
  const updatedPlayers = [...players];
  updatedPlayers[activePlayerIndex] = updatedPlayer;
  const updatedGame = { ...game, players: updatedPlayers };

  const actionMessage: ActionMessage = {
    type: 'artifact_used',
    item: 'verdict_amplifier',
    userId: game.players[activePlayerIndex].id,
    result: 'AMPLIFIED',
  };
  return { updatedGame, actionMessage };
}

// Crown Disavowal: Removes the current goblet
export function CrownDisavowal(game: GameState) {
  const { goblets, currentGobletIndex, gobletsRemaining } = game;
  const updatedGoblets = [...goblets];
  const removedGoblet = updatedGoblets.splice(currentGobletIndex, 1)[0];
  const updatedGame = {
    ...game,
    goblets: updatedGoblets,
    gobletsRemaining: gobletsRemaining - 1,
  };
  if (removedGoblet) {
    gobletCountMemory.poisonousGoblets--; // poison
  } else {
    gobletCountMemory.holyGoblets--; // holy
  }
  const actionMessage: ActionMessage = {
    type: 'artifact_used',
    item: 'crown_disavowal',
    userId: game.players[game.activePlayerIndex].id,
    result: removedGoblet ? 'POISONOUS' : 'HOLY',
  };
  return { updatedGame, actionMessage };
}

// Royal Chain Order: Cuffs the target player
export function RoyalChainOrder(game: GameState, targetPlayerId: string) {
  const updatedPlayers = game.players.map(player =>
    player.id === targetPlayerId
      ? { ...player, statusEffects: [...player.statusEffects, 'chained'] }
      : player
  );
  const updatedGame = { ...game, players: updatedPlayers };
  const actionMessage: ActionMessage = {
    type: 'artifact_used',
    item: 'royal_chain_order',
    userId: game.players[game.activePlayerIndex].id,
    targetId: targetPlayerId,
    result: 'CHAINED',
  };
  return { updatedGame, actionMessage };
}

// Sovereign Potion: Heals 1 life
export function SovereignPotion(game: GameState) {
  const { players, activePlayerIndex } = game;
  const updatedPlayers = [...players];
  updatedPlayers[activePlayerIndex] = {
    ...updatedPlayers[activePlayerIndex],
    lives: updatedPlayers[activePlayerIndex].lives + 1,
  };
  const updatedGame = { ...game, players: updatedPlayers };
  const actionMessage: ActionMessage = {
    type: 'artifact_used',
    item: 'sovereign_potion',
    userId: game.players[activePlayerIndex].id,
    result: 'HEALED',
  };
  return { updatedGame, actionMessage };
}

// Chronicle Ledger: Peeks at any random non-current goblet
export function ChronicleLedger(game: GameState) {
  const { goblets, currentGobletIndex } = game;
  const availableIndices = goblets
    .map((_, i) => i)
    .filter(i => i !== currentGobletIndex);
  const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  const isPoisonous = goblets[randomIndex];
  if (game.players[game.activePlayerIndex].isAI) {
    gobletMemory[randomIndex] = isPoisonous ? 'poisonous' : 'holy';
  }
  const actionMessage: ActionMessage = {
    type: 'artifact_used',
    item: 'chronicle_ledger',
    userId: game.players[game.activePlayerIndex].id,
    result: `${isPoisonous ? 'POISONOUS' : 'HOLY'}:${randomIndex}`,
  };
  return { updatedGame: game, actionMessage };
}

// Paradox Dial: Flips current goblet’s type
export function ParadoxDial(game: GameState) {
  const { goblets, currentGobletIndex } = game;
  const updatedGoblets = [...goblets];
  updatedGoblets[currentGobletIndex] = !updatedGoblets[currentGobletIndex];
  const updatedGame = { ...game, goblets: updatedGoblets };
  const actionMessage: ActionMessage = {
    type: 'artifact_used',
    item: 'paradox_dial',
    userId: game.players[game.activePlayerIndex].id,
    result: `${updatedGoblets[currentGobletIndex] ? 'POISONOUS' : 'HOLY'}:INVERTED`,
  };
  return { updatedGame, actionMessage };
}

// Thief Tooth: Steals a random item from target player
export function ThiefTooth(game: GameState, targetPlayerId: string) {
  const { players, activePlayerIndex } = game;
  const thief = players[activePlayerIndex];
  const targetIndex = players.findIndex(p => p.id === targetPlayerId);
  const target = players[targetIndex];

  if (!target.items.length) {
    const actionMessage: ActionMessage = {
      type: 'artifact_used',
      item: 'thief_tooth',
      userId: thief.id,
      targetId: target.id,
      result: 'FAILED_NO_ITEMS',
    };
    return { updatedGame: game, actionMessage };
  }

  const stolenIndex = Math.floor(Math.random() * target.items.length);
  const stolenItem = target.items[stolenIndex];

  const updatedTarget = {
    ...target,
    items: [...target.items.slice(0, stolenIndex), ...target.items.slice(stolenIndex + 1)],
  };

  const updatedThief = {
    ...thief,
    items: [...thief.items, stolenItem],
  };

  const updatedPlayers = [...players];
  updatedPlayers[activePlayerIndex] = updatedThief;
  updatedPlayers[targetIndex] = updatedTarget;

  const updatedGame = { ...game, players: updatedPlayers };
  const actionMessage: ActionMessage = {
    type: 'artifact_used',
    item: 'thief_tooth',
    userId: thief.id,
    targetId: target.id,
    result: `STOLEN:${stolenItem}`,
  };
  return { updatedGame, actionMessage };
}

// Generic item handler
export function Item(game: GameState, itemType: ItemType, targetPlayerId?: string): { updatedGame: GameState, actionMessage: ActionMessage } {
  const activePlayer = game.players[game.activePlayerIndex];
  if (!activePlayer.items.includes(itemType)) {
    throw new Error(`Item ${itemType} not available or already used this turn`);
  }
  const itemIndex = activePlayer.items.findIndex(item => item === itemType);
  const updatedItems = [...activePlayer.items.slice(0, itemIndex), ...activePlayer.items.slice(itemIndex + 1)];
  const updatedPlayer = { ...activePlayer, items: updatedItems };
  const updatedPlayers = [...game.players];
  updatedPlayers[game.activePlayerIndex] = updatedPlayer;
  const updatedGame = { ...game, players: updatedPlayers };

  switch (itemType) {
    case 'royal_scrutiny_glass': return RoyalScrutinyGlass(updatedGame);
    case 'verdict_amplifier': return VerdictAmplifier(updatedGame);
    case 'crown_disavowal': return CrownDisavowal(updatedGame);
    case 'royal_chain_order':
      if (!targetPlayerId) throw new Error('Target required for royal_chain_order');
      return RoyalChainOrder(updatedGame, targetPlayerId);
    case 'sovereign_potion': return SovereignPotion(updatedGame);
    case 'chronicle_ledger': return ChronicleLedger(updatedGame);
    case 'paradox_dial': return ParadoxDial(updatedGame);
    case 'thief_tooth':
      if (!targetPlayerId) throw new Error('Target required for thief_tooth');
      return ThiefTooth(updatedGame, targetPlayerId);
    default: throw new Error(`Unknown item: ${itemType}`);
  }
}
