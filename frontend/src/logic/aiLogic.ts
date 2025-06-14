import type { GameState, ItemType, ActionMessage, Contestant } from '../utils/types';
import { getNextPlayerIndex, playTurn, skipIfCuffed } from './gameEngine'; // Assuming this function exists and works as before


export const shellMemory: Record<number, 'live' | 'blank'> = {};
export const shellCountMemory = {
  live: 0,
  blank: 0
};

/**
 * Defines the possible actions an AI can take.
 * This is consistent with your original Action type.
 */
type Action =
  | { type: 'use_item'; itemType: ItemType; targetPlayerId?: string }
  | { type: 'shoot'; targetPlayerId?: string };

/**
 * Calculates a score for a given action based on the current game state.
 * This is the core of the intelligent decision-making.
 * Higher scores indicate more desirable actions.
 */
function calculateActionScore(
  game: GameState,
  action: Action,
  aiPlayer: Contestant,
  opponent: Contestant | undefined,
  pLive: number
): number {
  let score = 0;

  // Base score for simply taking a turn (avoiding doing nothing)
  score += 1;

  switch (action.type) {
    case 'use_item':
      // Assign scores based on item utility and current game context
      switch (action.itemType) {
        case 'first_aid_kit':
          // High priority if AI lives are very low
          if (aiPlayer.lives <= 1) {
            score += 1000; // Very high priority to survive
          } else if (aiPlayer.lives === 2) {
            score += 500;
          } else {
            score += 50; // Still good to heal, but not critical
          }
          break;

        case 'ejector_tool':
          // Very high priority if pLive is high and AI is at risk
          if (pLive > 0.6 && aiPlayer.lives <= 1) {
            score += 900; // Critical to remove live shell when AI is vulnerable
          } else if (pLive > 0.5) {
            score += 400; // Good to reduce risk
          } else {
            score += 50; // Less useful if pLive is low
          }
          break;

        case 'sawed_off_kit':
          // High priority if opponent is vulnerable or to set up a win
          if (opponent && opponent.lives <= 2) {
            score += 800; // Can set up a quick win
          } else if (opponent) {
            score += 300; // Good for general offensive pressure
          }
          break;

        case 'restraining_cuffs':
          // Good for control, especially if opponent has items or is about to act
          if (opponent && opponent.lives > 0) { // Only if opponent is still alive
             // Give a higher score if opponent has more items (e.g., to prevent their strong plays)
             const opponentItemCount = opponent.items.length;
             score += 500 + (opponentItemCount * 50);
          }
          break;

        case 'magnifying_scope':
          // High priority if current shell uncertainty is high (pLive is not 0 or 1)
          // And AI doesn't already know the next shell type
          if (pLive > 0 && pLive < 1) { // If there's uncertainty
            score += 600; // Information is valuable
          } else {
            score += 10; // Less valuable if shell is already known
          }
          break;

        case 'scout_report':
          // Similar to magnifying scope, provides info. Higher value if opponent has many items.
          if (opponent) {
            score += 550 + (opponent.items.length * 20); // Info about opponent's hand is useful
          } else {
            score += 50; // Less useful in a hypothetical solo game state
          }
          break;

        case 'shell_inverter':
          // Very high priority if pLive is high and you want to make it blank
          // Or if pLive is low and you want to make it live for a kill
          if (pLive > 0.6 && aiPlayer.lives <= 2) { // Make live shell blank for safety
            score += 700;
          } else if (pLive < 0.4 && opponent && opponent.lives <= 2) { // Make blank shell live for kill
            score += 650;
          } else {
            score += 100; // General utility
          }
          break;

        case 'adrenaline_shot':
          // NEW LOGIC: Steals an item from opponent and uses it immediately.
          // The value of this action depends on the value of the item that can be stolen.
          score = 50; // Base score for Adrenaline Shot itself

          if (opponent && opponent.items.length > 0) {
            let maxStolenItemScore = 0;
            // Iterate through opponent's items to see which one would be most valuable to steal and use
            for (const stolenItem of opponent.items) {
                if (stolenItem === 'adrenaline_shot') continue;
                // Create a hypothetical action for the stolen item to evaluate its score
                const hypotheticalStolenAction: Action = { type: 'use_item', itemType: stolenItem, targetPlayerId: opponent.id };

                // Recursively call calculateActionScore for the hypothetical stolen item.
                // This will give us the estimated value of using that specific item.
                const currentHypotheticalScore = calculateActionScore(game, hypotheticalStolenAction, aiPlayer, opponent, pLive);

                maxStolenItemScore = Math.max(maxStolenItemScore, currentHypotheticalScore);
            }
            score += maxStolenItemScore; // Add the value of the best potential stolen item
          } else {
            // If opponent has no items, Adrenaline Shot is effectively useless for its primary effect.
            score -= 200; // Penalize severely if there's nothing to steal
          }
          break;

        default:
          score += 10; // Base score for other unknown items
          break;
      }
      break;

    case 'shoot':
      const target = action.targetPlayerId;

      // Shooting Opponent
      if (target === opponent?.id && opponent) {
        // High score if it's a guaranteed hit and can win the game
        if (pLive === 1 && opponent.lives === 1) {
          score += 2000; // Immediate game win
        }
        // High score if it's a likely hit and can win the game
        else if (pLive >= 0.7 && opponent.lives === 1) {
          score += 1800;
        }
        // Good if it's a likely hit and deals damage
        else if (pLive >= 0.5) {
          score += 500 * pLive; // Scale by probability of hitting
        }
        // Low score if it's a low chance hit, but still an option
        else {
          score += 100 * pLive;
        }
        // Penalize if opponent is invulnerable (e.g., due to an item) - not implemented in current types, but good for future
        // if (opponent.isInvulnerable) score -= 1000;

      }
      // Shooting Self
      else if (target === aiPlayer.id) {
        // Very high score if it's a guaranteed blank and AI needs an extra turn/info
        if (pLive === 0) {
          score += 700; // Guaranteed blank, safe info/extra turn
        }
        // Good if it's a likely blank and AI has enough lives to risk
        else if (pLive < 0.3 && aiPlayer.lives > 1) {
          score += 300 * (1 - pLive); // Scale by probability of blank
        }
        // Penalize if it's a likely live shell and AI is vulnerable
        else if (pLive >= 0.5 && aiPlayer.lives <= 1) {
          score -= 1500; // Very dangerous, avoid
        }
        // Generally negative for shooting self unless it's a strategic blank
        else {
          score -= 100; // Default penalty for self-harm
        }
      }
      break;
  }
  return score;
}


