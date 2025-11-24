import React, { useState, useRef, useEffect } from 'react';
import { 
  Music, Plus, X, Save, Trash2, Edit3, Headphones, Mic2, Upload, 
  Link as LinkIcon, Play, Calendar, Wand2, Loader2,
  ChevronRight, ArrowLeft, Grid, Search, Youtube
} from 'lucide-react';
import RavenclawTaurusMascot from '../../components/RavenclawTaurusMascot';
import { AlbumItem, AudioShelfData } from '../../contexts/DataContext';
import { analyzeYoutubeMetadata } from '../../services/geminiService';

// --- IMPORT FIREBASE ---
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// --- UTILITIES & CONFIG ---

const getYouTubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const getYouTubeThumbnail = (id: string) => {
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
};

// --- CẤU HÌNH DANH SÁCH SERVER DỰ PHÒNG (FAILOVER LIST - UPDATED V3) ---
// Đã sắp xếp lại thứ tự ưu tiên các server ổn định nhất hiện nay
const PIPED_INSTANCES = [
  "https://api.piped.spot.sjv.io",         // Server Mỹ (Thường rất nhanh)
  "https://piped-api.garudalinux.org",     // Server Linux (Ổn định)
  "https://pipedapi.adminforge.de",        // Server Đức (Mới & Khỏe)
  "https://api.piped.privacy.com.de",      // Server Đức (Bảo mật)
  "https://pipedapi.drgns.space",          // Server Châu Âu
  "https://pipedapi.kavin.rocks",          // Server gốc (Hay quá tải, để dự phòng cuối)
];

