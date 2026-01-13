import React, { useState, useEffect } from 'react';

interface IntroOverlayProps {
  onStart: () => void;
}

const IntroOverlay: React.FC<IntroOverlayProps> = ({ onStart }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger entrance animation after mount
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleStart = () => {
    setIsExiting(true);
    setTimeout(() => {
      onStart();
    }, 600); // Wait for fade out transition
  };

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md transition-opacity duration-700 ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes hand-move {
          0%, 10% { transform: translate(0, 0) scale(1); opacity: 0; }
          15% { transform: translate(0, 0) scale(0.9); opacity: 1; } /* Touch */
          40% { transform: translate(40px, 40px) scale(0.9); opacity: 1; } /* Drag Back (Down-Right) */
          50% { transform: translate(40px, 40px) scale(1); opacity: 0; } /* Release */
          100% { transform: translate(0, 0) scale(1); opacity: 0; }
        }
        @keyframes ball-move {
          0%, 10% { transform: translate(0, 0); }
          15% { transform: translate(0, 0); }
          40% { transform: translate(40px, 40px); } /* Follow drag */
          50% { transform: translate(40px, 40px); } /* Release point */
          80% { transform: translate(-150px, -150px); opacity: 1; } /* Fly Up-Left */
          85% { transform: translate(-150px, -150px); opacity: 0; }
          100% { transform: translate(0, 0); opacity: 0; }
        }
        @keyframes dash-grow {
           0%, 15% { width: 0; opacity: 0; }
           40% { width: 56px; opacity: 0.5; transform: rotate(45deg); }
           50% { width: 56px; opacity: 0; transform: rotate(45deg); }
           100% { opacity: 0; }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-hand { animation: hand-move 2.5s ease-in-out infinite; }
        .animate-ball { animation: ball-move 2.5s cubic-bezier(0.25, 1, 0.5, 1) infinite; }
        .animate-dash { animation: dash-grow 2.5s ease-in-out infinite; }
      `}</style>

      {/* Background Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-64 h-64 bg-orange-600/20 rounded-full blur-[100px] transition-all duration-1000 ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}></div>
        <div className={`absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] transition-all duration-1000 delay-300 ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}></div>
      </div>

      <div className={`relative z-10 text-center px-6 transition-all duration-1000 flex flex-col items-center ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
        
        {/* Title */}
        <div className="animate-float mb-6">
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 drop-shadow-2xl">
            GEMINI
            <span className="block md:inline text-white drop-shadow-none md:ml-4 not-italic">HOOPS</span>
          </h1>
        </div>

        {/* Tutorial Animation Box */}
        <div className="relative w-64 h-48 bg-slate-800/50 rounded-2xl border border-slate-700 backdrop-blur-md mb-8 overflow-hidden shadow-2xl ring-1 ring-white/10 group hover:bg-slate-800/70 transition-colors">
            
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-20" 
                 style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            {/* Target Hoop Indicator (Top Left) */}
            <div className="absolute top-4 left-4 flex flex-col items-center opacity-50">
               <div className="w-12 h-1 bg-orange-500 rounded-full mb-1"></div>
               <div className="w-10 h-8 border-2 border-white/50 border-t-0 rounded-b-lg"></div>
            </div>

            {/* Animation Scene (Centered relative to Drag start) */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-4 ml-4">
                
                {/* Dashed Line for Drag Vector */}
                <div className="absolute top-0 left-0 h-[2px] bg-white origin-left animate-dash z-0"></div>

                {/* Ball */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-orange-200 shadow-lg animate-ball relative z-10 flex items-center justify-center">
                   <div className="w-full h-[1px] bg-orange-800/30 rotate-45"></div>
                </div>
                
                {/* Hand Cursor */}
                <div className="absolute top-4 left-4 text-4xl animate-hand z-20 pointer-events-none drop-shadow-xl filter">
                  👆
                </div>
            </div>

            <div className="absolute bottom-3 w-full text-center">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Drag Back & Release</p>
            </div>
        </div>

        {/* Features / Badges */}
        <div className="flex gap-4 mb-10 text-sm font-medium text-slate-300">
           <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700">
              <span className="text-blue-400">🎙️</span> AI 實況講評
           </div>
           <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700">
              <span className="text-orange-400">⚡</span> 物理引擎
           </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="group relative inline-flex items-center justify-center px-12 py-4 text-xl font-bold text-white transition-all duration-200 bg-orange-600 font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-600 hover:bg-orange-500 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(234,88,12,0.4)]"
        >
          <span className="absolute animate-ping w-full h-full rounded-full bg-orange-600 opacity-20"></span>
          開始比賽 START
          <svg className="w-6 h-6 ml-2 -mr-1 transition-transform group-hover:translate-x-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
          </svg>
        </button>

      </div>
    </div>
  );
};

export default IntroOverlay;