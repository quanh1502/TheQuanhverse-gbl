import React, { useState } from 'react';
import { Coffee, Plus, X, Save, Trash2, Edit3 } from 'lucide-react';
import { useData, CoffeeItem, CafeShelfData } from '../../contexts/DataContext';

// --- Components ---

const CoffeeBag3D = ({ item, onClick }: { item: CoffeeItem; onClick: () => void }) => {
  return (
    <div 
      onClick={onClick}
      className="group relative w-28 h-44 preserve-3d cursor-pointer transition-transform duration-500 hover:-translate-y-4 hover:rotate-y-12"
    >
      {/* Shadow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-8 w-20 h-6 bg-black/60 blur-md rounded-[100%] transform rotateX(60deg)"></div>

      {/* BAG BODY */}
      <div className="absolute inset-0 preserve-3d">
        
        {/* Front Face */}
        <div className="absolute inset-0 bg-slate-100 rounded-sm overflow-hidden backface-hidden shadow-inner border-r border-slate-300/50"
             style={{ transform: 'translateZ(12px)' }}>
           {/* Material Shine */}
           <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent z-20 pointer-events-none"></div>
           
           {/* Design Label */}
           <div className="h-full w-full p-2 flex flex-col bg-slate-50">
              <div className="h-2/3 w-full rounded-sm mb-2 relative overflow-hidden transition-colors duration-500" 
                   style={{ background: `linear-gradient(135deg, ${item.colorFrom}, ${item.colorTo})` }}>
                  <div className="absolute top-1 right-1 text-[8px] font-bold text-white/90 border border-white/30 px-1 rounded bg-black/10 backdrop-blur-sm">
                    {item.roast}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <h3 className="text-white font-serif font-bold text-base leading-none drop-shadow-md break-words">{item.name}</h3>
                    <p className="text-white/80 text-[8px] uppercase tracking-wider mt-1 truncate">{item.region}</p>
                  </div>
                  
                  {/* Edit Icon Hover Hint */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Edit3 className="text-white" size={20} />
                  </div>
              </div>
              <div className="flex-1 flex flex-col justify-between">
                 <p className="text-[8px] text-slate-500 leading-tight font-mono uppercase">
                    <span className="text-slate-800 font-bold line-clamp-2">{item.notes}</span>
                 </p>
                 <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-800 w-2/3"></div>
                 </div>
              </div>
           </div>
        </div>

        {/* Back Face */}
        <div className="absolute inset-0 bg-slate-200 rounded-sm backface-hidden"
             style={{ transform: 'translateZ(-12px) rotateY(180deg)' }}></div>

        {/* Sides */}
        <div className="absolute top-0 bottom-0 left-0 w-[24px] bg-slate-300 origin-left"
             style={{ transform: 'rotateY(-90deg) translateX(-12px)' }}>
              <div className="w-full h-full bg-gradient-to-r from-black/10 to-transparent"></div>
        </div>
        <div className="absolute top-0 bottom-0 right-0 w-[24px] bg-slate-300 origin-right"
             style={{ transform: 'rotateY(90deg) translateX(12px)' }}>
              <div className="w-full h-full bg-gradient-to-l from-black/10 to-transparent"></div>
        </div>

        {/* Top Seal */}
        <div className="absolute -top-3 left-0 right-0 h-3 bg-slate-200 transform origin-bottom rotateX(10deg)"
             style={{ clipPath: 'polygon(0% 100%, 5% 0%, 95% 0%, 100% 100%)' }}>
             <div className="w-full h-px bg-slate-400 mt-1 shadow-sm"></div>
        </div>
      </div>
    </div>
  );
};

const GlassJar = () => {
  return (
    <div className="relative w-16 h-28 group pointer-events-none">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 w-12 h-4 bg-black/50 blur-sm rounded-[100%]"></div>
      <div className="relative w-full h-full rounded-lg overflow-hidden bg-gradient-to-r from-white/10 via-white/20 to-white/5 backdrop-blur-sm border border-white/20 shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]">
         <div className="absolute top-0 left-2 w-2 h-full bg-gradient-to-b from-white/30 to-transparent opacity-50 blur-[1px]"></div>
         <div className="absolute bottom-1 left-1 right-1 top-6 rounded-b-md bg-[#3e2723] opacity-90 overflow-hidden">
            <div className="w-full h-full opacity-50" style={{ backgroundImage: 'radial-gradient(#5d4037 2px, transparent 2px)', backgroundSize: '6px 6px' }}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/40"></div>
         </div>
      </div>
      <div className="absolute -top-1 left-0 right-0 h-6 bg-neutral-900 rounded-t-md rounded-b-sm border-t border-white/10 shadow-lg flex items-center justify-center z-10">
         <div className="w-6 h-3 rounded-full border border-neutral-700 bg-neutral-800 shadow-inner flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-neutral-900 rounded-full"></div>
         </div>
      </div>
    </div>
  );
};

const CoffeeCup3D = ({ color }: { color: string }) => {
  return (
    <div className="relative w-12 h-12 preserve-3d pointer-events-none">
      {/* Shadow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 w-10 h-4 bg-black/50 blur-sm rounded-[100%] transform rotateX(60deg)"></div>

      {/* Cup Body (Cube Aesthetic for Digital Vibe) */}
      <div className="absolute inset-0 preserve-3d w-10 h-10 mx-auto top-2">
        
        {/* Steam Particles */}
        <div className="absolute -top-4 left-1/2 w-0 h-0">
          <div className="absolute w-2 h-2 bg-white/30 rounded-full blur-[2px] animate-float" 
               style={{ animation: 'steam 2.5s infinite ease-out', left: '-4px' }}></div>
           <div className="absolute w-2 h-2 bg-white/20 rounded-full blur-[2px] animate-float" 
               style={{ animation: 'steam 3s infinite ease-out 0.5s', left: '2px' }}></div>
            <div className="absolute w-1 h-1 bg-white/20 rounded-full blur-[1px] animate-float" 
               style={{ animation: 'steam 2s infinite ease-out 1.2s', left: '-1px' }}></div>
        </div>

        {/* Faces */}
        {/* Front */}
        <div className="absolute inset-0 w-10 h-10 rounded-sm"
             style={{ 
                background: `linear-gradient(to bottom right, ${color}, #1e293b)`,
                transform: 'translateZ(20px)',
                boxShadow: 'inset 0 0 5px rgba(0,0,0,0.2)'
             }}></div>
        {/* Back */}
        <div className="absolute inset-0 w-10 h-10 bg-slate-800 rounded-sm"
             style={{ transform: 'rotateY(180deg) translateZ(20px)' }}></div>
        {/* Left */}
        <div className="absolute inset-0 w-10 h-10 bg-slate-700 rounded-sm"
             style={{ transform: 'rotateY(-90deg) translateZ(20px)' }}></div>
        {/* Right */}
        <div className="absolute inset-0 w-10 h-10 bg-slate-700 rounded-sm flex items-center justify-center"
             style={{ transform: 'rotateY(90deg) translateZ(20px)' }}>
             {/* Handle attachment */}
             <div className="w-4 h-6 border-4 border-slate-600 rounded-r-md transform translate-x-2 translate-z-[-5px]"></div>
        </div>
        
        {/* Liquid (Top) */}
        <div className="absolute inset-0 w-10 h-10 bg-[#3e2723] rounded-sm border-4 border-slate-600/50"
             style={{ 
                transform: 'rotateX(90deg) translateZ(20px)',
                background: 'radial-gradient(circle, #4e342e 30%, #271c19 100%)'
             }}></div>
        
        {/* Bottom */}
         <div className="absolute inset-0 w-10 h-10 bg-slate-900 rounded-sm"
             style={{ transform: 'rotateX(-90deg) translateZ(20px)' }}></div>
      </div>

      <style>{`
        @keyframes steam {
          0% { transform: translateY(0) scale(1); opacity: 0.6; }
          100% { transform: translateY(-30px) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const AddNewPlaceholder = ({ onClick }: { onClick: () => void }) => {
  return (
    <div onClick={onClick} className="w-28 h-44 flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-lg bg-white/5 hover:bg-white/10 hover:border-orange-500/50 transition-all cursor-pointer group">
       <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Plus className="text-white/50 group-hover:text-orange-400" />
       </div>
       <span className="mt-4 text-[10px] text-white/40 font-mono uppercase tracking-widest">Add New</span>
    </div>
  );
};

// --- Edit Modal ---
const EditModal = ({ 
  item, 
  onClose, 
  onSave, 
  onDelete 
}: { 
  item: CoffeeItem, 
  onClose: () => void, 
  onSave: (item: CoffeeItem) => void,
  onDelete: (id: number) => void
}) => {
  const [formData, setFormData] = useState<CoffeeItem>({ ...item });

  const gradients = [
     { from: '#f472b6', to: '#be185d', label: 'Pink' },
     { from: '#facc15', to: '#ea580c', label: 'Orange' },
     { from: '#a855f7', to: '#4c1d95', label: 'Purple' },
     { from: '#60a5fa', to: '#1e3a8a', label: 'Blue' },
     { from: '#4ade80', to: '#14532d', label: 'Green' },
     { from: '#94a3b8', to: '#0f172a', label: 'Slate' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
       <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
       <div className="relative bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
          
          {/* Header */}
          <div className="p-6 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center">
             <h3 className="text-xl font-serif text-orange-100">Customize Bag</h3>
             <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
             
             {/* Name & Region */}
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-xs text-slate-400 uppercase font-mono">Coffee Name</label>
                   <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-xs text-slate-400 uppercase font-mono">Region</label>
                   <input 
                      type="text" 
                      value={formData.region} 
                      onChange={(e) => setFormData({...formData, region: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                   />
                </div>
             </div>

             {/* Roast Level */}
             <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase font-mono">Roast Level</label>
                <div className="flex gap-2">
                   {['Light', 'Medium', 'Dark', 'Omni'].map(r => (
                      <button 
                        key={r}
                        onClick={() => setFormData({...formData, roast: r as any})}
                        className={`flex-1 py-1.5 text-xs rounded border transition-all ${formData.roast === r ? 'bg-orange-500/20 border-orange-500 text-orange-200' : 'bg-slate-800 border-transparent text-slate-400 hover:bg-slate-700'}`}
                      >
                         {r}
                      </button>
                   ))}
                </div>
             </div>

             {/* Notes */}
             <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase font-mono">Tasting Notes</label>
                <textarea 
                   value={formData.notes} 
                   onChange={(e) => setFormData({...formData, notes: e.target.value})}
                   className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:border-orange-500 focus:outline-none h-20 resize-none"
                />
             </div>

             {/* Color Theme */}
             <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase font-mono">Packaging Style</label>
                <div className="flex gap-3 overflow-x-auto py-2 scrollbar-hide">
                   {gradients.map((g, i) => (
                      <button 
                         key={i}
                         onClick={() => setFormData({...formData, colorFrom: g.from, colorTo: g.to})}
                         className={`w-8 h-8 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-slate-900 transition-all ${formData.colorFrom === g.from ? 'ring-white' : 'ring-transparent opacity-70 hover:opacity-100'}`}
                         style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                      />
                   ))}
                </div>
             </div>

          </div>

          {/* Footer Actions */}
          <div className="p-6 pt-2 flex gap-3">
             <button 
               onClick={() => onDelete(formData.id)}
               className="p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
             >
               <Trash2 size={20} />
             </button>
             <button 
               onClick={() => onSave(formData)}
               className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold transition-colors py-3"
             >
               <Save size={18} />
               Save Changes
             </button>
          </div>
       </div>
    </div>
  );
};

const CafeRoom: React.FC = () => {
  const { cafeShelves: shelves, setCafeShelves: setShelves } = useData();
  const [editingItem, setEditingItem] = useState<{item: CoffeeItem, shelfId: number} | null>(null);
  
  // New state for shelf management
  const [editingShelfId, setEditingShelfId] = useState<number | null>(null);
  const [tempShelfTitle, setTempShelfTitle] = useState("");

  // --- Item Handlers ---
  const handleAddNewItem = (shelfId: number) => {
     const newItem: CoffeeItem = {
        id: Date.now(),
        name: "New Blend",
        region: "Unknown Origin",
        process: "Washed",
        notes: "Add notes here...",
        roast: "Medium",
        colorFrom: "#94a3b8",
        colorTo: "#0f172a"
     };
     
     // Add to shelf state immediately then open edit modal
     setShelves(prev => prev.map(s => {
        if (s.id === shelfId) {
           return { ...s, items: [...s.items, newItem] };
        }
        return s;
     }));
     setEditingItem({ item: newItem, shelfId });
  };

  const handleSaveItem = (updatedItem: CoffeeItem) => {
     if (!editingItem) return;
     setShelves(prev => prev.map(s => {
        if (s.id === editingItem.shelfId) {
           return {
              ...s,
              items: s.items.map(i => i.id === updatedItem.id ? updatedItem : i)
           };
        }
        return s;
     }));
     setEditingItem(null);
  };

  const handleDeleteItem = (itemId: number) => {
     if (!editingItem) return;
     setShelves(prev => prev.map(s => {
        if (s.id === editingItem.shelfId) {
           return {
              ...s,
              items: s.items.filter(i => i.id !== itemId)
           };
        }
        return s;
     }));
     setEditingItem(null);
  };

  // --- Shelf Handlers ---
  const handleAddShelf = () => {
    const newId = Date.now();
    const newShelf: CafeShelfData = {
      id: newId,
      title: "New Collection",
      items: []
    };
    setShelves([...shelves, newShelf]);
    // Automatically start editing the new shelf title
    setEditingShelfId(newId);
    setTempShelfTitle("New Collection");
  };

  const handleStartEditShelf = (shelf: CafeShelfData) => {
    setEditingShelfId(shelf.id);
    setTempShelfTitle(shelf.title);
  };

  const handleSaveShelfTitle = (id: number) => {
    setShelves(prev => prev.map(s => s.id === id ? { ...s, title: tempShelfTitle } : s));
    setEditingShelfId(null);
  };

  const handleDeleteShelf = (id: number) => {
    if (window.confirm("Are you sure you want to remove this entire shelf?")) {
      setShelves(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <div className="relative h-full w-full flex flex-col items-center overflow-hidden perspective-container bg-slate-950">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#1a120b] to-slate-950 -z-20"></div>
      
      {/* Header */}
      <div className="relative z-10 text-center mt-12 mb-8 animate-fade-away" style={{ animationDirection: 'reverse' }}>
         <div className="inline-block p-3 rounded-full bg-orange-900/20 border border-orange-500/30 mb-2 backdrop-blur-md">
            <Coffee size={24} className="text-orange-400" />
         </div>
         <h1 className="text-3xl md:text-4xl font-serif text-orange-50 tracking-widest uppercase">
            The Roastery
         </h1>
      </div>

      {/* Scrollable Shelves Area */}
      <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-32 px-4 scrollbar-hide perspective-container">
         <div className="max-w-5xl mx-auto flex flex-col gap-32 pt-12 pb-24">
            
            {shelves.map((shelf, index) => (
               <div key={shelf.id} className="relative preserve-3d group/shelf">
                  
                  {/* Shelf Title Area */}
                  <div className="absolute -top-12 left-4 md:left-0 w-full flex items-center gap-2 mb-4 border-b border-orange-900/30 pb-1 z-20">
                     <span className="text-orange-500/50 font-mono text-sm font-bold mr-2">0{index + 1}</span>
                     
                     {editingShelfId === shelf.id ? (
                        <div className="flex items-center gap-2 flex-1 animate-zoom-in">
                            <input 
                                autoFocus
                                className="bg-slate-900/90 border border-orange-500/50 text-orange-100 px-3 py-1 rounded w-full max-w-md outline-none font-mono text-sm uppercase tracking-widest"
                                value={tempShelfTitle}
                                onChange={(e) => setTempShelfTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveShelfTitle(shelf.id);
                                    if (e.key === 'Escape') setEditingShelfId(null);
                                }}
                                onBlur={() => handleSaveShelfTitle(shelf.id)}
                            />
                            <button onClick={() => handleSaveShelfTitle(shelf.id)} className="text-green-400 hover:text-green-300 p-1"><Save size={16}/></button>
                        </div>
                     ) : (
                         <div className="flex items-center gap-4 flex-1 group-hover/shelf:translate-x-2 transition-transform duration-300">
                            <span className="text-orange-200/50 font-mono text-sm uppercase tracking-widest truncate">
                                {shelf.title}
                            </span>
                            
                            {/* Edit Controls (Visible on Hover) */}
                            <div className="flex items-center gap-1 opacity-0 group-hover/shelf:opacity-100 transition-opacity duration-300">
                                <button 
                                    onClick={() => handleStartEditShelf(shelf)} 
                                    className="p-1.5 rounded-md hover:bg-orange-500/20 text-slate-500 hover:text-orange-300 transition-colors"
                                    title="Rename Shelf"
                                >
                                    <Edit3 size={14}/>
                                </button>
                                <button 
                                    onClick={() => handleDeleteShelf(shelf.id)} 
                                    className="p-1.5 rounded-md hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                                    title="Remove Shelf"
                                >
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                         </div>
                     )}
                  </div>

                  {/* The Plank (3D) */}
                  <div className="absolute top-36 -left-[10%] -right-[10%] h-12 bg-slate-800 transform -rotate-x-6 shadow-2xl border-t border-white/5">
                     <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900"></div>
                     {/* Wood texture overlay */}
                     <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
                  </div>

                  {/* Items Grid */}
                  <div className="relative z-10 flex flex-wrap justify-center md:justify-start items-end gap-12 md:gap-16 pl-4 md:pl-10 preserve-3d">
                     {shelf.items.map((item) => (
                        <div key={item.id} className="flex items-end gap-2 group/item preserve-3d">
                           <CoffeeBag3D 
                              item={item} 
                              onClick={() => setEditingItem({ item, shelfId: shelf.id })} 
                           />
                           {/* Accessories Cluster: Jar + Cup */}
                           <div className="transform translate-x-[-10px] translate-z-[20px] transition-transform duration-500 group-hover/item:translate-x-[-5px] flex items-end -space-x-2">
                              <GlassJar />
                              <div className="transform translate-z-[30px] translate-x-[-5px]">
                                 <CoffeeCup3D color={item.colorTo} />
                              </div>
                           </div>
                        </div>
                     ))}
                     
                     {/* Add New Button at end of shelf */}
                     <div className="transform translate-y-[4px]">
                        <AddNewPlaceholder onClick={() => handleAddNewItem(shelf.id)} />
                     </div>
                  </div>
               </div>
            ))}

            {/* Add New Shelf Section */}
            <div className="flex justify-center mt-8 opacity-50 hover:opacity-100 transition-opacity duration-500">
                <button 
                    onClick={handleAddShelf}
                    className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-slate-800 hover:border-orange-500/40 hover:bg-slate-900/50 transition-all"
                >
                    <div className="p-3 rounded-full bg-slate-900 group-hover:bg-orange-500/20 transition-colors">
                        <Plus className="text-slate-600 group-hover:text-orange-400" size={24} />
                    </div>
                    <span className="font-mono uppercase text-xs tracking-[0.2em] text-slate-600 group-hover:text-orange-200/70">
                        Create New Shelf
                    </span>
                </button>
            </div>

         </div>
      </div>

      {/* Modal */}
      {editingItem && (
         <EditModal 
            item={editingItem.item} 
            onClose={() => setEditingItem(null)}
            onSave={handleSaveItem}
            onDelete={handleDeleteItem}
         />
      )}

    </div>
  );
};

export default CafeRoom;