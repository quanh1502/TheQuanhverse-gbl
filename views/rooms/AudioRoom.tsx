import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Music, Plus, X, Save, Trash2, Edit3, Headphones, Mic2, Upload, 
  Link as LinkIcon, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Calendar, Wand2, Loader2, ChevronRight, ArrowLeft, Grid, Search, Disc, 
  Check, MapPin, List, LayoutGrid, Library, Filter, ArrowUpDown, Heart, 
  Sparkles, Share2, ChevronLeft, Repeat, Shuffle
} from 'lucide-react';
import RavenclawTaurusMascot from '../../components/RavenclawTaurusMascot';
import { AlbumItem, AudioShelfData } from '../../contexts/DataContext';
import { analyzeYoutubeMetadata } from '../../services/geminiService';

// --- IMPORT FIREBASE ---
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// --- GLOBAL STYLES & ANIMATIONS ---
const globalStyles = `
  @keyframes flyInCircle {
    0% { bottom: 20px; left: 20px; transform: scale(0.5) rotate(0deg); opacity: 0; }
    30% { bottom: 60%; left: 20%; transform: scale(0.8) rotate(15deg); opacity: 1; }
    60% { bottom: 80%; left: 80%; transform: scale(1) rotate(-15deg); }
    100% { bottom: 50%; left: 50%; transform: translate(-50%, 50%) scale(1.5) rotate(0deg); }
  }
  @keyframes sparkleDrop {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(0) translate(0, 30px); opacity: 0; }
  }
  @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
  @keyframes float-delayed { 0% { transform: translateY(0px); } 50% { transform: translateY(10px); } 100% { transform: translateY(0px); } }
  @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(6,182,212,0.2); } 50% { box-shadow: 0 0 40px rgba(6,182,212,0.5); } }
  @keyframes slide-in { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  
  .animate-spin-slow { animation: spin-slow 8s linear infinite; }
  .animate-slide-in { animation: slide-in 0.5s ease-out forwards; }
  .animate-mascot-intro { animation: flyInCircle 2.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
  .animate-float { animation: float 6s ease-in-out infinite; }
  .animate-float-delayed { animation: float-delayed 7s ease-in-out infinite; }
  .animate-pulse-glow { animation: pulse-glow 3s infinite; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  
  /* Custom Range Slider for Player */
  .range-slider { -webkit-appearance: none; background: transparent; cursor: pointer; }
  .range-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 12px; width: 12px; border-radius: 50%; background: #22d3ee; margin-top: -4px; box-shadow: 0 0 10px rgba(34,211,238,0.5); }
  .range-slider::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: rgba(255,255,255,0.1); border-radius: 2px; }
`;

