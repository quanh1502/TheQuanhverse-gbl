import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Music, Plus, X, Save, Trash2, Edit3, Headphones, Mic2, Upload, 
  Link as LinkIcon, Play, Calendar, Wand2, Loader2,
  ChevronRight, ArrowLeft, Grid, Search, Disc, Check, MapPin, List,
  LayoutGrid, Library, Filter, ArrowUpDown, Heart
} from 'lucide-react';
import RavenclawTaurusMascot from '../../components/RavenclawTaurusMascot';
import { AlbumItem, AudioShelfData } from '../../contexts/DataContext';
import { analyzeYoutubeMetadata } from '../../services/geminiService';

// --- IMPORT FIREBASE ---
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// --- STYLE ANIMATION (CSS IN JS) ---
// Thêm hiệu ứng nền trôi nhẹ (Floating) và ánh sáng (Glow)
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
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
  @keyframes breathe {
    0% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.1); }
    100% { opacity: 0.3; transform: scale(1); }
  }
  .animate-mascot-intro { animation: flyInCircle 2.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
  .animate-float { animation: float 6s ease-in-out infinite; }
  .sparkle-trail {
    position: fixed; border-radius: 50%;
    background: radial-gradient(circle, #fff 10%, #fbbf24 60%, transparent 100%);
    pointer-events: none; z-index: 40; 
    animation: sparkleDrop 0.8s linear forwards;
    box-shadow: 0 0 10px rgba(251, 191, 36, 0.8);
  }
  /* Scrollbar tàng hình nhưng vẫn scroll được */
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
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
        setSparkles(prev => [...prev.slice(-20), {
          id: Date.now(), x: tailX + (Math.random() * 20 - 10), y: tailY + (Math.random() * 20 - 10), size: Math.random() * 8 + 4
        }]); 
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {sparkles.map(s => (<div key={s.id} className="sparkle-trail" style={{ left: s.x, top: s.y, width: s.size, height: s.size }} />))}
      <div ref={mascotRef} className="absolute bottom-4 left-4 animate-mascot-intro">
         <div className="transform -rotate-12"> 
            <RavenclawTaurusMascot variant="music" placement="right" forceOpen={false} className="scale-150" />
         </div>
      </div>
    </>
  );
};

// --- SUB COMPONENTS (Visual Upgraded) ---

