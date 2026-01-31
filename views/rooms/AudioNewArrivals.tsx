import React from "react";
import { Play } from "lucide-react";
import { AlbumItem } from "../../contexts/DataContext";

interface TopChartProps {
  items: AlbumItem[];
  onPlay: (item: AlbumItem) => void;
}

const AudioTopChart: React.FC<TopChartProps> = ({ items, onPlay }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="w-full py-10 px-4 md:px-10 bg-[#0f1014] text-white">
      {/* Header Title */}
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-white tracking-wide flex items-center gap-3">
        <span className="w-2 h-8 bg-[#eab308] rounded-full"></span>
        Các bài hát được thêm gần đây
      </h2>

      {/* Grid Container */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
        {items.map((item, index) => (
          <div
            key={item.id}
            onClick={() => onPlay(item)}
            className="group flex flex-col cursor-pointer relative"
          >
            {/* --- ALBUM COVER SECTION (SQUARE) --- */}
            {/* [SỬA LỖI MẤT ẢNH]: Thay aspect-[2/3] thành aspect-square */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden transition-all duration-500 group-hover:shadow-[0_10px_40px_rgba(234,179,8,0.3)] group-hover:-translate-y-2">
              {/* Image */}
              <img
                src={item.coverUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Active Border Effect */}
              <div className="absolute inset-0 border-[3px] border-transparent group-hover:border-[#eab308] rounded-2xl transition-colors duration-300 pointer-events-none z-20"></div>

              {/* Overlay Play Button */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                <div className="w-14 h-14 bg-[#eab308] text-black rounded-full flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                  <Play size={28} fill="currentColor" className="ml-1" />
                </div>
              </div>
            </div>

            {/* --- INFO & RANKING SECTION --- */}
            <div className="flex items-start gap-4 mt-5 px-1">
              {/* Rank Number: Số to, màu vàng gradient nhẹ */}
              <span
                className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-[#eab308] to-[#a16207] leading-[0.8] select-none"
                style={{
                  fontFamily: "'Syne', sans-serif",
                  filter: "drop-shadow(0 4px 10px rgba(234, 179, 8, 0.2))",
                }}
              >
                {index + 1}
              </span>

              {/* Text Info */}
              <div className="flex flex-col pt-1 min-w-0">
                <h3 className="text-white font-extrabold text-lg leading-tight line-clamp-2 group-hover:text-[#eab308] transition-colors">
                  {item.title}
                </h3>

                <p className="text-gray-400 text-sm font-medium mt-1 truncate">
                  {item.artist || "Unknown Artist"}
                </p>

                {/* Optional: Meta tag nhỏ */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase border border-gray-700 px-1.5 py-0.5 rounded">
                    Single
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AudioTopChart;
