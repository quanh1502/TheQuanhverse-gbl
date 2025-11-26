import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Wind, Music } from 'lucide-react'; // Đã thêm icon Music

// --- CẤU HÌNH CẢM XÚC ---
const EMOTIONS = [
  { id: 'joy', label: 'Niềm Vui', color: '#FFD700', type: 'good' },      // Vàng
  { id: 'sad', label: 'Nỗi Buồn', color: '#3498DB', type: 'heavy' },     // Xanh dương
  { id: 'anger', label: 'Giận Dữ', color: '#E74C3C', type: 'heavy' },    // Đỏ
  { id: 'heal', label: 'Chữa Lành', color: '#2ECC71', type: 'good' },    // Xanh lá
  { id: 'dream', label: 'Giấc Mơ', color: '#9B59B6', type: 'good' },     // Tím
  { id: 'empty', label: 'Trống Rỗng', color: '#BDC3C7', type: 'heavy' }  // Trắng
];

// --- TYPES ---
interface Projectile {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  speed: number;
  progress: number; // 0 -> 1
}

interface Bloom {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  maxSize: number;
  phase: number;
  vx: number; 
  vy: number;
  isFlyingOff: boolean; 
}

interface Branch {
  x: number; 
  y: number; 
  endX: number; 
  endY: number; 
  depth: number; 
  width: number;
}

// Thêm Props để nhận hàm chuyển hướng từ App.tsx
interface TechRoomProps {
    onNavigate: (room: 'tech' | 'audio', params?: any) => void;
}

