import type { GameState, ActionMessage } from '../types/types';
export declare const gobletMemory: Record<number, 'poisonous' | 'holy'>;
export declare const gobletCountMemory: {
    poisonousGoblets: number;
    holyGoblets: number;
};
export declare function automatonTakeTurn(game: GameState): {
    updatedGame: GameState;
    actionMessage: ActionMessage;
};
