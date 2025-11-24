import React, { useState, useEffect } from 'react';
import { RoomType } from '../types';
import { getRoomAtmosphere } from '../services/geminiService';
import { Sparkles } from 'lucide-react';

interface GeminiOracleProps {
  room: RoomType;
}

const GeminiOracle: React.FC<GeminiOracleProps> = ({ room }) => {
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchThought = async () => {
      setLoading(true);
      setText('');
      setVisible(false);
      
      try {
        const thought = await getRoomAtmosphere(room);
        setText(thought);
        setLoading(false);
        setTimeout(() => setVisible(true), 100);
      } catch (e) {
        setLoading(false);
      }
    };

    fetchThought();
  }, [room]);

  return (
    <div className="fixed bottom-8 right-8 max-w-sm w-full z-50 pointer-events-none">
      <div 
        className={`
          bg-slate-900/80 backdrop-blur-md border border-indigo-500/30 p-6 rounded-2xl shadow-2xl
          transition-all duration-1000 transform
          ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}
      >
        <div className="flex items-center gap-2 mb-2 text-indigo-400">
          <Sparkles size={16} className={loading ? "animate-spin" : ""} />
          <span className="text-xs font-bold tracking-widest uppercase">Inner Voice</span>
        </div>
        
        <div className="min-h-[60px]">
          {loading ? (
            <div className="flex space-x-1 h-4 items-center">
               <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
               <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
               <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          ) : (
            <p className="text-sm md:text-base text-slate-200 serif italic leading-relaxed">
              "{text}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeminiOracle;