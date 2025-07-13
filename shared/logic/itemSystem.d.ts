import type { GameState, ItemType, ActionMessage } from '../types/types';
export declare function RoyalScrutinyGlass(game: GameState): {
    updatedGame: GameState;
    actionMessage: ActionMessage;
};
export declare function VerdictAmplifier(game: GameState): {
    updatedGame: {
        players: import("../types/types").Contestant[];
        currentRound: import("../types/types").RoundConfig;
        activePlayerIndex: number;
        goblets: boolean[];
        currentGobletIndex: number;
        gobletsRemaining: number;
        turnOrderDirection: "clockwise" | "counter-clockwise";
        gameState: import("../types/types").GameStatePhase;
    };
    actionMessage: ActionMessage;
};
export declare function CrownDisavowal(game: GameState): {
    updatedGame: {
        goblets: boolean[];
        gobletsRemaining: number;
        players: import("../types/types").Contestant[];
        currentRound: import("../types/types").RoundConfig;
        activePlayerIndex: number;
        currentGobletIndex: number;
        turnOrderDirection: "clockwise" | "counter-clockwise";
        gameState: import("../types/types").GameStatePhase;
    };
    actionMessage: ActionMessage;
};
export declare function RoyalChainOrder(game: GameState, targetPlayerId: string): {
    updatedGame: {
        players: import("../types/types").Contestant[];
        currentRound: import("../types/types").RoundConfig;
        activePlayerIndex: number;
        goblets: boolean[];
        currentGobletIndex: number;
        gobletsRemaining: number;
        turnOrderDirection: "clockwise" | "counter-clockwise";
        gameState: import("../types/types").GameStatePhase;
    };
    actionMessage: ActionMessage;
};
export declare function SovereignPotion(game: GameState): {
    updatedGame: {
        players: import("../types/types").Contestant[];
        currentRound: import("../types/types").RoundConfig;
        activePlayerIndex: number;
        goblets: boolean[];
        currentGobletIndex: number;
        gobletsRemaining: number;
        turnOrderDirection: "clockwise" | "counter-clockwise";
        gameState: import("../types/types").GameStatePhase;
    };
    actionMessage: ActionMessage;
};
export declare function ChronicleLedger(game: GameState): {
    updatedGame: GameState;
    actionMessage: ActionMessage;
};
export declare function ParadoxDial(game: GameState): {
    updatedGame: {
        goblets: boolean[];
        players: import("../types/types").Contestant[];
        currentRound: import("../types/types").RoundConfig;
        activePlayerIndex: number;
        currentGobletIndex: number;
        gobletsRemaining: number;
        turnOrderDirection: "clockwise" | "counter-clockwise";
        gameState: import("../types/types").GameStatePhase;
    };
    actionMessage: ActionMessage;
};
export declare function ThiefTooth(game: GameState): {
    updatedGame: {
        players: import("../types/types").Contestant[];
        currentRound: import("../types/types").RoundConfig;
        activePlayerIndex: number;
        goblets: boolean[];
        currentGobletIndex: number;
        gobletsRemaining: number;
        turnOrderDirection: "clockwise" | "counter-clockwise";
        gameState: import("../types/types").GameStatePhase;
    };
    actionMessage: ActionMessage;
};
export declare function Item(game: GameState, itemType: ItemType, targetPlayerId?: string): {
    updatedGame: GameState;
    actionMessage: ActionMessage;
};
