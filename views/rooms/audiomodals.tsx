import React, { useState, useRef } from "react";
import {
  X,
  Calendar,
  Play,
  Heart,
  Disc,
  Edit3,
  Search,
  Upload,
  Link as LinkIcon,
  Wand2,
  Trash2,
  Save,
  Music,
  Loader2,
  Plus,
  ListPlus,
} from "lucide-react";
import { AlbumItem } from "../../contexts/DataContext";
import {
  getYouTubeId,
  getYouTubeThumbnail,
  searchMusicDatabase,
} from "./utils";

// --- DETAIL MODAL (MODAL XEM CHI TIẾT) ---
export const DetailModal = ({
  item,
  onClose,
  onPlay,
  onAddToQueue,
}: {
  item: AlbumItem;
  onClose: () => void;
  onPlay: () => void;
  onAddToQueue: () => void;
}) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 perspective-[1200px]">
    <div
      className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
      onClick={onClose}
    ></div>
    <div className="relative w-full max-w-3xl bg-slate-900/50 border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(8,145,178,0.15)] overflow-hidden animate-zoom-in flex flex-col md:flex-row z-[105] backdrop-blur-2xl">
      {/* Ảnh bìa bên trái */}
      <div className="w-full md:w-5/12 aspect-square md:aspect-auto relative group">
        {item.coverUrl ? (
          <>
            <img
              src={item.coverUrl.replace("100x100", "600x600")}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:bg-gradient-to-r"></div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-900/40 to-slate-900 flex items-center justify-center">
            <Music size={64} className="text-white/10" />
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden text-white bg-black/50 p-2 rounded-full backdrop-blur-md"
        >
          <X size={20} />
        </button>
      </div>

      {/* Thông tin bên phải */}
      <div className="flex-1 p-8 md:p-10 flex flex-col relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 hidden md:block text-white/30 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        <div className="flex-1">
          {item.description && item.description.includes("Gợi ý") && (
            <span className="inline-block text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full mb-4 border border-amber-500/10">
              ✨ {item.description}
            </span>
          )}
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight tracking-tight">
            {item.title}
          </h2>
          <p className="text-xl md:text-2xl text-cyan-400 font-medium opacity-80 mb-6">
            {item.artist}
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-400 font-mono mb-8 border-b border-white/5 pb-6">
            <span className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full">
              <Calendar size={14} /> {item.year || "Unknown"}
            </span>
            {item.isFavorite && (
              <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                <Heart size={14} fill="currentColor" /> Favorite
              </span>
            )}
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-slate-300 leading-relaxed opacity-80 line-clamp-4">
              {item.description || "Chưa có mô tả cho bài hát này."}
            </p>
          </div>
        </div>

        {/* Nút thao tác */}
        <div className="mt-8 pt-6 border-t border-white/5 flex gap-3">
          {item.trackUrl ? (
            <>
              <button
                onClick={onPlay}
                className="flex-1 group flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-cyan-500/25 transform hover:-translate-y-1"
              >
                <Play size={20} fill="currentColor" /> Phát Ngay
              </button>
              <button
                onClick={onAddToQueue}
                className="px-5 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/10 hover:border-white/30"
                title="Thêm vào hàng chờ"
              >
                <ListPlus size={24} />
              </button>
            </>
          ) : (
            <div className="text-center text-slate-500 text-sm italic py-4 w-full">
              Chưa có link nhạc
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

// --- EDIT MODAL (MODAL CHỈNH SỬA & TÌM KIẾM - GIỮ NGUYÊN LOGIC) ---
export const EditModal = ({
  item,
  onClose,
  onSave,
  onDelete,
}: {
  item: AlbumItem;
  onClose: () => void;
  onSave: (item: AlbumItem) => void;
  onDelete: (id: number) => void;
}) => {
  const [formData, setFormData] = useState<AlbumItem>({ ...item });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State cho tìm kiếm nhạc (iTunes/Database)
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 1. Hàm Tìm kiếm nhạc (Gốc là gọi iTunes)
  const handleMusicSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);

    // Gọi hàm searchMusicDatabase từ utils.ts
    const results = await searchMusicDatabase(searchQuery);

    setSearchResults(results);
    setIsSearching(false);
  };

  // 2. Chọn kết quả tìm kiếm -> Điền vào form
  const handleSelectMusic = (music: any) => {
    setIsSearchMode(false);
    setFormData((prev) => ({
      ...prev,
      title: music.title,
      artist: music.artist,
      coverUrl: music.thumbnail,
      year: music.year,
      trackUrl: "", // Reset link để người dùng tự dán link YouTube chuẩn
    }));
  };

  // 3. Upload ảnh bìa từ máy
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setFormData((prev) => ({ ...prev, coverUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  // 4. LOGIC QUAN TRỌNG: Dán Link YouTube -> Tự lấy Thumbnail
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setFormData((prev) => ({ ...prev, trackUrl: newUrl }));

    // Kiểm tra xem có phải link YouTube không
    const ytId = getYouTubeId(newUrl);
    if (ytId) {
      // Nếu đúng là link YT -> Lấy ảnh bìa chất lượng cao
      const newThumb = getYouTubeThumbnail(ytId);
      // Chỉ cập nhật ảnh nếu người dùng chưa upload ảnh riêng (hoặc muốn dùng ảnh YT cho tiện)
      setFormData((prev) => ({ ...prev, coverUrl: newThumb }));
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
        onClick={onClose}
      ></div>
      <div className="relative bg-[#0f172a] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="p-5 bg-white/5 border-b border-white/5 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {isSearchMode ? (
              <Disc size={18} className="text-cyan-400" />
            ) : (
              <Edit3 size={18} className="text-cyan-400" />
            )}
            {isSearchMode ? "Tìm nhạc (iTunes)" : "Chỉnh sửa đĩa"}
          </h3>
          <div className="flex items-center gap-2">
            {!isSearchMode && (
              <button
                onClick={() => setIsSearchMode(true)}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Tìm thông tin bài hát"
              >
                <Search size={18} />
              </button>
            )}
            <button
              onClick={() =>
                setFormData((p) => ({ ...p, isFavorite: !p.isFavorite }))
              }
              className={`p-2 rounded-full transition-colors ${
                formData.isFavorite
                  ? "text-amber-400 bg-amber-400/10"
                  : "text-slate-500 hover:text-amber-400 hover:bg-white/5"
              }`}
            >
              <Heart
                size={18}
                fill={formData.isFavorite ? "currentColor" : "none"}
              />
            </button>
            <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto scrollbar-hide relative min-h-[400px]">
          {isSearchMode ? (
            // --- GIAO DIỆN TÌM KIẾM ---
            <div className="space-y-4 animate-fade-in">
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleMusicSearch()}
                  placeholder="Tên bài hát, ca sĩ..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pl-10 text-sm text-white focus:border-cyan-500 outline-none"
                />
                <button
                  onClick={handleMusicSearch}
                  disabled={isSearching}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors min-w-[80px] flex justify-center items-center"
                >
                  {isSearching ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Tìm"
                  )}
                </button>
              </div>
              <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                {searchResults.map((music) => (
                  <div
                    key={music.id}
                    onClick={() => handleSelectMusic(music)}
                    className="flex gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer group transition-colors border border-transparent hover:border-white/10 items-center"
                  >
                    <img
                      src={music.thumbnail}
                      alt=""
                      className="w-12 h-12 object-cover rounded-lg shadow-md"
                    />
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-sm font-bold text-slate-200 truncate">
                        {music.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {music.artist}
                      </p>
                    </div>
                    <Plus
                      size={18}
                      className="text-slate-600 group-hover:text-cyan-400"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setIsSearchMode(false)}
                className="w-full py-2 text-xs text-slate-500 hover:text-white uppercase tracking-wider font-medium mt-4"
              >
                Hủy tìm kiếm
              </button>
            </div>
          ) : (
            // --- GIAO DIỆN NHẬP LIỆU CHÍNH ---
            <>
              <div className="grid grid-cols-3 gap-4">
                {/* Upload Ảnh */}
                <div
                  className="col-span-1 relative group aspect-square bg-slate-900 rounded-xl overflow-hidden border border-slate-700 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.coverUrl ? (
                    <img
                      src={formData.coverUrl}
                      alt="Preview"
                      className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                      <Upload size={20} />
                      <span className="text-[10px]">Upload Cover</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                {/* Tên bài & Nghệ sĩ */}
                <div className="col-span-2 space-y-3">
                  <div>
                    <label className="text-[10px] text-cyan-500 uppercase font-bold tracking-wider mb-1 block">
                      Bài Hát
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-cyan-500 uppercase font-bold tracking-wider mb-1 block">
                      Nghệ Sĩ
                    </label>
                    <input
                      type="text"
                      value={formData.artist}
                      onChange={(e) =>
                        setFormData({ ...formData, artist: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* INPUT LINK YOUTUBE (Quan trọng: Đã phục hồi logic) */}
              <div>
                <label className="text-[10px] text-cyan-500 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <LinkIcon size={10} /> Youtube Link (Dán link để phát)
                  </div>
                  {/* Nút tiện ích mở Youtube để tìm nhanh */}
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                      formData.title + " " + formData.artist,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    <Search size={10} /> Tìm trên YT
                  </a>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Dán link video YouTube (ví dụ: https://youtu.be/...)"
                    value={formData.trackUrl || ""}
                    onChange={handleUrlChange} // <-- Đây là hàm xử lý logic lấy thumbnail
                    className="w-full bg-slate-900 border border-slate-700 text-blue-300 rounded-lg p-2.5 text-xs focus:border-cyan-500 outline-none transition-colors"
                  />
                  {getYouTubeId(formData.trackUrl || "") && (
                    <div className="absolute right-2 top-2 text-green-500">
                      <Wand2 size={16} />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-cyan-500 uppercase font-bold tracking-wider mb-1 block">
                  Ghi Chú
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-300 focus:border-cyan-500 outline-none h-24 resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-cyan-500 uppercase font-bold tracking-wider mb-1 block">
                  Năm
                </label>
                <input
                  type="text"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                  className="w-24 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Buttons */}
        {!isSearchMode && (
          <div className="p-4 bg-white/5 border-t border-white/5 flex gap-3 shrink-0">
            <button
              onClick={() => onDelete(formData.id)}
              className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={() => onSave(formData)}
              disabled={!formData.trackUrl && !formData.title}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold py-3 transition-all shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} /> Lưu Thay Đổi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
