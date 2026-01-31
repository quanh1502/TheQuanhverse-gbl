import React from "react";
import { Sparkles, Disc, Play, MoreHorizontal } from "lucide-react";
import { AlbumItem } from "../../contexts/DataContext"; // Check lại đường dẫn import này dựa trên file gốc của bạn

interface AudioHeroProps {
  item: AlbumItem | null;
  onPlay: (item: AlbumItem) => void;
  onViewDetail: (item: AlbumItem) => void;
}

const AudioHero: React.FC<AudioHeroProps> = ({
  item,
  onPlay,
  onViewDetail,
}) => {
  if (!item) return null;

  return (
    <div className="relative w-full h-[60vh] min-h-[500px] mb-12 rounded-3xl overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 transition-all duration-700">
      {/* --- LỚP 1: ẢNH NỀN --- */}
      <div className="absolute inset-0 z-0">
        <img
          src={item.coverUrl}
          alt="Hero Background"
          className="w-full h-full object-cover blur-2xl opacity-70 scale-110 group-hover:scale-125 transition-transform duration-[2000ms] ease-in-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/60 to-transparent" />
      </div>

      {/* --- LỚP 2: NỘI DUNG --- */}
      <div className="absolute inset-0 z-10 p-8 md:p-12 flex flex-col md:flex-row items-end md:items-center justify-between gap-8">
        {/* Phần Text */}
        <div className="flex-1 max-w-3xl space-y-6 animate-slide-up">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-widest rounded-full border border-cyan-500/30 backdrop-blur-md flex items-center gap-1 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Sparkles size={10} /> Random Pick
            </span>
            <span className="text-white/80 text-xs font-mono uppercase tracking-widest drop-shadow-md">
              #Discover The Unknown
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white font-syne leading-[1.1] drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
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

        {/* Phần Ảnh Bìa Gốc */}
        <div className="hidden md:block relative w-[320px] aspect-square shrink-0 group-hover:scale-105 transition-transform duration-500">
          <div className="absolute inset-0 bg-cyan-500 rounded-2xl blur-[80px] opacity-40 animate-pulse-slow"></div>
          <img
            src={item.coverUrl}
            alt={item.title}
            className="relative w-full h-full object-cover rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/20 rotate-3 group-hover:rotate-6 transition-all duration-500 ease-out z-10"
          />
        </div>
      </div>

      {/* Fake Navigation Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20 opacity-50">
        {[0, 1, 2, 3, 4].map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${
              idx === 2
                ? "w-12 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                : "w-2 bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default AudioHero;
