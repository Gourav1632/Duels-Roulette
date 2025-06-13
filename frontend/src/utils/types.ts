// Status effects a player can have
export type StatusEffect = 'cuffed' | 'sawed_off' | 'adrenaline' | string;

// All possible item types
export type ItemType =
  | 'magnifying_scope'
  | 'sawed_off_kit'
  | 'ejector_tool'
  | 'restraining_cuffs'
  | 'first_aid_kit'
  | 'scout_report'
  | 'shell_inverter'
  | 'adrenaline_shot';

// Player/Contestant model
export interface Contestant {
  id: string;
  name: string;
  lives: number;
  items: ItemType[];
  isAI: boolean;
  isOnline: boolean;
  hasUsedItemThisTurn: boolean;
  statusEffects: StatusEffect[];
}

// Game state model
export enum TurnOrderDirection {
  Clockwise = 'clockwise',
  CounterClockwise = 'counter-clockwise',
}

export type GameStatePhase = 'loading' | 'playing' | 'round_over' | 'game_over';

export interface GameState {
  players: Contestant[];
  currentRound: number;
  activePlayerIndex: number;
  automatonLives: number | null;
  shotgunChambers: boolean[];
  currentChamberIndex: number;
  shellsRemaining: number;
  turnOrderDirection: TurnOrderDirection;
  gunDamageMultiplier: number;
  gameState: GameStatePhase;
} 