export function automatonTakeTurn(game: GameState): { updatedGame: GameState, actionMessage: ActionMessage } {
  const { players, activePlayerIndex, shotgunChambers } = game;
  const aiPlayer = players[activePlayerIndex];

  if (!aiPlayer.isAI) {
    throw new Error('Automaton Enforcer is not the active player');
  }

  

  const liveShells = shellCountMemory.live
  const totalShells = shellCountMemory.live + shellCountMemory.blank;
  const pLive = totalShells > 0 ? liveShells / totalShells : 0; // Handle division by zero
  const opponent = players.find(p => !p.isAI);

  let bestAction: Action | null = null;
  let highestScore = -Infinity; // Initialize with a very low score

  if( aiPlayer.statusEffects.includes('adrenaline') && opponent && opponent.items.length > 0  ) {
    const opponentItems = opponent.items;
    let bestAction: Action | null = null;
    for(const item of opponentItems) {
      if (item === 'adrenaline_shot') continue; // ✅ Skip stealing adrenaline to prevent recursion
      let targetPlayerId: string | undefined = undefined;
      if (item === 'restraining_cuffs' && opponent) {
        targetPlayerId = opponent.id;
      }
      const currentAction: Action = { type: 'use_item', itemType: item, targetPlayerId: opponent.id };
      const score = calculateActionScore(game, currentAction, aiPlayer, opponent, pLive);

      if (score > highestScore) {
        highestScore = score;
        bestAction = currentAction;
      }
    }
    if (bestAction && bestAction.type === 'use_item') {
    // 1. Remove adrenaline status
    const updatedPlayers = game.players.map((p, idx) => {
      if (idx === activePlayerIndex) {
        return {
          ...p,
          statusEffects: p.statusEffects.filter(e => e !== 'adrenaline'),
        };
      }
      return p;
    });

    const finalPlayers = updatedPlayers.map((p) => {
        if (p.id === opponent.id) {
          // Remove one instance from opponent
          const copy = [...p.items];
          const index = copy.indexOf(bestAction.itemType);
          if (index > -1) copy.splice(index, 1); // remove only one
          return { ...p, items: copy };
        }

        if (p.id === aiPlayer.id) {
          // Add the stolen item to AI inventory
          return { ...p, items: [...p.items, bestAction.itemType] };
        }

        return p;
      });

    const finalGame = { ...game, players: finalPlayers };

    return playTurn(finalGame, bestAction);
  }
  }

  // 1. Evaluate "use_item" actions
  for (const item of aiPlayer.items) {
    // Determine target for items like restraining_cuffs
    let targetPlayerId: string | undefined = undefined;
    if (item === 'restraining_cuffs' && opponent) {
      targetPlayerId = opponent.id;
    }

    const currentAction: Action = { type: 'use_item', itemType:item, targetPlayerId };
    const score = calculateActionScore(game, currentAction, aiPlayer, opponent, pLive);

    if (score > highestScore) {
      highestScore = score;
      bestAction = currentAction;
    }
  }

  // 2. Evaluate "shoot" actions
  // Potential target: Opponent
  if (opponent) {
    const shootOpponentAction: Action = { type: 'shoot', targetPlayerId: opponent.id };
    const score = calculateActionScore(game, shootOpponentAction, aiPlayer, opponent, pLive);
    if (score > highestScore) {
      highestScore = score;
      bestAction = shootOpponentAction;
    }
  }

  // Potential target: Self
  const shootSelfAction: Action = { type: 'shoot', targetPlayerId: aiPlayer.id };
  const scoreSelf = calculateActionScore(game, shootSelfAction, aiPlayer, opponent, pLive);
  if (scoreSelf > highestScore) {
    highestScore = scoreSelf;
    bestAction = shootSelfAction;
  }


  // Fallback: If no action was chosen (shouldn't happen with default scores, but good practice)
  if (!bestAction) {
    // Default to shooting opponent if possible, otherwise self
    bestAction = {
      type: 'shoot',
      targetPlayerId: opponent ? opponent.id : aiPlayer.id
    };
  }

  // Debugging log (optional)
  // console.log(`AI Player: ${aiPlayer.id}, Best Action: ${JSON.stringify(bestAction)}, Score: ${highestScore}`);


  return playTurn(game, bestAction);
}
