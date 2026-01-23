import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, AlertTriangle, ChevronLeft, ChevronRight, Music, Plus, Repeat, Heart, ListMusic } from 'lucide-react';
import { AlbumItem } from '../../contexts/DataContext';
import RavenclawTaurusMascot from '../../components/RavenclawTaurusMascot';
import { formatTime } from './utils';

// --- MASCOT (Giữ nguyên) ---
export const FlyingBroomMascot = () => {
  // ... (Code cũ giữ nguyên)
  return <div />; // Placeholder để ngắn gọn, bạn giữ code cũ nhé
};

// --- MINI PLAYER (UI/UX UPGRADE) ---
interface MiniPlayerProps {
    currentTrack: AlbumItem | null;
    isPlaying: boolean;
    onTogglePlay: () => void;
    onNext: () => void;
    onPrev: () => void;
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
    volume: number;
    onVolumeChange: (vol: number) => void;
    isLooping: boolean;
    onToggleLoop: () => void;
    onToggleFavorite: () => void;
    onToggleQueue?: () => void; // Thêm nút mở danh sách chờ (nếu muốn mở rộng sau này)
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ 
    currentTrack, isPlaying, onTogglePlay, onNext, onPrev, 
    currentTime, duration, onSeek, volume, onVolumeChange,
    isLooping, onToggleLoop, onToggleFavorite 
}) => {
    if (!currentTrack) return null;

    // Tính phần trăm để làm thanh progress gradient
    const progressPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-[100] animate-slide-in">
            {/* Glass Container */}
            <div className={`
                relative bg-slate-900/60 backdrop-blur-xl rounded-3xl p-4 
                border border-white/10 shadow-2xl transition-all duration-500
                ${isPlaying ? 'shadow-[0_0_30px_rgba(6,182,212,0.15)] border-cyan-500/30' : ''}
            `}>
                {/* Progress Bar chạy dọc trên đầu Player */}
                <div className="absolute top-0 left-4 right-4 h-[2px] bg-white/10 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 shadow-[0_0_10px_#22d3ee]"
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>

                <div className="flex items-center justify-between gap-4 mt-2">
                    
                    {/* 1. Track Info & Cover */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`
                            relative w-14 h-14 rounded-full overflow-hidden border-2 
                            ${isPlaying ? 'animate-spin-slow border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'border-slate-600'}
                        `}>
                            <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover" />
                            {/* Inner hole for Vinyl look */}
                            <div className="absolute inset-0 m-auto w-3 h-3 bg-slate-900 rounded-full border border-white/20"></div>
                        </div>
                        <div className="overflow-hidden">
                            <h4 className="text-white font-bold truncate text-sm md:text-base">
                                {currentTrack.title}
                            </h4>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-slate-400 truncate max-w-[100px] md:max-w-xs">{currentTrack.artist}</p>
                                <button onClick={onToggleFavorite} className={`transition-transform hover:scale-110 ${currentTrack.isFavorite ? 'text-amber-400' : 'text-slate-600 hover:text-white'}`}>
                                    <Heart size={14} fill={currentTrack.isFavorite ? "currentColor" : "none"} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 2. Controls (Centered) */}
                    <div className="flex items-center gap-4 md:gap-6">
                        <button onClick={onToggleLoop} className={`transition-colors hidden md:block ${isLooping ? 'text-cyan-400' : 'text-slate-500 hover:text-white'}`}>
                            <Repeat size={18} />
                        </button>
                        
                        <button onClick={onPrev} className="text-slate-400 hover:text-white transition-colors p-2"><SkipBack size={20} fill="currentColor" /></button>
                        
                        <button 
                            onClick={onTogglePlay} 
                            className={`
                                w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105
                                ${isPlaying ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'bg-white text-slate-900'}
                            `}
                        >
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                        </button>
                        
                        <button onClick={onNext} className="text-slate-400 hover:text-white transition-colors p-2"><SkipForward size={20} fill="currentColor" /></button>
                        
                        <div className="hidden md:flex items-center gap-2 w-24">
                            <button onClick={() => onVolumeChange(volume === 0 ? 100 : 0)} className="text-slate-400 hover:text-white">
                                {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>
                            <input type="range" min="0" max="100" value={volume} onChange={(e) => onVolumeChange(Number(e.target.value))} className="range-slider h-1 bg-slate-700 rounded-full w-full"/>
                        </div>
                    </div>

                    {/* 3. Time (Desktop only) */}
                    <div className="hidden md:block text-xs text-slate-500 font-mono w-20 text-right">
                         {formatTime(currentTime)}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- JEWEL CASE 3D (LOGIC UPDATE & HEALTH CHECK) ---
interface JewelCaseProps {
    item: AlbumItem;
    isPlayingThis?: boolean;
    isError?: boolean; // NEW: Trạng thái lỗi
    onClick: () => void;
    onEdit: () => void;
}

export const JewelCase3D: React.FC<JewelCaseProps> = ({ item, isPlayingThis, isError, onClick, onEdit }) => {
  // Logic cũ: clickCount + timer. Giờ ta sẽ đơn giản hóa để UX mượt hơn.
  // Click -> Trigger onClick (Cha sẽ quyết định Play hay Zoom tùy context Mobile/Desktop)
  // Double Click -> Trigger Edit
  // Right Click -> Edit (cho Desktop tiện hơn)
  
  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      onEdit();
  };

  return (
    <div className="flex flex-col items-center gap-3 group relative z-10 hover:z-20 transition-all duration-300">
        <div 
            onClick={onClick} 
            onContextMenu={handleContextMenu}
            className="relative w-36 h-36 cursor-pointer perspective-[800px] touch-manipulation"
        >
          {/* Shadow & Glow */}
          <div className={`absolute bottom-0 left-4 right-4 h-4 bg-black/40 blur-xl rounded-full transform translate-y-2 group-hover:scale-75 transition-transform duration-500 ${isPlayingThis ? 'bg-cyan-500/20' : ''}`}></div>
          
          <div className={`w-full h-full preserve-3d transition-transform duration-500 ${isPlayingThis ? '-translate-y-4 rotate-x-6 rotate-y-12' : 'group-hover:-translate-y-4 group-hover:rotate-x-6 group-hover:rotate-y-12'}`}>
            
            {/* CD Disc inside */}
            <div className={`absolute top-1 left-1 w-32 h-32 rounded-full flex items-center justify-center transition-transform duration-[3s] linear shadow-lg ${isPlayingThis ? 'translate-x-16 animate-spin-slow' : 'group-hover:translate-x-16 group-hover:rotate-[360deg] duration-700'}`}
                 style={{ background: `conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.4) 20%, transparent 30%, transparent 100%), radial-gradient(circle, #334155 30%, #0f172a 100%)` }}>
              <div className="absolute inset-0 rounded-full opacity-60 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 mix-blend-screen"></div>
              <div className="w-10 h-10 bg-slate-950 rounded-full border border-white/10"></div>
              {item.isFavorite && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-400 drop-shadow-md z-10 text-xl animate-pulse">★</div>}
            </div>

            {/* Case Cover */}
            <div className={`absolute inset-0 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 shadow-xl overflow-hidden transform origin-left transition-transform duration-500 group-hover:rotate-y-[-15deg] ${isError ? 'border-red-500/50' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent z-20 pointer-events-none mix-blend-overlay"></div>
                
                {item.coverUrl ? ( 
                    <img src={item.coverUrl} alt={item.title} className={`w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-110 ${isError ? 'grayscale' : ''}`} /> 
                ) : ( 
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-2 text-center">
                        <Music size={32} className="text-white/20 mb-2" />
                        <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">{item.title}</span>
                    </div> 
                )}

                {/* ERROR INDICATOR */}
                {isError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
                        <AlertTriangle size={32} className="text-red-500 animate-pulse" />
                    </div>
                )}
                
                {/* Playing Indicator Overlay */}
                {isPlayingThis && !isError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-30">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/80 flex items-center justify-center backdrop-blur-md shadow-[0_0_15px_#22d3ee]">
                            <div className="w-1 h-3 bg-white mx-0.5 animate-bounce"></div>
                            <div className="w-1 h-4 bg-white mx-0.5 animate-bounce delay-75"></div>
                            <div className="w-1 h-3 bg-white mx-0.5 animate-bounce delay-150"></div>
                        </div>
                    </div>
                )}

                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/40 z-30"></div>
            </div>
          </div>
        </div>
        
        {/* Title */}
        <div className={`text-center w-40 pointer-events-none transition-all duration-300 ${isPlayingThis ? 'text-cyan-400 translate-y-1' : 'group-hover:translate-y-1'}`}>
            <h3 className={`text-xs font-bold leading-tight drop-shadow-md truncate px-1 ${isError ? 'text-red-400 line-through' : ''}`}>{item.title}</h3>
            <p className="text-[10px] text-white/50 font-medium uppercase tracking-wider mt-1 truncate">{item.artist}</p>
        </div>
    </div>
  );
};

// ... SpotlightHero và AddNewAlbum giữ nguyên hoặc chỉnh sửa nhẹ ...
export const SpotlightHero = ({ item, onClick, onNext, onPrev, total, currentIndex }: any) => {
    // Code cũ giữ nguyên
    return <div />; // Placeholder
};

export const AddNewAlbum = ({ onClick }: { onClick: () => void }) => (
    <div onClick={onClick} className="mb-12 w-36 h-36 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-400/30 transition-all cursor-pointer group hover:scale-105 backdrop-blur-sm">
       <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors"><Plus className="text-white/30 group-hover:text-cyan-400" /></div>
       <span className="mt-3 text-[10px] text-white/30 font-mono uppercase tracking-widest group-hover:text-cyan-300">Add Music</span>
    </div>
);
