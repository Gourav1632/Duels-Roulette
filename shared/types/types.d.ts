export type StatusEffect = 'chained' | 'amplified' | 'thief' | string;
export type ActionMessage = {
    type: 'drink' | 'artifact_used' | 'skip' | 'refill' | 'message' | 'refill' | 'announce' | string;
    item?: ItemType;
    userId?: string;
    targetId?: string;
    result?: string;
};
export type ItemType = 'royal_scrutiny_glass' | 'verdict_amplifier' | 'crown_disavowal' | 'royal_chain_order' | 'sovereign_potion' | 'chronicle_ledger' | 'paradox_dial' | 'thiefs_tooth' | string;
export interface Contestant {
    id: string;
    name: string;
    lives: number;
    items: ItemType[];
    isAI: boolean;
    isOnline: boolean;
    statusEffects: StatusEffect[];
}
export type Player = {
    id: string;
    name: string;
    socketId: string;
};
export type GameStatePhase = 'loading' | 'playing' | 'round_over' | 'game_over';
export interface GameState {
    players: Contestant[];
    currentRound: RoundConfig;
    activePlayerIndex: number;
    goblets: boolean[];
    currentGobletIndex: number;
    gobletsRemaining: number;
    turnOrderDirection: 'clockwise' | 'counter-clockwise';
    gameState: GameStatePhase;
}
export type RoundConfig = {
    round: number;
    poisnousGoblets: number;
    holyGoblets: number;
    lives: number;
    itemCount: number;
    suddenDeath: boolean;
};
export interface RoomData {
    id: string;
    host: Player;
    players: Player[];
    maxPlayers: number;
    isPrivate: boolean;
    password: string;
    gameState: GameState | null;
    voiceChatEnabled: boolean;
}
export interface PublicRoomData {
    id: string;
    host: Player;
    playersActive: number;
    maxPlayers: number;
    voiceChatEnabled: boolean;
}