const TechRoom: React.FC<TechRoomProps> = ({ onNavigate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [vitalityUI, setVitalityUI] = useState(10);
  const [currentMoodId, setCurrentMoodId] = useState('joy');
  const [isWindBlowing, setIsWindBlowing] = useState(false);

  // --- STATE MỚI: PHÁT HIỆN TÂM TRẠNG ---
  const [heavyEmotionCount, setHeavyEmotionCount] = useState(0); // Đếm số lần buồn
  const [showMusicPrompt, setShowMusicPrompt] = useState(false); // Hiện popup

  // GAME STATE
  const gameState = useRef({
    selectedMood: EMOTIONS[0],
    vitality: 10,
    time: 0,
    width: 0,
    height: 0,
    trunkR: 40, trunkG: 40, trunkB: 40,
    
    branches: [] as Branch[],
    projectiles: [] as Projectile[], 
    blooms: [] as Bloom[],           
    
    windForce: 0 
  });

  // --- LOGIC TẠO CÂY ---
  const generateTreeStructure = (w: number, h: number) => {
    const branches: Branch[] = [];
    const grow = (x: number, y: number, len: number, angle: number, wid: number, depth: number) => {
      const endX = x + len * Math.cos(angle);
      const endY = y + len * Math.sin(angle);
      branches.push({ x, y, endX, endY, angle, depth, width: wid } as any);
      
      if (len < 10 || depth > 10) return;
      
      grow(endX, endY, len * 0.75, angle - 0.3 - Math.random() * 0.2, wid * 0.7, depth + 1);
      grow(endX, endY, len * 0.75, angle + 0.3 + Math.random() * 0.2, wid * 0.7, depth + 1);
    };
    grow(w / 2, h, h * 0.18, -Math.PI / 2, 16, 0);
    return branches;
  };

  // --- KHỞI TẠO & ANIMATION LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gameState.current.width = window.innerWidth;
      gameState.current.height = window.innerHeight;
      gameState.current.branches = generateTreeStructure(window.innerWidth, window.innerHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // --- MAIN RENDER LOOP ---
    let animationId: number;
    const render = () => {
      const state = gameState.current;
      state.time += 0.03;

      // 1. Background & Clear
      const bgLevel = 5 + (state.vitality * 0.2); 
      ctx.fillStyle = `rgb(${bgLevel}, ${bgLevel}, ${bgLevel + 5})`;
      ctx.fillRect(0, 0, state.width, state.height);

      // 2. Vẽ Cây
      const breath = Math.sin(state.time) * 0.5 + 0.5;
      const trunkColor = `rgb(${Math.floor(state.trunkR)}, ${Math.floor(state.trunkG)}, ${Math.floor(state.trunkB)})`;
      
      ctx.lineCap = "round";
      state.branches.forEach(b => {
        ctx.beginPath();
        const windSway = state.windForce * (b.depth * 0.05) * Math.sin(state.time * 5);
        const naturalSway = Math.sin(state.time + b.depth) * (b.depth * 0.5);
        
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.endX + naturalSway + windSway, b.endY);
        ctx.lineWidth = b.width;
        ctx.strokeStyle = trunkColor;
        
        if (state.vitality > 40) {
          ctx.shadowBlur = (state.vitality - 40) * 0.2 * breath;
          ctx.shadowColor = trunkColor;
        } else {
            ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // 3. Vẽ Projectiles
      for (let i = state.projectiles.length - 1; i >= 0; i--) {
          const p = state.projectiles[i];
          p.progress += p.speed;
          
          const cx = (p.x + p.targetX) / 2 + Math.sin(state.time * 5) * 50; 
          const cy = Math.min(p.y, p.targetY) - 100;

          const t = p.progress;
          const invT = 1 - t;
          const currX = invT * invT * p.x + 2 * invT * t * cx + t * t * p.targetX;
          const currY = invT * invT * p.y + 2 * invT * t * cy + t * t * p.targetY;

          ctx.fillStyle = p.color;
          ctx.shadowBlur = 15;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(currX, currY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.beginPath();
          ctx.moveTo(currX, currY);
          ctx.lineTo(currX - (currX - p.x)*0.05, currY + 10);
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = 0.5;
          ctx.stroke();
          ctx.globalAlpha = 1;

          if (p.progress >= 1) {
              state.blooms.push({
                  id: Date.now() + i,
                  x: p.targetX,
                  y: p.targetY,
                  color: p.color,
                  size: 0,
                  maxSize: Math.random() * 5 + 3,
                  phase: Math.random() * Math.PI,
                  vx: 0,
                  vy: 0,
                  isFlyingOff: false
              });
              state.projectiles.splice(i, 1);
          }
      }

      // 4. Vẽ Blooms
      for (let i = state.blooms.length - 1; i >= 0; i--) {
        const b = state.blooms[i];

        if (state.windForce > 0) {
            b.isFlyingOff = true;
            b.vx += state.windForce * 0.5 + (Math.random()-0.5);
            b.vy += (Math.random() - 0.2) * 2;
        }

        if (b.isFlyingOff) {
            b.x += b.vx;
            b.y += b.vy;
            b.vx *= 0.98; 
            b.size *= 0.99; 
            
            if (b.x > state.width || b.x < 0 || b.y < 0 || b.size < 0.5) {
                state.blooms.splice(i, 1);
                continue;
            }
        } else {
            if (b.size < b.maxSize) b.size += 0.1;
            const stickSway = Math.sin(state.time * 5) * state.windForce * 10;
            const bloomBreath = Math.sin(state.time * 3 + b.phase) * 0.3 + 0.8;
            ctx.fillStyle = b.color;
            const glow = state.vitality > 50 ? 20 : 8;
            ctx.shadowBlur = glow * bloomBreath;
            ctx.shadowColor = b.color;
            ctx.beginPath();
            ctx.arc(b.x + stickSway, b.y, b.size * bloomBreath, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
      }
      
      if (!isWindBlowing && state.windForce > 0) {
          state.windForce -= 0.01;
          if (state.windForce < 0) state.windForce = 0;
      }

      animationId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [isWindBlowing]);

  // --- ACTIONS ---

  const sendToVoid = useCallback(() => {
    const state = gameState.current;
    const mood = state.selectedMood;
    
    // --- LOGIC MỚI: ĐẾM CẢM XÚC ĐỂ GỢI Ý NHẠC ---
    if (mood.type === 'heavy') {
        const newCount = heavyEmotionCount + 1;
        setHeavyEmotionCount(newCount);
        
        // Nếu tích tụ đủ 3 lần tiêu cực -> Hiện gợi ý
        if (newCount >= 3) {
            // Delay 1.5s để người dùng nhìn thấy tia sáng bay lên trước đã
            setTimeout(() => setShowMusicPrompt(true), 1500); 
        }
    } else {
        setHeavyEmotionCount(0); // Reset bộ đếm nếu gửi cảm xúc tích cực
    }

    // --- LOGIC CŨ: CẬP NHẬT CÂY ---
    if (mood.type === 'good') {
        state.vitality = Math.min(100, state.vitality + 5);
        state.trunkR = Math.min(200, state.trunkR + 5);
        state.trunkG = Math.min(180, state.trunkG + 4);
    } else {
        state.vitality = Math.min(100, state.vitality + 1);
        const hexToRgb = (hex: string) => {
            const bigint = parseInt(hex.slice(1), 16);
            return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
        };
        const c = hexToRgb(mood.color);
        state.trunkR = state.trunkR * 0.95 + c.r * 0.05;
        state.trunkG = state.trunkG * 0.95 + c.g * 0.05;
        state.trunkB = state.trunkB * 0.95 + c.b * 0.05;
    }
    setVitalityUI(Math.floor(state.vitality));

    const tips = state.branches.filter(b => b.depth > 6);
    let targetX = state.width / 2;
    let targetY = state.height / 2;
    
    if (tips.length > 0) {
        const targetBranch = tips[Math.floor(Math.random() * tips.length)];
        targetX = targetBranch.endX + (Math.random() - 0.5) * 20;
        targetY = targetBranch.endY + (Math.random() - 0.5) * 20;
    }

    state.projectiles.push({
        x: state.width / 2, 
        y: state.height - 80, 
        targetX: targetX,
        targetY: targetY,
        color: mood.color,
        speed: 0.01 + Math.random() * 0.01,
        progress: 0
    });

    setInputValue('');
  }, [heavyEmotionCount]); // Cần dependency này để state update đúng

  const triggerWind = () => {
      setIsWindBlowing(true);
      gameState.current.windForce = 2;
      gameState.current.vitality = 10;
      setVitalityUI(10);
      gameState.current.trunkR = 40; 
      gameState.current.trunkG = 40; 
      gameState.current.trunkB = 40;
      
      setHeavyEmotionCount(0); // Reset bộ đếm khi gió thổi
      setTimeout(() => {
          setIsWindBlowing(false);
      }, 3000);
  };

  const handleSelectMood = (mood: typeof EMOTIONS[0]) => {
    setCurrentMoodId(mood.id);
    gameState.current.selectedMood = mood;
  };

  return (
    <div className="relative w-full h-screen bg-[#020202] overflow-hidden font-sans text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400&family=Playfair+Display:ital,wght@1,500&display=swap');
      `}</style>

      {/* --- POPUP GỢI Ý NGHE NHẠC (MỚI) --- */}
      {showMusicPrompt && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in px-4">
            <div className="bg-[#151515] border border-white/10 p-8 rounded-3xl max-w-sm text-center shadow-[0_0_50px_rgba(255,255,255,0.05)] transform scale-100 transition-all">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Music size={24} className="text-white/70" />
                </div>
                <h3 className="text-2xl font-serif text-white/90 mb-3">Ngày hôm nay hơi nặng nề nhỉ?</h3>
                <p className="text-white/50 text-sm mb-8 font-light leading-relaxed">
                    Có vẻ bạn đang mang nhiều tâm tư. Bạn có muốn nghe một bản nhạc để xoa dịu không?
                </p>
                <div className="flex gap-4 justify-center">
                    <button 
                        onClick={() => { setShowMusicPrompt(false); setHeavyEmotionCount(0); }}
                        className="px-6 py-3 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors text-xs uppercase tracking-widest font-bold"
                    >
                        Mình ổn
                    </button>
                    <button 
                        onClick={() => onNavigate('audio', { mood: 'healing' })}
                        className="px-8 py-3 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all transform hover:scale-105"
                    >
                        Nghe nhạc
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* CANVAS LAYER */}
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none" />

      {/* HEADER INFO */}
      <div className="absolute top-6 right-6 text-right z-10 select-none pointer-events-none">
        <div className="font-serif text-white/50 text-sm">Sức Sống</div>
        <div className="w-32 h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-700 ease-out"
            style={{ 
              width: `${vitalityUI}%`,
              background: vitalityUI > 60 ? '#FFD700' : '#4facfe'
            }}
          ></div>
        </div>
      </div>

      {/* WIND BUTTON (Reset) */}
      <button 
        onClick={triggerWind}
        title="Thổi bay ký ức"
        className={`absolute top-6 left-6 p-3 rounded-full border border-white/10 backdrop-blur-md transition-all duration-500 z-50 hover:bg-white/10 group ${isWindBlowing ? 'rotate-180 bg-white/20' : ''}`}
      >
        <Wind className={`w-5 h-5 text-white/60 group-hover:text-white ${isWindBlowing ? 'animate-pulse' : ''}`} />
      </button>

      {/* INTRO TEXT */}
      <div className={`absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none transition-opacity duration-1000 ${vitalityUI > 15 ? 'opacity-0' : 'opacity-70'}`}>
        <h1 className="font-serif text-3xl text-white/40 tracking-widest">CÂY TÂM TƯ</h1>
      </div>

      {/* --- CONTROLS LAYER --- */}
      <div className="absolute bottom-0 left-0 w-full pb-8 pt-20 px-4 flex flex-col items-center justify-end z-50 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none">
        
        <div className="w-full max-w-[500px] flex flex-col items-center gap-5 pointer-events-auto">
            
            {/* EMOTION PALETTE */}
            <div className="flex justify-center gap-3 p-2">
                {EMOTIONS.map((mood) => (
                    <button
                        key={mood.id}
                        onClick={() => handleSelectMood(mood)}
                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                            currentMoodId === mood.id 
                            ? 'scale-125 border-white shadow-[0_0_10px_currentColor]' 
                            : 'border-transparent opacity-50 hover:opacity-100 hover:scale-110'
                        }`}
                        style={{ backgroundColor: mood.color }}
                        title={mood.label}
                    />
                ))}
            </div>

            {/* INPUT AREA WITH ARROW BUTTON */}
            <div className="w-full relative flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-2 py-2 shadow-2xl transition-all focus-within:bg-white/10 focus-within:border-white/30">
                <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendToVoid()}
                    placeholder="Gửi tâm tư vào cây..."
                    className="flex-1 bg-transparent border-none text-white/90 font-serif text-lg px-4 focus:outline-none placeholder:text-white/30"
                />
                
                <button 
                  onClick={sendToVoid}
                  disabled={isWindBlowing}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white/80 transition-all hover:text-white hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
            </div>
            
            <div className="text-[10px] text-white/30 font-light tracking-widest uppercase mt-2">
                {EMOTIONS.find(e => e.id === currentMoodId)?.label}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TechRoom;