// --- UTILITIES ---
const getYouTubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};
const getYouTubeThumbnail = (id: string) => `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;

const searchMusicDatabase = async (query: string) => {
  try {
    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=20`);
    if (!response.ok) throw new Error("iTunes API Error");
    const data = await response.json();
    return data.results && data.results.length > 0 ? data.results.map((item: any) => ({
      id: item.trackId,
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName,
      year: item.releaseDate ? item.releaseDate.substring(0, 4) : "",
      thumbnail: item.artworkUrl100.replace('100x100bb', '600x600bb'),
      youtubeSearchLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(item.trackName + " " + item.artistName + " lyrics")}`
    })) : [];
  } catch (error) { console.error("Music Search Error:", error); return []; }
};

const getMoodSearchQuery = (moodId: string) => {
  switch (moodId) {
    case 'joy': return ['happy upbeat pop', 'summer vibes', 'energetic dance'];
    case 'sad': return ['sad piano ballad', 'melancholic acoustic', 'heartbreak songs'];
    case 'anger': return ['heavy metal rock', 'intense workout music'];
    case 'empty': return ['lofi hip hop', 'ambient space music', 'deep focus music'];
    case 'dream': return ['dream pop', 'ethereal shoegaze', 'ambient electronic'];
    case 'heal': return ['healing frequencies', 'nature sounds music', 'meditation piano'];
    default: return ['relaxing music'];
  }
};

const getMascotMessage = (moodId: string) => {
  switch (moodId) {
    case 'joy': return "Năng lượng tuyệt vời! Ta tìm thấy thứ này để bồ 'quẩy' nè!";
    case 'sad': return "Ta biết bồ đang buồn. Hy vọng giai điệu này sẽ là cái ôm ấm áp.";
    case 'anger': return "Woah, nóng nảy thế! Xả hết ra với bài này đi!";
    case 'empty': return "Đôi khi ta cần khoảng lặng. Thử bài này xem, nó như trôi giữa vũ trụ vậy.";
    case 'dream': return "Muggle đang mơ mộng à? Bài này sẽ đưa bồ đi xa hơn nữa.";
    case 'heal': return "Hít thở sâu nào... Giai điệu chữa lành dành riêng cho bồ đây.";
    default: return "Chào mừng đến với phòng nhạc của Quanh! Tận hưởng nhé!";
  }
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// --- COMPONENT: FLYING MASCOT ---
const FlyingBroomMascot = () => {
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

// --- COMPONENT: MINI PLAYER (THE NEW STAR) ---
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
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ currentTrack, isPlaying, onTogglePlay, onNext, onPrev, currentTime, duration, onSeek, volume, onVolumeChange }) => {
    if (!currentTrack) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-24 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 z-[100] animate-slide-in flex items-center px-4 md:px-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            {/* 1. Track Info */}
            <div className="flex items-center gap-4 w-1/3 min-w-[200px]">
                <div className={`w-14 h-14 rounded-full overflow-hidden border-2 border-slate-700 shadow-lg relative ${isPlaying ? 'animate-spin-slow' : ''}`}>
                    <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 bg-slate-900 rounded-full border border-white/20"></div>
                    </div>
                </div>
                <div className="hidden md:block overflow-hidden">
                    <h4 className="text-white font-bold truncate max-w-[150px]">{currentTrack.title}</h4>
                    <p className="text-xs text-slate-400 truncate">{currentTrack.artist}</p>
                </div>
            </div>

            {/* 2. Controls & Progress */}
            <div className="flex flex-col items-center justify-center flex-1 max-w-xl">
                <div className="flex items-center gap-6 mb-2">
                    <button onClick={onPrev} className="text-slate-400 hover:text-white transition-colors"><SkipBack size={20} fill="currentColor" /></button>
                    <button onClick={onTogglePlay} className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/20">
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <button onClick={onNext} className="text-slate-400 hover:text-white transition-colors"><SkipForward size={20} fill="currentColor" /></button>
                </div>
                <div className="w-full flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <input 
                        type="range" min="0" max={duration || 100} value={currentTime} 
                        onChange={(e) => onSeek(Number(e.target.value))}
                        className="range-slider w-full h-1 bg-slate-700 rounded-full appearance-none"
                    />
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* 3. Volume & Extras */}
            <div className="w-1/3 flex items-center justify-end gap-4 min-w-[150px]">
                <div className="flex items-center gap-2 group">
                    <button onClick={() => onVolumeChange(volume === 0 ? 100 : 0)} className="text-slate-400 hover:text-white">
                        {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <input 
                        type="range" min="0" max="100" value={volume} 
                        onChange={(e) => onVolumeChange(Number(e.target.value))}
                        className="w-20 range-slider h-1 bg-slate-700 rounded-full"
                    />
                </div>
            </div>
        </div>
    );
};

// --- SPOTLIGHT HERO (Giữ nguyên) ---
const SpotlightHero = ({ item, onClick, onNext, onPrev, total, currentIndex }: { item: AlbumItem, onClick: () => void, onNext: () => void, onPrev: () => void, total: number, currentIndex: number }) => {
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

// --- SUB COMPONENTS (Visual Upgraded) ---
const JewelCase3D: React.FC<{ item: AlbumItem; isPlayingThis?: boolean; onClick: () => void; onEdit: () => void; }> = ({ item, isPlayingThis, onClick, onEdit }) => {
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

const AddNewAlbum = ({ onClick }: { onClick: () => void }) => (
    <div onClick={onClick} className="mb-12 w-36 h-36 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-400/30 transition-all cursor-pointer group hover:scale-105 backdrop-blur-sm">
       <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors"><Plus className="text-white/30 group-hover:text-cyan-400" /></div>
       <span className="mt-3 text-[10px] text-white/30 font-mono uppercase tracking-widest group-hover:text-cyan-300">Add Music</span>
    </div>
);

// --- MODALS (Updated to Play in App) ---
const DetailModal = ({ item, onClose, onPlay }: { item: AlbumItem, onClose: () => void, onPlay: () => void }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 perspective-[1200px]">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose}></div>
        <div className="relative w-full max-w-3xl bg-slate-900/50 border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(8,145,178,0.15)] overflow-hidden animate-zoom-in flex flex-col md:flex-row z-[105] backdrop-blur-2xl">
            <div className="w-full md:w-5/12 aspect-square md:aspect-auto relative group">
                {item.coverUrl ? ( <><img src={item.coverUrl.replace('100x100', '600x600')} alt={item.title} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:bg-gradient-to-r"></div></> ) : ( <div className="w-full h-full bg-gradient-to-br from-cyan-900/40 to-slate-900 flex items-center justify-center"><Music size={64} className="text-white/10" /></div> )}
                <button onClick={onClose} className="absolute top-4 right-4 md:hidden text-white bg-black/50 p-2 rounded-full backdrop-blur-md"><X size={20} /></button>
            </div>
            <div className="flex-1 p-8 md:p-10 flex flex-col relative">
                <button onClick={onClose} className="absolute top-6 right-6 hidden md:block text-white/30 hover:text-white transition-colors"><X size={24} /></button>
                <div className="flex-1">
                    {item.description && item.description.includes("Gợi ý") && ( <span className="inline-block text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full mb-4 border border-amber-500/10">✨ {item.description}</span> )}
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight tracking-tight">{item.title}</h2>
                    <p className="text-xl md:text-2xl text-cyan-400 font-medium opacity-80 mb-6">{item.artist}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-400 font-mono mb-8 border-b border-white/5 pb-6">
                        <span className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full"><Calendar size={14}/> {item.year || "Unknown"}</span>
                        {item.isFavorite && <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20"><Heart size={14} fill="currentColor"/> Favorite</span>}
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none"><p className="text-slate-300 leading-relaxed opacity-80">{item.description || "No notes added for this track."}</p></div>
                </div>
                <div className="mt-8 pt-6 border-t border-white/5">
                  {item.trackUrl ? ( 
                      <button onClick={onPlay} className="group flex items-center justify-between w-full p-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-cyan-500/25 transform hover:-translate-y-1">
                          <span className="pl-2">Phát Nhạc Ngay</span>
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-cyan-600 transition-colors">
                            <Play size={18} fill="currentColor" />
                          </div> 
                      </button>
                  ) : ( <div className="text-center text-slate-500 text-sm italic py-4">No link available</div> )}
                </div>
            </div>
        </div>
    </div>
);

const EditModal = ({ item, onClose, onSave, onDelete }: { item: AlbumItem, onClose: () => void, onSave: (item: AlbumItem) => void, onDelete: (id: number) => void }) => {
    // ... (Giữ nguyên logic EditModal như cũ, chỉ rút gọn để đỡ dài file)
    // ... (Bạn giữ nguyên phần code EditModal từ file trước nhé, không thay đổi gì)
  const [formData, setFormData] = useState<AlbumItem>({ ...item });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData(prev => ({ ...prev, coverUrl: reader.result as string })); reader.readAsDataURL(file); } };
  const handleAutoFill = async () => { if (!formData.trackUrl) return; setIsAnalyzing(true); try { const ytId = getYouTubeId(formData.trackUrl); if (ytId) setFormData(prev => ({ ...prev, coverUrl: getYouTubeThumbnail(ytId) })); const metadata = await analyzeYoutubeMetadata(formData.trackUrl); if (metadata) setFormData(prev => ({ ...prev, title: metadata.title || prev.title, artist: metadata.artist || prev.artist, year: metadata.year || prev.year })); } catch (e) { console.error(e); } finally { setIsAnalyzing(false); } };
  const handleMusicSearch = async () => { if(!searchQuery.trim()) return; setIsSearching(true); setSearchResults([]); const results = await searchMusicDatabase(searchQuery); setSearchResults(results); setIsSearching(false); };
  const handleSelectMusic = (music: any) => { setFormData(prev => ({ ...prev, title: music.title, artist: music.artist, coverUrl: music.thumbnail, year: music.year, trackUrl: music.youtubeSearchLink })); setIsSearchMode(false); };
  
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
       <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose}></div>
       <div className="relative bg-[#0f172a] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
          <div className="p-5 bg-white/5 border-b border-white/5 flex justify-between items-center shrink-0">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">{isSearchMode ? <Disc size={18} className="text-cyan-400" /> : <Edit3 size={18} className="text-cyan-400" />} {isSearchMode ? "Tìm nhạc (iTunes)" : "Chỉnh sửa đĩa"}</h3>
             <div className="flex items-center gap-2"><button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20}/></button></div>
          </div>
          <div className="p-6 space-y-5 overflow-y-auto scrollbar-hide relative min-h-[400px]">
             {isSearchMode ? (
                <div className="space-y-4 animate-fade-in">
                   <div className="flex gap-2"><input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleMusicSearch()} placeholder="Tên bài hát, ca sĩ..." className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none" /><button onClick={handleMusicSearch} className="bg-cyan-600 text-white px-4 rounded-xl text-sm font-bold">Tìm</button></div>
                   <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">{searchResults.map((music) => ( <div key={music.id} onClick={() => handleSelectMusic(music)} className="flex gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/10 items-center"><img src={music.thumbnail} alt="" className="w-12 h-12 object-cover rounded-lg" /><div className="flex-1 overflow-hidden"><h4 className="text-sm font-bold text-slate-200 truncate">{music.title}</h4><p className="text-xs text-slate-500 mt-0.5 truncate">{music.artist}</p></div><Plus size={18} className="text-slate-600"/></div>))}</div>
                   <button onClick={() => setIsSearchMode(false)} className="w-full py-2 text-xs text-slate-500 hover:text-white uppercase tracking-wider font-medium mt-4">Hủy</button>
                </div>
             ) : (
             <>
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 relative group aspect-square bg-slate-900 rounded-xl overflow-hidden border border-slate-700 cursor-pointer" onClick={() => fileInputRef.current?.click()}>{formData.coverUrl ? <img src={formData.coverUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2"><Upload size={20} /></div>}<input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" /></div>
                    <div className="col-span-2 space-y-3"><div><label className="text-[10px] text-cyan-500 uppercase font-bold mb-1 block">Bài Hát</label><input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white outline-none" /></div><div><label className="text-[10px] text-cyan-500 uppercase font-bold mb-1 block">Nghệ Sĩ</label><input type="text" value={formData.artist} onChange={(e) => setFormData({...formData, artist: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white outline-none" /></div></div>
                </div>
                <div><label className="text-[10px] text-cyan-500 uppercase font-bold mb-1 flex items-center justify-between">Youtube Link</label><div className="relative"><input type="text" value={formData.trackUrl || ''} onChange={(e) => setFormData({...formData, trackUrl: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-blue-300 outline-none pr-10" /><button onClick={handleAutoFill} disabled={!formData.trackUrl} className="absolute right-1 top-1 p-1.5 bg-cyan-500/10 rounded hover:bg-cyan-500 hover:text-white text-cyan-500 transition-colors disabled:opacity-50"><Wand2 size={14} /></button></div></div>
                <div><label className="text-[10px] text-cyan-500 uppercase font-bold mb-1 block">Ghi Chú</label><textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-300 outline-none h-24 resize-none" /></div>
                <div><label className="text-[10px] text-cyan-500 uppercase font-bold mb-1 block">Năm</label><input type="text" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} className="w-24 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white" /></div>
             </>
             )}
          </div>
          {!isSearchMode && (<div className="p-4 bg-white/5 border-t border-white/5 flex gap-3 shrink-0"><button onClick={() => onDelete(formData.id)} className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20"><Trash2 size={18} /></button><button onClick={() => onSave(formData)} className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold py-3 shadow-lg"><Save size={18} /> Lưu</button></div>)}
       </div>
    </div>
  );
};

// --- MAIN COMPONENT: AudioRoom ---
interface AudioRoomProps { initialMood?: string; }

// Extend Window interface for YouTube API
declare global { interface Window { onYouTubeIframeAPIReady: () => void; YT: any; } }

const AudioRoom: React.FC<AudioRoomProps> = ({ initialMood }) => {
  const [shelves, setShelves] = useState<AudioShelfData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [focusedShelfId, setFocusedShelfId] = useState<number | null>(null);
  
  const [viewMode, setViewMode] = useState<'shelves' | 'library'>('shelves'); 
  const [filterType, setFilterType] = useState<'all' | 'favorites'>('all');
  const [sortType, setSortType] = useState<'newest' | 'oldest' | 'az'>('newest');
  
  const PREVIEW_LIMIT = 8; 
  const [viewingItem, setViewingItem] = useState<AlbumItem | null>(null);
  const [editingItem, setEditingItem] = useState<{item: AlbumItem, shelfId: number} | null>(null);
  const [editingShelfId, setEditingShelfId] = useState<number | null>(null);
  const [tempShelfTitle, setTempShelfTitle] = useState("");
  const shelfRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const [mascotPhase, setMascotPhase] = useState<'flying' | 'greeting' | 'returning' | 'idle'>('flying');
  const [recommendedTrack, setRecommendedTrack] = useState<AlbumItem | null>(null);
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  // --- MUSIC PLAYER STATE ---
  const [activeTrack, setActiveTrack] = useState<AlbumItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<AlbumItem[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  
  const playerRef = useRef<any>(null); // YouTube Player Instance

  // 1. Load Data
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onSnapshot(collection(db, "audio-shelves"), 
      (snapshot) => {
        const loadedShelves = snapshot.docs.map(doc => doc.data() as AudioShelfData);
        loadedShelves.sort((a, b) => a.id - b.id);
        setShelves(loadedShelves);
        setIsLoading(false);
      },
      (error) => { console.error(error); setIsLoading(false); }
    );
    return () => unsubscribe();
  }, []);

  // 2. Load YouTube API
  useEffect(() => {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => { /* API Ready */ };
  }, []);

  // 3. Initialize/Update Player when Active Track Changes
  useEffect(() => {
      if (!activeTrack || !activeTrack.trackUrl) return;
      const videoId = getYouTubeId(activeTrack.trackUrl);
      if (!videoId) return;

      if (!playerRef.current) {
          playerRef.current = new window.YT.Player('youtube-player', {
              height: '0', width: '0', videoId: videoId,
              playerVars: { 'autoplay': 1, 'controls': 0, 'rel': 0, 'showinfo': 0 },
              events: {
                  'onReady': (event: any) => { event.target.setVolume(volume); event.target.playVideo(); setIsPlaying(true); setDuration(event.target.getDuration()); },
                  'onStateChange': (event: any) => {
                      if (event.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
                      if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
                      if (event.data === window.YT.PlayerState.ENDED) handleNextTrack();
                  }
              }
          });
      } else {
          playerRef.current.loadVideoById(videoId);
          playerRef.current.playVideo();
          setIsPlaying(true);
      }
  }, [activeTrack]);

  // 4. Progress Interval
  useEffect(() => {
      const interval = setInterval(() => {
          if (playerRef.current && isPlaying) {
              setCurrentTime(playerRef.current.getCurrentTime());
              setDuration(playerRef.current.getDuration());
          }
      }, 1000);
      return () => clearInterval(interval);
  }, [isPlaying]);

  // Player Controls
  const togglePlay = () => {
      if (!playerRef.current) return;
      if (isPlaying) playerRef.current.pauseVideo();
      else playerRef.current.playVideo();
      setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
      if (playerRef.current) { playerRef.current.seekTo(time, true); setCurrentTime(time); }
  };

  const handleVolumeChange = (vol: number) => {
      setVolume(vol);
      if (playerRef.current) playerRef.current.setVolume(vol);
  };

  const handleNextTrack = () => {
      if (!activeTrack || queue.length === 0) return;
      const currentIndex = queue.findIndex(t => t.id === activeTrack.id);
      const nextIndex = (currentIndex + 1) % queue.length;
      setActiveTrack(queue[nextIndex]);
  };

  const handlePrevTrack = () => {
      if (!activeTrack || queue.length === 0) return;
      const currentIndex = queue.findIndex(t => t.id === activeTrack.id);
      const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
      setActiveTrack(queue[prevIndex]);
  };

  const playTrackFromShelf = (track: AlbumItem, shelfId: number) => {
      // Find the shelf to set queue
      const shelf = shelves.find(s => s.id === shelfId);
      if (shelf) setQueue(shelf.items);
      else setQueue([track]); // Fallback
      
      setActiveTrack(track);
      setViewingItem(null); // Close modal if open
  };

  const playSpotlight = (track: AlbumItem) => {
      // Create queue from all favorites
      const allFavorites = shelves.flatMap(s => s.items).filter(i => i.isFavorite);
      setQueue(allFavorites);
      setActiveTrack(track);
  };

  // --- Recommendation Logic ---
  useEffect(() => {
    const flyTimer = setTimeout(async () => {
      setMascotPhase('greeting');
      if (initialMood) {
          const queries = getMoodSearchQuery(initialMood);
          const randomQuery = queries[Math.floor(Math.random() * queries.length)];
          const results = await searchMusicDatabase(randomQuery);
          if (results.length > 0) {
              const track = results[Math.floor(Math.random() * results.length)];
              setRecommendedTrack({ ...track, id: Date.now(), isFavorite: false, description: `Gợi ý từ Vũ Trụ vì bạn đang cảm thấy: ${initialMood.toUpperCase()}`, trackUrl: track.youtubeSearchLink });
          }
      }
    }, 2500); 
    return () => clearTimeout(flyTimer);
  }, [initialMood]);

  // Handle Logic
  const handleMascotClose = () => { setMascotPhase('returning'); setTimeout(() => { setMascotPhase('idle'); }, 1000); };
  const handleAddShelf = async () => { const newId = Date.now(); await setDoc(doc(db, "audio-shelves", String(newId)), { id: newId, title: "Bộ Sưu Tập Mới", items: [] }); setEditingShelfId(newId); setTempShelfTitle("Bộ Sưu Tập Mới"); };
  const handleSaveShelfTitle = async (id: number) => { if (!tempShelfTitle.trim()) return; await updateDoc(doc(db, "audio-shelves", String(id)), { title: tempShelfTitle }); setEditingShelfId(null); };
  const handleDeleteShelf = async (id: number) => { if(window.confirm("Xóa kệ này? Các bài hát bên trong sẽ mất.")) { await deleteDoc(doc(db, "audio-shelves", String(id))); } };
  const handleAddNewItem = async (shelfId: number) => { const newItem: AlbumItem = { id: Date.now(), title: "New Track", artist: "Unknown", coverUrl: "", trackUrl: "", year: new Date().getFullYear().toString(), description: "", isFavorite: false }; const shelf = shelves.find(s => s.id === shelfId); if (shelf) { await updateDoc(doc(db, "audio-shelves", String(shelfId)), { items: [...shelf.items, newItem] }); setEditingItem({ item: newItem, shelfId }); } };
  const handleSaveItem = async (updatedItem: AlbumItem) => { if (!editingItem) return; const shelf = shelves.find(s => s.id === editingItem.shelfId); if (shelf) { await updateDoc(doc(db, "audio-shelves", String(editingItem.shelfId)), { items: shelf.items.map(i => i.id === updatedItem.id ? updatedItem : i) }); setEditingItem(null); } };
  const handleDeleteItem = async (id: number) => { if (!editingItem) return; const shelf = shelves.find(s => s.id === editingItem.shelfId); if (shelf) { await updateDoc(doc(db, "audio-shelves", String(editingItem.shelfId)), { items: shelf.items.filter(i => i.id !== id) }); setEditingItem(null); } };

  // --- GET "SPOTLIGHT" ITEMS ---
  const spotlightItems = useMemo(() => {
      const allFavorites: AlbumItem[] = [];
      shelves.forEach(shelf => { shelf.items.forEach(item => { if(item.isFavorite) allFavorites.push(item); }); });
      allFavorites.sort((a, b) => b.id - a.id);
      return allFavorites;
  }, [shelves]);
  useEffect(() => {
      if (spotlightItems.length <= 1) return;
      const timer = setInterval(() => { setSpotlightIndex(prev => (prev + 1) % spotlightItems.length); }, 8000);
      return () => clearInterval(timer);
  }, [spotlightItems]);
  const nextSpotlight = () => setSpotlightIndex(prev => (prev + 1) % spotlightItems.length);
  const prevSpotlight = () => setSpotlightIndex(prev => (prev - 1 + spotlightItems.length) % spotlightItems.length);

  // --- LOGIC FOR "LIBRARY VIEW" ---
  const allTracks = useMemo(() => {
      let tracks: {item: AlbumItem, shelfId: number}[] = [];
      shelves.forEach(shelf => { shelf.items.forEach(item => { tracks.push({ item, shelfId: shelf.id }); }); });
      if (filterType === 'favorites') tracks = tracks.filter(t => t.item.isFavorite);
      tracks.sort((a, b) => { if (sortType === 'newest') return b.item.id - a.item.id; if (sortType === 'oldest') return a.item.id - b.item.id; if (sortType === 'az') return a.item.title.localeCompare(b.item.title); return 0; });
      return tracks;
  }, [shelves, filterType, sortType]);

  // Drag and Drop
  const [draggedItem, setDraggedItem] = useState<{ item: AlbumItem, sourceShelfId: number, sourceIndex: number } | null>(null);
  const handleDragStart = (e: React.DragEvent, item: AlbumItem, shelfId: number, index: number) => { if (viewMode === 'library') { e.preventDefault(); return; } setDraggedItem({ item, sourceShelfId: shelfId, sourceIndex: index }); e.dataTransfer.effectAllowed = "move"; (e.target as HTMLElement).classList.add('opacity-50'); };
  const handleDragEnd = (e: React.DragEvent) => { (e.target as HTMLElement).classList.remove('opacity-50'); setDraggedItem(null); };
  const handleDrop = async (e: React.DragEvent, targetShelfId: number, targetIndex?: number) => { e.preventDefault(); if (!draggedItem) return; const { sourceShelfId, sourceIndex, item } = draggedItem; try { if (sourceShelfId === targetShelfId) { const shelf = shelves.find(s => s.id === sourceShelfId); if (shelf) { const newItems = [...shelf.items]; newItems.splice(sourceIndex, 1); const finalIndex = targetIndex !== undefined ? targetIndex : newItems.length; newItems.splice(finalIndex, 0, item); await updateDoc(doc(db, "audio-shelves", String(sourceShelfId)), { items: newItems }); } } else { const sourceShelf = shelves.find(s => s.id === sourceShelfId); const targetShelf = shelves.find(s => s.id === targetShelfId); if (sourceShelf && targetShelf) { const newSourceItems = [...sourceShelf.items]; newSourceItems.splice(sourceIndex, 1); const newTargetItems = [...targetShelf.items]; const finalIndex = targetIndex !== undefined ? targetIndex : newTargetItems.length; newTargetItems.splice(finalIndex, 0, item); await Promise.all([ updateDoc(doc(db, "audio-shelves", String(sourceShelfId)), { items: newSourceItems }), updateDoc(doc(db, "audio-shelves", String(targetShelfId)), { items: newTargetItems }) ]); } } } catch (e) { console.error(e); } setDraggedItem(null); };

  const focusedShelf = focusedShelfId ? shelves.find(s => s.id === focusedShelfId) : null;

  return (
    <div className="relative h-full w-full flex flex-col items-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black overflow-hidden text-slate-200">
      <style>{globalStyles}</style>

      {/* --- HIDDEN YOUTUBE PLAYER --- */}
      <div id="youtube-player" className="hidden fixed top-0 left-0"></div>

      {/* --- BACKGROUND --- */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none animate-float"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none animate-float-delayed"></div>

      {/* --- HEADER --- */}
      {!focusedShelfId && (
          <div className="z-30 w-full max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-appear-from-void sticky top-0 bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent backdrop-blur-sm">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-full border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"><Headphones size={24} className="text-cyan-400" /></div>
                  <div><h1 className="text-2xl font-bold text-white tracking-wider font-mono uppercase">Quanh<span className="text-cyan-400">Zik</span></h1><p className="text-[10px] text-slate-400 tracking-[0.2em] uppercase">Sonic Archive</p></div>
              </div>
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5 backdrop-blur-md">
                   <button onClick={() => setViewMode('shelves')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'shelves' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}> <LayoutGrid size={14} /> Kệ Đĩa </button>
                   <button onClick={() => setViewMode('library')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'library' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}> <Library size={14} /> Thư Viện </button>
              </div>
          </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <div className={`relative w-full h-full overflow-y-auto scrollbar-hide px-4 z-10 ${activeTrack ? 'pb-32' : 'pb-10'}`}>
         <div className="max-w-7xl mx-auto min-h-[500px]">
             
             {/* CAROUSEL SPOTLIGHT */}
             {!focusedShelfId && viewMode === 'shelves' && spotlightItems.length > 0 && (
                 <SpotlightHero item={spotlightItems[spotlightIndex]} onClick={() => playSpotlight(spotlightItems[spotlightIndex])} onNext={nextSpotlight} onPrev={prevSpotlight} total={spotlightItems.length} currentIndex={spotlightIndex} />
             )}
             
             {/* SHELVES VIEW */}
             {viewMode === 'shelves' && !focusedShelfId && (
                <div className="flex flex-col gap-12 pb-20">
                    {shelves.length === 0 && !isLoading && <div className="text-center text-slate-500 italic mt-20">Chưa có kệ nhạc nào. Hãy tạo mới!</div>}
                    {shelves.map((shelf) => (
                        <div key={shelf.id} ref={(el) => { if (el) shelfRefs.current.set(shelf.id, el); }} className="relative group transition-all duration-500" onDragOver={(e) => { e.preventDefault(); }} onDrop={(e) => handleDrop(e, shelf.id)}>
                            <div className="flex items-end gap-4 mb-6 px-2 border-b border-white/5 pb-2">
                                <h2 className="text-xl font-bold text-white hover:text-cyan-400 font-mono uppercase tracking-widest cursor-pointer transition-colors" onClick={() => setFocusedShelfId(shelf.id)}> {shelf.title} </h2>
                                <span className="text-xs text-slate-500 font-mono mb-1">{shelf.items.length} TRACKS</span>
                                <div className="ml-auto flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingShelfId(shelf.id); setTempShelfTitle(shelf.title); }} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-cyan-400"><Edit3 size={14}/></button>
                                    <button onClick={() => handleDeleteShelf(shelf.id)} className="p-1.5 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-400"><Trash2 size={14}/></button>
                                </div>
                                {editingShelfId === shelf.id && ( <div className="absolute left-0 bottom-2 bg-slate-900 p-2 border border-cyan-500 rounded z-20 flex gap-2"> <input autoFocus className="bg-transparent border-b border-cyan-500 text-white text-sm outline-none" value={tempShelfTitle} onChange={(e) => setTempShelfTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveShelfTitle(shelf.id)} /> <button onClick={() => handleSaveShelfTitle(shelf.id)}><Check size={14} className="text-green-400"/></button> </div> )}
                            </div>
                            <div className="flex flex-wrap items-end gap-x-8 gap-y-12 pl-4">
                                {shelf.items.slice(0, PREVIEW_LIMIT).map((item, index) => ( <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item, shelf.id, index)} onDragEnd={handleDragEnd} onDrop={(e) => { e.stopPropagation(); handleDrop(e, shelf.id, index); }}> 
                                    <JewelCase3D item={item} isPlayingThis={activeTrack?.id === item.id && isPlaying} onClick={() => playTrackFromShelf(item, shelf.id)} onEdit={() => setEditingItem({ item, shelfId: shelf.id })} /> 
                                </div> ))}
                                <AddNewAlbum onClick={() => handleAddNewItem(shelf.id)} />
                                {shelf.items.length > PREVIEW_LIMIT && ( <div onClick={() => setFocusedShelfId(shelf.id)} className="mb-12 w-32 h-32 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"> <span className="text-xl font-bold text-slate-500 group-hover:text-white">+{shelf.items.length - PREVIEW_LIMIT}</span> <span className="text-[10px] text-slate-600 uppercase">Xem Thêm</span> </div> )}
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-center pb-20"> <button onClick={handleAddShelf} className="px-6 py-3 rounded-full border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-white hover:bg-white/5 transition-all uppercase font-mono text-xs tracking-widest flex items-center gap-2"> <Plus size={16} /> Tạo Kệ Mới </button> </div>
                </div>
             )}
             
             {/* LIBRARY VIEW */}
             {viewMode === 'library' && !focusedShelfId && (
                 <div className="py-8 animate-fade-in">
                     <div className="flex flex-wrap items-center gap-4 mb-8 sticky top-20 z-20 bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-xl">
                         <div className="flex items-center gap-2 border-r border-white/10 pr-4"> <Filter size={16} className="text-slate-500"/> <button onClick={() => setFilterType('all')} className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${filterType === 'all' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}>Tất Cả</button> <button onClick={() => setFilterType('favorites')} className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${filterType === 'favorites' ? 'bg-amber-400 text-amber-900' : 'text-slate-400 hover:text-amber-400'}`}>Yêu Thích</button> </div>
                         <div className="flex items-center gap-2"> <ArrowUpDown size={16} className="text-slate-500"/> <select value={sortType} onChange={(e) => setSortType(e.target.value as any)} className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"> <option value="newest" className="bg-slate-900">Mới Nhất</option> <option value="oldest" className="bg-slate-900">Cũ Nhất</option> <option value="az" className="bg-slate-900">Tên A-Z</option> </select> </div>
                         <div className="ml-auto text-xs text-slate-500 font-mono"> {allTracks.length} TRACKS </div>
                     </div>
                     <div className="flex flex-wrap items-end justify-center gap-x-10 gap-y-16"> {allTracks.length === 0 ? ( <div className="text-slate-500 italic py-20">Không tìm thấy bài hát nào.</div> ) : ( allTracks.map(({item, shelfId}) => ( <JewelCase3D key={item.id} item={item} isPlayingThis={activeTrack?.id === item.id && isPlaying} onClick={() => playTrackFromShelf(item, shelfId)} onEdit={() => setEditingItem({ item, shelfId })} /> )) )} </div>
                 </div>
             )}
             
             {/* FOCUSED SHELF VIEW */}
             {focusedShelf && (
                <div className="animate-zoom-in py-8">
                    <div className="flex items-center gap-4 mb-8"> <button onClick={() => setFocusedShelfId(null)} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"><ArrowLeft size={24} /></button> <h2 className="text-3xl font-bold text-white font-mono uppercase tracking-wider">{focusedShelf.title}</h2> </div>
                    <div className="flex flex-wrap items-end justify-center gap-x-10 gap-y-16"> {focusedShelf.items.map((item, index) => ( <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item, focusedShelf.id, index)} onDragEnd={handleDragEnd} onDrop={(e) => { e.stopPropagation(); handleDrop(e, focusedShelf.id, index); }}> <JewelCase3D item={item} isPlayingThis={activeTrack?.id === item.id && isPlaying} onClick={() => playTrackFromShelf(item, focusedShelf.id)} onEdit={() => setEditingItem({ item, shelfId: focusedShelf.id })} /> </div> ))} <AddNewAlbum onClick={() => handleAddNewItem(focusedShelf.id)} /> </div>
                </div>
             )}
         </div>
      </div>

      {/* --- MASCOT & MODALS --- */}
      {mascotPhase === 'flying' && <div className="fixed z-50 w-full h-full pointer-events-none"><FlyingBroomMascot /></div>}
      {mascotPhase === 'greeting' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-500">
             <div className="relative flex flex-col items-center animate-zoom-in">
                <RavenclawTaurusMascot greeting={initialMood ? getMascotMessage(initialMood) : "Chào mừng đến với không gian âm nhạc!"} variant="music" placement="top" forceOpen={true} className="scale-150 origin-bottom"/>
                {initialMood && recommendedTrack ? ( <div className="mt-8 bg-slate-900 border border-amber-500/30 p-4 rounded-xl flex items-center gap-4 shadow-[0_0_50px_rgba(251,191,36,0.2)] animate-appear-from-void max-w-sm cursor-pointer hover:bg-slate-800 transition-colors transform hover:scale-105" onClick={() => { setViewingItem(recommendedTrack); setMascotPhase('idle'); }}> <img src={recommendedTrack.coverUrl || ''} className="w-16 h-16 rounded-lg object-cover" /> <div className="text-left flex-1"><div className="text-[10px] text-amber-400 uppercase font-bold">Gợi ý từ Vũ Trụ</div><div className="text-white font-bold truncate">{recommendedTrack.title}</div><div className="text-white/60 text-xs truncate">{recommendedTrack.artist}</div></div> <div className="p-3 bg-amber-500 rounded-full text-white shadow-lg"><Play size={20} fill="currentColor" /></div> </div> ) : ( <button onClick={handleMascotClose} className="mt-8 px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform">Bắt đầu thôi!</button> )}
             </div>
          </div>
      )}
      {mascotPhase === 'returning' && <div className="fixed inset-0 z-50 pointer-events-none"><div className="absolute top-auto left-4 bottom-4 transition-all duration-1000 ease-in-out"><RavenclawTaurusMascot variant="music" placement="right" /></div></div>}
      {mascotPhase === 'idle' && !(viewingItem?.isFavorite) && !focusedShelfId && <RavenclawTaurusMascot className="absolute bottom-4 left-4 z-20 animate-fade-in" greeting="Tận hưởng âm nhạc đi Muggle" variant="music" placement="right" />}

      {/* --- RENDER PLAYER --- */}
      <MiniPlayer currentTrack={activeTrack} isPlaying={isPlaying} onTogglePlay={togglePlay} onNext={handleNextTrack} onPrev={handlePrevTrack} currentTime={currentTime} duration={duration} onSeek={handleSeek} volume={volume} onVolumeChange={handleVolumeChange} />
      
      {viewingItem && <DetailModal item={viewingItem} onClose={() => setViewingItem(null)} onPlay={() => { playTrackFromShelf(viewingItem, shelves.find(s => s.items.some(i => i.id === viewingItem.id))?.id || 0); setViewingItem(null); }} />}
      {editingItem && <EditModal item={editingItem.item} onClose={() => setEditingItem(null)} onSave={handleSaveItem} onDelete={handleDeleteItem} />}
    </div>
  );
};

export default AudioRoom;
