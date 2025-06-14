// Status effects a player can have
export type StatusEffect = 'cuffed' | 'sawed_off' | 'adrenaline' | string;

export type ActionMessage = {
  type: 'shoot' | 'item_used' | 'skip' | string;
  item?: ItemType;
  userId: string;
  targetId?: string;
  result?:  string;
};

// All possible item types
export type ItemType =
  | 'magnifying_scope' // use to see if the current shot is live or blank
  | 'sawed_off_kit' // use to make the gun do 2x damage
  | 'ejector_tool' // use to eject the current shell and skip the shot
  | 'restraining_cuffs' // use to restrain an opponent, preventing them from taking actions for one turn
  | 'first_aid_kit' // use to restore 1 life
  | 'scout_report' // use to see any random future shell
  | 'shell_inverter' // use to flip the type of the current shell (live becomes blank, blank becomes live)
  | 'adrenaline_shot'; // use to steal the opponent's item

// Player/Contestant model
export interface Contestant {
  id: string;
  name: string;
  lives: number;
  items: ItemType[];
  isAI: boolean;
  isOnline: boolean;
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
  currentRound: RoundConfig;
  activePlayerIndex: number;
  shotgunChambers: boolean[];
  currentChamberIndex: number;
  shellsRemaining: number;
  turnOrderDirection: TurnOrderDirection;
  gameState: GameStatePhase;
} 

export type RoundConfig = {
  round: number;
  liveShells: number;
  blankShells: number;
  lives: number;
  itemCount: number;
  suddenDeath: boolean;
};