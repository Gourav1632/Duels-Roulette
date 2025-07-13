import type { RoundConfig, GameState, Contestant, ItemType, ActionMessage } from '../types/types';
export declare function initializeGame(players: Contestant[]): GameState;
export declare function startRound(game: GameState, roundNumber: number): GameState;
export declare function playTurn(game: GameState, action: {
    type: 'drink' | 'use_item' | string;
    targetPlayerId?: string;
    itemType?: ItemType;
}): {
    updatedGame: GameState;
    actionMessage: ActionMessage;
};
export declare function nextRound(game: GameState, roundNumber: number): GameState;
export declare function getNextPlayerIndex(currentIndex: number, totalPlayers: number, direction: string): number;
export declare function generateRoundConfig(round: number): RoundConfig;
export declare function refillChambers(game: GameState): GameState;
export declare const skipIfChained: (game: GameState, player: Contestant) => {
    updatedGame: GameState;
    actionMessage: ActionMessage;
} | null;
