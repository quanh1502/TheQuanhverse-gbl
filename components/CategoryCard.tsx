import React from "react";
import { ChevronRight } from "lucide-react";

// Định nghĩa các loại màu (Gradient Presets)
export type CardVariant = "dreamy" | "vintage" | "modern" | "ocean";

interface CategoryCardProps {
  title: string;
  count?: number; // Số lượng bài hát (optional)
  variant?: CardVariant;
  onClick?: () => void;
}

// Map màu gradient chuẩn Tailwind
const gradientMap: Record<CardVariant, string> = {
  dreamy: "from-purple-600 to-rose-400", // Tím -> Hồng (Giống ô 1, 2, 4 trong ảnh)
  vintage: "from-teal-600 to-orange-400", // Xanh -> Cam đất (Giống ô '1967')
  modern: "from-indigo-600 via-purple-600 to-pink-500", // Tím xanh đậm đà
  ocean: "from-cyan-500 to-blue-600", // Xanh biển (bổ sung cho đa dạng)
};

const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  count,
  variant = "dreamy",
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative group cursor-pointer overflow-hidden rounded-2xl p-6 h-36
        bg-gradient-to-br ${gradientMap[variant]}
        shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 
        hover:-translate-y-1 hover:scale-[1.02]
        transition-all duration-300 ease-out
        border border-white/10
      `}
    >
      {/* Hiệu ứng noise/texture nhẹ (Optional) */}
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-500" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* Title Area */}
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-white leading-tight drop-shadow-md line-clamp-2">
            {title}
          </h3>
          {count !== undefined && (
            <p className="text-white/80 text-xs font-mono mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -translate-x-2 group-hover:translate-x-0">
              {count} Tracks
            </p>
          )}
        </div>

        {/* Footer Area: "Xem chủ đề >" */}
        <div className="flex items-center gap-1 text-white/90 text-sm font-semibold mt-auto">
          <span className="group-hover:underline decoration-white/50 underline-offset-4">
            Xem chủ đề
          </span>
          <ChevronRight
            size={16}
            className="transform group-hover:translate-x-1 transition-transform duration-300"
          />
        </div>
      </div>

      {/* Trang trí nền (Blob mờ) */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
    </div>
  );
};

export default CategoryCard;
