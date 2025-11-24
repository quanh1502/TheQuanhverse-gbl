
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RoomConfig, RoomType } from '../types';
import { User, Coffee, Headphones, Cpu, CircleDashed, Hand, Settings, Download, Upload, Trash2, X } from 'lucide-react';
import RavenclawTaurusMascot from '../components/RavenclawTaurusMascot';
import { useData } from '../contexts/DataContext';

interface TheVoidProps {
  onEnterRoom: (room: RoomType) => void;
  isExiting: boolean;
}

// Room Definitions
const rooms: RoomConfig[] = [
  { 
    id: RoomType.IDENTITY, 
    title: 'Bản Ngã', 
    description: 'ISTJ • Taurus',
    icon: User, 
    color: 'text-emerald-400',
  },
  { 
    id: RoomType.CAFE, 
    title: 'Cà Phê', 
    description: 'Năng lượng đen', 
    icon: Coffee, 
    color: 'text-orange-400',
  },
  { 
    id: RoomType.AUDIO, 
    title: 'Âm Nhạc', 
    description: 'Audiophile', 
    icon: Headphones, 
    color: 'text-cyan-400',
  },
  { 
    id: RoomType.TECH, 
    title: 'Công Nghệ', 
    description: 'Đồ chơi số', 
    icon: Cpu, 
    color: 'text-blue-500',
  },
  { 
    id: RoomType.PRISM, 
    title: 'Lăng Kính', 
    description: 'Ambivert', 
    icon: CircleDashed, 
    color: 'text-purple-400',
  },
];

