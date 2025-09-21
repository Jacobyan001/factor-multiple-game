
export type Player = 1 | 2;
export type GameMode = 'menu' | 'vsPlayer' | 'vsAI';

export interface CellState {
  number: number;
  owner: Player | null;
}
