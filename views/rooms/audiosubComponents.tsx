// src/rooms/audiosubComponents.tsx
import React, { useRef, useEffect, useState } from "react";
// Gộp tất cả các icon cần thiết, thêm Flame và Zap cho nhãn HOT/NEW
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Music,
  Plus,
  Repeat,
  Heart,
  AlertTriangle,
  ListMusic,
  Flame,
  Zap,
} from "lucide-react";

import { AlbumItem } from "../../contexts/DataContext";
import RavenclawTaurusMascot from "../../components/RavenclawTaurusMascot";
import { formatTime } from "./utils";

// --- 1. MASCOT (GIỮ NGUYÊN) ---
export const FlyingBroomMascot = () => {
  const mascotRef = useRef<HTMLDivElement>(null);
  const [sparkles, setSparkles] = useState<
    { id: number; x: number; y: number; size: number }[]
  >([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (mascotRef.current) {
        const rect = mascotRef.current.getBoundingClientRect();
        const tailX = rect.left + rect.width * 0.2;
        const tailY = rect.top + rect.height * 0.8;
        setSparkles((prev) => [
          ...prev.slice(-20),
          {
            id: Date.now(),
            x: tailX + (Math.random() * 20 - 10),
            y: tailY + (Math.random() * 20 - 10),
            size: Math.random() * 8 + 4,
          },
        ]);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="sparkle-trail"
          style={{ left: s.x, top: s.y, width: s.size, height: s.size }}
        />
      ))}
      <div
        ref={mascotRef}
        className="absolute bottom-4 left-4 animate-mascot-intro"
      >
        <div className="transform -rotate-12">
          <RavenclawTaurusMascot
            variant="music"
            placement="right"
            forceOpen={false}
            className="scale-150"
          />
        </div>
      </div>
    </>
  );
};

