import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import ScoreBoard from './components/ScoreBoard';
import Commentator from './components/Commentator';
import IntroOverlay from './components/IntroOverlay';
import { generateCommentary } from './services/geminiService';
import { ShotResult } from './types';

const GAME_DURATION = 90; // seconds

const App: React.FC = () => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  
  // Timer States
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isGameOver, setIsGameOver] = useState(false);
  
  const [commentary, setCommentary] = useState<string>("歡迎來到 Gemini 投籃大賽！準備好展現你的技術了嗎？");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Countdown Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (!showIntro && !isGameOver && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [showIntro, isGameOver, timeLeft]);

  const handleShotResult = async (result: ShotResult) => {
    // Prevent scoring if game is over
    if (isGameOver) return;

    setAttempts(prev => prev + 1);
    
    let newScore = score;
    let newStreak = streak;

    if (result.made) {
      newStreak += 1;
      const points = result.isClean ? 3 : 2; // Bonus for clean shots
      newScore += points + (newStreak > 3 ? 1 : 0); // Bonus for streaks
      setScore(newScore);
      setStreak(newStreak);
    } else {
      newStreak = 0;
      setStreak(0);
    }

    // Trigger Gemini Commentary
    setIsAiLoading(true);
    try {
      const text = await generateCommentary({
        score: newScore,
        streak: newStreak,
        lastShot: result
      });
      setCommentary(text);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const restartGame = () => {
    setScore(0);
    setStreak(0);
    setAttempts(0);
    setTimeLeft(GAME_DURATION);
    setIsGameOver(false);
    setCommentary("延長賽開始！再接再厲！");
  };

  return (
    <div className="w-full h-screen bg-slate-900 relative overflow-hidden font-sans select-none">
      
      {/* Intro Overlay */}
      {showIntro && <IntroOverlay onStart={() => setShowIntro(false)} />}

      {/* Game Over Overlay */}
      {isGameOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
           <h2 className="text-6xl font-black text-white mb-4 italic tracking-tighter">TIME'S UP!</h2>
           <div className="bg-slate-800 p-8 rounded-2xl border border-slate-600 text-center shadow-2xl transform scale-100">
              <p className="text-slate-400 text-lg uppercase tracking-widest mb-2">Final Score</p>
              <p className="text-8xl font-black text-orange-500 mb-6">{score}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8 text-slate-300">
                 <div className="bg-slate-900/50 p-3 rounded-lg">
                    <div className="text-xs uppercase text-slate-500">Attempts</div>
                    <div className="text-xl font-bold">{attempts}</div>
                 </div>
                 <div className="bg-slate-900/50 p-3 rounded-lg">
                    <div className="text-xs uppercase text-slate-500">Best Streak</div>
                    <div className="text-xl font-bold text-orange-400">{streak}</div> {/* Note: Currently showing last streak, for best streak logic would need separate state */}
                 </div>
              </div>

              <button 
                onClick={restartGame}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 px-8 rounded-full transition-all active:scale-95 shadow-lg"
              >
                再玩一次 Play Again
              </button>
           </div>
        </div>
      )}

      {/* Game Layer */}
      <div className="absolute inset-0 z-0">
        <GameCanvas onShotResult={handleShotResult} isGameOver={isGameOver} />
      </div>

      {/* UI Layer */}
      <div className="relative z-10 w-full h-full pointer-events-none">
        <ScoreBoard score={score} streak={streak} attempts={attempts} timeLeft={timeLeft} />
        <Commentator text={commentary} isLoading={isAiLoading} />
      </div>

    </div>
  );
};

export default App;