const SettingsModal = ({ onClose }: { onClose: () => void }) => {
  const { exportData, importData, resetData } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string>("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const success = await importData(file);
      if (success) {
        setImportStatus("Import successful! Reloading...");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setImportStatus("Import failed. Invalid file.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-zoom-in">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-serif text-slate-200">Data Management</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20}/></button>
         </div>

         <div className="space-y-4">
            {/* Export */}
            <button 
              onClick={exportData}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-indigo-900/30 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/50 hover:text-indigo-100 transition-all"
            >
               <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Download size={20} />
               </div>
               <div className="text-left">
                  <div className="font-bold text-sm">Backup Data</div>
                  <div className="text-[10px] opacity-70">Download JSON file</div>
               </div>
            </button>

            {/* Import */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-emerald-900/30 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50 hover:text-emerald-100 transition-all"
            >
               <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Upload size={20} />
               </div>
               <div className="text-left">
                  <div className="font-bold text-sm">Restore Data</div>
                  <div className="text-[10px] opacity-70">Upload Backup JSON</div>
               </div>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
            
            {importStatus && <p className="text-center text-xs text-emerald-400">{importStatus}</p>}

            <div className="h-px bg-slate-800 my-4"></div>

            {/* Reset */}
            <button 
              onClick={resetData}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors text-xs uppercase font-bold tracking-wider"
            >
               <Trash2 size={14} />
               Reset All Data
            </button>
         </div>
      </div>
    </div>
  );
};

const TheVoid: React.FC<TheVoidProps> = ({ onEnterRoom, isExiting }) => {
  const [activeIndex, setActiveIndex] = useState(2); // Start with Audio (center)
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const startXRef = useRef(0);
  const isClickRef = useRef(true); // To distinguish drag from click

  // --- Navigation Logic ---
  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % rooms.length);
  }, []);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + rooms.length) % rooms.length);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isExiting) return;
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'Enter') onEnterRoom(rooms[activeIndex].id);
  }, [handleNext, handlePrev, isExiting, onEnterRoom, activeIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // --- Swipe / Drag Handlers ---
  const handleStart = (clientX: number) => {
    if (isExiting) return;
    setIsDragging(true);
    startXRef.current = clientX;
    isClickRef.current = true;
    setDragX(0);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startXRef.current;
    setDragX(diff);
    
    // If moved significantly, it's not a click
    if (Math.abs(diff) > 5) {
      isClickRef.current = false;
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = window.innerWidth * 0.15; // 15% screen width to trigger switch
    
    if (dragX < -threshold) {
      handleNext();
    } else if (dragX > threshold) {
      handlePrev();
    }
    
    // Animate snap back
    setDragX(0);
  };

  // --- Render Helpers ---
  const getDoorColor = (id: RoomType) => {
    switch (id) {
        case RoomType.AUDIO: return 'bg-[#0f172a]'; // Navy
        case RoomType.CAFE: return 'bg-[#3e2723]'; // Brown
        case RoomType.IDENTITY: return 'bg-[#064e3b]';
        case RoomType.TECH: return 'bg-[#1e293b]';
        case RoomType.PRISM: return 'bg-[#312e81]';
        default: return 'bg-slate-900';
    }
  };

  const getRoomDisplayTitle = (id: RoomType) => {
      switch (id) {
          case RoomType.AUDIO: return "QUANHZIK";
          case RoomType.CAFE: return "THE ROASTERY";
          case RoomType.IDENTITY: return "THE ARCHITECT";
          case RoomType.TECH: return "LABORATORY";
          case RoomType.PRISM: return "PRISM";
          default: return "UNKNOWN";
      }
  };

  const getMascotConfig = (id: RoomType) => {
      if (id === RoomType.AUDIO) {
          return { variant: 'music' as const, greeting: "Tận hưởng giai điệu đi Muggle" };
      }
      if (id === RoomType.CAFE) {
          return { variant: 'coffee' as const, greeting: "Cà phê không Muggle?" };
      }
      return { variant: 'default' as const, greeting: "Khám phá cánh cửa này nhé?" };
  };

  return (
    <div 
      className={`
        h-screen w-full flex flex-col items-center justify-center relative z-10 overflow-hidden perspective-container bg-slate-950
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
      `}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      
      {/* Settings Button */}
      <div className={`absolute top-6 right-6 z-50 transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
         <button 
           onClick={() => setShowSettings(true)}
           className="p-3 rounded-full bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white backdrop-blur-md border border-white/10 shadow-lg transition-all hover:rotate-90"
         >
            <Settings size={20} />
         </button>
      </div>

      {/* Title Layer */}
      <div className={`absolute top-10 z-0 text-center pointer-events-none transition-all duration-700 ${isExiting ? 'opacity-0 -translate-y-10' : 'opacity-100 translate-y-0'}`}>
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-indigo-100 to-slate-500 tracking-[0.2em] font-serif">
          MIND PALACE
        </h1>
        <p className="text-slate-500 text-xs font-mono mt-2 tracking-widest uppercase flex items-center justify-center gap-2">
           <Hand size={14} className="animate-pulse" /> Swipe to navigate
        </p>
      </div>

      {/* 3D Carousel Container */}
      <div 
        className={`
          relative w-full h-[600px] preserve-3d flex items-center justify-center
          transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]
          ${isExiting ? 'scale-[3] opacity-0' : 'scale-100 opacity-100'}
        `}
      >
        {rooms.map((room, index) => {
          const dragOffsetVW = (dragX / window.innerWidth) * 60;
          let offset = index - activeIndex;
          const isActive = index === activeIndex;
          const mascotConfig = getMascotConfig(room.id);
          const doorColorClass = getDoorColor(room.id);

          const xOffset = (offset * 60) + dragOffsetVW; 
          const distanceFromCenter = Math.abs(xOffset); 
          const isVisuallyCenter = distanceFromCenter < 30;

          const zOffset = Math.max(-1000, -15 * distanceFromCenter); 
          const rotateY = xOffset > 0 ? -45 : (xOffset < 0 ? 45 : 0);
          
          const opacity = Math.max(0, 1 - (distanceFromCenter / 100)); 
          const blur = Math.min(10, distanceFromCenter / 10);
          const scale = Math.max(0.8, 1 - (distanceFromCenter / 300));

          return (
            <div
              key={room.id}
              onClick={(e) => {
                  e.stopPropagation();
                  if (isClickRef.current) {
                      if (isActive) onEnterRoom(room.id);
                      else setActiveIndex(index);
                  }
              }}
              className={`
                absolute preserve-3d transition-all
                w-48 h-80 md:w-64 md:h-96
              `}
              style={{
                transitionDuration: isDragging ? '0ms' : '700ms',
                transform: `translateX(${xOffset}vw) translateZ(${zOffset}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity: opacity, 
                filter: `blur(${blur}px)`,
                zIndex: isVisuallyCenter ? 50 : 10 - Math.min(5, Math.abs(Math.round(offset))),
                pointerEvents: opacity < 0.1 ? 'none' : 'auto',
              }}
            >
              
              {/* --- MASCOT (Floating Left) --- */}
              <div 
                className={`absolute bottom-0 -left-20 md:-left-32 z-50 transition-all duration-500 delay-300 ${isVisuallyCenter ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
              >
                 <RavenclawTaurusMascot 
                    variant={mascotConfig.variant}
                    greeting={mascotConfig.greeting}
                    size="small"
                    withHint={true}
                 />
              </div>

              {/* --- THE DOOR STRUCTURE --- */}
              <div className="relative w-full h-full preserve-3d group cursor-pointer">
                 
                 {/* Shadow on Floor */}
                 <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-full h-8 bg-black/50 blur-xl rounded-[100%] transform rotateX(70deg)"></div>

                 {/* Door Frame */}
                 <div className="absolute inset-0 border-[8px] md:border-[12px] border-slate-900 bg-slate-950 shadow-2xl transform translate-z-[-2px] rounded-t-lg"></div>

                 {/* Backlight Glow */}
                 <div className={`absolute inset-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl ${room.color.replace('text-', 'bg-')}`}></div>

                 {/* THE DOOR PANEL */}
                 <div className={`
                    absolute top-[12px] bottom-0 left-[12px] right-[12px]
                    ${doorColorClass}
                    origin-left transition-transform duration-1000 ease-in-out
                    ${isActive && isVisuallyCenter ? 'group-hover:rotate-y-[-40deg]' : ''} preserve-3d
                    border-r border-t border-white/10 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]
                 `}>
                    
                    {/* Wood/Metal Texture Overlay */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] mix-blend-overlay"></div>
                    <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_bottom,transparent,black)]"></div>

                    {/* --- DOOR PANELS (3D Relief) --- */}
                    <div className="absolute inset-0 p-4 flex flex-col gap-6 preserve-3d">
                        
                        {/* Nameplate Area (Top) */}
                        <div className="relative h-24 flex items-center justify-center mt-2 transform translate-z-[2px]">
                            {/* The Plaque */}
                            <div className="bg-gradient-to-br from-slate-900 via-black to-slate-900 border-2 border-amber-600/60 shadow-[0_5px_15px_rgba(0,0,0,0.5)] px-4 py-2 rounded-sm relative w-full max-w-[90%]">
                                {/* Screws */}
                                <div className="absolute top-1 left-1 w-1 h-1 bg-amber-700 rounded-full shadow-inner"></div>
                                <div className="absolute top-1 right-1 w-1 h-1 bg-amber-700 rounded-full shadow-inner"></div>
                                <div className="absolute bottom-1 left-1 w-1 h-1 bg-amber-700 rounded-full shadow-inner"></div>
                                <div className="absolute bottom-1 right-1 w-1 h-1 bg-amber-700 rounded-full shadow-inner"></div>
                                
                                <h3 className={`text-xs md:text-sm font-bold ${room.color} tracking-[0.2em] uppercase font-serif text-center drop-shadow-md`}>
                                    {getRoomDisplayTitle(room.id)}
                                </h3>
                            </div>
                        </div>

                        {/* Top Panel */}
                        <div className="flex-1 relative mx-2 bg-black/10 shadow-[inset_2px_2px_10px_rgba(0,0,0,0.6),1px_1px_0px_rgba(255,255,255,0.05)] rounded-sm border border-black/20">
                            <div className="absolute inset-2 border border-black/10 opacity-50"></div>
                        </div>

                        {/* Bottom Panel */}
                        <div className="h-1/3 relative mx-2 bg-black/10 shadow-[inset_2px_2px_10px_rgba(0,0,0,0.6),1px_1px_0px_rgba(255,255,255,0.05)] rounded-sm border border-black/20">
                            <div className="absolute inset-2 border border-black/10 opacity-50"></div>
                        </div>

                    </div>

                    {/* --- HANDLE / KNOB --- */}
                    <div className="absolute top-1/2 right-3 md:right-4 w-4 h-12 md:w-5 md:h-16 bg-gradient-to-b from-amber-700 to-amber-900 rounded-full shadow-[2px_4px_8px_rgba(0,0,0,0.6)] flex items-center justify-center transform translate-z-[4px] group-hover:translate-z-[6px] transition-transform">
                        {/* Knob Shine */}
                        <div className="w-1 h-10 bg-amber-500/30 rounded-full blur-[1px]"></div>
                        {/* Backplate */}
                        <div className="absolute -z-10 w-6 h-16 md:w-8 md:h-20 bg-black/40 blur-[1px] rounded-full"></div>
                    </div>

                 </div>

                 {/* PORTAL VIEW (Inside the frame, behind the door) */}
                 <div className="absolute top-[12px] bottom-0 left-[12px] right-[12px] bg-black overflow-hidden translate-z-[-1px] flex items-center justify-center">
                    <div className={`absolute inset-0 opacity-50 ${room.color.replace('text-', 'bg-')} animate-pulse`}></div>
                    <div className="relative z-10">
                        <room.icon size={48} className="text-white opacity-90 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    </div>
                 </div>

              </div>
            </div>
          );
        })}
      </div>
      
      {/* Navigation Indicators (Dots only) */}
      <div className={`absolute bottom-10 flex gap-2 items-center transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
        {rooms.map((_, i) => (
            <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'bg-indigo-400 w-8' : 'bg-slate-800 w-1.5'}`}
            />
        ))}
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

    </div>
  );
};

export default TheVoid;