// --- 2. MINI PLAYER (GIỮ NGUYÊN CẤU TRÚC ĐÃ SỬA: w-[90%] max-w-3xl) ---
interface MiniPlayerProps {
  currentTrack: AlbumItem | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  onToggleFavorite: () => void;
  onToggleQueue?: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  isLooping,
  onToggleLoop,
  onToggleFavorite,
}) => {
  if (!currentTrack) return null;

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl z-[100] animate-slide-in">
      {/* Glass Container */}
      <div
        className={`
                relative bg-slate-900/60 backdrop-blur-xl rounded-3xl px-4 py-3 md:p-4 
                border border-white/10 shadow-2xl transition-all duration-500
                ${isPlaying ? "shadow-[0_0_30px_rgba(6,182,212,0.15)] border-cyan-500/30" : ""}
            `}
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-4 right-4 h-[2px] bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 shadow-[0_0_10px_#22d3ee]"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between gap-3 md:gap-4 mt-2">
          {/* Track Info & Cover */}
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            <div
              className={`
                            relative w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-full overflow-hidden border-2 
                            ${isPlaying ? "animate-spin-slow border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]" : "border-slate-600"}
                        `}
            >
              <img
                src={currentTrack.coverUrl}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 m-auto w-3 h-3 bg-slate-900 rounded-full border border-white/20"></div>
            </div>
            <div className="overflow-hidden">
              <h4 className="text-white font-bold truncate text-sm md:text-base">
                {currentTrack.title}
              </h4>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-400 truncate max-w-[80px] md:max-w-xs">
                  {currentTrack.artist}
                </p>
                <button
                  onClick={onToggleFavorite}
                  className={`transition-transform hover:scale-110 ${currentTrack.isFavorite ? "text-amber-400" : "text-slate-600 hover:text-white"}`}
                >
                  <Heart
                    size={14}
                    fill={currentTrack.isFavorite ? "currentColor" : "none"}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 md:gap-6">
            <button
              onClick={onToggleLoop}
              className={`transition-colors hidden md:block ${isLooping ? "text-cyan-400" : "text-slate-500 hover:text-white"}`}
            >
              <Repeat size={18} />
            </button>

            <button
              onClick={onPrev}
              className="text-slate-400 hover:text-white transition-colors p-1 md:p-2"
            >
              <SkipBack size={20} fill="currentColor" />
            </button>

            <button
              onClick={onTogglePlay}
              className={`
                                w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 shrink-0
                                ${isPlaying ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]" : "bg-white text-slate-900"}
                            `}
            >
              {isPlaying ? (
                <Pause size={20} fill="currentColor" />
              ) : (
                <Play size={20} fill="currentColor" className="ml-1" />
              )}
            </button>

            <button
              onClick={onNext}
              className="text-slate-400 hover:text-white transition-colors p-1 md:p-2"
            >
              <SkipForward size={20} fill="currentColor" />
            </button>

            {/* Volume */}
            <div className="hidden lg:flex items-center gap-2 w-20 xl:w-24">
              <button
                onClick={() => onVolumeChange(volume === 0 ? 100 : 0)}
                className="text-slate-400 hover:text-white"
              >
                {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="range-slider h-1 bg-slate-700 rounded-full w-full"
              />
            </div>
          </div>

          {/* Time */}
          <div className="hidden lg:block text-xs text-slate-500 font-mono w-16 text-right">
            {formatTime(currentTime)}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 3. SPOTLIGHT HERO (REDESIGNED: LUXURY WHITE BORDER & GLOW) ---
export const SpotlightHero = ({
  item,
  onClick,
  onNext,
  onPrev,
  total,
  currentIndex,
}: any) => {
  if (!item) return null;

  // Logic giữ nguyên
  const isTrendingHit =
    item.isFavorite &&
    ((item as any).playCount > 10 || item.description?.includes("Gợi ý"));

  return (
    <div className="relative w-full mb-16 group cursor-pointer animate-appear-from-void min-h-[420px] flex items-center justify-center py-8 px-4">
      {/* Navigation Buttons - Giữ nguyên logic, đẩy vị trí ra xa hơn một chút để không dính vào viền */}
      {total > 1 && (
        <>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-0 xl:-left-16 top-1/2 -translate-y-1/2 z-50 p-4 bg-slate-950 hover:bg-white hover:text-black text-white rounded-full border-2 border-white/20 transition-all cursor-pointer hover:scale-110 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            <ChevronLeft size={28} />
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-0 xl:-right-16 top-1/2 -translate-y-1/2 z-50 p-4 bg-slate-950 hover:bg-white hover:text-black text-white rounded-full border-2 border-white/20 transition-all cursor-pointer hover:scale-110 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            <ChevronRight size={28} />
          </div>
        </>
      )}

      {/* THE MAIN CARD - Thiết kế mới: Viền Trắng Dày + Glow + Tách biệt nền */}
      <div
        onClick={onClick}
        className={`
            relative w-full max-w-6xl overflow-hidden rounded-[2.5rem]
            
            /* --- YÊU CẦU 1: VIỀN TRẮNG & DÀY --- */
            border-[4px] border-white
            
            /* --- YÊU CẦU 1 (Tiếp): HIỆU ỨNG PHÁT SÁNG (GLOW) TỪ VIỀN --- */
            /* Layer shadow đầu tiên là glow trắng, layer sau là bóng đổ đen tạo độ sâu */
            shadow-[0_0_30px_rgba(255,255,255,0.3),_0_20px_80px_rgba(0,0,0,0.95)]
            
            /* --- YÊU CẦU 2: TÁCH BIỆT KHỐI (SEPARATION) --- */
            /* Nền đậm màu hơn để che background phía sau, tạo cảm giác thẻ bài đặc */
            bg-slate-950/95 backdrop-blur-3xl
            
            /* Hiệu ứng Hover: Nổi lên cao hơn và sáng hơn */
            transition-all duration-500 transform 
            hover:-translate-y-1
            hover:shadow-[0_0_50px_rgba(255,255,255,0.5),_0_40px_100px_rgba(0,0,0,1)]
        `}
      >
        {/* Decorative Background Effects (Bên trong thẻ) */}
        <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/20 to-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-gradient-to-tr from-purple-500/20 to-pink-600/5 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Nội dung chính */}
        <div
          key={item.id}
          className="relative z-10 p-8 md:p-14 flex flex-col md:flex-row items-center gap-10 md:gap-20 h-full animate-slide-in"
        >
          {/* Album Art Section */}
          <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-700 ease-out">
             {/* Glow sau ảnh bìa */}
            <div
              className={`absolute inset-0 rounded-[2rem] ${
                isTrendingHit ? "bg-amber-400" : "bg-cyan-400"
              } blur-[50px] opacity-30 group-hover:opacity-50 transition-opacity duration-700`}
            ></div>
            
            {/* Khung ảnh */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-[2rem] overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900">
                <img
                src={item.coverUrl}
                alt={item.title}
                className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-110"
                />
                 {/* Shine effect quét qua ảnh */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>

            {/* Badges - Đặt nổi lên trên khung ảnh */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white text-slate-950 text-sm font-black uppercase tracking-wider px-6 py-2.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-2 whitespace-nowrap z-20 border-2 border-transparent group-hover:border-cyan-200 transition-all">
              <Sparkles
                size={16}
                className={isTrendingHit ? "text-amber-500" : "text-cyan-500"}
              />
              {isTrendingHit ? "Trending Hit" : "Spotlight"}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 text-center md:text-left space-y-6 md:space-y-8">
            {/* Top Meta */}
            <div className="flex items-center justify-center md:justify-start gap-4">
              <span className={`
                text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border backdrop-blur-md
                ${isTrendingHit 
                    ? "bg-amber-500/10 text-amber-300 border-amber-500/50 box-shadow-amber" 
                    : "bg-cyan-500/10 text-cyan-300 border-cyan-500/50 box-shadow-cyan"
                }
              `}>
                 {isTrendingHit ? "Editor's Choice" : "Fresh Drop"}
              </span>
              <div className="h-px w-16 bg-white/30"></div>
              <span className="text-sm text-white/60 font-mono">
                 {item.year || "Unknown"}
              </span>
            </div>

            {/* Title & Artist */}
            <div className="space-y-2">
                <h2 className="text-4xl md:text-7xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-lg">
                {item.title}
                </h2>
                <div className="flex items-center justify-center md:justify-start gap-3">
                    <p className="text-xl md:text-3xl text-slate-200 font-light tracking-wide">
                        {item.artist}
                    </p>
                    {item.isFavorite && <Heart size={24} className="text-red-500 fill-current animate-pulse" />}
                </div>
            </div>

            {/* Description */}
            {item.description && (
              <p className="text-base md:text-lg text-slate-400 max-w-xl mx-auto md:mx-0 leading-relaxed border-l-4 border-white/20 pl-6 bg-gradient-to-r from-white/5 to-transparent py-2 rounded-r-lg">
                {item.description}
              </p>
            )}

            {/* Action Button - Thiết kế nút bấm lớn hơn, tương xứng với khung viền */}
            <div className="pt-6 flex items-center justify-center md:justify-start">
              <button className="group/btn relative px-10 py-5 bg-white text-slate-950 rounded-full font-black text-sm tracking-[0.2em] uppercase overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.6)]">
                 <span className="relative z-10 flex items-center gap-3">
                    <Play size={20} fill="currentColor" /> Play Now
                 </span>
                 <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-white opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Pagination Dots */}
        {total > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
            {Array.from({ length: Math.min(total, 5) }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-500 ${
                  idx === currentIndex % 5 
                  ? "bg-white w-10 shadow-[0_0_10px_white]" 
                  : "bg-white/30 w-2 hover:bg-white/60"
                }`}
              ></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
// --- 4. JEWEL CASE 3D (ĐÃ CẬP NHẬT: THÊM NHÃN HOT/NEW) ---
interface JewelCaseProps {
  item: AlbumItem;
  isPlayingThis?: boolean;
  isError?: boolean;
  onClick: () => void;
  onEdit: () => void;
}

export const JewelCase3D: React.FC<JewelCaseProps> = ({
  item,
  isPlayingThis,
  isError,
  onClick,
  onEdit,
}) => {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onEdit();
  };

  // Logic xác định nhãn HOT hoặc NEW
  const currentYear = new Date().getFullYear();
  // New nếu là năm hiện tại hoặc năm ngoái
  const isNew =
    item.year === currentYear.toString() ||
    item.year === (currentYear - 1).toString();
  // Hot nếu được yêu thích hoặc playCount cao (giả định > 20)
  const isHot = item.isFavorite || (item as any).playCount > 20;

  return (
    <div className="flex flex-col items-center gap-3 group relative z-10 hover:z-20 transition-all duration-300">
      <div
        onClick={onClick}
        onContextMenu={handleContextMenu}
        className="relative w-36 h-36 cursor-pointer perspective-[800px] touch-manipulation"
      >
        {/* Shadow dưới đáy */}
        <div
          className={`absolute bottom-0 left-4 right-4 h-4 bg-black/40 blur-xl rounded-full transform translate-y-2 group-hover:scale-75 transition-transform duration-500 ${isPlayingThis ? "bg-cyan-500/20" : ""}`}
        ></div>

        <div
          className={`w-full h-full preserve-3d transition-transform duration-500 ${isPlayingThis ? "-translate-y-4 rotate-x-6 rotate-y-12" : "group-hover:-translate-y-4 group-hover:rotate-x-6 group-hover:rotate-y-12"}`}
        >
          {/* Đĩa CD trượt ra */}
          <div
            className={`absolute top-1 left-1 w-32 h-32 rounded-full flex items-center justify-center transition-transform duration-[3s] linear shadow-lg ${isPlayingThis ? "translate-x-16 animate-spin-slow" : "group-hover:translate-x-16 group-hover:rotate-[360deg] duration-700"}`}
            style={{
              background: `conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.4) 20%, transparent 30%, transparent 100%), radial-gradient(circle, #334155 30%, #0f172a 100%)`,
            }}
          >
            <div className="absolute inset-0 rounded-full opacity-60 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 mix-blend-screen"></div>
            <div className="w-10 h-10 bg-slate-950 rounded-full border border-white/10"></div>
            {item.isFavorite && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-400 drop-shadow-md z-10 text-xl animate-pulse">
                ★
              </div>
            )}
          </div>

          {/* Vỏ đĩa (Cover) */}
          <div
            className={`absolute inset-0 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 shadow-xl overflow-hidden transform origin-left transition-transform duration-500 group-hover:rotate-y-[-15deg] ${isError ? "border-red-500/50" : ""}`}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent z-20 pointer-events-none mix-blend-overlay"></div>

            {/* Ảnh bìa */}
            {item.coverUrl ? (
              <img
                src={item.coverUrl}
                alt={item.title}
                className={`w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-110 ${isError ? "grayscale" : ""}`}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-2 text-center">
                <Music size={32} className="text-white/20 mb-2" />
                <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">
                  {item.title}
                </span>
              </div>
            )}

            {/* Error Overlay */}
            {isError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
                <AlertTriangle
                  size={32}
                  className="text-red-500 animate-pulse"
                />
              </div>
            )}

            {/* Playing Indicator Overlay */}
            {isPlayingThis && !isError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-30">
                <div className="w-8 h-8 rounded-full bg-cyan-500/80 flex items-center justify-center backdrop-blur-md shadow-[0_0_15px_#22d3ee]">
                  <div className="w-1 h-3 bg-white mx-0.5 animate-bounce"></div>
                  <div className="w-1 h-4 bg-white mx-0.5 animate-bounce delay-75"></div>
                  <div className="w-1 h-3 bg-white mx-0.5 animate-bounce delay-150"></div>
                </div>
              </div>
            )}

            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/40 z-30"></div>

            {/* [MỚI] HOT / NEW BADGES - Được đặt bên trong layer vỏ đĩa để xoay cùng */}
            <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5 z-40">
              {isHot && (
                <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-lg flex items-center gap-1 animate-pulse border border-white/10">
                  <Flame size={8} fill="currentColor" /> HOT
                </div>
              )}
              {isNew && !isHot && (
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-lg flex items-center gap-1 border border-white/10">
                  <Zap size={8} fill="currentColor" /> NEW
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Title & Artist */}
      <div
        className={`text-center w-40 pointer-events-none transition-all duration-300 ${isPlayingThis ? "text-cyan-400 translate-y-1" : "group-hover:translate-y-1"}`}
      >
        <h3
          className={`text-xs font-bold leading-tight drop-shadow-md truncate px-1 ${isError ? "text-red-400 line-through" : ""}`}
        >
          {item.title}
        </h3>
        <p className="text-[10px] text-white/50 font-medium uppercase tracking-wider mt-1 truncate">
          {item.artist}
        </p>
      </div>
    </div>
  );
};

// --- 5. ADD NEW ALBUM (GIỮ NGUYÊN) ---
export const AddNewAlbum = ({ onClick }: { onClick: () => void }) => (
  <div
    onClick={onClick}
    className="mb-12 w-36 h-36 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-400/30 transition-all cursor-pointer group hover:scale-105 backdrop-blur-sm"
  >
    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
      <Plus className="text-white/30 group-hover:text-cyan-400" />
    </div>
    <span className="mt-3 text-[10px] text-white/30 font-mono uppercase tracking-widest group-hover:text-cyan-300">
      Add Music
    </span>
  </div>
);
// Thêm component này vào file
export const CrystalBall = ({ onClick }: { onClick: () => void }) => {
  return (
    <div 
      onClick={onClick}
      className="fixed right-6 top-24 z-40 group cursor-pointer animate-float-delayed" // Vị trí bên phải, lơ lửng
      title="Xin một quẻ tiên tri..."
    >
      {/* Lớp vỏ thủy tinh */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all duration-500 overflow-hidden relative">
        
        {/* Làn khói bên trong (Dùng CSS tạo hiệu ứng mây trôi) */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 via-transparent to-transparent opacity-50 group-hover:opacity-80 transition-opacity"></div>
        
        {/* Điểm sáng phản chiếu (Specular Highlight) */}
        <div className="absolute top-2 left-3 w-3 h-1.5 bg-white/40 rounded-full blur-[1px]"></div>
      </div>
    </div>
  );
};
// Sửa/Thêm component này
export const MysteryOverlay = ({ item, onClose, onPlay, onRetry }: any) => {
  // Logic ngăn không cho click ra ngoài đóng luôn modal nếu muốn trải nghiệm trọn vẹn
  const handleContentClick = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div 
      onClick={onClose}
      // Hiệu ứng Fade In nhẹ nhàng cho nền tối
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-fade-in transition-all duration-500"
    >
      <div 
        onClick={handleContentClick}
        // Hiệu ứng Scale Up nhẹ + Fade In: Mượt mà, không giật, không bay
        className="relative flex flex-col items-center animate-appear-from-void" 
      >
        {/* Tiêu đề nhỏ, tinh tế, font chữ mảnh */}
        <h3 className="text-sm font-mono text-purple-200/50 uppercase tracking-[0.4em] mb-8">
           The Prophecy
        </h3>

        {/* Đĩa nhạc: Chỉ hiện ra, không hiệu ứng xoay quá đà */}
        <div className="relative group cursor-pointer transition-transform duration-700 hover:scale-105" onClick={onPlay}>
            {/* Hào quang mờ ảo phía sau (Glow nhẹ) */}
            <div className="absolute inset-0 bg-purple-500/20 blur-[60px] rounded-full"></div>
            
            {/* Tái sử dụng JewelCase nhưng size lớn */}
            <div className="scale-125 md:scale-150">
                <JewelCase3D item={item} onClick={onPlay} onEdit={() => {}} />
            </div>
        </div>

        {/* Các nút bấm tối giản */}
        <div className="flex items-center gap-6 mt-12 opacity-0 animate-slide-in" style={{ animationDelay: '0.3s' }}>
           <button 
             onClick={(e) => { e.stopPropagation(); onRetry(); }} 
             className="px-4 py-2 text-xs text-slate-400 hover:text-white uppercase tracking-widest transition-colors"
           >
             Gieo quẻ khác
           </button>
           
           <button 
             onClick={(e) => { e.stopPropagation(); onPlay(); }} 
             className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-purple-100 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
           >
             Nghe Ngay
           </button>
        </div>
      </div>
    </div>
  );
};

