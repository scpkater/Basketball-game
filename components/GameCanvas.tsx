import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Vector2, GameState, ShotResult } from '../types';

interface GameCanvasProps {
  onShotResult: (result: ShotResult) => void;
  isGameOver: boolean;
}

// Physics Constants
const GRAVITY = 0.5;
const BOUNCE_DAMPING = 0.7;
const DRAG_POWER = 0.15;
const MAX_DRAG_DIST = 150;
const FLOOR_Y = 550;
const LEFT_WALL = 0;
const RIGHT_WALL = 800;

// Court Dimensions (SVG coordinate system 800x600)
const HOOP_CENTER: Vector2 = { x: 700, y: 250 };
const HOOP_RADIUS = 35;
const BALL_RADIUS = 18;
const START_POS: Vector2 = { x: 150, y: 400 };

const GameCanvas: React.FC<GameCanvasProps> = ({ onShotResult, isGameOver }) => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [ballPos, setBallPos] = useState<Vector2>(START_POS);
  const [dragStart, setDragStart] = useState<Vector2 | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Vector2 | null>(null);
  
  // Use refs for physics loop to avoid closure staleness and re-renders
  const ballPosRef = useRef<Vector2>(START_POS);
  const velocityRef = useRef<Vector2>({ x: 0, y: 0 });
  const reqIdRef = useRef<number>();
  const gameStateRef = useRef<GameState>(GameState.IDLE);
  const rimHitRef = useRef<boolean>(false);
  const backboardHitRef = useRef<boolean>(false);

  // Sync state for rendering
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const resetBall = useCallback(() => {
    // If game is over, do not reset to idle, stay in reset/game over state visually
    if (isGameOver) return;

    setGameState(GameState.IDLE);
    setBallPos(START_POS);
    ballPosRef.current = START_POS;
    velocityRef.current = { x: 0, y: 0 };
    setDragStart(null);
    setDragCurrent(null);
    rimHitRef.current = false;
    backboardHitRef.current = false;
  }, [isGameOver]);

  const checkCollision = (pos: Vector2, vel: Vector2) => {
    let newPos = { ...pos };
    let newVel = { ...vel };
    let didHit = false;

    // Floor
    if (newPos.y + BALL_RADIUS > FLOOR_Y) {
      newPos.y = FLOOR_Y - BALL_RADIUS;
      newVel.y = -newVel.y * BOUNCE_DAMPING;
      // Friction
      newVel.x *= 0.95; 
      didHit = true;
    }

    // Walls
    if (newPos.x - BALL_RADIUS < LEFT_WALL) {
      newPos.x = LEFT_WALL + BALL_RADIUS;
      newVel.x = -newVel.x * BOUNCE_DAMPING;
      didHit = true;
    }
    if (newPos.x + BALL_RADIUS > RIGHT_WALL) {
      newPos.x = RIGHT_WALL + BALL_RADIUS;
      newVel.x = -newVel.x * BOUNCE_DAMPING;
      didHit = true;
    }

    // Backboard (Simplified as a line segment)
    // Backboard is roughly at x=740, from y=150 to y=250
    const BB_X = 740;
    const BB_TOP = 150;
    const BB_BOTTOM = 250;

    if (
      newPos.x + BALL_RADIUS > BB_X && 
      newPos.x - BALL_RADIUS < BB_X + 10 &&
      newPos.y > BB_TOP && 
      newPos.y < BB_BOTTOM
    ) {
        newVel.x = -Math.abs(newVel.x) * BOUNCE_DAMPING;
        newPos.x = BB_X - BALL_RADIUS;
        backboardHitRef.current = true;
        didHit = true;
    }

    // Hoop Rim (Simplified as two points for collision)
    // Rim is from 665 to 735 (width 70)
    const rimLeft = { x: HOOP_CENTER.x - HOOP_RADIUS, y: HOOP_CENTER.y };
    const rimRight = { x: HOOP_CENTER.x + HOOP_RADIUS, y: HOOP_CENTER.y };
    
    [rimLeft, rimRight].forEach(rimPoint => {
      const dx = newPos.x - rimPoint.x;
      const dy = newPos.y - rimPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < BALL_RADIUS + 3) { // 3 is rim thickness radius
         // Normalize
         const nx = dx / dist;
         const ny = dy / dist;
         
         // Reflect velocity
         const dot = newVel.x * nx + newVel.y * ny;
         newVel.x = (newVel.x - 2 * dot * nx) * BOUNCE_DAMPING;
         newVel.y = (newVel.y - 2 * dot * ny) * BOUNCE_DAMPING;
         
         // Push out
         const overlap = (BALL_RADIUS + 3) - dist;
         newPos.x += nx * overlap;
         newPos.y += ny * overlap;
         
         rimHitRef.current = true;
         didHit = true;
      }
    });

    return { pos: newPos, vel: newVel, didHit };
  };

  const gameLoop = useCallback(() => {
    if (gameStateRef.current !== GameState.FLYING) return;

    let pos = ballPosRef.current;
    let vel = velocityRef.current;

    // Apply Gravity
    vel.y += GRAVITY;

    // Move
    pos.x += vel.x;
    pos.y += vel.y;

    // Collisions
    const collisionResult = checkCollision(pos, vel);
    pos = collisionResult.pos;
    vel = collisionResult.vel;

    // Check Scoring
    // To score, ball must pass through HOOP_Y moving downwards, within X range
    const inHoopX = pos.x > HOOP_CENTER.x - HOOP_RADIUS + 5 && pos.x < HOOP_CENTER.x + HOOP_RADIUS - 5;
    const crossedRimY = pos.y > HOOP_CENTER.y && (pos.y - vel.y) <= HOOP_CENTER.y;
    
    if (crossedRimY && inHoopX && vel.y > 0) {
      // GOAL!
      setGameState(GameState.RESETTING);
      onShotResult({
        made: true,
        isClean: !rimHitRef.current && !backboardHitRef.current,
        isAirball: false
      });
      setTimeout(resetBall, 1500);
      return; 
    }

    // Check Miss (Hit floor)
    // If the ball touches the floor, reset immediately (with small delay for visual impact)
    if (pos.y >= FLOOR_Y - BALL_RADIUS - 1) {
       setGameState(GameState.RESETTING);
       onShotResult({
         made: false,
         isClean: false,
         isAirball: !rimHitRef.current && !backboardHitRef.current
       });
       // Short delay to allow seeing the ball hit the floor
       setTimeout(resetBall, 200); 
       return;
    }

    // Update Refs
    ballPosRef.current = pos;
    velocityRef.current = vel;
    setBallPos({ ...pos });

    reqIdRef.current = requestAnimationFrame(gameLoop);
  }, [onShotResult, resetBall]);

  useEffect(() => {
    if (gameState === GameState.FLYING) {
      reqIdRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    };
  }, [gameState, gameLoop]);


  // Input Handlers
  const getPointerPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): Vector2 => {
    const svg = document.getElementById('game-svg') as any;
    const pt = svg.createSVGPoint();
    
    // Handle both mouse and touch
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    pt.x = clientX;
    pt.y = clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: svgP.x, y: svgP.y };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Disable input if game is over
    if (gameState !== GameState.IDLE || isGameOver) return;
    
    const pos = getPointerPos(e);
    
    // Check if clicking near ball
    const dist = Math.sqrt(Math.pow(pos.x - ballPos.x, 2) + Math.pow(pos.y - ballPos.y, 2));
    if (dist < 100) { // Generous hit area
      setGameState(GameState.AIMING);
      setDragStart(ballPos);
      setDragCurrent(ballPos);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== GameState.AIMING || !dragStart) return;
    // prevent scrolling on touch
    // e.preventDefault(); // Note: Managed by CSS touch-action in index.html usually
    
    let current = getPointerPos(e);
    
    // Limit drag distance
    const dx = current.x - dragStart.x;
    const dy = current.y - dragStart.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist > MAX_DRAG_DIST) {
      const angle = Math.atan2(dy, dx);
      current = {
        x: dragStart.x + Math.cos(angle) * MAX_DRAG_DIST,
        y: dragStart.y + Math.sin(angle) * MAX_DRAG_DIST
      };
    }
    
    setDragCurrent(current);
  };

  const handleEnd = () => {
    if (gameState !== GameState.AIMING || !dragStart || !dragCurrent) return;
    
    const dx = dragStart.x - dragCurrent.x;
    const dy = dragStart.y - dragCurrent.y;
    
    velocityRef.current = {
      x: dx * DRAG_POWER,
      y: dy * DRAG_POWER
    };
    
    setGameState(GameState.FLYING);
    setDragStart(null);
    setDragCurrent(null);
  };

  return (
    <div className="w-full h-full relative select-none">
      <svg
        id="game-svg"
        viewBox="0 0 800 600"
        className={`w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 ${isGameOver ? 'cursor-default grayscale-[0.5]' : 'cursor-pointer'}`}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        {/* Floor */}
        <rect x="0" y={FLOOR_Y} width="800" height="50" fill="#2d3748" />
        <line x1="0" y1={FLOOR_Y} x2="800" y2={FLOOR_Y} stroke="#4a5568" strokeWidth="2" />
        
        {/* Backboard Pole */}
        <rect x="780" y="250" width="20" height="300" fill="#4a5568" />
        <path d="M780 250 L740 220" stroke="#4a5568" strokeWidth="8" />

        {/* Backboard */}
        <rect x="740" y="150" width="10" height="100" fill="white" />
        <rect x="743" y="200" width="4" height="40" fill="#ef4444" /> {/* Square target */}

        {/* Net (Simple visual) */}
        <path 
          d={`M${HOOP_CENTER.x - HOOP_RADIUS} ${HOOP_CENTER.y} 
             L${HOOP_CENTER.x - HOOP_RADIUS + 10} ${HOOP_CENTER.y + 60} 
             L${HOOP_CENTER.x + HOOP_RADIUS - 10} ${HOOP_CENTER.y + 60} 
             L${HOOP_CENTER.x + HOOP_RADIUS} ${HOOP_CENTER.y}`}
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeDasharray="4 4"
          className="opacity-60"
        />

        {/* Hoop Rim Front (Visual, but physics uses calculated points) */}
        <line 
            x1={HOOP_CENTER.x - HOOP_RADIUS} 
            y1={HOOP_CENTER.y} 
            x2={HOOP_CENTER.x + HOOP_RADIUS} 
            y2={HOOP_CENTER.y} 
            stroke="#ea580c" 
            strokeWidth="6" 
            strokeLinecap="round"
        />

        {/* Trajectory Line (Aiming) */}
        {gameState === GameState.AIMING && dragStart && dragCurrent && (
          <g>
            <line 
              x1={dragStart.x} 
              y1={dragStart.y} 
              x2={dragCurrent.x} 
              y2={dragCurrent.y} 
              stroke="white" 
              strokeWidth="2" 
              strokeDasharray="5 5"
              opacity="0.5"
            />
            {/* Inverse line to show shot direction */}
             <line 
              x1={dragStart.x} 
              y1={dragStart.y} 
              x2={dragStart.x + (dragStart.x - dragCurrent.x)} 
              y2={dragStart.y + (dragStart.y - dragCurrent.y)} 
              stroke="#fbbf24" 
              strokeWidth="3" 
              strokeDasharray="5 5"
            />
          </g>
        )}

        {/* The Ball */}
        <g transform={`translate(${ballPos.x}, ${ballPos.y})`}>
            <circle r={BALL_RADIUS} fill="#f97316" stroke="#c2410c" strokeWidth="2" />
            {/* Ball Lines */}
            <path d={`M-${BALL_RADIUS} 0 H${BALL_RADIUS}`} stroke="#7c2d12" strokeWidth="2" />
            <path d={`M0 -${BALL_RADIUS} V${BALL_RADIUS}`} stroke="#7c2d12" strokeWidth="2" />
            <circle r={BALL_RADIUS * 0.6} fill="none" stroke="#7c2d12" strokeWidth="2" />
        </g>
        
        {/* Hoop Rim Front Half (Draw over ball to simulate going 'in') */}
         <path 
            d={`M${HOOP_CENTER.x - HOOP_RADIUS} ${HOOP_CENTER.y} A ${HOOP_RADIUS} 5 0 0 0 ${HOOP_CENTER.x + HOOP_RADIUS} ${HOOP_CENTER.y}`}
            fill="none"
            stroke="#ea580c" 
            strokeWidth="6"
            strokeLinecap="round"
            className="z-10"
         />

      </svg>
      
      {/* Tutorial Overlay */}
      {gameState === GameState.IDLE && !isGameOver && ballPos.x === START_POS.x && (
        <div className="absolute top-1/2 left-[20%] transform -translate-y-1/2 pointer-events-none animate-pulse text-white/50 text-sm">
           <span className="block text-2xl mb-2">👈</span>
           Drag Back to Shoot
        </div>
      )}
    </div>
  );
};

export default GameCanvas;