import { AlbumItem } from '../../contexts/DataContext';

export const globalStyles = `
  @keyframes flyInCircle {
    0% { bottom: 20px; left: 20px; transform: scale(0.5) rotate(0deg); opacity: 0; }
    30% { bottom: 60%; left: 20%; transform: scale(0.8) rotate(15deg); opacity: 1; }
    60% { bottom: 80%; left: 80%; transform: scale(1) rotate(-15deg); }
    100% { bottom: 50%; left: 50%; transform: translate(-50%, 50%) scale(1.5) rotate(0deg); }
  }
  @keyframes sparkleDrop {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(0) translate(0, 30px); opacity: 0; }
  }
  @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
  @keyframes float-delayed { 0% { transform: translateY(0px); } 50% { transform: translateY(10px); } 100% { transform: translateY(0px); } }
  @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(6,182,212,0.2); } 50% { box-shadow: 0 0 40px rgba(6,182,212,0.5); } }
  @keyframes slide-in { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  
  .animate-spin-slow { animation: spin-slow 8s linear infinite; }
  .animate-slide-in { animation: slide-in 0.5s ease-out forwards; }
  .animate-mascot-intro { animation: flyInCircle 2.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
  .animate-float { animation: float 6s ease-in-out infinite; }
  .animate-float-delayed { animation: float-delayed 7s ease-in-out infinite; }
  .animate-pulse-glow { animation: pulse-glow 3s infinite; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .range-slider { -webkit-appearance: none; background: transparent; cursor: pointer; }
  .range-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 12px; width: 12px; border-radius: 50%; background: #22d3ee; margin-top: -4px; box-shadow: 0 0 10px rgba(34,211,238,0.5); }
  .range-slider::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: rgba(255,255,255,0.1); border-radius: 2px; }
`;

export const getYouTubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const getYouTubeThumbnail = (id: string) => `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;

export const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const searchMusicDatabase = async (query: string) => {
  try {
    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=20`);
    if (!response.ok) throw new Error("iTunes API Error");
    const data = await response.json();
    return data.results && data.results.length > 0 ? data.results.map((item: any) => ({
      id: item.trackId,
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName,
      year: item.releaseDate ? item.releaseDate.substring(0, 4) : "",
      thumbnail: item.artworkUrl100.replace('100x100bb', '600x600bb'),
      youtubeSearchLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(item.trackName + " " + item.artistName + " lyrics")}`
    })) : [];
  } catch (error) { console.error("Music Search Error:", error); return []; }
};

export const getMoodSearchQuery = (moodId: string) => {
  switch (moodId) {
    case 'joy': return ['happy upbeat pop', 'summer vibes', 'energetic dance'];
    case 'sad': return ['sad piano ballad', 'melancholic acoustic', 'heartbreak songs'];
    case 'anger': return ['heavy metal rock', 'intense workout music'];
    case 'empty': return ['lofi hip hop', 'ambient space music', 'deep focus music'];
    case 'dream': return ['dream pop', 'ethereal shoegaze', 'ambient electronic'];
    case 'heal': return ['healing frequencies', 'nature sounds music', 'meditation piano'];
    default: return ['relaxing music'];
  }
};

export const getMascotMessage = (moodId: string) => {
  switch (moodId) {
    case 'joy': return "Năng lượng tuyệt vời! Ta tìm thấy thứ này để bồ 'quẩy' nè!";
    case 'sad': return "Ta biết bồ đang buồn. Hy vọng giai điệu này sẽ là cái ôm ấm áp.";
    case 'anger': return "Woah, nóng nảy thế! Xả hết ra với bài này đi!";
    case 'empty': return "Đôi khi ta cần khoảng lặng. Thử bài này xem, nó như trôi giữa vũ trụ vậy.";
    case 'dream': return "Muggle đang mơ mộng à? Bài này sẽ đưa bồ đi xa hơn nữa.";
    case 'heal': return "Hít thở sâu nào... Giai điệu chữa lành dành riêng cho bồ đây.";
    default: return "Chào mừng đến với phòng nhạc của Quanh! Tận hưởng nhé!";
  }
};

// --- LOGIC TÌM KIẾM VIDEO ONE-CLICK (Mới - Tối ưu đa Server) ---
const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://api.piped.otter.sh",
  "https://pipedapi.drgns.space",
  "https://api.piped.privacy.com.de",
  "https://pipedapi.smnz.de"
];

export const findYoutubeVideo = async (query: string) => {
  for (const instance of PIPED_INSTANCES) {
    try {
      console.log(`Đang thử tìm trên server: ${instance}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); 

      const response = await fetch(`${instance}/search?q=${encodeURIComponent(query)}&filter=all`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Server ${instance} error`);
      
      const data = await response.json();
      const firstVideo = data.items.find((item: any) => item.type === 'stream');
      
      if (firstVideo) {
        const videoId = firstVideo.url.split('/watch?v=')[1];
        if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
      }
    } catch (error) {
      console.warn(`Thất bại với server ${instance}, đang thử server khác...`);
      continue; 
    }
  }
  console.error("Tất cả các server đều không phản hồi.");
  return null;
};
