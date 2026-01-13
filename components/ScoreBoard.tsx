import React from 'react';

interface ScoreBoardProps {
  score: number;
  streak: number;
  attempts: number;
  timeLeft: number;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ score, streak, attempts, timeLeft }) => {
  const accuracy = attempts > 0 ? Math.round((score / attempts) * 100) : 0;
  
  // Format time as MM:SS (though strictly only need seconds for 90s)
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  const isLowTime = timeLeft <= 10;

  return (
    <div className="absolute top-4 left-4 right-4 flex flex-row justify-between items-start pointer-events-none">
      
      {/* Left: Score */}
      <div className="flex flex-col gap-2">
        <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 shadow-lg text-white">
          <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-orange-500">{score}</span>
              <span className="text-sm font-medium text-slate-400 mb-1">PTS</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-bold">
              Accuracy: {accuracy}%
          </div>
        </div>

        {streak > 1 && (
          <div className="bg-orange-600/90 backdrop-blur-sm p-2 rounded-lg border border-orange-500 shadow-lg animate-bounce">
             <div className="text-center">
               <span className="text-xl font-black text-white">🔥 {streak} STREAK</span>
             </div>
          </div>
        )}
      </div>

      {/* Right: Timer */}
      <div className={`
        bg-slate-800/80 backdrop-blur-md p-3 px-5 rounded-xl border shadow-lg text-white
        ${isLowTime ? 'border-red-500 animate-pulse' : 'border-slate-700'}
      `}>
         <div className="flex flex-col items-center">
            <span className={`text-3xl font-mono font-bold ${isLowTime ? 'text-red-500' : 'text-white'}`}>
                {timeString}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Time</span>
         </div>
      </div>

    </div>
  );
};

export default ScoreBoard;