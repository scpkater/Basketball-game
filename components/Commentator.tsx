import React from 'react';

interface CommentatorProps {
  text: string;
  isLoading: boolean;
}

const Commentator: React.FC<CommentatorProps> = ({ text, isLoading }) => {
  if (!text && !isLoading) return null;

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 md:bottom-auto md:top-4 z-20 pointer-events-none">
      <div className="flex items-end gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg border-2 border-white shrink-0">
          <span className="text-xl">🎙️</span>
        </div>

        {/* Bubble */}
        <div className={`
          relative bg-white text-slate-800 p-4 rounded-2xl rounded-bl-none shadow-xl border-2 border-blue-100
          transition-all duration-300 transform origin-bottom-left
          ${isLoading ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}
        `}>
           {isLoading ? (
             <div className="flex gap-1 h-6 items-center">
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
           ) : (
             <p className="font-bold text-lg leading-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-purple-800">
               {text}
             </p>
           )}
        </div>
      </div>
    </div>
  );
};

export default Commentator;