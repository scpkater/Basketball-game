export interface Vector2 {
  x: number;
  y: number;
}

export enum GameState {
  IDLE = 'IDLE',      // Waiting for user input
  AIMING = 'AIMING',  // User is dragging
  FLYING = 'FLYING',  // Ball is in the air
  RESETTING = 'RESETTING', // Short delay after shot
  GAME_OVER = 'GAME_OVER' // Time is up
}

export interface ShotResult {
  made: boolean;
  isClean: boolean; // Swish (no rim touch)
  isAirball: boolean;
}

export interface CommentaryRequest {
  score: number;
  streak: number;
  lastShot: ShotResult;
}