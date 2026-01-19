// src/rooms/AudioRoom.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Headphones, Check, Edit3, Trash2, Plus, ArrowLeft, LayoutGrid, Library, Filter, ArrowUpDown, Play } from 'lucide-react';
import RavenclawTaurusMascot from '../../components/RavenclawTaurusMascot';
import { AlbumItem, AudioShelfData } from '../../contexts/DataContext';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// --- IMPORT CÁC FILE CON ---
import { globalStyles, getYouTubeId, getMoodSearchQuery, getMascotMessage, searchMusicDatabase } from './utils';
import { FlyingBroomMascot, MiniPlayer, SpotlightHero, JewelCase3D, AddNewAlbum } from './audiosubComponents';
import { DetailModal, EditModal } from './audiomodals';

declare global { interface Window { onYouTubeIframeAPIReady: () => void; YT: any; } }

const AudioRoom: React.FC<{ initialMood?: string }> = ({ initialMood }) => {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [shelves, setShelves] = useState<AudioShelfData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [focusedShelfId, setFocusedShelfId] = useState<number | null>(null);
  
  // --- STATE GIAO DIỆN ---
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
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  // Trong AudioRoom component
const [isLooping, setIsLooping] = useState(false);
  
  const playerRef = useRef<any>(null);
// Hàm cập nhật playCount lên Firebase
const updatePlayCount = async (track: AlbumItem, shelfId: number) => {
    const shelf = shelves.find(s => s.id === shelfId);
    if (!shelf) return;
    
    const updatedItems = shelf.items.map(i => {
        if (i.id === track.id) {
            return { ...i, playCount: (i.playCount || 0) + 1 };
        }
        return i;
    });
    
    // Update thầm lặng không cần loading
    await updateDoc(doc(db, "audio-shelves", String(shelfId)), { items: updatedItems });
};

// Sửa lại logic Player Event
// Trong useEffect khởi tạo playerRef:
'onStateChange': (event: any) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
        setIsPlaying(true);
        // Tùy chọn: Tăng playCount ngay khi bắt đầu nghe hoặc nghe được 50%
        // Ở đây tôi đề xuất tăng khi bài hát kết thúc để tránh spam
    }
    if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
    if (event.data === window.YT.PlayerState.ENDED) {
        if (isLooping) {
            event.target.playVideo(); // Loop lại
            // Vẫn nên tăng playCount khi loop xong 1 vòng
            if (activeTrack) {
                 const shelfId = shelves.find(s => s.items.some(i => i.id === activeTrack.id))?.id;
                 if(shelfId) updatePlayCount(activeTrack, shelfId);
            }
        } else {
            handleNextTrack();
        }
    }
},
  const handleToggleFavoritePlayer = async () => {
    if (!activeTrack) return;
    const shelf = shelves.find(s => s.items.some(i => i.id === activeTrack.id));
    if (!shelf) return;

    const updatedItem = { ...activeTrack, isFavorite: !activeTrack.isFavorite };
    
    // 1. Update UI ngay lập tức (Optimistic update)
    setActiveTrack(updatedItem);
    
    // 2. Update Firebase
    const updatedItems = shelf.items.map(i => i.id === activeTrack.id ? updatedItem : i);
    await updateDoc(doc(db, "audio-shelves", String(shelf.id)), { items: updatedItems });
};
  const spotlightItems = useMemo(() => {
    // 1. Gom tất cả bài hát lại
    const allItems: AlbumItem[] = [];
    shelves.forEach(shelf => allItems.push(...shelf.items));

    // 2. Lọc bài "Mới nhất" (Dựa trên ID - giả sử ID là timestamp)
    const newest = [...allItems].sort((a, b) => b.id - a.id).slice(0, 5);

    // 3. Lọc bài "Nghe nhiều nhất" (Dựa trên playCount)
    const mostPlayed = [...allItems]
        .filter(i => (i.playCount || 0) > 0) // Chỉ lấy bài đã từng nghe
        .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
        .slice(0, 5);

    // 4. Lọc bài "Yêu thích ngẫu nhiên" (để gợi nhắc kỷ niệm)
    const favorites = allItems.filter(i => i.isFavorite);
    const randomFavs = favorites.sort(() => 0.5 - Math.random()).slice(0, 3);

    // 5. Gộp lại và Xóa trùng (Dùng Set hoặc Map)
    const combined = [...newest, ...mostPlayed, ...randomFavs];
    const uniqueItems = Array.from(new Map(combined.map(item => [item.id, item])).values());

    // 6. Sắp xếp hiển thị: Ưu tiên Favorite lên đầu hoặc xen kẽ
    // Ở đây tôi sort ngẫu nhiên nhẹ để mỗi lần F5 là 1 trải nghiệm mới
    return uniqueItems.sort(() => 0.5 - Math.random());
}, [shelves]); // Chạy lại khi shelves thay đổi
  

  
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
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        window.onYouTubeIframeAPIReady = () => { setIsPlayerReady(true); };
      } else {
        setIsPlayerReady(true);
      }
  }, []);

  // 3. Initialize/Update Player
  useEffect(() => {
      if (!activeTrack || !activeTrack.trackUrl || !isPlayerReady) return;
      const videoId = getYouTubeId(activeTrack.trackUrl);
      if (!videoId) return;

      if (!playerRef.current) {
          try {
            playerRef.current = new window.YT.Player('youtube-player', {
                height: '0', width: '0', videoId: videoId,
                playerVars: { 'autoplay': 1, 'controls': 0, 'rel': 0, 'showinfo': 0, 'playsinline': 1 },
                events: {
                    'onReady': (event: any) => { 
                        event.target.setVolume(volume); 
                        event.target.playVideo(); 
                        setIsPlaying(true); 
                        setDuration(event.target.getDuration()); 
                    },
                    'onStateChange': (event: any) => {
                        if (event.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
                        if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
                        if (event.data === window.YT.PlayerState.ENDED) handleNextTrack();
                    },
                    'onError': (e: any) => console.error("YouTube Player Error:", e)
                }
            });
          } catch (e) { console.error("Init Player Failed", e); }
      } else {
          if (typeof playerRef.current.loadVideoById === 'function') {
            playerRef.current.loadVideoById(videoId);
            setTimeout(() => playerRef.current.playVideo(), 100); 
            setIsPlaying(true);
          }
      }
  }, [activeTrack, isPlayerReady]);

  // 4. Progress Interval
  useEffect(() => {
      const interval = setInterval(() => {
          if (playerRef.current && isPlaying && typeof playerRef.current.getCurrentTime === 'function') {
              setCurrentTime(playerRef.current.getCurrentTime());
              setDuration(playerRef.current.getDuration());
          }
      }, 1000);
      return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => { 
    if (!playerRef.current || typeof playerRef.current.playVideo !== 'function') return; 
    if (isPlaying) playerRef.current.pauseVideo(); 
    else playerRef.current.playVideo(); 
    setIsPlaying(!isPlaying); 
  };
  
  const handleSeek = (time: number) => { 
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') { 
        playerRef.current.seekTo(time, true); 
        setCurrentTime(time); 
    } 
  };
  
  const handleVolumeChange = (vol: number) => { 
    setVolume(vol); 
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') playerRef.current.setVolume(vol); 
  };

  const handleNextTrack = () => { if (!activeTrack || queue.length === 0) return; const currentIndex = queue.findIndex(t => t.id === activeTrack.id); const nextIndex = (currentIndex + 1) % queue.length; setActiveTrack(queue[nextIndex]); };
  const handlePrevTrack = () => { if (!activeTrack || queue.length === 0) return; const currentIndex = queue.findIndex(t => t.id === activeTrack.id); const prevIndex = (currentIndex - 1 + queue.length) % queue.length; setActiveTrack(queue[prevIndex]); };
  
  const playTrackFromShelf = (track: AlbumItem, shelfId: number) => {
      const shelf = shelves.find(s => s.id === shelfId);
      if (shelf) setQueue(shelf.items); else setQueue([track]);
      setActiveTrack(track); setViewingItem(null);
  };
  const playSpotlight = (track: AlbumItem) => {
      const allFavorites = shelves.flatMap(s => s.items).filter(i => i.isFavorite);
      setQueue(allFavorites); setActiveTrack(track);
  };

  // --- MASCOT LOGIC ---
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

  const handleMascotClose = () => { setMascotPhase('returning'); setTimeout(() => { setMascotPhase('idle'); }, 1000); };

  // --- ACTIONS ---
  const handleAddShelf = async () => { const newId = Date.now(); await setDoc(doc(db, "audio-shelves", String(newId)), { id: newId, title: "Bộ Sưu Tập Mới", items: [] }); setEditingShelfId(newId); setTempShelfTitle("Bộ Sưu Tập Mới"); };
  const handleSaveShelfTitle = async (id: number) => { if (!tempShelfTitle.trim()) return; await updateDoc(doc(db, "audio-shelves", String(id)), { title: tempShelfTitle }); setEditingShelfId(null); };
  const handleDeleteShelf = async (id: number) => { if(window.confirm("Xóa kệ này? Các bài hát bên trong sẽ mất.")) { await deleteDoc(doc(db, "audio-shelves", String(id))); } };
  const handleAddNewItem = async (shelfId: number) => { const newItem: AlbumItem = { id: Date.now(), title: "New Track", artist: "Unknown", coverUrl: "", trackUrl: "", year: new Date().getFullYear().toString(), description: "", isFavorite: false }; const shelf = shelves.find(s => s.id === shelfId); if (shelf) { await updateDoc(doc(db, "audio-shelves", String(shelfId)), { items: [...shelf.items, newItem] }); setEditingItem({ item: newItem, shelfId }); } };
  const handleSaveItem = async (updatedItem: AlbumItem) => { if (!editingItem) return; const shelf = shelves.find(s => s.id === editingItem.shelfId); if (shelf) { await updateDoc(doc(db, "audio-shelves", String(editingItem.shelfId)), { items: shelf.items.map(i => i.id === updatedItem.id ? updatedItem : i) }); setEditingItem(null); } };
  const handleDeleteItem = async (id: number) => { if (!editingItem) return; const shelf = shelves.find(s => s.id === editingItem.shelfId); if (shelf) { await updateDoc(doc(db, "audio-shelves", String(editingItem.shelfId)), { items: shelf.items.filter(i => i.id !== id) }); setEditingItem(null); } };
  
  // Spotlight Items
  const spotlightItems = useMemo(() => {
      const allFavorites: AlbumItem[] = []; shelves.forEach(shelf => { shelf.items.forEach(item => { if(item.isFavorite) allFavorites.push(item); }); });
      allFavorites.sort((a, b) => b.id - a.id); return allFavorites;
  }, [shelves]);
  useEffect(() => { if (spotlightItems.length <= 1) return; const timer = setInterval(() => { setSpotlightIndex(prev => (prev + 1) % spotlightItems.length); }, 8000); return () => clearInterval(timer); }, [spotlightItems]);
  const nextSpotlight = () => setSpotlightIndex(prev => (prev + 1) % spotlightItems.length);
  const prevSpotlight = () => setSpotlightIndex(prev => (prev - 1 + spotlightItems.length) % spotlightItems.length);

  // Library Tracks
  const allTracks = useMemo(() => {
      let tracks: {item: AlbumItem, shelfId: number}[] = []; shelves.forEach(shelf => { shelf.items.forEach(item => { tracks.push({ item, shelfId: shelf.id }); }); });
      if (filterType === 'favorites') tracks = tracks.filter(t => t.item.isFavorite);
      tracks.sort((a, b) => { if (sortType === 'newest') return b.item.id - a.item.id; if (sortType === 'oldest') return a.item.id - b.item.id; if (sortType === 'az') return a.item.title.localeCompare(b.item.title); return 0; });
      return tracks;
  }, [shelves, filterType, sortType]);

  // Drag Drop (Simplified)
  const [draggedItem, setDraggedItem] = useState<{ item: AlbumItem, sourceShelfId: number, sourceIndex: number } | null>(null);
  const handleDragStart = (e: React.DragEvent, item: AlbumItem, shelfId: number, index: number) => { if (viewMode === 'library') { e.preventDefault(); return; } setDraggedItem({ item, sourceShelfId: shelfId, sourceIndex: index }); e.dataTransfer.effectAllowed = "move"; (e.target as HTMLElement).classList.add('opacity-50'); };
  const handleDragEnd = (e: React.DragEvent) => { (e.target as HTMLElement).classList.remove('opacity-50'); setDraggedItem(null); };
  const handleDrop = async (e: React.DragEvent, targetShelfId: number, targetIndex?: number) => { e.preventDefault(); if (!draggedItem) return; const { sourceShelfId, sourceIndex, item } = draggedItem; try { if (sourceShelfId === targetShelfId) { const shelf = shelves.find(s => s.id === sourceShelfId); if (shelf) { const newItems = [...shelf.items]; newItems.splice(sourceIndex, 1); const finalIndex = targetIndex !== undefined ? targetIndex : newItems.length; newItems.splice(finalIndex, 0, item); await updateDoc(doc(db, "audio-shelves", String(sourceShelfId)), { items: newItems }); } } else { const sourceShelf = shelves.find(s => s.id === sourceShelfId); const targetShelf = shelves.find(s => s.id === targetShelfId); if (sourceShelf && targetShelf) { const newSourceItems = [...sourceShelf.items]; newSourceItems.splice(sourceIndex, 1); const newTargetItems = [...targetShelf.items]; const finalIndex = targetIndex !== undefined ? targetIndex : newTargetItems.length; newTargetItems.splice(finalIndex, 0, item); await Promise.all([ updateDoc(doc(db, "audio-shelves", String(sourceShelfId)), { items: newSourceItems }), updateDoc(doc(db, "audio-shelves", String(targetShelfId)), { items: newTargetItems }) ]); } } } catch (e) { console.error(e); } setDraggedItem(null); };

  const focusedShelf = focusedShelfId ? shelves.find(s => s.id === focusedShelfId) : null;

  return (
    // MAIN LAYOUT CHANGE: overflow-hidden on parent to prevent body scroll
    <div className="relative h-full w-full flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black overflow-hidden text-slate-200">
      <style>{globalStyles}</style>
      
      {/* Hidden YouTube Player */}
      <div id="youtube-player" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}></div>
      
      {/* Background Ambience (Fixed position) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none animate-float"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none animate-float-delayed"></div>
      
      {/* ================================================================================== */}
      {/* PART 1 & 2: FIXED HEADER & TOOLBAR AREA (KHÔNG BAO GIỜ CUỘN)                       */}
      {/* ================================================================================== */}
      <div className="z-30 w-full flex flex-col bg-gradient-to-b from-slate-900 via-slate-900/90 to-transparent backdrop-blur-md border-b border-white/5 shadow-2xl transition-all duration-300">
        
        {/* A. HEADER (Logo & View Switch) - Chỉ hiện khi không focus shelf */}
        {!focusedShelfId && (
          <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-appear-from-void">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-full border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    <Headphones size={24} className="text-cyan-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white tracking-wider font-mono uppercase">Quanh<span className="text-cyan-400">Zik</span></h1>
                    <p className="text-[10px] text-slate-400 tracking-[0.2em] uppercase">Sonic Archive</p>
                  </div>
              </div>
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5 backdrop-blur-md">
                    <button onClick={() => setViewMode('shelves')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'shelves' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}> <LayoutGrid size={14} /> Kệ Đĩa </button>
                    <button onClick={() => setViewMode('library')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'library' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}> <Library size={14} /> Thư Viện </button>
              </div>
          </div>
        )}

        {/* B. TOOLBAR (Filter/Sort) - Chỉ hiện ở chế độ Library */}
        {viewMode === 'library' && !focusedShelfId && (
          <div className="px-6 pb-4 pt-0 animate-fade-in flex flex-wrap items-center gap-4">
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
               <div className="ml-auto text-xs text-slate-500 font-mono"> {allTracks.length} TRACKS </div>
          </div>
        )}
      </div>

      {/* ================================================================================== */}
      {/* PART 3: SCROLLABLE CONTENT AREA (PHẦN NÀY SẼ "CHUI" XUỐNG DƯỚI HEADER)            */}
      {/* ================================================================================== */}
      <div className={`flex-1 w-full overflow-y-auto scrollbar-hide px-4 z-10 ${activeTrack ? 'pb-32' : 'pb-10'}`}>
         <div className="max-w-7xl mx-auto min-h-[500px] pt-6">
             
             {/* 1. SPOTLIGHT CAROUSEL */}
             {!focusedShelfId && viewMode === 'shelves' && spotlightItems.length > 0 && (
                 <SpotlightHero item={spotlightItems[spotlightIndex]} onClick={() => playSpotlight(spotlightItems[spotlightIndex])} onNext={nextSpotlight} onPrev={prevSpotlight} total={spotlightItems.length} currentIndex={spotlightIndex} />
             )}
             
             {/* 2. SHELVES VIEW */}
             {viewMode === 'shelves' && !focusedShelfId && (
                <div className="flex flex-col gap-12 pb-20 mt-8">
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
                                {shelf.items.slice(0, PREVIEW_LIMIT).map((item, index) => ( 
                                    <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item, shelf.id, index)} onDragEnd={handleDragEnd} onDrop={(e) => { e.stopPropagation(); handleDrop(e, shelf.id, index); }}> 
                                        <JewelCase3D item={item} isPlayingThis={activeTrack?.id === item.id && isPlaying} onClick={() => playTrackFromShelf(item, shelf.id)} onEdit={() => setEditingItem({ item, shelfId: shelf.id })} /> 
                                    </div> 
                                ))}
                                <AddNewAlbum onClick={() => handleAddNewItem(shelf.id)} />
                                {shelf.items.length > PREVIEW_LIMIT && ( <div onClick={() => setFocusedShelfId(shelf.id)} className="mb-12 w-32 h-32 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"> <span className="text-xl font-bold text-slate-500 group-hover:text-white">+{shelf.items.length - PREVIEW_LIMIT}</span> <span className="text-[10px] text-slate-600 uppercase">Xem Thêm</span> </div> )}
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-center pb-20"> <button onClick={handleAddShelf} className="px-6 py-3 rounded-full border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-white hover:bg-white/5 transition-all uppercase font-mono text-xs tracking-widest flex items-center gap-2"> <Plus size={16} /> Tạo Kệ Mới </button> </div>
                </div>
             )}
             
             {/* 3. LIBRARY VIEW (CHỈ RENDER LƯỚI BÀI HÁT, TOOLBAR ĐÃ CHUYỂN LÊN TRÊN) */}
             {viewMode === 'library' && !focusedShelfId && (
                 <div className="py-8 animate-fade-in">
                     <div className="flex flex-wrap items-end justify-center gap-x-10 gap-y-16"> 
                      {allTracks.length === 0 ? ( <div className="text-slate-500 italic py-20">Không tìm thấy bài hát nào.</div> ) : ( allTracks.map(({item, shelfId}) => ( <JewelCase3D key={item.id} item={item} isPlayingThis={activeTrack?.id === item.id && isPlaying} onClick={() => playTrackFromShelf(item, shelfId)} onEdit={() => setEditingItem({ item, shelfId })} /> )) )} 
                     </div>
                 </div>
             )}
             
             {/* 4. FOCUSED SHELF */}
             {focusedShelf && (
                <div className="animate-zoom-in py-8">
                    <div className="flex items-center gap-4 mb-8"> <button onClick={() => setFocusedShelfId(null)} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"><ArrowLeft size={24} /></button> <h2 className="text-3xl font-bold text-white font-mono uppercase tracking-wider">{focusedShelf.title}</h2> </div>
                    <div className="flex flex-wrap items-end justify-center gap-x-10 gap-y-16"> {focusedShelf.items.map((item, index) => ( <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item, focusedShelf.id, index)} onDragEnd={handleDragEnd} onDrop={(e) => { e.stopPropagation(); handleDrop(e, focusedShelf.id, index); }}> <JewelCase3D item={item} isPlayingThis={activeTrack?.id === item.id && isPlaying} onClick={() => playTrackFromShelf(item, focusedShelf.id)} onEdit={() => setEditingItem({ item, shelfId: focusedShelf.id })} /> </div> ))} <AddNewAlbum onClick={() => handleAddNewItem(focusedShelf.id)} /> </div>
                </div>
             )}
         </div>
      </div>

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

      {/* --- GLOBAL COMPONENTS --- */}
      <MiniPlayer currentTrack={activeTrack} isPlaying={isPlaying} onTogglePlay={togglePlay} onNext={handleNextTrack} onPrev={handlePrevTrack} currentTime={currentTime} duration={duration} onSeek={handleSeek} volume={volume} onVolumeChange={handleVolumeChange} />
      
      {viewingItem && <DetailModal item={viewingItem} onClose={() => setViewingItem(null)} onPlay={() => { playTrackFromShelf(viewingItem, shelves.find(s => s.items.some(i => i.id === viewingItem.id))?.id || 0); setViewingItem(null); }} />}
      {editingItem && <EditModal item={editingItem.item} onClose={() => setEditingItem(null)} onSave={handleSaveItem} onDelete={handleDeleteItem} />}
    </div>
  );
};
  <MiniPlayer 
    currentTrack={activeTrack} 
    // ... props cũ
    isLooping={isLooping}
    onToggleLoop={() => setIsLooping(!isLooping)}
    onToggleFavorite={handleToggleFavoritePlayer}
/>
export default AudioRoom;
