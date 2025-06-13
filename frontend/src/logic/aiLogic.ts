import type { GameState, Contestant, ItemType } from '../utils/types';
import { useItem } from './itemSystem';

// AI decision-making function for the Automaton Enforcer
export function automatonTakeTurn(game: GameState): GameState {
  const { players, activePlayerIndex, shotgunChambers, currentChamberIndex, gunDamageMultiplier } = game;
  const aiPlayer = players[activePlayerIndex];

  // Ensure the active player is the AI
  if (!aiPlayer.isAI) {
    throw new Error('Automaton Enforcer is not the active player');
  }

  // Calculate probability of a live shell in the current chamber
  const liveShells = shotgunChambers.filter(shell => shell).length;
  const totalShells = shotgunChambers.length;
  const pLive = liveShells / totalShells;

  // Decision-making logic
  if (pLive > 0.5 && aiPlayer.lives <= 1) {
    // High risk of live shell and AI is low on lives, prioritize survival
    if (aiPlayer.items.includes('ejector_tool')) {
      return useItem(game, 'ejector_tool');
    } else if (aiPlayer.items.includes('first_aid_kit')) {
      return useItem(game, 'first_aid_kit');
    }
  }

  // If the AI has a sawed-off kit and the opponent is low on lives, use it
  const opponent = players.find(p => !p.isAI);
  if (opponent && opponent.lives <= 2 && aiPlayer.items.includes('sawed_off_kit')) {
    return useItem(game, 'sawed_off_kit');
  }

  // If the AI has restraining cuffs, use them to prevent the opponent's turn
  if (opponent && aiPlayer.items.includes('restraining_cuffs')) {
    return useItem(game, 'restraining_cuffs', opponent.id);
  }

  // If the AI has a magnifying scope, use it to check the current chamber
  if (aiPlayer.items.includes('magnifying_scope')) {
    return useItem(game, 'magnifying_scope');
  }

  // If the AI has a scout report, use it to check a random chamber
  if (aiPlayer.items.includes('scout_report')) {
    return useItem(game, 'scout_report');
  }

  // If the AI has a shell inverter and the current chamber is likely live, invert it
  if (pLive > 0.5 && aiPlayer.items.includes('shell_inverter')) {
    return useItem(game, 'shell_inverter');
  }

  // If the AI has an adrenaline shot, use it for a potential extra turn
  if (aiPlayer.items.includes('adrenaline_shot')) {
    return useItem(game, 'adrenaline_shot');
  }

  // Default action: shoot the opponent
  if (opponent) {
    return {
      ...game,
      activePlayerIndex: (activePlayerIndex + 1) % players.length,
    };
  }

  // If no opponent, shoot self
  return {
    ...game,
    activePlayerIndex: (activePlayerIndex + 1) % players.length,
  };
} 