// --- HÀM TÌM KIẾM THÔNG MINH (UPDATED) ---
const searchYoutubeVideos = async (query: string) => {
  console.log("Starting search for:", query);
  
  for (const instance of PIPED_INSTANCES) {
    try {
      console.log(`Trying server: ${instance}`);
      
      // Thêm timeout để không bị treo nếu server phản hồi lâu
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 giây timeout

      const response = await fetch(`${instance}/search?q=${encodeURIComponent(query)}&filter=videos`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Server ${instance} returned ${response.status}`);
        continue; 
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        // Lọc chỉ lấy video
        const videos = data.items.filter((item: any) => item.type === 'stream');
        
        if (videos.length === 0) continue; // Có kết quả nhưng không phải video, thử server khác

        console.log(`Success with ${instance}`);
        return videos.slice(0, 10).map((item: any) => {
          // Piped URL format: /watch?v=ID
          const videoId = item.url.split('v=')[1];
          return {
            id: videoId,
            title: item.title,
            channelTitle: item.uploaderName,
            thumbnail: item.thumbnail
          };
        });
      }
    } catch (error) {
      console.warn(`Failed to connect to ${instance}`, error);
    }
  }
  
  console.error("All search servers failed.");
  return [];
};

// --- COMPONENTS ---

const JewelCase3D: React.FC<{ 
  item: AlbumItem; 
  onClick: () => void; 
  onEdit: () => void;
}> = ({ item, onClick, onEdit }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickCountRef = useRef(0);

  const handleInteraction = (e: React.MouseEvent) => {
    e.stopPropagation();
    clickCountRef.current += 1;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (clickCountRef.current === 2) {
      clickCountRef.current = 0; onEdit();
    } else {
      timerRef.current = setTimeout(() => {
        if (clickCountRef.current === 1) onClick(); 
        clickCountRef.current = 0; timerRef.current = null;
      }, 250);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 group relative z-10 hover:z-20">
        <div onClick={handleInteraction} className="relative w-32 h-32 cursor-pointer perspective-[800px] transition-all duration-500 touch-manipulation">
          <div className="w-full h-full preserve-3d transition-transform duration-500 group-hover:-translate-y-4 group-hover:rotate-x-12 group-hover:rotate-y-12">
            {/* Disc */}
            <div className="absolute top-1 left-1 w-28 h-28 rounded-full flex items-center justify-center transition-transform duration-700 group-hover:translate-x-16 group-hover:rotate-[360deg]"
                style={{ background: `conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.8) 20%, transparent 30%, transparent 100%), radial-gradient(circle, #d1d5db 30%, #9ca3af 100%)`, boxShadow: '0 0 5px rgba(0,0,0,0.5)' }}>
              <div className="absolute inset-0 rounded-full opacity-40 bg-gradient-to-tr from-transparent via-pink-500/20 to-cyan-500/20 mix-blend-color-dodge"></div>
              <div className="w-8 h-8 bg-slate-900 rounded-full border-2 border-white/20"></div>
              {item.isFavorite && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-400 drop-shadow-md z-10 text-lg">★</div>}
            </div>
            {/* Case Back */}
            <div className="absolute inset-0 bg-slate-900 rounded border border-slate-700 shadow-xl" style={{ transform: 'translateZ(-2px)' }}>
                <div className="absolute top-0 bottom-0 -left-2 w-2 bg-slate-800 origin-right transform rotateY(-90deg) flex items-center justify-center overflow-hidden border-l border-slate-600">
                    <span className="text-[6px] text-white whitespace-nowrap rotate-90 tracking-widest uppercase font-mono opacity-70">{item.artist} - {item.title}</span>
                </div>
            </div>
            {/* Case Front */}
            <div className="absolute inset-0 bg-slate-900 rounded overflow-hidden border-l border-slate-600 shadow-lg transform origin-left transition-transform duration-500 group-hover:rotate-y-[-20deg]">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent z-20 pointer-events-none"></div>
                {item.coverUrl ? (
                    <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover opacity-90" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-cyan-900 to-blue-900 flex flex-col items-center justify-center p-2 text-center">
                      <Music size={32} className="text-cyan-400/50 mb-2" />
                      <span className="text-[8px] text-cyan-200 font-bold uppercase">{item.title}</span>
                    </div>
                )}
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white/20 z-30"></div>
            </div>
          </div>
        </div>
        <div className="text-center transform transition-transform duration-300 group-hover:translate-y-2 preserve-3d w-40 pointer-events-none">
            <h3 className="text-[10px] font-bold text-cyan-100 leading-tight bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded border border-cyan-500/20 shadow-[0_2px_10px_rgba(0,0,0,0.5)] inline-block max-w-full truncate">{item.title}</h3>
            <p className="text-[9px] text-cyan-400/60 font-mono uppercase tracking-widest mt-1">{item.artist}</p>
        </div>
    </div>
  );
};

const AddNewAlbum = ({ onClick }: { onClick: () => void }) => {
  return (
    <div onClick={onClick} className="mb-12 w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-cyan-500/20 rounded bg-cyan-900/5 hover:bg-cyan-900/20 hover:border-cyan-400/50 transition-all cursor-pointer group perspective-[800px]">
       <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-cyan-500/20">
          <Plus className="text-cyan-500/50 group-hover:text-cyan-400" />
       </div>
       <span className="mt-2 text-[9px] text-cyan-400/40 font-mono uppercase tracking-widest group-hover:text-cyan-300">Add CD</span>
    </div>
  );
};

// --- MODALS ---

const DetailModal = ({ item, onClose }: { item: AlbumItem, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 perspective-[1200px]">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            {item.isFavorite && (
               <div className="absolute top-24 md:top-1/3 right-4 md:right-24 z-[110]">
                  <RavenclawTaurusMascot greeting="Bài này Quanh hay nghe lắm nè" forceOpen={true} variant="music" placement="left" className="scale-75 origin-right" style={{ animationDuration: '6s' }} dialogClassName="w-40 text-center rounded-xl"/>
               </div>
            )}
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.15)] overflow-hidden animate-zoom-in flex flex-col md:flex-row z-[105]">
                <div className="w-full md:w-1/2 aspect-square md:aspect-auto relative bg-black">
                    {item.coverUrl ? (
                        <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover opacity-90" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-cyan-900 to-slate-900 flex items-center justify-center"><Music size={64} className="text-cyan-500/30" /></div>
                    )}
                    <button onClick={onClose} className="absolute top-4 right-4 md:hidden text-white bg-black/50 p-2 rounded-full backdrop-blur-sm"><X size={20} /></button>
                </div>
                <div className="flex-1 p-8 flex flex-col justify-center relative">
                    <button onClick={onClose} className="absolute top-4 right-4 hidden md:block text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                    <div className="mb-6">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">{item.title}</h2>
                        <p className="text-xl text-cyan-400 font-serif italic">{item.artist}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400 font-mono mb-6 border-b border-slate-800 pb-6">
                        <span className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded"><Calendar size={14}/> {item.year}</span>
                        {item.trackUrl ? <a href={item.trackUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-green-400 hover:underline"><LinkIcon size={14}/> Link</a> : <span className="text-slate-600">No Link</span>}
                        {item.isFavorite && <span className="flex items-center gap-1 text-yellow-400 font-bold border border-yellow-400/30 px-2 py-0.5 rounded-full bg-yellow-400/10">★ Favorite</span>}
                    </div>
                    <div className="mb-8 flex-1 overflow-y-auto scrollbar-hide max-h-40">
                         <p className="text-slate-300 leading-relaxed text-sm">{item.description || "No description available."}</p>
                    </div>
                    {item.trackUrl && (
                        <a href={item.trackUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all shadow-[0_4px_20px_rgba(8,145,178,0.4)]">
                            <div className="p-1 bg-white rounded-full text-cyan-600"><Play size={14} fill="currentColor" /></div> Listen Now
                        </a>
                    )}
                </div>
            </div>
        </div>
    )
}

const EditModal = ({ item, onClose, onSave, onDelete }: { item: AlbumItem, onClose: () => void, onSave: (item: AlbumItem) => void, onDelete: (id: number) => void }) => {
  const [formData, setFormData] = useState<AlbumItem>({ ...item });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States cho tính năng tìm kiếm
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingYoutube, setIsSearchingYoutube] = useState(false);

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
      if (metadata) {
        setFormData(prev => ({
          ...prev,
          title: metadata.title || prev.title,
          artist: metadata.artist || prev.artist,
          year: metadata.year || prev.year,
        }));
      }
    } catch (e) { console.error(e); } finally { setIsAnalyzing(false); }
  };

  const handleYoutubeSearch = async () => {
     if(!searchQuery.trim()) return;
     setIsSearchingYoutube(true);
     setSearchResults([]); // Clear kết quả cũ để hiển thị loading rõ hơn
     
     const results = await searchYoutubeVideos(searchQuery);
     setSearchResults(results);
     setIsSearchingYoutube(false);
  };

  const handleSelectVideo = (video: any) => {
     setFormData(prev => ({
        ...prev,
        title: video.title,
        artist: video.channelTitle,
        coverUrl: video.thumbnail,
        trackUrl: `https://www.youtube.com/watch?v=${video.id}`
     }));
     setIsSearchMode(false);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
       <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose}></div>
       <div className="relative bg-slate-900 border border-cyan-900 w-full max-w-lg rounded-xl shadow-[0_0_50px_rgba(8,145,178,0.2)] overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
          
          <div className="p-5 bg-slate-950 border-b border-cyan-900/50 flex justify-between items-center shrink-0">
             <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                {isSearchMode ? <Youtube size={18} /> : <Edit3 size={18} />} 
                {isSearchMode ? "Search YouTube" : "Edit Metadata"}
             </h3>
             <div className="flex items-center gap-2">
                {/* SEARCH TOGGLE BUTTON */}
                {!isSearchMode && (
                   <button 
                      onClick={() => setIsSearchMode(true)} 
                      className="p-2 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                      title="Search on YouTube"
                   >
                      <Search size={18} />
                   </button>
                )}
                
                {/* FAVORITE TOGGLE */}
                <button 
                  onClick={() => setFormData(p => ({...p, isFavorite: !p.isFavorite}))} 
                  className={`p-2 rounded-full transition-colors ${formData.isFavorite ? 'text-yellow-400 bg-yellow-400/10 ring-1 ring-yellow-400/50' : 'text-slate-600 hover:text-yellow-400 hover:bg-slate-800'}`}
                  title="Toggle Favorite"
                >
                  {formData.isFavorite ? '★' : '☆'}
                </button>
                <div className="w-[1px] h-6 bg-slate-800 mx-1"></div>
                <button onClick={onClose} className="text-slate-500 hover:text-cyan-400"><X size={20}/></button>
             </div>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto scrollbar-hide relative min-h-[400px]">
             {/* --- SEARCH INTERFACE --- */}
             {isSearchMode ? (
                <div className="space-y-4 animate-fade-in">
                   <div className="flex gap-2">
                      <div className="relative flex-1">
                         <input 
                            autoFocus
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleYoutubeSearch()}
                            placeholder="Search song title..." 
                            className="w-full bg-slate-800/80 border border-slate-600 rounded-lg p-3 pl-10 text-sm text-white focus:border-cyan-500 outline-none"
                         />
                         <Search size={16} className="absolute left-3 top-3.5 text-slate-500" />
                      </div>
                      <button onClick={handleYoutubeSearch} disabled={isSearchingYoutube} className="bg-red-600 hover:bg-red-700 text-white px-4 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors min-w-[80px] flex justify-center">
                         {isSearchingYoutube ? <Loader2 size={16} className="animate-spin" /> : "Search"}
                      </button>
                   </div>

                   <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                      {searchResults.length === 0 && !isSearchingYoutube && (
                         <div className="text-center text-slate-500 py-8 text-sm italic">
                            {searchQuery && searchResults.length === 0 ? 
                               "No results found. Try a different keyword." : 
                               "Enter a keyword to start searching."}
                         </div>
                      )}
                      
                      {/* Loading Skeleton if no results but searching */}
                      {isSearchingYoutube && searchResults.length === 0 && (
                          <div className="space-y-3 opacity-50">
                              {[1,2,3].map(i => (
                                  <div key={i} className="flex gap-3 p-2 rounded-lg border border-slate-800">
                                      <div className="w-24 h-16 bg-slate-800 rounded animate-pulse"></div>
                                      <div className="flex-1 space-y-2 py-1">
                                          <div className="h-3 bg-slate-800 rounded w-3/4 animate-pulse"></div>
                                          <div className="h-2 bg-slate-800 rounded w-1/2 animate-pulse"></div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}

                      {searchResults.map((video) => (
                         <div 
                            key={video.id} 
                            onClick={() => handleSelectVideo(video)}
                            className="flex gap-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer group transition-colors border border-transparent hover:border-cyan-900/50"
                         >
                            <img src={video.thumbnail} alt="" className="w-24 h-16 object-cover rounded bg-slate-950" />
                            <div className="flex-1 overflow-hidden">
                               <h4 className="text-sm font-bold text-slate-200 truncate group-hover:text-cyan-300">{video.title}</h4>
                               <p className="text-xs text-slate-500 mt-1">{video.channelTitle}</p>
                            </div>
                            <button className="text-slate-600 group-hover:text-cyan-500 self-center"><Plus size={18}/></button>
                         </div>
                      ))}
                   </div>
                   
                   <button onClick={() => setIsSearchMode(false)} className="w-full py-2 text-xs text-slate-500 hover:text-white uppercase tracking-wider font-mono mt-4">Cancel Search</button>
                </div>
             ) : (
             /* --- NORMAL FORM INTERFACE --- */
             <>
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 relative group aspect-square bg-slate-800 rounded overflow-hidden border border-slate-700 cursor-pointer h-full" onClick={() => fileInputRef.current?.click()}>
                       {formData.coverUrl ? <img src={formData.coverUrl} alt="Preview" className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2"><Upload size={20} /><span className="text-[8px]">Upload</span></div>}
                       <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    </div>
                    <div className="col-span-2 space-y-3">
                       <div><label className="text-[10px] text-cyan-600 uppercase font-mono font-bold">Title</label><input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded p-2 text-sm text-cyan-100 focus:border-cyan-500 outline-none" /></div>
                       <div><label className="text-[10px] text-cyan-600 uppercase font-mono font-bold">Artist</label><input type="text" value={formData.artist} onChange={(e) => setFormData({...formData, artist: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded p-2 text-sm text-cyan-100 focus:border-cyan-500 outline-none" /></div>
                    </div>
                </div>
                <div>
                    <label className="text-[10px] text-cyan-600 uppercase font-mono font-bold flex items-center justify-between mb-1">
                       <div className="flex items-center gap-1"><LinkIcon size={10} /> Link</div>
                    </label>
                    <div className="relative">
                       <input type="text" value={formData.trackUrl || ''} onChange={(e) => setFormData({...formData, trackUrl: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded p-2 text-xs text-blue-300 focus:border-cyan-500 outline-none pr-10" />
                       <button onClick={handleAutoFill} disabled={!formData.trackUrl || isAnalyzing} className="absolute right-1 top-1 p-1 bg-cyan-900/50 rounded hover:bg-cyan-500 hover:text-white text-cyan-500 transition-colors disabled:opacity-50">{isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}</button>
                    </div>
                </div>
                <div><label className="text-[10px] text-cyan-600 uppercase font-mono font-bold">Notes</label><textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:border-cyan-500 outline-none h-20 resize-none" /></div>
                <div><label className="text-[10px] text-cyan-600 uppercase font-mono font-bold">Year</label><input type="text" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded p-2 text-xs text-slate-300 w-24" /></div>
             </>
             )}
          </div>
          
          {/* Footer */}
          {!isSearchMode && (
              <div className="p-4 bg-slate-950 border-t border-cyan-900/30 flex gap-3 shrink-0">
                 <button onClick={() => onDelete(formData.id)} className="p-2 rounded bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40"><Trash2 size={18} /></button>
                 <button onClick={() => onSave(formData)} className="flex-1 flex items-center justify-center gap-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded font-bold py-2"><Save size={16} /> Update Disc</button>
              </div>
          )}
       </div>
    </div>
  );
};

// --- MAIN COMPONENT: AudioRoom ---
const AudioRoom: React.FC = () => {
  const [shelves, setShelves] = useState<AudioShelfData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Quản lý trạng thái "Deep Dive" ---
  const [focusedShelfId, setFocusedShelfId] = useState<number | null>(null);
  
  const PREVIEW_LIMIT = 10;
  
  const [viewingItem, setViewingItem] = useState<AlbumItem | null>(null);
  const [editingItem, setEditingItem] = useState<{item: AlbumItem, shelfId: number} | null>(null);
  const [editingShelfId, setEditingShelfId] = useState<number | null>(null);
  const [tempShelfTitle, setTempShelfTitle] = useState("");

  // Visualizer
  const [bars, setBars] = useState<number[]>(new Array(30).fill(20));
  useEffect(() => {
    const interval = setInterval(() => setBars(prev => prev.map(() => Math.random() * 60 + 10)), 150);
    return () => clearInterval(interval);
  }, []);

  // Firebase Sync
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

  // --- CRUD Functions ---
  const handleAddShelf = async () => {
    try {
      const newId = Date.now();
      const newShelf: AudioShelfData = { id: newId, title: "New Genre", items: [] };
      await setDoc(doc(db, "audio-shelves", String(newId)), newShelf);
      setEditingShelfId(newId); setTempShelfTitle("New Genre");
    } catch (e) { console.error(e); }
  };

  const handleSaveShelfTitle = async (id: number) => {
    if (!tempShelfTitle.trim()) return;
    try {
      await updateDoc(doc(db, "audio-shelves", String(id)), { title: tempShelfTitle });
      setEditingShelfId(null);
    } catch (e) { console.error(e); }
  };

  const handleDeleteShelf = async (id: number) => {
     if(window.confirm("Delete this shelf?")) {
        try { await deleteDoc(doc(db, "audio-shelves", String(id))); } catch (e) { console.error(e); }
     }
  };

  const handleAddNewItem = async (shelfId: number) => {
     try {
       const newItem: AlbumItem = {
         id: Date.now(), title: "New Track", artist: "Unknown Artist", coverUrl: "", trackUrl: "", year: new Date().getFullYear().toString(), description: "", isFavorite: false,
       };
       const shelf = shelves.find(s => s.id === shelfId);
       if (shelf) {
         const updatedItems = [...shelf.items, newItem];
         await updateDoc(doc(db, "audio-shelves", String(shelfId)), { items: updatedItems });
         setEditingItem({ item: newItem, shelfId });
       }
     } catch (e) { console.error(e); }
  };

  const handleSaveItem = async (updatedItem: AlbumItem) => {
     if (!editingItem) return;
     try {
       const shelfId = editingItem.shelfId;
       const shelf = shelves.find(s => s.id === shelfId);
       if (shelf) {
         const updatedItems = shelf.items.map(i => i.id === updatedItem.id ? updatedItem : i);
         await updateDoc(doc(db, "audio-shelves", String(shelfId)), { items: updatedItems });
         setEditingItem(null);
       }
     } catch (e) { console.error(e); }
  };

  const handleDeleteItem = async (id: number) => {
     if (!editingItem) return;
     try {
       const shelfId = editingItem.shelfId;
       const shelf = shelves.find(s => s.id === shelfId);
       if (shelf) {
         const updatedItems = shelf.items.filter(i => i.id !== id);
         await updateDoc(doc(db, "audio-shelves", String(shelfId)), { items: updatedItems });
         setEditingItem(null);
       }
     } catch (e) { console.error(e); }
  };

  // Drag & Drop
  const [draggedItem, setDraggedItem] = useState<{ item: AlbumItem, sourceShelfId: number, sourceIndex: number } | null>(null);

  const handleDragStart = (e: React.DragEvent, item: AlbumItem, shelfId: number, index: number) => {
     setDraggedItem({ item, sourceShelfId: shelfId, sourceIndex: index });
     e.dataTransfer.effectAllowed = "move";
     const el = e.target as HTMLElement;
     requestAnimationFrame(() => el.classList.add('opacity-50'));
  };

  const handleDragEnd = (e: React.DragEvent) => {
     (e.target as HTMLElement).classList.remove('opacity-50');
     setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };

  const handleDrop = async (e: React.DragEvent, targetShelfId: number, targetIndex?: number) => {
     e.preventDefault();
     if (!draggedItem) return;
     const { sourceShelfId, sourceIndex, item } = draggedItem;
     try {
       if (sourceShelfId === targetShelfId) {
           const shelf = shelves.find(s => s.id === sourceShelfId);
           if (shelf) {
               const newItems = [...shelf.items];
               newItems.splice(sourceIndex, 1);
               const finalIndex = targetIndex !== undefined ? targetIndex : newItems.length;
               newItems.splice(finalIndex, 0, item);
               await updateDoc(doc(db, "audio-shelves", String(sourceShelfId)), { items: newItems });
           }
       } else {
           const sourceShelf = shelves.find(s => s.id === sourceShelfId);
           const targetShelf = shelves.find(s => s.id === targetShelfId);
           if (sourceShelf && targetShelf) {
               const newSourceItems = [...sourceShelf.items];
               newSourceItems.splice(sourceIndex, 1);
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

  // --- RENDER ---
  const focusedShelf = focusedShelfId ? shelves.find(s => s.id === focusedShelfId) : null;

  return (
    <div className="relative h-full w-full flex flex-col items-center bg-slate-950 overflow-hidden">
      
      {/* Mascot (Chỉ hiện ở màn hình chính) */}
      {!(viewingItem?.isFavorite) && !focusedShelfId && (
        <RavenclawTaurusMascot className="absolute bottom-4 left-4 z-20" greeting="Tận hưởng âm nhạc đi Muggle" variant="music" placement="right" />
      )}

      {/* Visualizer */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-2 h-64 opacity-10 pointer-events-none -z-0 gap-1">
         {bars.map((h, i) => <div key={i} className="w-full bg-cyan-500/20 blur-xl transition-all duration-300" style={{ height: `${h}%` }}></div>)}
      </div>

      {/* --- GIAO DIỆN FULL SCREEN CHO FOCUSED SHELF --- */}
      {focusedShelf ? (
        <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-xl flex flex-col animate-zoom-in overflow-hidden">
            {/* Focused Header */}
            <div className="flex items-center justify-between p-6 border-b border-cyan-900/50 bg-slate-900/50">
               <div className="flex items-center gap-4">
                  <button onClick={() => setFocusedShelfId(null)} className="p-2 rounded-full hover:bg-slate-800 text-cyan-500 transition-colors flex items-center gap-2 group">
                      <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" /> 
                      <span className="font-mono text-sm uppercase tracking-widest hidden md:inline">Thoát ra</span>
                  </button>
                  <h2 className="text-3xl font-bold text-cyan-100 font-mono uppercase tracking-wider">{focusedShelf.title}</h2>
                  <span className="text-sm text-slate-500 bg-slate-800 px-2 py-1 rounded-full">{focusedShelf.items.length} đĩa</span>
               </div>
               <div className="text-slate-600 text-xs font-mono uppercase tracking-widest hidden md:block">Deep Dive Mode</div>
            </div>

            {/* Focused Content Grid */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
               <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-16 perspective-container max-w-7xl mx-auto">
                  {focusedShelf.items.map((item, index) => (
                      <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item, focusedShelf.id, index)} onDragEnd={handleDragEnd} onDrop={(e) => { e.stopPropagation(); handleDrop(e, focusedShelf.id, index); }}>
                         <JewelCase3D item={item} onClick={() => setViewingItem(item)} onEdit={() => setEditingItem({ item, shelfId: focusedShelf.id })} />
                      </div>
                  ))}
                  <AddNewAlbum onClick={() => handleAddNewItem(focusedShelf.id)} />
               </div>
               {/* Pad bottom */}
               <div className="h-32"></div> 
            </div>
        </div>
      ) : (
        /* --- GIAO DIỆN CHÍNH (DANH SÁCH KỆ) --- */
        <>
          {/* Main Header */}
          <div className="relative z-10 mt-12 mb-8 text-center animate-appear-from-void">
             <div className="inline-flex items-center justify-center p-4 rounded-full bg-cyan-950/30 border border-cyan-500/30 mb-2 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                <Headphones size={32} className="text-cyan-400" />
             </div>
             <h1 className="text-4xl font-bold text-cyan-100 tracking-[0.2em] uppercase font-mono">Quanh<span className="text-cyan-500">Zik</span></h1>
             <p className="text-cyan-400/50 text-xs tracking-widest mt-2">Quanh's Sonic Dimension</p>
          </div>

          {/* Shelves List */}
          <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-32 px-4 scrollbar-hide perspective-container z-10">
             <div className="max-w-6xl mx-auto flex flex-col gap-24 pt-8 pb-24">
                {isLoading ? (
                   <div className="flex flex-col items-center justify-center h-64 gap-4">
                      <Loader2 size={48} className="text-cyan-500 animate-spin" />
                   </div>
                ) : (
                   <>
                     {shelves.length === 0 && <div className="text-center text-slate-500 italic">Chưa có kệ đĩa nào. Bấm nút bên dưới để tạo nhé!</div>}

                     {shelves.map((shelf) => {
                        const totalItems = shelf.items.length;
                        const visibleItems = shelf.items.slice(0, PREVIEW_LIMIT);
                        const remainingCount = totalItems - PREVIEW_LIMIT;

                        return (
                        <div key={shelf.id} className="relative group/shelf" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, shelf.id)}>
                           
                           {/* Shelf Header */}
                           <div className="flex items-center justify-between mb-6 border-b border-cyan-900/50 pb-2 w-full max-w-md">
                              <div className="flex items-center gap-4 flex-1">
                                  <Mic2 size={16} className="text-cyan-700" />
                                  {editingShelfId === shelf.id ? (
                                     <input autoFocus className="bg-slate-900 border border-cyan-500/50 text-cyan-100 px-2 py-1 rounded w-full text-sm font-mono uppercase"
                                        value={tempShelfTitle} onChange={(e) => setTempShelfTitle(e.target.value)} onBlur={() => handleSaveShelfTitle(shelf.id)} onKeyDown={(e) => e.key === 'Enter' && handleSaveShelfTitle(shelf.id)} />
                                  ) : (
                                     <div className="flex items-center gap-2 group-hover/shelf:translate-x-2 transition-transform cursor-pointer" onClick={() => setFocusedShelfId(shelf.id)}>
                                        <h2 className="text-lg text-cyan-100/80 font-mono uppercase tracking-wider hover:text-cyan-400 transition-colors">{shelf.title}</h2>
                                        <span className="text-xs text-slate-500">({totalItems})</span>
                                        <div className="opacity-0 group-hover/shelf:opacity-100 transition-opacity flex gap-1 ml-2">
                                           <button onClick={(e) => { e.stopPropagation(); setEditingShelfId(shelf.id); setTempShelfTitle(shelf.title); }} className="p-1 text-slate-500 hover:text-cyan-400"><Edit3 size={14}/></button>
                                           <button onClick={(e) => { e.stopPropagation(); handleDeleteShelf(shelf.id); }} className="p-1 text-slate-500 hover:text-red-400"><Trash2 size={14}/></button>
                                        </div>
                                     </div>
                                  )}
                              </div>
                              
                              {/* View All Button */}
                              {totalItems > PREVIEW_LIMIT && (
                                  <button 
                                    onClick={() => setFocusedShelfId(shelf.id)}
                                    className="flex items-center gap-1 text-xs font-mono uppercase text-cyan-600 hover:text-cyan-400 transition-colors bg-cyan-950/30 px-3 py-1 rounded-full border border-cyan-900 hover:border-cyan-500"
                                  >
                                    Xem tất cả <ChevronRight size={14} />
                                  </button>
                              )}
                           </div>

                           {/* Shelf Platform */}
                           <div className="absolute top-32 -left-[5%] -right-[5%] h-4 bg-cyan-900/20 border-t border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)] transform -rotate-x-6 translate-z-[-20px]"></div>
                           
                           {/* Items Row */}
                           <div className="flex flex-wrap items-end gap-x-6 gap-y-16 pl-4 relative z-10">
                              {visibleItems.map((item, index) => (
                                 <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item, shelf.id, index)} onDragEnd={handleDragEnd} onDrop={(e) => { e.stopPropagation(); handleDrop(e, shelf.id, index); }}>
                                    <JewelCase3D item={item} onClick={() => setViewingItem(item)} onEdit={() => setEditingItem({ item, shelfId: shelf.id })} />
                                 </div>
                              ))}
                              <AddNewAlbum onClick={() => handleAddNewItem(shelf.id)} />
                              
                              {remainingCount > 0 && (
                                  <div onClick={() => setFocusedShelfId(shelf.id)} className="mb-12 w-32 h-32 flex flex-col items-center justify-center border border-dashed border-slate-700/50 rounded bg-slate-900/20 hover:bg-cyan-900/10 hover:border-cyan-500/30 transition-all cursor-pointer group">
                                      <Grid className="text-slate-600 group-hover:text-cyan-500 transition-colors" />
                                      <span className="text-[10px] text-slate-500 mt-2 font-mono group-hover:text-cyan-400">+{remainingCount} more</span>
                                  </div>
                              )}
                           </div>
                        </div>
                     )})}

                     <div className="flex justify-center mt-12">
                        <button onClick={handleAddShelf} className="px-8 py-4 rounded-full border border-dashed border-cyan-900 text-cyan-700 hover:text-cyan-400 hover:border-cyan-500 hover:bg-cyan-900/10 transition-all uppercase font-mono text-xs tracking-widest flex items-center gap-2">
                           <Plus size={16} /> Create New Section
                        </button>
                     </div>
                   </>
                )}
             </div>
          </div>
        </>
      )}

      {viewingItem && <DetailModal item={viewingItem} onClose={() => setViewingItem(null)} />}
      {editingItem && <EditModal item={editingItem.item} onClose={() => setEditingItem(null)} onSave={handleSaveItem} onDelete={handleDeleteItem} />}
    </div>
  );
};

export default AudioRoom;
