  import type { GameState, ActionMessage } from "../../../shared/types/types";
  import { skipIfChained, refillChambers, startRound, nextRound } from "../../../shared/logic/gameEngine";
import { roomManager } from "./roomManager";
  
export function handlePlayerTurn(
  roomId: string,
  game: GameState
): { game: GameState; actionMessage: ActionMessage; delay: number } | null {
    const room = roomManager.getRoom(roomId);
    if(!room || !room.gameState) {
       const message: ActionMessage = {type: 'error', result: 'No room found.'}
        return {game: game, actionMessage: message, delay: 0};
    }

    // check if round is over
    const {actionMessage} = checkDeathsAndAdvance(roomId, game);
    if (actionMessage.type === 'announce' || actionMessage.type === 'message'){
      return {game: room.gameState, actionMessage, delay: 5000};
    } 

    // check if player is chained
    const active = game.players[game.activePlayerIndex];
    const skipResult = skipIfChained(game, active);
    if (skipResult) {
      const { updatedGame, actionMessage } = skipResult;
       room.gameState = updatedGame;
       return {game: room.gameState, actionMessage: actionMessage, delay: 5000};
    }

    // player status is thief 
    if (active.statusEffects.includes("thief")) { 
      const message : ActionMessage = {type: 'canSteal'}
      return {game: room.gameState, actionMessage: message, delay: 0 };
    }

    // check if all goblets are over
    if (game.gobletsRemaining === 0 && game.gameState === "playing") {
      const updatedGame = refillChambers(game);
      room.gameState = updatedGame;
      const message: ActionMessage = {
        type: 'refill',
        userId: game.players[game.activePlayerIndex].id,
        result: `Guard refills the goblets. It has ${updatedGame.currentRound.holyGoblets} holy and ${updatedGame.currentRound.poisnousGoblets} poisoned goblets.`
        };
        return {game: room.gameState, actionMessage: message, delay: 5000};
    }
    
    const message: ActionMessage = {type: 'canDrink'};
    return {game: room.gameState, actionMessage: message, delay: 0};
  }


  export function checkDeathsAndAdvance(roomId: string, game: GameState) {
    const deadPlayers = game.players.filter(p => p.lives <= 0);
    const room = roomManager.getRoom(roomId);
    if(!room){
      const message : ActionMessage = {type: 'error', result: 'No room found.'}
      return {actionMessage : message};
    } 
    if (deadPlayers.length > 0) {
        const nextround = game.currentRound.round + 1;
        room.gameState = nextRound(game, nextround);
        if(room.gameState.gameState !== "game_over") {
          const currentTurnId = room.gameState.players[room.gameState.activePlayerIndex].id;
          const {poisnousGoblets, holyGoblets} = room.gameState.currentRound;
          const message: ActionMessage = {type: 'announce', userId: currentTurnId , result: `${deadPlayers.map(p => p.name).join(', ')} lost the round. Round ${nextround} has ${poisnousGoblets} poisnous and ${holyGoblets} holy goblets.`}
          return { actionMessage: message};
        } else {
          const message: ActionMessage = { type: 'message', result: `Game Over!` };
          return { actionMessage: message };
        }
    } 
    const message: ActionMessage = {
      type: 'continue',
      result: 'No deaths yet.'
    }
    return {actionMessage: message};
  }
