import React from "react";
import {
  Sparkles,
  Disc,
  Play,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AlbumItem } from "../../contexts/DataContext";

interface AudioHeroProps {
  item: AlbumItem | null;
  onPlay: (item: AlbumItem) => void;
  onViewDetail: (item: AlbumItem) => void;
  onNext: () => void;
  onPrev: () => void;
}

const AudioHero: React.FC<AudioHeroProps> = ({
  item,
  onPlay,
  onViewDetail,
  onNext,
  onPrev,
}) => {
  if (!item) return null;

  return (
    <div
      className="
        relative w-full h-[60vh] min-h-[500px] mb-12 rounded-3xl overflow-hidden group 
        transition-all duration-700 ease-out
        border-2 border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.2)]
        hover:border-amber-400 hover:shadow-[0_0_50px_rgba(251,191,36,0.6)] hover:scale-[1.01]
      "
    >
      {/* --- BACKGROUND LAYER --- */}
      <div className="absolute inset-0 z-0 bg-black">
        <img
          key={item.coverUrl} // Force re-render animation when item changes
          src={item.coverUrl}
          alt="Hero Background"
          className="w-full h-full object-cover blur-2xl opacity-60 scale-110 group-hover:scale-125 transition-transform duration-[2000ms] ease-in-out animate-fade-in"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/60 to-transparent" />
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="absolute inset-0 z-10 p-8 md:p-12 flex flex-col md:flex-row items-end md:items-center justify-between gap-8">
        {/* TEXT CONTENT */}
        <div className="flex-1 max-w-3xl space-y-6 animate-slide-up">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-widest rounded-full border border-cyan-500/30 backdrop-blur-md flex items-center gap-1 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Sparkles size={10} /> Spotlight
            </span>
            <span className="text-white/80 text-xs font-mono uppercase tracking-widest drop-shadow-md">
              #Featured Track
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white font-syne leading-[1.1] drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] line-clamp-2">
            {item.title}
          </h1>

          <div className="flex items-center gap-4">
            <p className="text-2xl text-cyan-300 font-bold tracking-wide flex items-center gap-2 drop-shadow-md">
              <Disc size={24} className="animate-spin-slow" /> {item.artist}
            </p>
            <span className="text-white/50 text-xl font-thin">|</span>
            <p className="text-white/80 text-lg font-mono">
              {item.year || "2024"}
            </p>
          </div>

          <p className="text-slate-300 line-clamp-2 max-w-xl text-lg leading-relaxed drop-shadow-md">
            {item.description ||
              "Hãy trải nghiệm không gian âm nhạc đỉnh cao cùng giai điệu này trên The Quanhverse."}
          </p>

          <div className="flex flex-wrap gap-4 pt-6">
            <button
              onClick={() => onPlay(item)}
              className="px-10 py-4 bg-white text-black hover:bg-cyan-400 hover:text-black transition-all rounded-full font-black text-lg flex items-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)] transform hover:-translate-y-1 active:scale-95 duration-300"
            >
              <Play size={28} fill="currentColor" /> PHÁT NGAY
            </button>
            <button
              onClick={() => onViewDetail(item)}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white text-white rounded-full font-bold backdrop-blur-md transition-all flex items-center gap-2"
            >
              <MoreHorizontal size={24} /> CHI TIẾT
            </button>
          </div>
        </div>

        {/* COVER ART (ROTATING 3D) */}
        <div className="hidden md:block relative w-[320px] aspect-square shrink-0 group-hover:scale-105 transition-transform duration-500">
          <div className="absolute inset-0 bg-cyan-500 rounded-2xl blur-[80px] opacity-40 animate-pulse-slow"></div>
          <img
            key={`img-${item.id}`}
            src={item.coverUrl}
            alt={item.title}
            className="relative w-full h-full object-cover rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/20 rotate-3 group-hover:rotate-6 transition-all duration-500 ease-out z-10 animate-fade-in"
          />
        </div>
      </div>

      {/* --- CAROUSEL CONTROLS (NEW) --- */}
      {/* Left Arrow */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 hover:bg-white/20 text-white/50 hover:text-white backdrop-blur-sm border border-white/5 hover:border-white/50 transition-all transform hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft size={32} />
      </button>

      {/* Right Arrow */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 hover:bg-white/20 text-white/50 hover:text-white backdrop-blur-sm border border-white/5 hover:border-white/50 transition-all transform hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
      >
        <ChevronRight size={32} />
      </button>

      {/* Pagination Indicators (Visual Only) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        <div className="w-2 h-2 rounded-full bg-white/30"></div>
        <div className="w-8 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
        <div className="w-2 h-2 rounded-full bg-white/30"></div>
      </div>
    </div>
  );
};

export default AudioHero;