const JewelCase3D: React.FC<{ item: AlbumItem; onClick: () => void; onEdit: () => void; }> = ({ item, onClick, onEdit }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickCountRef = useRef(0);

  const handleInteraction = (e: React.MouseEvent) => {
    e.stopPropagation();
    clickCountRef.current += 1;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (clickCountRef.current === 2) { clickCountRef.current = 0; onEdit(); } 
    else {
      timerRef.current = setTimeout(() => { if (clickCountRef.current === 1) onClick(); clickCountRef.current = 0; timerRef.current = null; }, 250);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 group relative z-10 hover:z-20 transition-all duration-300">
        <div onClick={handleInteraction} className="relative w-36 h-36 cursor-pointer perspective-[800px] touch-manipulation">
          {/* Shadow dưới đĩa */}
          <div className="absolute bottom-0 left-4 right-4 h-4 bg-black/40 blur-xl rounded-full transform translate-y-2 group-hover:scale-75 transition-transform duration-500"></div>
          
          <div className="w-full h-full preserve-3d transition-transform duration-500 group-hover:-translate-y-4 group-hover:rotate-x-6 group-hover:rotate-y-12">
            {/* Đĩa than bên trong (CD) */}
            <div className="absolute top-1 left-1 w-32 h-32 rounded-full flex items-center justify-center transition-transform duration-700 group-hover:translate-x-16 group-hover:rotate-[360deg] shadow-lg"
                 style={{ background: `conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.4) 20%, transparent 30%, transparent 100%), radial-gradient(circle, #334155 30%, #0f172a 100%)` }}>
              <div className="absolute inset-0 rounded-full opacity-60 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 mix-blend-screen"></div>
              <div className="w-10 h-10 bg-slate-950 rounded-full border border-white/10"></div>
              {item.isFavorite && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-400 drop-shadow-md z-10 text-xl animate-pulse">★</div>}
            </div>
            
            {/* Vỏ đĩa - Phong cách Glassmorphism */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 shadow-xl overflow-hidden transform origin-left transition-transform duration-500 group-hover:rotate-y-[-15deg]">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent z-20 pointer-events-none mix-blend-overlay"></div>
                {item.coverUrl ? (
                    <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-2 text-center">
                        <Music size={32} className="text-white/20 mb-2" />
                        <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">{item.title}</span>
                    </div>
                )}
                {/* Hiệu ứng bóng kính (Reflection) */}
                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/40 z-30"></div>
                <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 group-hover:translate-x-full transition-transform duration-1000"></div>
            </div>
          </div>
        </div>
        
        {/* Tên bài hát - Tối giản */}
        <div className="text-center w-40 pointer-events-none transition-all duration-300 group-hover:translate-y-1">
            <h3 className="text-xs font-bold text-white/90 leading-tight drop-shadow-md truncate px-1">{item.title}</h3>
            <p className="text-[10px] text-cyan-200/60 font-medium uppercase tracking-wider mt-1 truncate">{item.artist}</p>
        </div>
    </div>
  );
};

const AddNewAlbum = ({ onClick }: { onClick: () => void }) => (
    <div onClick={onClick} className="mb-12 w-36 h-36 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-400/30 transition-all cursor-pointer group hover:scale-105 backdrop-blur-sm">
       <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
          <Plus className="text-white/30 group-hover:text-cyan-400" />
       </div>
       <span className="mt-3 text-[10px] text-white/30 font-mono uppercase tracking-widest group-hover:text-cyan-300">Add Music</span>
    </div>
);

// --- MODALS (Glass Style) ---
const DetailModal = ({ item, onClose }: { item: AlbumItem, onClose: () => void }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 perspective-[1200px]">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose}></div>
        <div className="relative w-full max-w-3xl bg-slate-900/50 border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(8,145,178,0.15)] overflow-hidden animate-zoom-in flex flex-col md:flex-row z-[105] backdrop-blur-2xl">
            {/* Cover Art - Tràn viền */}
            <div className="w-full md:w-5/12 aspect-square md:aspect-auto relative group">
                {item.coverUrl ? (
                  <>
                    <img src={item.coverUrl.replace('100x100', '600x600')} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:bg-gradient-to-r"></div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-cyan-900/40 to-slate-900 flex items-center justify-center"><Music size={64} className="text-white/10" /></div>
                )}
                <button onClick={onClose} className="absolute top-4 right-4 md:hidden text-white bg-black/50 p-2 rounded-full backdrop-blur-md"><X size={20} /></button>
            </div>
            
            {/* Info Content */}
            <div className="flex-1 p-8 md:p-10 flex flex-col relative">
                <button onClick={onClose} className="absolute top-6 right-6 hidden md:block text-white/30 hover:text-white transition-colors"><X size={24} /></button>
                
                <div className="flex-1">
                    {/* Tags */}
                    {item.description && item.description.includes("Gợi ý") && (
                        <span className="inline-block text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full mb-4 border border-amber-500/10">
                            ✨ {item.description}
                        </span>
                    )}
                    
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight tracking-tight">{item.title}</h2>
                    <p className="text-xl md:text-2xl text-cyan-400 font-medium opacity-80 mb-6">{item.artist}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-400 font-mono mb-8 border-b border-white/5 pb-6">
                        <span className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full"><Calendar size={14}/> {item.year || "Unknown"}</span>
                        {item.isFavorite && <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">★ Favorite</span>}
                    </div>
                    
                    <div className="prose prose-invert prose-sm max-w-none">
                        <p className="text-slate-300 leading-relaxed opacity-80">{item.description || "No notes added for this track."}</p>
                    </div>
                </div>
                
                {/* Play Button */}
                <div className="mt-8 pt-6 border-t border-white/5">
                  {item.trackUrl ? (
                      <a href={item.trackUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between w-full p-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-cyan-500/25 transform hover:-translate-y-1">
                          <span className="pl-2">{item.description?.includes("Gợi ý") ? "Nghe thử trên Youtube" : "Play Music"}</span>
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-cyan-600 transition-colors">
                            <Play size={18} fill="currentColor" />
                          </div> 
                      </a>
                  ) : (
                    <div className="text-center text-slate-500 text-sm italic py-4">No link available</div>
                  )}
                </div>
            </div>
        </div>
    </div>
);

const EditModal = ({ item, onClose, onSave, onDelete }: { item: AlbumItem, onClose: () => void, onSave: (item: AlbumItem) => void, onDelete: (id: number) => void }) => {
  const [formData, setFormData] = useState<AlbumItem>({ ...item });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ... (Logic giữ nguyên)
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, coverUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };
  const handleAutoFill = async () => {
    if (!formData.trackUrl) return;
    setIsAnalyzing(true);
    try {
      const ytId = getYouTubeId(formData.trackUrl);
      if (ytId) setFormData(prev => ({ ...prev, coverUrl: getYouTubeThumbnail(ytId) }));
      const metadata = await analyzeYoutubeMetadata(formData.trackUrl);
      if (metadata) setFormData(prev => ({ ...prev, title: metadata.title || prev.title, artist: metadata.artist || prev.artist, year: metadata.year || prev.year }));
    } catch (e) { console.error(e); } finally { setIsAnalyzing(false); }
  };
  const handleMusicSearch = async () => {
     if(!searchQuery.trim()) return;
     setIsSearching(true); setSearchResults([]); 
     const results = await searchMusicDatabase(searchQuery);
     setSearchResults(results); setIsSearching(false);
  };
  const handleSelectMusic = (music: any) => {
     setFormData(prev => ({ ...prev, title: music.title, artist: music.artist, coverUrl: music.thumbnail, year: music.year, trackUrl: music.youtubeSearchLink }));
     setIsSearchMode(false);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
       <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose}></div>
       <div className="relative bg-[#0f172a] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-5 bg-white/5 border-b border-white/5 flex justify-between items-center shrink-0">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">{isSearchMode ? <Disc size={18} className="text-cyan-400" /> : <Edit3 size={18} className="text-cyan-400" />} {isSearchMode ? "Tìm nhạc (iTunes)" : "Chỉnh sửa đĩa"}</h3>
             <div className="flex items-center gap-2">
                {!isSearchMode && (<button onClick={() => setIsSearchMode(true)} className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors" title="Search Database"><Search size={18} /></button>)}
                <button onClick={() => setFormData(p => ({...p, isFavorite: !p.isFavorite}))} className={`p-2 rounded-full transition-colors ${formData.isFavorite ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-amber-400 hover:bg-white/5'}`}>{formData.isFavorite ? <Heart size={18} fill="currentColor" /> : <Heart size={18} />}</button>
                <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
                <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20}/></button>
             </div>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto scrollbar-hide relative min-h-[400px]">
             {isSearchMode ? (
                <div className="space-y-4 animate-fade-in">
                   <div className="flex gap-2">
                      <div className="relative flex-1"><input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleMusicSearch()} placeholder="Tên bài hát, ca sĩ..." className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pl-10 text-sm text-white focus:border-cyan-500 outline-none" /><Search size={16} className="absolute left-3 top-3.5 text-slate-500" /></div>
                      <button onClick={handleMusicSearch} disabled={isSearching} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors min-w-[80px] flex justify-center items-center">{isSearching ? <Loader2 size={16} className="animate-spin" /> : "Tìm"}</button>
                   </div>
                   <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                      {searchResults.map((music) => (
                         <div key={music.id} onClick={() => handleSelectMusic(music)} className="flex gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer group transition-colors border border-transparent hover:border-white/10 items-center">
                            <img src={music.thumbnail} alt="" className="w-12 h-12 object-cover rounded-lg shadow-md" />
                            <div className="flex-1 overflow-hidden"><h4 className="text-sm font-bold text-slate-200 truncate">{music.title}</h4><p className="text-xs text-slate-500 mt-0.5 truncate">{music.artist}</p></div>
                            <Plus size={18} className="text-slate-600 group-hover:text-cyan-400"/>
                         </div>
                      ))}
                   </div>
                   <button onClick={() => setIsSearchMode(false)} className="w-full py-2 text-xs text-slate-500 hover:text-white uppercase tracking-wider font-medium mt-4">Hủy tìm kiếm</button>
                </div>
             ) : (
             <>
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 relative group aspect-square bg-slate-900 rounded-xl overflow-hidden border border-slate-700 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                       {formData.coverUrl ? <img src={formData.coverUrl} alt="Preview" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2"><Upload size={20} /><span className="text-[10px]">Upload Cover</span></div>}
                       <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    </div>
                    <div className="col-span-2 space-y-3">
                       <div><label className="text-[10px] text-cyan-500 uppercase font-bold tracking-wider mb-1 block">Bài Hát</label><input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500 outline-none transition-colors" /></div>
                       <div><label className="text-[10px] text-cyan-500 uppercase font-bold tracking-wider mb-1 block">Nghệ Sĩ</label><input type="text" value={formData.artist} onChange={(e) => setFormData({...formData, artist: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500 outline-none transition-colors" /></div>
                    </div>
                </div>
                <div>
                    <label className="text-[10px] text-cyan-500 uppercase font-bold tracking-wider mb-1 flex items-center justify-between"><div className="flex items-center gap-1"><LinkIcon size={10} /> Youtube/Link</div></label>
                    <div className="relative">
                       <input type="text" value={formData.trackUrl || ''} onChange={(e) => setFormData({...formData, trackUrl: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-blue-300 focus:border-cyan-500 outline-none pr-10" />
                       <button onClick={handleAutoFill} disabled={!formData.trackUrl || isAnalyzing} className="absolute right-1 top-1 p-1.5 bg-cyan-500/10 rounded hover:bg-cyan-500 hover:text-white text-cyan-500 transition-colors disabled:opacity-50">{isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}</button>
                    </div>
                </div>
                <div><label className="text-[10px] text-cyan-500 uppercase font-bold tracking-wider mb-1 block">Ghi Chú</label><textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-300 focus:border-cyan-500 outline-none h-24 resize-none" /></div>
                <div><label className="text-[10px] text-cyan-500 uppercase font-bold tracking-wider mb-1 block">Năm</label><input type="text" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} className="w-24 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white" /></div>
             </>
             )}
          </div>
          
          {!isSearchMode && (
              <div className="p-4 bg-white/5 border-t border-white/5 flex gap-3 shrink-0">
                 <button onClick={() => onDelete(formData.id)} className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"><Trash2 size={18} /></button>
                 <button onClick={() => onSave(formData)} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold py-3 transition-all shadow-lg hover:shadow-cyan-500/20"><Save size={18} /> Lưu Thay Đổi</button>
              </div>
          )}
       </div>
    </div>
  );
};

// --- MAIN COMPONENT: AudioRoom ---
interface AudioRoomProps { initialMood?: string; }

const AudioRoom: React.FC<AudioRoomProps> = ({ initialMood }) => {
  const [shelves, setShelves] = useState<AudioShelfData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [focusedShelfId, setFocusedShelfId] = useState<number | null>(null);
  
  // --- NEW STATES FOR ORGANIZING ---
  const [viewMode, setViewMode] = useState<'shelves' | 'library'>('shelves'); // 'shelves' = Kệ (cũ), 'library' = Tất cả (mới)
  const [filterType, setFilterType] = useState<'all' | 'favorites'>('all');
  const [sortType, setSortType] = useState<'newest' | 'oldest' | 'az'>('newest');
  
  const PREVIEW_LIMIT = 8; // Giảm số lượng xem trước để đỡ rối
  const [viewingItem, setViewingItem] = useState<AlbumItem | null>(null);
  const [editingItem, setEditingItem] = useState<{item: AlbumItem, shelfId: number} | null>(null);
  const [editingShelfId, setEditingShelfId] = useState<number | null>(null);
  const [tempShelfTitle, setTempShelfTitle] = useState("");
  const shelfRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Mascot & Decoration
  const [mascotPhase, setMascotPhase] = useState<'flying' | 'greeting' | 'returning' | 'idle'>('flying');
  const [recommendedTrack, setRecommendedTrack] = useState<AlbumItem | null>(null);

  // Load Data
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

  // Recommendation Logic
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
  const handleAddShelf = async () => {
    const newId = Date.now();
    await setDoc(doc(db, "audio-shelves", String(newId)), { id: newId, title: "Bộ Sưu Tập Mới", items: [] });
    setEditingShelfId(newId); setTempShelfTitle("Bộ Sưu Tập Mới");
  };
  const handleSaveShelfTitle = async (id: number) => {
    if (!tempShelfTitle.trim()) return;
    await updateDoc(doc(db, "audio-shelves", String(id)), { title: tempShelfTitle });
    setEditingShelfId(null);
  };
  const handleDeleteShelf = async (id: number) => { if(window.confirm("Xóa kệ này? Các bài hát bên trong sẽ mất.")) { await deleteDoc(doc(db, "audio-shelves", String(id))); } };
  const handleAddNewItem = async (shelfId: number) => {
       const newItem: AlbumItem = { id: Date.now(), title: "New Track", artist: "Unknown", coverUrl: "", trackUrl: "", year: new Date().getFullYear().toString(), description: "", isFavorite: false };
       const shelf = shelves.find(s => s.id === shelfId);
       if (shelf) { await updateDoc(doc(db, "audio-shelves", String(shelfId)), { items: [...shelf.items, newItem] }); setEditingItem({ item: newItem, shelfId }); }
  };
  const handleSaveItem = async (updatedItem: AlbumItem) => {
     if (!editingItem) return;
     const shelf = shelves.find(s => s.id === editingItem.shelfId);
     if (shelf) { await updateDoc(doc(db, "audio-shelves", String(editingItem.shelfId)), { items: shelf.items.map(i => i.id === updatedItem.id ? updatedItem : i) }); setEditingItem(null); }
  };
  const handleDeleteItem = async (id: number) => {
     if (!editingItem) return;
     const shelf = shelves.find(s => s.id === editingItem.shelfId);
     if (shelf) { await updateDoc(doc(db, "audio-shelves", String(editingItem.shelfId)), { items: shelf.items.filter(i => i.id !== id) }); setEditingItem(null); }
  };

  // --- LOGIC GỘP & LỌC CHO "LIBRARY VIEW" ---
  const allTracks = useMemo(() => {
      let tracks: {item: AlbumItem, shelfId: number}[] = [];
      shelves.forEach(shelf => {
          shelf.items.forEach(item => {
              tracks.push({ item, shelfId: shelf.id });
          });
      });
      // 1. Filter
      if (filterType === 'favorites') tracks = tracks.filter(t => t.item.isFavorite);
      
      // 2. Sort
      tracks.sort((a, b) => {
          if (sortType === 'newest') return b.item.id - a.item.id; // Dùng ID làm timestamp
          if (sortType === 'oldest') return a.item.id - b.item.id;
          if (sortType === 'az') return a.item.title.localeCompare(b.item.title);
          return 0;
      });
      return tracks;
  }, [shelves, filterType, sortType]);

  // Drag and Drop (Giữ nguyên logic cũ, chỉ dùng cho Shelf Mode)
  const [draggedItem, setDraggedItem] = useState<{ item: AlbumItem, sourceShelfId: number, sourceIndex: number } | null>(null);
  const handleDragStart = (e: React.DragEvent, item: AlbumItem, shelfId: number, index: number) => {
      if (viewMode === 'library') { e.preventDefault(); return; } // Tắt drag ở chế độ Library
      setDraggedItem({ item, sourceShelfId: shelfId, sourceIndex: index });
      e.dataTransfer.effectAllowed = "move";
      (e.target as HTMLElement).classList.add('opacity-50');
  };
  const handleDragEnd = (e: React.DragEvent) => { (e.target as HTMLElement).classList.remove('opacity-50'); setDraggedItem(null); };
  const handleDrop = async (e: React.DragEvent, targetShelfId: number, targetIndex?: number) => {
      e.preventDefault(); if (!draggedItem) return;
      // ... (Giữ nguyên logic update firebase)
      const { sourceShelfId, sourceIndex, item } = draggedItem;
      try {
       if (sourceShelfId === targetShelfId) {
           const shelf = shelves.find(s => s.id === sourceShelfId);
           if (shelf) {
               const newItems = [...shelf.items]; newItems.splice(sourceIndex, 1);
               const finalIndex = targetIndex !== undefined ? targetIndex : newItems.length;
               newItems.splice(finalIndex, 0, item);
               await updateDoc(doc(db, "audio-shelves", String(sourceShelfId)), { items: newItems });
           }
       } else {
           const sourceShelf = shelves.find(s => s.id === sourceShelfId);
           const targetShelf = shelves.find(s => s.id === targetShelfId);
           if (sourceShelf && targetShelf) {
               const newSourceItems = [...sourceShelf.items]; newSourceItems.splice(sourceIndex, 1);
               const newTargetItems = [...targetShelf.items];
               const finalIndex = targetIndex !== undefined ? targetIndex : newTargetItems.length;
               newTargetItems.splice(finalIndex, 0, item);
               await Promise.all([
                   updateDoc(doc(db, "audio-shelves", String(sourceShelfId)), { items: newSourceItems }),
                   updateDoc(doc(db, "audio-shelves", String(targetShelfId)), { items: newTargetItems })
               ]);
           }
       }
     } catch (e) { console.error(e); }
     setDraggedItem(null);
  };

  const focusedShelf = focusedShelfId ? shelves.find(s => s.id === focusedShelfId) : null;

  return (
    <div className="relative h-full w-full flex flex-col items-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black overflow-hidden text-slate-200">
      <style>{globalStyles}</style>

      {/* --- BACKGROUND ELEMENTS (AMBIENT) --- */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none animate-float"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none animate-float" style={{animationDelay: '2s'}}></div>

      {/* --- HEADER & CONTROLS --- */}
      {!focusedShelfId && (
          <div className="z-30 w-full max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-appear-from-void sticky top-0 bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent backdrop-blur-sm">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-full border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                      <Headphones size={24} className="text-cyan-400" />
                  </div>
                  <div>
                      <h1 className="text-2xl font-bold text-white tracking-wider font-mono uppercase">Quanh<span className="text-cyan-400">Zik</span></h1>
                      <p className="text-[10px] text-slate-400 tracking-[0.2em] uppercase">Sonic Archive</p>
                  </div>
              </div>

              {/* VIEW SWITCHER & FILTERS */}
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5 backdrop-blur-md">
                   <button onClick={() => setViewMode('shelves')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'shelves' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                       <LayoutGrid size={14} /> Kệ Đĩa
                   </button>
                   <button onClick={() => setViewMode('library')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'library' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                       <Library size={14} /> Thư Viện (Tất Cả)
                   </button>
              </div>
          </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <div className="relative w-full h-full overflow-y-auto scrollbar-hide px-4 pb-32 z-10">
         <div className="max-w-7xl mx-auto min-h-[500px]">
             
             {/* 1. VIEW MODE: SHELVES (Giao diện cũ nhưng đẹp hơn) */}
             {viewMode === 'shelves' && !focusedShelfId && (
                <div className="flex flex-col gap-16 py-8">
                    {shelves.length === 0 && !isLoading && <div className="text-center text-slate-500 italic mt-20">Chưa có kệ nhạc nào. Hãy tạo mới!</div>}
                    
                    {shelves.map((shelf) => (
                        <div key={shelf.id} ref={(el) => { if (el) shelfRefs.current.set(shelf.id, el); }} className="relative group transition-all duration-500" onDragOver={(e) => { e.preventDefault(); }} onDrop={(e) => handleDrop(e, shelf.id)}>
                            {/* Shelf Header */}
                            <div className="flex items-end gap-4 mb-6 px-2 border-b border-white/5 pb-2">
                                <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 font-mono uppercase tracking-widest cursor-pointer hover:text-cyan-400 transition-colors"
                                    onClick={() => setFocusedShelfId(shelf.id)}>
                                    {shelf.title}
                                </h2>
                                <span className="text-xs text-slate-500 font-mono mb-1">{shelf.items.length} TRACKS</span>
                                
                                {/* Edit Actions */}
                                <div className="ml-auto flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingShelfId(shelf.id); setTempShelfTitle(shelf.title); }} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-cyan-400"><Edit3 size={14}/></button>
                                    <button onClick={() => handleDeleteShelf(shelf.id)} className="p-1.5 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-400"><Trash2 size={14}/></button>
                                </div>
                                {editingShelfId === shelf.id && (
                                    <div className="absolute left-0 bottom-2 bg-slate-900 p-2 border border-cyan-500 rounded z-20 flex gap-2">
                                        <input autoFocus className="bg-transparent border-b border-cyan-500 text-white text-sm outline-none" value={tempShelfTitle} onChange={(e) => setTempShelfTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveShelfTitle(shelf.id)} />
                                        <button onClick={() => handleSaveShelfTitle(shelf.id)}><Check size={14} className="text-green-400"/></button>
                                    </div>
                                )}
                            </div>

                            {/* Shelf Items Grid */}
                            <div className="flex flex-wrap items-end gap-x-8 gap-y-12 pl-4">
                                {shelf.items.slice(0, PREVIEW_LIMIT).map((item, index) => (
                                    <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item, shelf.id, index)} onDragEnd={handleDragEnd} onDrop={(e) => { e.stopPropagation(); handleDrop(e, shelf.id, index); }}>
                                        <JewelCase3D item={item} onClick={() => setViewingItem(item)} onEdit={() => setEditingItem({ item, shelfId: shelf.id })} />
                                    </div>
                                ))}
                                <AddNewAlbum onClick={() => handleAddNewItem(shelf.id)} />
                                {shelf.items.length > PREVIEW_LIMIT && (
                                    <div onClick={() => setFocusedShelfId(shelf.id)} className="mb-12 w-32 h-32 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                                        <span className="text-xl font-bold text-slate-500 group-hover:text-white">+{shelf.items.length - PREVIEW_LIMIT}</span>
                                        <span className="text-[10px] text-slate-600 uppercase">Xem Thêm</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    <div className="flex justify-center pb-20">
                        <button onClick={handleAddShelf} className="px-6 py-3 rounded-full border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-white hover:bg-white/5 transition-all uppercase font-mono text-xs tracking-widest flex items-center gap-2">
                            <Plus size={16} /> Tạo Kệ Mới
                        </button>
                    </div>
                </div>
             )}

             {/* 2. VIEW MODE: LIBRARY (Chế độ xem tất cả, giải quyết vấn đề lộn xộn) */}
             {viewMode === 'library' && !focusedShelfId && (
                 <div className="py-8 animate-fade-in">
                     {/* Filter Bar */}
                     <div className="flex flex-wrap items-center gap-4 mb-8 sticky top-20 z-20 bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-xl">
                         <div className="flex items-center gap-2 border-r border-white/10 pr-4">
                             <Filter size={16} className="text-slate-500"/>
                             <button onClick={() => setFilterType('all')} className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${filterType === 'all' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}>Tất Cả</button>
                             <button onClick={() => setFilterType('favorites')} className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${filterType === 'favorites' ? 'bg-amber-400 text-amber-900' : 'text-slate-400 hover:text-amber-400'}`}>Yêu Thích</button>
                         </div>
                         <div className="flex items-center gap-2">
                             <ArrowUpDown size={16} className="text-slate-500"/>
                             <select value={sortType} onChange={(e) => setSortType(e.target.value as any)} className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer">
                                 <option value="newest" className="bg-slate-900">Mới Nhất</option>
                                 <option value="oldest" className="bg-slate-900">Cũ Nhất</option>
                                 <option value="az" className="bg-slate-900">Tên A-Z</option>
                             </select>
                         </div>
                         <div className="ml-auto text-xs text-slate-500 font-mono">
                             {allTracks.length} TRACKS
                         </div>
                     </div>

                     {/* Grid View All */}
                     <div className="flex flex-wrap items-end justify-center gap-x-10 gap-y-16">
                         {allTracks.length === 0 ? (
                             <div className="text-slate-500 italic py-20">Không tìm thấy bài hát nào.</div>
                         ) : (
                             allTracks.map(({item, shelfId}) => (
                                 <JewelCase3D key={item.id} item={item} onClick={() => setViewingItem(item)} onEdit={() => setEditingItem({ item, shelfId })} />
                             ))
                         )}
                     </div>
                 </div>
             )}

             {/* 3. FOCUSED SHELF VIEW (Chế độ xem chi tiết 1 kệ) */}
             {focusedShelf && (
                <div className="animate-zoom-in py-8">
                    <div className="flex items-center gap-4 mb-8">
                        <button onClick={() => setFocusedShelfId(null)} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"><ArrowLeft size={24} /></button>
                        <h2 className="text-3xl font-bold text-white font-mono uppercase tracking-wider">{focusedShelf.title}</h2>
                    </div>
                    <div className="flex flex-wrap items-end justify-center gap-x-10 gap-y-16">
                         {focusedShelf.items.map((item, index) => (
                             <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item, focusedShelf.id, index)} onDragEnd={handleDragEnd} onDrop={(e) => { e.stopPropagation(); handleDrop(e, focusedShelf.id, index); }}>
                                <JewelCase3D item={item} onClick={() => setViewingItem(item)} onEdit={() => setEditingItem({ item, shelfId: focusedShelf.id })} />
                             </div>
                         ))}
                         <AddNewAlbum onClick={() => handleAddNewItem(focusedShelf.id)} />
                    </div>
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
                {initialMood && recommendedTrack ? (
                    <div className="mt-8 bg-slate-900 border border-amber-500/30 p-4 rounded-xl flex items-center gap-4 shadow-[0_0_50px_rgba(251,191,36,0.2)] animate-appear-from-void max-w-sm cursor-pointer hover:bg-slate-800 transition-colors transform hover:scale-105" onClick={() => { setViewingItem(recommendedTrack); setMascotPhase('idle'); }}>
                        <img src={recommendedTrack.coverUrl || ''} className="w-16 h-16 rounded-lg object-cover" />
                        <div className="text-left flex-1"><div className="text-[10px] text-amber-400 uppercase font-bold">Gợi ý từ Vũ Trụ</div><div className="text-white font-bold truncate">{recommendedTrack.title}</div><div className="text-white/60 text-xs truncate">{recommendedTrack.artist}</div></div>
                        <div className="p-3 bg-amber-500 rounded-full text-white shadow-lg"><Play size={20} fill="currentColor" /></div>
                    </div>
                ) : (
                    <button onClick={handleMascotClose} className="mt-8 px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform">Bắt đầu thôi!</button>
                )}
             </div>
          </div>
      )}
      {mascotPhase === 'returning' && <div className="fixed inset-0 z-50 pointer-events-none"><div className="absolute top-auto left-4 bottom-4 transition-all duration-1000 ease-in-out"><RavenclawTaurusMascot variant="music" placement="right" /></div></div>}
      {mascotPhase === 'idle' && !(viewingItem?.isFavorite) && !focusedShelfId && <RavenclawTaurusMascot className="absolute bottom-4 left-4 z-20 animate-fade-in" greeting="Tận hưởng âm nhạc đi Muggle" variant="music" placement="right" />}

      {viewingItem && <DetailModal item={viewingItem} onClose={() => setViewingItem(null)} />}
      {editingItem && <EditModal item={editingItem.item} onClose={() => setEditingItem(null)} onSave={handleSaveItem} onDelete={handleDeleteItem} />}
    </div>
  );
};

export default AudioRoom;
