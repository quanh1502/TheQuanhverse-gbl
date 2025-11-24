import React, { useState, useEffect } from 'react';
import { Edit3, Check, X, Music, MessageCircle } from 'lucide-react';

interface MascotProps {
  greeting: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  variant?: 'default' | 'coffee' | 'music';
  size?: 'small' | 'medium';
  withHint?: boolean;
}

const RavenclawTaurusMascot: React.FC<MascotProps> = ({ 
  greeting: initialGreeting, 
  className, 
  style, 
  onClick,
  variant = 'default',
  size = 'medium',
  withHint = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentGreeting, setCurrentGreeting] = useState(initialGreeting);
  const [isEditing, setIsEditing] = useState(false);
  const [tempText, setTempText] = useState(initialGreeting);

  useEffect(() => {
    setCurrentGreeting(initialGreeting);
    setTempText(initialGreeting);
  }, [initialGreeting]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
    if (onClick) onClick();
  };

  const handleSave = () => {
    setCurrentGreeting(tempText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempText(currentGreeting);
    setIsEditing(false);
  };

  // Styles based on size
  // Small = Horizontal Landscape (for Lobby/Void)
  // Medium = Portrait/Standard (for inside Rooms)
  const modalDimensions = size === 'small' 
    ? 'w-[320px] md:w-[400px]' 
    : 'max-w-sm w-full';
    
  const contentPadding = size === 'small' ? 'px-6 py-4 pt-8' : 'p-6';
  const fontSize = size === 'small' ? 'text-sm leading-relaxed' : 'text-lg leading-relaxed';
  const titleSize = size === 'small' ? 'text-[10px]' : 'text-sm';
  const iconSize = size === 'small' ? 'w-12 h-12 -top-6 text-xl' : 'w-16 h-16 -top-8 text-3xl';

  return (
    <>
      {/* Container */}
      <div 
        onClick={handleClick}
        className={`z-50 cursor-pointer animate-float hover:scale-110 transition-transform duration-300 w-24 h-24 ${className || ''}`}
        style={{ animationDuration: '5s', ...style }}
        title="Click me!"
      >
        <div className="relative w-full h-full drop-shadow-2xl">
            {/* --- HINT BUBBLE --- */}
            {withHint && !isOpen && (
              <div className="absolute -top-2 -right-4 z-50 animate-bounce" style={{ animationDuration: '2s' }}>
                  <div className="bg-white text-cyan-700 rounded-t-xl rounded-br-xl rounded-bl-none p-1.5 shadow-[0_0_15px_rgba(255,255,255,0.6)] border-2 border-cyan-100 flex items-center justify-center transform hover:scale-110 transition-transform">
                      <MessageCircle size={14} fill="currentColor" className="text-cyan-600" />
                  </div>
              </div>
            )}

            {/* --- HALO VARIANTS --- */}
            {variant === 'coffee' && (
               <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-40 animate-float" style={{ animationDuration: '3s' }}>
                  <div className="w-8 h-5 bg-[#3e2723] rounded-[50%] border-t border-white/10 shadow-[0_0_15px_rgba(255,165,0,0.4)] relative overflow-hidden transform rotate-12">
                     <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#1a100c] -translate-y-1/2 rotate-3 shadow-[0_1px_1px_rgba(255,255,255,0.1)]"></div>
                  </div>
               </div>
            )}

            {variant === 'music' && (
               <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-40 animate-float" style={{ animationDuration: '4s' }}>
                  <div className="w-8 h-8 rounded-full border-2 border-cyan-400 bg-black/50 shadow-[0_0_15px_#22d3ee] flex items-center justify-center backdrop-blur-sm relative overflow-hidden group-hover:scale-110 transition-transform">
                     <div className="absolute inset-0 bg-cyan-400/20 animate-pulse"></div>
                     <Music size={14} className="text-cyan-300 relative z-10" />
                  </div>
               </div>
            )}

            {/* --- BODY (Ravenclaw Robe) --- */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-12 bg-[#0e1a40] rounded-t-3xl rounded-b-xl overflow-hidden shadow-lg flex justify-center z-10">
                 {/* Robe Opening/Bronze Trim */}
                 <div className="w-2 h-full bg-[#946b2d]/80"></div>
                 {/* Inner Shirt */}
                 <div className="absolute top-0 w-6 h-6 bg-white rotate-45 -translate-y-4 shadow-sm"></div>
            </div>

            {/* --- ARM & WAND (Waving) - Behind Scarf, In front of body --- */}
            <div className="absolute top-12 right-0 origin-top-left animate-wave z-30 pointer-events-none">
                 {/* Arm */}
                 <div className="w-8 h-3 bg-[#0e1a40] rounded-full rotate-45 absolute top-0 left-0"></div>
                 {/* Hand */}
                 <div className="w-3 h-3 bg-[#5d4037] rounded-full absolute top-1 right-[-2px]"></div>
                 {/* Wand */}
                 <div className="w-10 h-0.5 bg-[#3e2723] absolute top-2 left-6 -rotate-12">
                    {/* Magic Sparkle */}
                    <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] animate-pulse ${variant === 'music' ? 'bg-cyan-300 shadow-cyan-400' : 'bg-blue-300 shadow-blue-400'}`}></div>
                 </div>
            </div>

            {/* --- SCARF (Red) --- */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#b91c1c] rounded-full z-20 shadow-md border-b-2 border-[#7f1d1d] flex items-center justify-center gap-2 overflow-hidden">
                <div className="w-2 h-full bg-[#7f1d1d]/20 -skew-x-12"></div>
                <div className="w-2 h-full bg-[#7f1d1d]/20 -skew-x-12"></div>
            </div>
            {/* Scarf Tail */}
            <div className="absolute top-14 right-5 w-4 h-8 bg-[#b91c1c] rounded-b-md rotate-6 z-10 border-r-2 border-[#7f1d1d]"></div>

            {/* --- HEAD (Taurus) --- */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-12 bg-[#5d4037] rounded-2xl shadow-md z-10 flex items-center justify-center">
                {/* Eyes */}
                <div className="flex gap-3 mb-1">
                    <div className="w-2 h-2 bg-black rounded-full animate-blink relative">
                        <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-white rounded-full"></div>
                    </div>
                    <div className="w-2 h-2 bg-black rounded-full animate-blink relative">
                        <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-white rounded-full"></div>
                    </div>
                </div>
                {/* Snout */}
                <div className="absolute bottom-0.5 w-9 h-5 bg-[#3e2723] rounded-xl flex justify-center items-center gap-2 opacity-80">
                     <div className="w-1 h-1 bg-black/60 rounded-full"></div>
                     <div className="w-1 h-1 bg-black/60 rounded-full"></div>
                     {/* Nose Ring */}
                     <div className="absolute -bottom-1 w-3 h-3 border-2 border-yellow-500 rounded-full clip-path-half"></div>
                </div>
            </div>

            {/* --- HORNS (Visible now) --- */}
            <div className="absolute top-0 left-0 w-4 h-7 border-l-[6px] border-t-[4px] border-[#e2e8f0] rounded-tl-full -rotate-[20deg] z-0"></div>
            <div className="absolute top-0 right-0 w-4 h-7 border-r-[6px] border-t-[4px] border-[#e2e8f0] rounded-tr-full rotate-[20deg] z-0"></div>

        </div>

        {/* --- STYLES --- */}
        <style>{`
            @keyframes wave {
                0%, 100% { transform: rotate(0deg); }
                5% { transform: rotate(20deg); }
                10% { transform: rotate(-10deg); }
                15% { transform: rotate(10deg); }
                20% { transform: rotate(0deg); }
            }
            .animate-wave {
                animation: wave 5s infinite ease-in-out;
            }
            @keyframes blink {
                0%, 96%, 100% { transform: scaleY(1); }
                98% { transform: scaleY(0.1); }
            }
            .animate-blink {
                animation: blink 4s infinite;
            }
        `}</style>
      </div>

      {/* Greeting Modal */}
      {isOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 cursor-auto" onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsEditing(false); }}>
             <div 
                className={`
                  relative bg-slate-900/95 backdrop-blur-xl border border-cyan-500/50 
                  rounded-2xl ${modalDimensions} shadow-[0_0_100px_rgba(6,182,212,0.4)] 
                  animate-zoom-in text-center transform hover:scale-[1.02] transition-transform 
                  ${contentPadding}
                `} 
                onClick={(e) => e.stopPropagation()}
             >
                 {/* Icon Badge */}
                 <div className={`absolute left-1/2 -translate-x-1/2 bg-slate-800 rounded-full border-4 border-slate-900 flex items-center justify-center shadow-lg ${iconSize}`}>
                    <span className="filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] flex items-center justify-center">
                        {variant === 'music' ? (
                            <Music size={24} className="text-cyan-400" />
                        ) : variant === 'coffee' ? '☕' : '✨'}
                    </span>
                 </div>
                 
                 {/* Header & Edit Toggle */}
                 <div className="mt-4 mb-2 space-y-1 relative">
                    <h3 className={`text-cyan-400 font-bold uppercase tracking-[0.2em] ${titleSize}`}>
                        {variant === 'music' ? 'DJ Taurus' : (variant === 'coffee' ? 'Barista Taurus' : 'Taurus the Wizard')}
                    </h3>
                    
                    {!isEditing && (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="absolute top-0 right-0 text-slate-600 hover:text-cyan-400 transition-colors"
                        >
                            <Edit3 size={14} />
                        </button>
                    )}
                 </div>
                 
                 {/* Content Area */}
                 {isEditing ? (
                    <div className="mb-2">
                        <textarea 
                            value={tempText}
                            onChange={(e) => setTempText(e.target.value)}
                            className="w-full h-20 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none resize-none mb-2"
                        />
                        <div className="flex gap-2 justify-center">
                            <button onClick={handleCancel} className="p-1 rounded bg-red-900/20 text-red-400 hover:bg-red-900/40"><X size={16} /></button>
                            <button onClick={handleSave} className="p-1 rounded bg-green-900/20 text-green-400 hover:bg-green-900/40"><Check size={16} /></button>
                        </div>
                    </div>
                 ) : (
                    <div className="min-h-[3rem] flex items-center justify-center">
                        <p className={`text-slate-200 font-serif italic ${fontSize} px-2 whitespace-pre-wrap`}>
                            "{currentGreeting}"
                        </p>
                    </div>
                 )}
                 
                 <div className="mt-4 pt-3 border-t border-white/5">
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="px-6 py-1.5 bg-gradient-to-r from-cyan-900 to-blue-900 hover:from-cyan-800 hover:to-blue-800 text-cyan-100 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all border border-cyan-700/50 shadow-lg hover:shadow-cyan-500/20"
                    >
                        Close
                    </button>
                 </div>
             </div>
         </div>
      )}
    </>
  );
};

export default RavenclawTaurusMascot;