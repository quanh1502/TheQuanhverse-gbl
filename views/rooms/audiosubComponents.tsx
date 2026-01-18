// src/components/audio/AudioSubComponents.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Sparkles, ChevronLeft, ChevronRight, Music, Plus } from 'lucide-react';
import RavenclawTaurusMascot from '../RavenclawTaurusMascot';
import { AlbumItem } from '../../contexts/DataContext';
import { formatTime } from './utils';

// --- MASCOT ---
export const FlyingBroomMascot = () => {
  const mascotRef = useRef<HTMLDivElement>(null);
  const [sparkles, setSparkles] = useState<{id: number, x: number, y: number, size: number}[]>([]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (mascotRef.current) {
        const rect = mascotRef.current.getBoundingClientRect();
        const tailX = rect.left + (rect.width * 0.2); 
        const tailY = rect.top + (rect.height * 0.8);
        setSparkles(prev => [...prev.slice(-20), { id: Date.now(), x: tailX + (Math.random() * 20 - 10), y: tailY + (Math.random() * 20 - 10), size: Math.random() * 8 + 4 }]); 
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);
  return (
    <>
      {sparkles.map(s => (<div key={s.id} className="sparkle-trail" style={{ left: s.x, top: s.y, width: s.size, height: s.size }} />))}
      <div ref={mascotRef} className="absolute bottom-4 left-4 animate-mascot-intro"><div className="transform -rotate-12"><RavenclawTaurusMascot variant="music" placement="right" forceOpen={false} className="scale-150" /></div></div>
    </>
  );
};

// --- MINI PLAYER ---
interface MiniPlayerProps {
    currentTrack: AlbumItem | null; isPlaying: boolean; onTogglePlay: () => void;
    onNext: () => void; onPrev: () => void; currentTime: number; duration: number;
    onSeek: (time: number) => void; volume: number; onVolumeChange: (vol: number) => void;
}
export const MiniPlayer: React.FC<MiniPlayerProps> = ({ currentTrack, isPlaying, onTogglePlay, onNext, onPrev, currentTime, duration, onSeek, volume, onVolumeChange }) => {
    if (!currentTrack) return null;
    return (
        <div className="fixed bottom-0 left-0 right-0 h-24 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 z-[100] animate-slide-in flex items-center px-4 md:px-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-4 w-1/3 min-w-[200px]">
                <div className={`w-14 h-14 rounded-full overflow-hidden border-2 border-slate-700 shadow-lg relative ${isPlaying ? 'animate-spin-slow' : ''}`}>
                    <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center"><div className="w-4 h-4 bg-slate-900 rounded-full border border-white/20"></div></div>
                </div>
                <div className="hidden md:block overflow-hidden"><h4 className="text-white font-bold truncate max-w-[150px]">{currentTrack.title}</h4><p className="text-xs text-slate-400 truncate">{currentTrack.artist}</p></div>
            </div>
            <div className="flex flex-col items-center justify-center flex-1 max-w-xl">
                <div className="flex items-center gap-6 mb-2">
                    <button onClick={onPrev} className="text-slate-400 hover:text-white transition-colors"><SkipBack size={20} fill="currentColor" /></button>
                    <button onClick={onTogglePlay} className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/20">{isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}</button>
                    <button onClick={onNext} className="text-slate-400 hover:text-white transition-colors"><SkipForward size={20} fill="currentColor" /></button>
                </div>
                <div className="w-full flex items-center gap-3 text-xs text-slate-400 font-mono"><span>{formatTime(currentTime)}</span><input type="range" min="0" max={duration || 100} value={currentTime} onChange={(e) => onSeek(Number(e.target.value))} className="range-slider w-full h-1 bg-slate-700 rounded-full appearance-none"/><span>{formatTime(duration)}</span></div>
            </div>
            <div className="w-1/3 flex items-center justify-end gap-4 min-w-[150px]">
                <div className="flex items-center gap-2 group"><button onClick={() => onVolumeChange(volume === 0 ? 100 : 0)} className="text-slate-400 hover:text-white">{volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}</button><input type="range" min="0" max="100" value={volume} onChange={(e) => onVolumeChange(Number(e.target.value))} className="w-20 range-slider h-1 bg-slate-700 rounded-full"/></div>
            </div>
        </div>
    );
};

// --- SPOTLIGHT HERO ---
export const SpotlightHero = ({ item, onClick, onNext, onPrev, total, currentIndex }: any) => {
    if (!item) return null;
    return (
        <div className="relative w-full overflow-hidden rounded-3xl mb-12 group cursor-pointer shadow-2xl animate-appear-from-void min-h-[350px]">
             {total > 1 && ( <><div onClick={(e) => {e.stopPropagation(); onPrev();}} className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-black/30 hover:bg-black/60 backdrop-blur-md rounded-full text-white/50 hover:text-white transition-all cursor-pointer hover:scale-110"><ChevronLeft size={24} /></div><div onClick={(e) => {e.stopPropagation(); onNext();}} className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-black/30 hover:bg-black/60 backdrop-blur-md rounded-full text-white/50 hover:text-white transition-all cursor-pointer hover:scale-110"><ChevronRight size={24} /></div></> )}
            <div key={`bg-${item.id}`} className="absolute inset-0 z-0 transition-opacity duration-700"><img src={item.coverUrl} alt="" className="w-full h-full object-cover blur-[80px] opacity-60 scale-150 animate-pulse-glow" /><div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/60 to-transparent"></div><div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div></div>
            <div key={item.id} className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row items-end md:items-center gap-6 md:gap-10 h-full animate-slide-in" onClick={onClick}>
                <div className="w-40 h-40 md:w-56 md:h-56 shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden transform transition-transform duration-500 group-hover:scale-105 group-hover:rotate-2 border border-white/10"><img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" /></div>
                <div className="flex-1 space-y-3 pb-2"><div className="flex items-center gap-2 mb-2"><span className="bg-cyan-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-[0_0_15px_rgba(6,182,212,0.6)]"><Sparkles size={10} fill="currentColor"/> Editor's Choice</span>{total > 1 && <span className="text-[10px] text-slate-400 font-mono tracking-widest">{currentIndex + 1} / {total}</span>}</div><h2 className="text-3xl md:text-5xl font-bold text-white leading-tight drop-shadow-lg group-hover:text-cyan-200 transition-colors line-clamp-2">{item.title}</h2><div className="flex items-center gap-3 text-lg md:text-xl text-slate-300 font-medium"><span>{item.artist}</span><span className="w-1 h-1 rounded-full bg-slate-500"></span><span className="text-sm font-mono opacity-70">{item.year}</span></div>{item.description && ( <p className="text-sm text-slate-400 italic max-w-xl line-clamp-2 opacity-80 border-l-2 border-cyan-500/50 pl-3 mt-2">"{item.description}"</p> )}<div className="pt-4 flex items-center gap-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"><div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30"><Play size={24} fill="currentColor" className="ml-1"/></div><span className="text-sm font-bold text-white uppercase tracking-wider">Nghe Ngay</span></div></div>
            </div>
            {total > 1 && ( <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">{Array.from({ length: Math.min(total, 5) }).map((_, idx) => ( <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === (currentIndex % 5) ? 'bg-cyan-400 w-4' : 'bg-white/20'}`}></div> ))}</div> )}
        </div>
    );
};

// --- JEWEL CASE 3D ---
export const JewelCase3D: React.FC<{ item: AlbumItem; isPlayingThis?: boolean; onClick: () => void; onEdit: () => void; }> = ({ item, isPlayingThis, onClick, onEdit }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickCountRef = useRef(0);
  const handleInteraction = (e: React.MouseEvent) => {
    e.stopPropagation(); clickCountRef.current += 1;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (clickCountRef.current === 2) { clickCountRef.current = 0; onEdit(); } 
    else { timerRef.current = setTimeout(() => { if (clickCountRef.current === 1) onClick(); clickCountRef.current = 0; timerRef.current = null; }, 250); }
  };
  return (
    <div className="flex flex-col items-center gap-3 group relative z-10 hover:z-20 transition-all duration-300">
        <div onClick={handleInteraction} className="relative w-36 h-36 cursor-pointer perspective-[800px] touch-manipulation">
          <div className="absolute bottom-0 left-4 right-4 h-4 bg-black/40 blur-xl rounded-full transform translate-y-2 group-hover:scale-75 transition-transform duration-500"></div>
          <div className={`w-full h-full preserve-3d transition-transform duration-500 ${isPlayingThis ? '-translate-y-4 rotate-x-6 rotate-y-12' : 'group-hover:-translate-y-4 group-hover:rotate-x-6 group-hover:rotate-y-12'}`}>
            <div className={`absolute top-1 left-1 w-32 h-32 rounded-full flex items-center justify-center transition-transform duration-[3s] linear shadow-lg ${isPlayingThis ? 'translate-x-16 animate-spin-slow' : 'group-hover:translate-x-16 group-hover:rotate-[360deg] duration-700'}`}
                 style={{ background: `conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.4) 20%, transparent 30%, transparent 100%), radial-gradient(circle, #334155 30%, #0f172a 100%)` }}>
              <div className="absolute inset-0 rounded-full opacity-60 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 mix-blend-screen"></div>
              <div className="w-10 h-10 bg-slate-950 rounded-full border border-white/10"></div>
              {item.isFavorite && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-400 drop-shadow-md z-10 text-xl animate-pulse">★</div>}
            </div>
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 shadow-xl overflow-hidden transform origin-left transition-transform duration-500 group-hover:rotate-y-[-15deg]">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent z-20 pointer-events-none mix-blend-overlay"></div>
                {item.coverUrl ? ( <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-110" /> ) : ( <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-2 text-center"><Music size={32} className="text-white/20 mb-2" /><span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">{item.title}</span></div> )}
                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/40 z-30"></div>
            </div>
          </div>
        </div>
        <div className={`text-center w-40 pointer-events-none transition-all duration-300 ${isPlayingThis ? 'text-cyan-400 translate-y-1' : 'group-hover:translate-y-1'}`}>
            <h3 className="text-xs font-bold leading-tight drop-shadow-md truncate px-1">{item.title}</h3>
            <p className="text-[10px] text-white/50 font-medium uppercase tracking-wider mt-1 truncate">{item.artist}</p>
        </div>
    </div>
  );
};

export const AddNewAlbum = ({ onClick }: { onClick: () => void }) => (
    <div onClick={onClick} className="mb-12 w-36 h-36 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-400/30 transition-all cursor-pointer group hover:scale-105 backdrop-blur-sm">
       <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors"><Plus className="text-white/30 group-hover:text-cyan-400" /></div>
       <span className="mt-3 text-[10px] text-white/30 font-mono uppercase tracking-widest group-hover:text-cyan-300">Add Music</span>
    </div>
);
