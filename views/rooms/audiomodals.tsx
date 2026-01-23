import React, { useState, useRef } from 'react';
import { X, Calendar, Play, Heart, Disc, Edit3, Search, Upload, Link as LinkIcon, Wand2, Trash2, Save, Music, Loader2, Plus, ExternalLink, ListPlus } from 'lucide-react';
import { AlbumItem } from '../../contexts/DataContext';
import { getYouTubeId, getYouTubeThumbnail, searchMusicDatabase } from './utils';

// --- DETAIL MODAL (NÂNG CẤP) ---
// Thêm prop onAddToQueue
export const DetailModal = ({ item, onClose, onPlay, onAddToQueue }: { item: AlbumItem, onClose: () => void, onPlay: () => void, onAddToQueue: () => void }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 perspective-[1200px]">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose}></div>
        <div className="relative w-full max-w-3xl bg-slate-900/50 border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(8,145,178,0.15)] overflow-hidden animate-zoom-in flex flex-col md:flex-row z-[105] backdrop-blur-2xl">
            {/* ... Phần Image giữ nguyên ... */}
            <div className="w-full md:w-5/12 aspect-square md:aspect-auto relative group">
                {item.coverUrl ? ( <><img src={item.coverUrl.replace('100x100', '600x600')} alt={item.title} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:bg-gradient-to-r"></div></> ) : ( <div className="w-full h-full bg-gradient-to-br from-cyan-900/40 to-slate-900 flex items-center justify-center"><Music size={64} className="text-white/10" /></div> )}
                <button onClick={onClose} className="absolute top-4 right-4 md:hidden text-white bg-black/50 p-2 rounded-full backdrop-blur-md"><X size={20} /></button>
            </div>

            <div className="flex-1 p-8 md:p-10 flex flex-col relative">
                <button onClick={onClose} className="absolute top-6 right-6 hidden md:block text-white/30 hover:text-white transition-colors"><X size={24} /></button>
                <div className="flex-1">
                     {/* ... Thông tin bài hát giữ nguyên ... */}
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight tracking-tight">{item.title}</h2>
                    <p className="text-xl md:text-2xl text-cyan-400 font-medium opacity-80 mb-6">{item.artist}</p>
                    <div className="prose prose-invert prose-sm max-w-none"><p className="text-slate-300 leading-relaxed opacity-80 line-clamp-4">{item.description || "Chưa có mô tả cho bài hát này."}</p></div>
                </div>
                
                {/* ACTION BUTTONS */}
                <div className="mt-8 pt-6 border-t border-white/5 flex gap-3">
                  {item.trackUrl ? ( 
                      <>
                        <button onClick={onPlay} className="flex-1 group flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-cyan-500/25 transform hover:-translate-y-1">
                            <Play size={20} fill="currentColor" /> Phát Ngay
                        </button>
                        <button onClick={onAddToQueue} className="px-5 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/10 hover:border-white/30" title="Thêm vào hàng chờ">
                            <ListPlus size={24} />
                        </button>
                      </>
                  ) : ( <div className="text-center text-slate-500 text-sm italic py-4 w-full">Chưa có link nhạc</div> )}
                </div>
            </div>
        </div>
    </div>
);

// --- EDIT MODAL (Giữ nguyên logic của bạn, chỉ export) ---
export const EditModal = ({ item, onClose, onSave, onDelete }: any) => {
    // ... Copy logic cũ vào đây hoặc giữ nguyên file hiện tại ...
    // Placeholder để code ngắn gọn
    return <div />; 
};
