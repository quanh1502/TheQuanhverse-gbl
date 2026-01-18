import React, { useState, useEffect } from 'react';
// Thêm Lock, Unlock, ArrowRight vào import cũ
import { Coffee, Plus, X, Save, Trash2, Edit3, Lock, Unlock, ArrowRight } from 'lucide-react'; 
import { useData, CoffeeItem, CafeShelfData } from '../../contexts/DataContext';

// ... (Giữ nguyên các component CoffeeBag3D, GlassJar, CoffeeCup3D, AddNewPlaceholder, EditModal như cũ) ...

// --- Component Mới: Màn hình khóa ---
const SecurityGate = ({ 
  onUnlock, 
  isWrongPass 
}: { 
  onUnlock: (pass: string) => void,
  isWrongPass: boolean 
}) => {
  const [inputPass, setInputPass] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUnlock(inputPass);
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950">
      {/* Background Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900/10 via-slate-950 to-slate-950 animate-spin-slow opacity-50"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm px-6">
        <div className="mb-8 text-center space-y-2">
          <div className={`mx-auto w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 shadow-2xl transition-all duration-300 ${isWrongPass ? 'animate-shake border-red-500/50 text-red-500' : 'border-orange-500/30 text-orange-400'}`}>
            {isWrongPass ? <Lock size={32} /> : <Lock size={32} />}
          </div>
          <h2 className="text-2xl font-serif text-slate-200 tracking-wider">RESTRICTED ACCESS</h2>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Enter Passcode to Enter The Roastery</p>
        </div>

        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="password"
            autoFocus
            value={inputPass}
            onChange={(e) => setInputPass(e.target.value)}
            placeholder="PASSCODE"
            className="w-full bg-slate-900/50 border-b-2 border-slate-800 py-4 px-4 text-center text-xl text-orange-50 tracking-[0.5em] placeholder:text-slate-700 placeholder:tracking-normal focus:outline-none focus:border-orange-500 transition-colors"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-orange-400 transition-colors"
          >
            <ArrowRight size={20} />
          </button>
        </form>

        {isWrongPass && (
          <p className="mt-4 text-center text-xs text-red-400 font-mono animate-pulse">
            ACCESS DENIED. INCORRECT PASSCODE.
          </p>
        )}
      </div>

      {/* CSS Animation cho hiệu ứng rung khi sai pass */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

// --- Main Component ---
const CafeRoom: React.FC = () => {
  const { cafeShelves: shelves, setCafeShelves: setShelves } = useData();
  
  // --- STATE CHO KHÓA PHÒNG ---
  // Mặc định là true (bị khóa) khi mới vào
  const [isLocked, setIsLocked] = useState(true);
  const [isWrongPass, setIsWrongPass] = useState(false);

  // MẬT KHẨU CỦA BẠN (Thay đổi tại đây)
  const MY_SECRET_PASS = "2026"; 

  const handleUnlock = (pass: string) => {
    if (pass === MY_SECRET_PASS) {
      setIsLocked(false);
      setIsWrongPass(false);
    } else {
      setIsWrongPass(true);
      // Reset trạng thái sai sau 2 giây để người dùng thử lại
      setTimeout(() => setIsWrongPass(false), 2000);
    }
  };

  // Nút khóa lại thủ công (nếu muốn khóa khi đang ở trong phòng)
  const handleLockRoom = () => {
      setIsLocked(true);
  };

  // ... (Giữ nguyên các state cũ: editingItem, editingShelfId, tempShelfTitle) ...
  const [editingItem, setEditingItem] = useState<{item: CoffeeItem, shelfId: number} | null>(null);
  const [editingShelfId, setEditingShelfId] = useState<number | null>(null);
  const [tempShelfTitle, setTempShelfTitle] = useState("");

  // ... (Giữ nguyên các hàm handler: handleAddNewItem, handleSaveItem, handleDeleteItem, Shelf handlers...) ...
  // (Tôi lược bớt phần code cũ để tập trung vào phần mới, bạn giữ nguyên logic cũ nhé)
  const handleAddNewItem = (shelfId: number) => { /* Code cũ */ };
  const handleSaveItem = (updatedItem: CoffeeItem) => { /* Code cũ */ };
  const handleDeleteItem = (itemId: number) => { /* Code cũ */ };
  const handleAddShelf = () => { /* Code cũ */ };
  const handleStartEditShelf = (shelf: CafeShelfData) => { /* Code cũ */ };
  const handleSaveShelfTitle = (id: number) => { /* Code cũ */ };
  const handleDeleteShelf = (id: number) => { /* Code cũ */ };

  return (
    <div className="relative h-full w-full flex flex-col items-center overflow-hidden perspective-container bg-slate-950">
      
      {/* --- PHẦN LOGIC KHÓA --- */}
      {isLocked && (
        <SecurityGate onUnlock={handleUnlock} isWrongPass={isWrongPass} />
      )}

      {/* --- NÚT KHÓA THỦ CÔNG (Tùy chọn hiển thị ở góc màn hình) --- */}
      {!isLocked && (
        <button 
          onClick={handleLockRoom}
          className="absolute top-4 right-4 z-50 p-2 text-slate-600 hover:text-orange-500 transition-colors opacity-50 hover:opacity-100"
          title="Lock Room"
        >
          <Lock size={20} />
        </button>
      )}

      {/* Background Ambience (Giữ nguyên) */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#1a120b] to-slate-950 -z-20"></div>
      
      {/* ... Phần render giao diện chính (Header, Shelves, Modal) giữ nguyên như code gốc ... */}
       <div className="relative z-10 text-center mt-12 mb-8 animate-fade-away" style={{ animationDirection: 'reverse' }}>
          {/* ... Header content ... */}
           <div className="inline-block p-3 rounded-full bg-orange-900/20 border border-orange-500/30 mb-2 backdrop-blur-md">
             <Coffee size={24} className="text-orange-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-orange-50 tracking-widest uppercase">
             The Roastery
          </h1>
       </div>

       {/* ... Scrollable Shelves Area ... */}
       <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-32 px-4 scrollbar-hide perspective-container">
           {/* ... Nội dung shelves code cũ ... */}
           {/* Bạn copy lại phần render shelves ở đây */}
           {/* Do code dài nên tôi chỉ note vị trí để bạn ghép vào */}
             <div className="max-w-5xl mx-auto flex flex-col gap-32 pt-12 pb-24">
               {shelves.map((shelf, index) => (
                  // ... Code render shelf ...
                  <div key={shelf.id} className="relative preserve-3d group/shelf">
                      {/* ... Nội dung từng shelf ... */}
                      {/* Cần tôi paste lại toàn bộ đoạn này không? Nếu bạn biết chỗ ghép rồi thì có thể bỏ qua để đỡ rối */}
                      <div className="absolute -top-12 left-4 md:left-0 w-full flex items-center gap-2 mb-4 border-b border-orange-900/30 pb-1 z-20">
                          {/* ... Title Shelf ... */}
                          <span className="text-orange-500/50 font-mono text-sm font-bold mr-2">0{index + 1}</span>
                           <span className="text-orange-200/50 font-mono text-sm uppercase tracking-widest truncate">{shelf.title}</span>
                      </div>
                      <div className="absolute top-36 -left-[10%] -right-[10%] h-12 bg-slate-800 transform -rotate-x-6 shadow-2xl border-t border-white/5"></div>
                      <div className="relative z-10 flex flex-wrap justify-center md:justify-start items-end gap-12 md:gap-16 pl-4 md:pl-10 preserve-3d">
                        {shelf.items.map((item) => (
                           <CoffeeBag3D 
                              key={item.id}
                              item={item} 
                              onClick={() => setEditingItem({ item, shelfId: shelf.id })} 
                           />
                        ))}
                        <div className="transform translate-y-[4px]">
                          <AddNewPlaceholder onClick={() => handleAddNewItem(shelf.id)} />
                        </div>
                      </div>
                  </div>
               ))}
                <div className="flex justify-center mt-8 opacity-50 hover:opacity-100 transition-opacity duration-500">
                    <button onClick={handleAddShelf} className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-slate-800 hover:border-orange-500/40 hover:bg-slate-900/50 transition-all">
                        <Plus className="text-slate-600 group-hover:text-orange-400" size={24} />
                    </button>
                </div>
             </div>
       </div>

       {/* ... Modal Edit ... */}
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
