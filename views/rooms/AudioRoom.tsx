import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Headphones, Check, Edit3, Trash2, Plus, LayoutGrid, Library, Filter, ArrowUpDown, LogOut } from 'lucide-react';
import { AlbumItem, AudioShelfData } from '../../contexts/DataContext';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore'; // Import writeBatch

import { globalStyles, getYouTubeId, getMoodSearchQuery, searchMusicDatabase } from './utils';
import { FlyingBroomMascot, MiniPlayer, JewelCase3D, AddNewAlbum } from './audiosubComponents';
import { DetailModal, EditModal } from './audiomodals';

declare global { interface Window { onYouTubeIframeAPIReady: () => void; YT: any; } }

interface AudioRoomProps {
    initialMood?: string;
    onExit: () => void;
}

const AudioRoom: React.FC<AudioRoomProps> = ({ initialMood, onExit }) => {
  // --- STATE DATA ---
  const [shelves, setShelves] = useState<AudioShelfData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [focusedShelfId, setFocusedShelfId] = useState<number | null>(null);
  
  // --- STATE UI ---
  const [viewMode, setViewMode] = useState<'shelves' | 'library'>('shelves'); 
  const [filterType, setFilterType] = useState<'all' | 'favorites'>('all');
  const [sortType, setSortType] = useState<'newest' | 'oldest' | 'az'>('newest');
  
  // --- STATE LOGIC ---
  const [viewingItem, setViewingItem] = useState<AlbumItem | null>(null);
  const [editingItem, setEditingItem] = useState<{item: AlbumItem, shelfId: number} | null>(null);
  const [editingShelfId, setEditingShelfId] = useState<number | null>(null);
  const [tempShelfTitle, setTempShelfTitle] = useState("");
  
  // --- HEALTH CHECK STATE (Mới) ---
  const [errorItems, setErrorItems] = useState<Set<number>>(new Set());

  // --- PLAYER STATE ---
  const [activeTrack, setActiveTrack] = useState<AlbumItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<AlbumItem[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  
  const [isLooping, setIsLooping] = useState(false);
  const isLoopingRef = useRef(isLooping);
  const playerRef = useRef<any>(null);

  // Check Mobile
  const isMobile = window.innerWidth < 768;

  useEffect(() => { isLoopingRef.current = isLooping; }, [isLooping]);

  // --- FIREBASE LOAD ---
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onSnapshot(collection(db, "audio-shelves"), (snapshot) => {
        const loadedShelves = snapshot.docs.map(doc => doc.data() as AudioShelfData);
        loadedShelves.sort((a, b) => a.id - b.id);
        setShelves(loadedShelves);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- YOUTUBE PLAYER LOGIC (With Error Handling) ---
  useEffect(() => {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        window.onYouTubeIframeAPIReady = () => { setIsPlayerReady(true); };
      } else { setIsPlayerReady(true); }
  }, []);

  useEffect(() => {
      if (!activeTrack || !activeTrack.trackUrl || !isPlayerReady) return;
      const videoId = getYouTubeId(activeTrack.trackUrl);
      if (!videoId) return; // Có thể set Error ở đây nếu URL invalid

      if (!playerRef.current) {
          playerRef.current = new window.YT.Player('youtube-player', {
              height: '0', width: '0', videoId: videoId,
              playerVars: { 'autoplay': 1, 'controls': 0, 'rel': 0, 'showinfo': 0, 'playsinline': 1 },
              events: {
                  'onReady': (event: any) => { 
                      event.target.setVolume(volume); 
                      event.target.playVideo(); 
                      setIsPlaying(true); 
                  },
                  'onStateChange': (event: any) => {
                      if (event.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
                      if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
                      if (event.data === window.YT.PlayerState.ENDED) {
                          if (isLoopingRef.current) event.target.playVideo();
                          else handleNextTrack();
                      }
                  },
                  'onError': (e: any) => {
                      console.error("YouTube Error Code:", e.data);
                      // LOGIC 2: Health Check - Nếu lỗi (video xóa, private...), đánh dấu vào Set
                      if (activeTrack) {
                          setErrorItems(prev => new Set(prev).add(activeTrack.id));
                          setIsPlaying(false);
                          // Tự động qua bài tiếp theo nếu lỗi
                          setTimeout(handleNextTrack, 2000); 
                      }
                  }
              }
          });
      } else {
          playerRef.current.loadVideoById(videoId);
      }
  }, [activeTrack, isPlayerReady]);

  // Player Intervals & Controls
  useEffect(() => {
      const interval = setInterval(() => {
          if (playerRef.current && isPlaying && typeof playerRef.current.getCurrentTime === 'function') {
              setCurrentTime(playerRef.current.getCurrentTime());
              setDuration(playerRef.current.getDuration());
          }
      }, 1000);
      return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => { if (playerRef.current) { isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo(); setIsPlaying(!isPlaying); }};
  const handleSeek = (time: number) => { playerRef.current?.seekTo(time, true); setCurrentTime(time); };
  const handleVolumeChange = (vol: number) => { setVolume(vol); playerRef.current?.setVolume(vol); };
  
  const handleNextTrack = () => { if (!queue.length) return; const curr = queue.findIndex(t => t.id === activeTrack?.id); setActiveTrack(queue[(curr + 1) % queue.length]); };
  const handlePrevTrack = () => { if (!queue.length) return; const curr = queue.findIndex(t => t.id === activeTrack?.id); setActiveTrack(queue[(curr - 1 + queue.length) % queue.length]); };

  // --- QUEUE LOGIC (TÁCH BIỆT) ---
  const playTrackNow = (track: AlbumItem, contextShelfId?: number) => {
      // Logic: Nếu click từ kệ -> Queue là cả kệ. Nếu từ Library -> Queue là list hiển thị
      const contextList = contextShelfId 
        ? shelves.find(s => s.id === contextShelfId)?.items || [track]
        : allTracks.map(t => t.item);
      
      setQueue(contextList);
      setActiveTrack(track);
  };

  const addToQueue = (track: AlbumItem) => {
      setQueue(prev => {
          if (prev.find(t => t.id === track.id)) return prev; // Đã có thì thôi
          return [...prev, track];
      });
      // Hiệu ứng visual (Optional: Toast notification)
      alert(`Đã thêm "${track.title}" vào hàng chờ!`);
  };

  // --- DRAG & DROP (LOGIC 1: WRITE BATCH) ---
  const [draggedItem, setDraggedItem] = useState<{ item: AlbumItem, sourceShelfId: number, sourceIndex: number } | null>(null);

  const handleDragStart = (e: React.DragEvent, item: AlbumItem, shelfId: number, index: number) => {
      if (viewMode === 'library') { e.preventDefault(); return; }
      setDraggedItem({ item, sourceShelfId: shelfId, sourceIndex: index });
  };

  const handleDrop = async (e: React.DragEvent, targetShelfId: number, targetIndex?: number) => {
      e.preventDefault();
      if (!draggedItem) return;
      const { sourceShelfId, sourceIndex, item } = draggedItem;

      // Nếu thả vào chính vị trí cũ thì bỏ qua
      if (sourceShelfId === targetShelfId && sourceIndex === targetIndex) return;

      try {
          const batch = writeBatch(db); // INIT BATCH

          if (sourceShelfId === targetShelfId) {
              // Cùng 1 kệ: Reorder
              const shelfRef = doc(db, "audio-shelves", String(sourceShelfId));
              const shelf = shelves.find(s => s.id === sourceShelfId);
              if (shelf) {
                  const newItems = [...shelf.items];
                  newItems.splice(sourceIndex, 1);
                  const finalIndex = targetIndex !== undefined ? targetIndex : newItems.length;
                  newItems.splice(finalIndex, 0, item);
                  batch.update(shelfRef, { items: newItems });
              }
          } else {
              // Khác kệ: Move (Atomically)
              const sourceRef = doc(db, "audio-shelves", String(sourceShelfId));
              const targetRef = doc(db, "audio-shelves", String(targetShelfId));
              const sourceShelf = shelves.find(s => s.id === sourceShelfId);
              const targetShelf = shelves.find(s => s.id === targetShelfId);

              if (sourceShelf && targetShelf) {
                  const newSourceItems = [...sourceShelf.items];
                  newSourceItems.splice(sourceIndex, 1); // Xóa khỏi nguồn
                  
                  const newTargetItems = [...targetShelf.items];
                  const finalIndex = targetIndex !== undefined ? targetIndex : newTargetItems.length;
                  newTargetItems.splice(finalIndex, 0, item); // Thêm vào đích

                  batch.update(sourceRef, { items: newSourceItems });
                  batch.update(targetRef, { items: newTargetItems });
              }
          }

          await batch.commit(); // COMMIT 1 LẦN DUY NHẤT
          console.log("Drag & Drop Sync Complete via Batch");

      } catch (e) {
          console.error("Batch Update Failed:", e);
      }
      setDraggedItem(null);
  };

  // --- CRUD HELPERS (Giữ nguyên logic cũ nhưng gọn hơn) ---
  const handleAddShelf = async () => { const id = Date.now(); await setDoc(doc(db, "audio-shelves", String(id)), { id, title: "Kệ Mới", items: [] }); setEditingShelfId(id); setTempShelfTitle("Kệ Mới"); };
  const handleDeleteShelf = async (id: number) => { if(confirm("Xóa kệ?")) await deleteDoc(doc(db, "audio-shelves", String(id))); };
  const handleSaveShelfTitle = async (id: number) => { if(!tempShelfTitle.trim()) return; await updateDoc(doc(db, "audio-shelves", String(id)), { title: tempShelfTitle }); setEditingShelfId(null); };
  
  const handleAddNewItem = async (shelfId: number) => { 
      const newItem: AlbumItem = { id: Date.now(), title: "New Song", artist: "Unknown", coverUrl: "", trackUrl: "", year: "2024", description: "", isFavorite: false };
      const shelf = shelves.find(s => s.id === shelfId);
      if (shelf) {
          await updateDoc(doc(db, "audio-shelves", String(shelfId)), { items: [...shelf.items, newItem] });
          setEditingItem({ item: newItem, shelfId }); // Mở modal edit ngay
      }
  };
  
  // --- DERIVED DATA ---
  const allTracks = useMemo(() => {
      let tracks: {item: AlbumItem, shelfId: number}[] = []; 
      shelves.forEach(s => s.items.forEach(i => tracks.push({ item: i, shelfId: s.id })));
      if (filterType === 'favorites') tracks = tracks.filter(t => t.item.isFavorite);
      // Sort logic here if needed
      return tracks;
  }, [shelves, filterType]);

  const focusedShelf = focusedShelfId ? shelves.find(s => s.id === focusedShelfId) : null;

  // --- HANDLE CLICK ITEM (MOBILE vs DESKTOP) ---
  const handleItemClick = (item: AlbumItem, shelfId: number) => {
      if (isMobile) {
          // Mobile: Chạm -> Mở Modal xem chi tiết
          setViewingItem(item);
      } else {
          // Desktop: Click -> Play luôn
          playTrackNow(item, shelfId);
      }
  };

  return (
    <div className="relative h-full w-full flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black overflow-hidden text-slate-200">
      <style>{globalStyles}</style>
      <div id="youtube-player" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}></div>
      
      {/* HEADER */}
      <div className="z-30 w-full flex flex-col bg-slate-900/80 backdrop-blur-xl border-b border-white/5 shadow-2xl shrink-0">
          <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-full border border-white/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]"><Headphones size={24} className="text-cyan-400" /></div>
                  <div className="hidden md:block"><h1 className="text-xl font-bold uppercase tracking-wider">Audio<span className="text-cyan-400">Room</span></h1></div>
              </div>
              <div className="flex items-center gap-2">
                 {/* View Switchers & Controls */}
                 <button onClick={() => setViewMode('shelves')} className={`p-2 rounded-lg ${viewMode === 'shelves' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}><LayoutGrid size={20}/></button>
                 <button onClick={() => setViewMode('library')} className={`p-2 rounded-lg ${viewMode === 'library' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}><Library size={20}/></button>
                 <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
                 <button onClick={onExit} className="p-2 text-red-400 hover:bg-red-500/10 rounded-full"><LogOut size={20}/></button>
              </div>
          </div>
      </div>

      {/* BODY */}
      <div className={`flex-1 w-full overflow-y-auto scrollbar-hide px-4 z-10 ${activeTrack ? 'pb-32' : 'pb-10'}`}>
         <div className="max-w-7xl mx-auto pt-6 min-h-[600px]">
             {/* SHELF VIEW */}
             {viewMode === 'shelves' && !focusedShelfId && (
                <div className="flex flex-col gap-12 pb-20">
                    {shelves.map((shelf) => (
                        <div key={shelf.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, shelf.id)} className="animate-fade-in">
                            <div className="flex items-end gap-4 mb-6 px-2 border-b border-white/5 pb-2 group">
                                <h2 className="text-xl font-bold text-white cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => setFocusedShelfId(shelf.id)}>{shelf.title}</h2>
                                {/* Edit Shelf Buttons */}
                                <div className="ml-auto flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingShelfId(shelf.id); setTempShelfTitle(shelf.title); }} className="text-slate-400 hover:text-cyan-400"><Edit3 size={14}/></button>
                                    <button onClick={() => handleDeleteShelf(shelf.id)} className="text-slate-400 hover:text-red-400"><Trash2 size={14}/></button>
                                </div>
                                {editingShelfId === shelf.id && ( <div className="absolute bg-slate-800 p-2 rounded z-20 flex"><input autoFocus value={tempShelfTitle} onChange={e => setTempShelfTitle(e.target.value)} className="bg-transparent border-b border-cyan-500 outline-none"/><button onClick={() => handleSaveShelfTitle(shelf.id)}><Check size={16} className="text-green-500"/></button></div> )}
                            </div>
                            
                            <div className="flex flex-wrap items-end gap-x-6 gap-y-10 pl-2">
                                {shelf.items.map((item, index) => (
                                    <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item, shelf.id, index)} onDrop={(e) => { e.stopPropagation(); handleDrop(e, shelf.id, index); }}>
                                        <JewelCase3D 
                                            item={item} 
                                            isPlayingThis={activeTrack?.id === item.id && isPlaying}
                                            isError={errorItems.has(item.id)} // Truyền trạng thái lỗi
                                            onClick={() => handleItemClick(item, shelf.id)}
                                            onEdit={() => setEditingItem({ item, shelfId: shelf.id })} 
                                        />
                                    </div>
                                ))}
                                <AddNewAlbum onClick={() => handleAddNewItem(shelf.id)} />
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-center"><button onClick={handleAddShelf} className="px-6 py-2 border border-dashed border-slate-600 rounded-full text-slate-400 hover:text-white flex gap-2 items-center"><Plus size={16}/> New Collection</button></div>
                </div>
             )}
             
             {/* FOCUSED SHELF VIEW (Code tương tự logic trên, chỉ render 1 shelf) */}
             {focusedShelf && (
                 <div className="animate-zoom-in">
                     {/* ... Header Focused Shelf ... */}
                     <div className="flex flex-wrap items-end gap-x-8 gap-y-12">
                         {focusedShelf.items.map((item, index) => (
                             <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item, focusedShelf.id, index)} onDrop={(e) => { e.stopPropagation(); handleDrop(e, focusedShelf.id, index); }}>
                                <JewelCase3D 
                                    item={item} 
                                    isPlayingThis={activeTrack?.id === item.id && isPlaying}
                                    isError={errorItems.has(item.id)}
                                    onClick={() => handleItemClick(item, focusedShelf.id)}
                                    onEdit={() => setEditingItem({ item, shelfId: focusedShelf.id })} 
                                />
                             </div>
                         ))}
                         <AddNewAlbum onClick={() => handleAddNewItem(focusedShelf.id)} />
                     </div>
                 </div>
             )}
         </div>
      </div>

      <MiniPlayer 
        currentTrack={activeTrack} 
        isPlaying={isPlaying} 
        onTogglePlay={togglePlay} 
        onNext={handleNextTrack} 
        onPrev={handlePrevTrack} 
        currentTime={currentTime} 
        duration={duration} 
        onSeek={handleSeek} 
        volume={volume} 
        onVolumeChange={handleVolumeChange}
        isLooping={isLooping}
        onToggleLoop={() => setIsLooping(!isLooping)}
        onToggleFavorite={async () => { /* Logic update Firebase here */ }}
      />
      
      {/* MODALS */}
      {viewingItem && (
        <DetailModal 
            item={viewingItem} 
            onClose={() => setViewingItem(null)} 
            onPlay={() => { playTrackNow(viewingItem); setViewingItem(null); }}
            onAddToQueue={() => { addToQueue(viewingItem); setViewingItem(null); }} // Thêm vào queue thay vì play
        />
      )}
      
      {/* EDIT MODAL giữ nguyên props */}
      {editingItem && <EditModal item={editingItem.item} onClose={() => setEditingItem(null)} onSave={() => { /* Handle Save */ }} onDelete={() => { /* Handle Delete */ }} />}
      
      {/* MASCOT (Background) */}
      <FlyingBroomMascot />
    </div>
  );
};

export default AudioRoom;
