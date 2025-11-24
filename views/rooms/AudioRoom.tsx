// --- MAIN COMPONENT: AudioRoom (Optimized) ---
const AudioRoom: React.FC = () => {
  const [shelves, setShelves] = useState<AudioShelfData[]>([]);
  const [isLoading, setIsLoading] = useState(true); // 1. Thêm state loading
  
  const [viewingItem, setViewingItem] = useState<AlbumItem | null>(null);
  const [editingItem, setEditingItem] = useState<{item: AlbumItem, shelfId: number} | null>(null);
  const [editingShelfId, setEditingShelfId] = useState<number | null>(null);
  const [tempShelfTitle, setTempShelfTitle] = useState("");

  // --- Background Visualizer ---
  const [bars, setBars] = useState<number[]>(new Array(30).fill(20));
  useEffect(() => {
    const interval = setInterval(() => setBars(prev => prev.map(() => Math.random() * 60 + 10)), 150);
    return () => clearInterval(interval);
  }, []);

  // --- 1. LẮNG NGHE DỮ LIỆU TỪ FIREBASE ---
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onSnapshot(collection(db, "audio-shelves"), 
      (snapshot) => {
        const loadedShelves = snapshot.docs.map(doc => doc.data() as AudioShelfData);
        loadedShelves.sort((a, b) => a.id - b.id);
        setShelves(loadedShelves);
        setIsLoading(false); // Tắt loading khi có dữ liệu
      },
      (error) => {
        console.error("Firebase Snapshot Error:", error);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // --- 2. CÁC HÀM GHI DỮ LIỆU (Thêm try/catch) ---

  const handleAddShelf = async () => {
    try {
      const newId = Date.now();
      const newShelf: AudioShelfData = { id: newId, title: "New Genre", items: [] };
      await setDoc(doc(db, "audio-shelves", String(newId)), newShelf);
      
      setEditingShelfId(newId);
      setTempShelfTitle("New Genre");
    } catch (error) {
      console.error("Error adding shelf:", error);
      alert("Không thể tạo kệ mới. Vui lòng thử lại.");
    }
  };

  const handleSaveShelfTitle = async (id: number) => {
    if (!tempShelfTitle.trim()) return; // Validation đơn giản
    try {
      const shelfRef = doc(db, "audio-shelves", String(id));
      await updateDoc(shelfRef, { title: tempShelfTitle });
      setEditingShelfId(null);
    } catch (error) {
      console.error("Error updating title:", error);
    }
  };

  const handleDeleteShelf = async (id: number) => {
     if(window.confirm("Delete this shelf?")) {
        try {
          await deleteDoc(doc(db, "audio-shelves", String(id)));
        } catch (error) {
          console.error("Error deleting shelf:", error);
        }
     }
  };

  const handleAddNewItem = async (shelfId: number) => {
     try {
       const newItem: AlbumItem = {
         id: Date.now(),
         title: "New Track",
         artist: "Unknown Artist",
         coverUrl: "",
         trackUrl: "",
         year: new Date().getFullYear().toString(),
         description: "",
         isFavorite: false,
       };
       
       const shelf = shelves.find(s => s.id === shelfId);
       if (shelf) {
         const updatedItems = [...shelf.items, newItem];
         await updateDoc(doc(db, "audio-shelves", String(shelfId)), { items: updatedItems });
         setEditingItem({ item: newItem, shelfId });
       }
     } catch (error) {
       console.error("Error adding item:", error);
     }
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
     } catch (error) {
       console.error("Error saving item:", error);
       alert("Lỗi khi lưu thông tin đĩa.");
     }
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
     } catch (error) {
       console.error("Error deleting item:", error);
     }
  };

  // --- DRAG & DROP LOGIC ---
  const [draggedItem, setDraggedItem] = useState<{ item: AlbumItem, sourceShelfId: number, sourceIndex: number } | null>(null);

  const handleDragStart = (e: React.DragEvent, item: AlbumItem, shelfId: number, index: number) => {
     setDraggedItem({ item, sourceShelfId: shelfId, sourceIndex: index });
     e.dataTransfer.effectAllowed = "move";
     // Thêm delay nhỏ để tránh xung đột UI khi bắt đầu drag
     const el = e.target as HTMLElement;
     requestAnimationFrame(() => el.classList.add('opacity-50'));
  };

  const handleDragEnd = (e: React.DragEvent) => {
     const el = e.target as HTMLElement;
     el.classList.remove('opacity-50');
     setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
     e.preventDefault();
     e.dataTransfer.dropEffect = "move";
  };

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

               // Sử dụng Promise.all để đảm bảo cả 2 thao tác ghi đều hoàn tất
               await Promise.all([
                   updateDoc(doc(db, "audio-shelves", String(sourceShelfId)), { items: newSourceItems }),
                   updateDoc(doc(db, "audio-shelves", String(targetShelfId)), { items: newTargetItems })
               ]);
           }
       }
     } catch (error) {
       console.error("Drag and drop error:", error);
       // Tùy chọn: Refresh lại trang hoặc thông báo lỗi nếu sync thất bại
     }
     setDraggedItem(null);
  };

  return (
    <div className="relative h-full w-full flex flex-col items-center bg-slate-950 overflow-hidden">
      
      {/* Mascot */}
      {!(viewingItem?.isFavorite) && (
        <RavenclawTaurusMascot className="absolute bottom-4 left-4 z-20" greeting="Tận hưởng âm nhạc đi Muggle" variant="music" placement="right" />
      )}

      {/* Visualizer */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-2 h-64 opacity-10 pointer-events-none -z-0 gap-1">
         {bars.map((h, i) => (
            <div key={i} className="w-full bg-cyan-500/20 blur-xl transition-all duration-300" style={{ height: `${h}%` }}></div>
         ))}
      </div>

      {/* Header */}
      <div className="relative z-10 mt-12 mb-8 text-center animate-appear-from-void">
         <div className="inline-flex items-center justify-center p-4 rounded-full bg-cyan-950/30 border border-cyan-500/30 mb-2 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
            <Headphones size={32} className="text-cyan-400" />
         </div>
         <h1 className="text-4xl font-bold text-cyan-100 tracking-[0.2em] uppercase font-mono">Quanh<span className="text-cyan-500">Zik</span></h1>
         <p className="text-cyan-400/50 text-xs tracking-widest mt-2">Quanh's Sonic Dimension</p>
         <p className="text-slate-600 text-[10px] mt-1">Double click to edit • Click to view</p>
      </div>

      {/* Content */}
      <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-32 px-4 scrollbar-hide perspective-container z-10">
         <div className="max-w-6xl mx-auto flex flex-col gap-24 pt-8 pb-24">
            
            {/* Loading Indicator */}
            {isLoading ? (
               <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <Loader2 size={48} className="text-cyan-500 animate-spin" />
                  <p className="text-cyan-400/50 font-mono text-sm animate-pulse">Loading Frequency...</p>
               </div>
            ) : (
               <>
                 {shelves.length === 0 && (
                    <div className="text-center text-slate-500 italic">
                       Chưa có kệ đĩa nào. Bấm nút bên dưới để tạo nhé!
                    </div>
                 )}

                 {shelves.map((shelf) => (
                    <div key={shelf.id} className="relative group/shelf" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, shelf.id)}>
                       
                       {/* Shelf Header */}
                       <div className="flex items-center gap-4 mb-6 border-b border-cyan-900/50 pb-2 w-full max-w-md">
                          <Mic2 size={16} className="text-cyan-700" />
                          {editingShelfId === shelf.id ? (
                             <div className="flex items-center gap-2 flex-1">
                                <input autoFocus className="bg-slate-900 border border-cyan-500/50 text-cyan-100 px-2 py-1 rounded w-full text-sm font-mono uppercase"
                                    value={tempShelfTitle} onChange={(e) => setTempShelfTitle(e.target.value)} onBlur={() => handleSaveShelfTitle(shelf.id)} onKeyDown={(e) => e.key === 'Enter' && handleSaveShelfTitle(shelf.id)} />
                             </div>
                          ) : (
                             <div className="flex items-center gap-4 flex-1 group-hover/shelf:translate-x-2 transition-transform">
                                <h2 className="text-lg text-cyan-100/80 font-mono uppercase tracking-wider">{shelf.title}</h2>
                                <div className="opacity-0 group-hover/shelf:opacity-100 transition-opacity flex gap-1">
                                   <button onClick={() => { setEditingShelfId(shelf.id); setTempShelfTitle(shelf.title); }} className="p-1 text-slate-500 hover:text-cyan-400"><Edit3 size={14}/></button>
                                   <button onClick={() => handleDeleteShelf(shelf.id)} className="p-1 text-slate-500 hover:text-red-400"><Trash2 size={14}/></button>
                                </div>
                             </div>
                          )}
                       </div>

                       {/* 3D Shelf Platform */}
                       <div className="absolute top-32 -left-[5%] -right-[5%] h-4 bg-cyan-900/20 border-t border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)] transform -rotate-x-6 translate-z-[-20px]"></div>
                       
                       {/* Items Row */}
                       <div className="flex flex-wrap items-end gap-x-6 gap-y-16 pl-4 relative z-10">
                          {shelf.items.map((item, index) => (
                             <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item, shelf.id, index)} onDragEnd={handleDragEnd} onDrop={(e) => { e.stopPropagation(); handleDrop(e, shelf.id, index); }}>
                                <JewelCase3D item={item} onClick={() => setViewingItem(item)} onEdit={() => setEditingItem({ item, shelfId: shelf.id })} />
                             </div>
                          ))}
                          <AddNewAlbum onClick={() => handleAddNewItem(shelf.id)} />
                       </div>
                    </div>
                 ))}

                 <div className="flex justify-center mt-12">
                    <button onClick={handleAddShelf} className="px-8 py-4 rounded-full border border-dashed border-cyan-900 text-cyan-700 hover:text-cyan-400 hover:border-cyan-500 hover:bg-cyan-900/10 transition-all uppercase font-mono text-xs tracking-widest flex items-center gap-2">
                       <Plus size={16} /> Create New Section
                    </button>
                 </div>
               </>
            )}
         </div>
      </div>

      {viewingItem && <DetailModal item={viewingItem} onClose={() => setViewingItem(null)} />}
      {editingItem && <EditModal item={editingItem.item} onClose={() => setEditingItem(null)} onSave={handleSaveItem} onDelete={handleDeleteItem} />}
    </div>
  );
};

export default AudioRoom;
