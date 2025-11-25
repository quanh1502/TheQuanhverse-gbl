import React, { useEffect, useRef, useState, useCallback } from 'react';

// --- CẤU HÌNH ---
const EMOTIONS = [
  { id: 'joy', label: 'Niềm Vui', color: '#FFD700', type: 'good' },      // Vàng
  { id: 'sad', label: 'Nỗi Buồn', color: '#3498DB', type: 'heavy' },     // Xanh dương
  { id: 'anger', label: 'Giận Dữ', color: '#E74C3C', type: 'heavy' },    // Đỏ
  { id: 'heal', label: 'Chữa Lành', color: '#2ECC71', type: 'good' },    // Xanh lá
  { id: 'dream', label: 'Giấc Mơ', color: '#9B59B6', type: 'good' },     // Tím
  { id: 'empty', label: 'Trống Rỗng', color: '#BDC3C7', type: 'heavy' }  // Trắng
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  type: string; 
  life: number;
  size: number;
}

interface Bloom {
  x: number;
  y: number;
  color: string;
  size: number;
  maxSize: number;
  phase: number;
}

const TechRoom: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [vitalityUI, setVitalityUI] = useState(10);
  const [currentMoodId, setCurrentMoodId] = useState('joy');

  // GAME STATE (Lưu trong Ref để không bị React render lại làm mất hoạt ảnh)
  const gameState = useRef({
    selectedMood: EMOTIONS[0],
    vitality: 10,
    time: 0,
    width: 0,
    height: 0,
    trunkR: 40, trunkG: 40, trunkB: 40, // Màu thân cây gốc
    particles: [] as Particle[],
    blooms: [] as Bloom[],
    branches: [] as any[]
  });

  // --- HÀM TẠO CÂY (Chạy 1 lần) ---
  const generateTreeStructure = (w: number, h: number) => {
    const branches: any[] = [];
    const grow = (x: number, y: number, len: number, angle: number, wid: number, depth: number) => {
      const endX = x + len * Math.cos(angle);
      const endY = y + len * Math.sin(angle);
      branches.push({ x, y, endX, endY, angle, depth, width: wid });
      
      if (len < 10 || depth > 10) return;
      
      grow(endX, endY, len * 0.75, angle - 0.3 - Math.random() * 0.2, wid * 0.7, depth + 1);
      grow(endX, endY, len * 0.75, angle + 0.3 + Math.random() * 0.2, wid * 0.7, depth + 1);
    };
    // Gốc cây luôn ở giữa dưới màn hình
    grow(w / 2, h, h * 0.18, -Math.PI / 2, 16, 0);
    return branches;
  };

  // --- KHỞI TẠO & VÒNG LẶP ANIMATION ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gameState.current.width = window.innerWidth;
      gameState.current.height = window.innerHeight;
      gameState.current.branches = generateTreeStructure(window.innerWidth, window.innerHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // MAIN LOOP
    let animationId: number;
    const render = () => {
      const state = gameState.current;
      state.time += 0.03; // Tốc độ nhịp thở

      // 1. Clear & Background
      const bgLevel = 5 + (state.vitality * 0.2); 
      ctx.fillStyle = `rgb(${bgLevel}, ${bgLevel}, ${bgLevel + 5})`;
      ctx.fillRect(0, 0, state.width, state.height);

      // 2. Vẽ Cây
      const breath = Math.sin(state.time) * 0.5 + 0.5;
      const trunkColor = `rgb(${Math.floor(state.trunkR)}, ${Math.floor(state.trunkG)}, ${Math.floor(state.trunkB)})`;

      ctx.lineCap = "round";
      state.branches.forEach(b => {
        ctx.beginPath();
        const sway = Math.sin(state.time + b.depth) * (b.depth * 0.5); // Gió thổi nhẹ
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.endX + sway, b.endY);
        ctx.lineWidth = b.width;
        ctx.strokeStyle = trunkColor;
        
        // Glow effect
        if (state.vitality > 40) {
          ctx.shadowBlur = (state.vitality - 40) * 0.2 * breath;
          ctx.shadowColor = trunkColor;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // 3. Vẽ Particles (Hạt năng lượng bay lên)
      for (let i = state.particles.length - 1; i >= 0; i--) {
        let p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy; // Bay lên trên
        p.life--;
        p.size *= 0.98; // Nhỏ dần

        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Xử lý khi hạt bay đến tán cây (hoặc hết đời)
        if (p.life <= 0 || p.y < state.height * 0.4) {
          if (p.type === 'good') {
             // Năng lượng tốt -> Nở hoa
             const tips = state.branches.filter(b => b.depth > 7);
             if (tips.length > 0) {
                const target = tips[Math.floor(Math.random() * tips.length)];
                state.blooms.push({
                   x: target.endX + (Math.random()-0.5)*40,
                   y: target.endY + (Math.random()-0.5)*40,
                   color: p.color,
                   size: 0,
                   maxSize: Math.random() * 5 + 3,
                   phase: Math.random() * Math.PI
                });
             }
          }
          state.particles.splice(i, 1);
        }
      }

      // 4. Vẽ Hoa (Nở vĩnh viễn)
      state.blooms.forEach(b => {
        if (b.size < b.maxSize) b.size += 0.1; // Hiệu ứng nở từ từ
        
        const bloomBreath = Math.sin(state.time * 2 + b.phase) * 0.3 + 0.8;
        ctx.fillStyle = b.color;
        
        // Cây càng khỏe hoa càng sáng
        const glow = state.vitality > 50 ? 15 : 5;
        ctx.shadowBlur = glow * bloomBreath;
        ctx.shadowColor = b.color;
        
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size * bloomBreath, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // --- HÀM XỬ LÝ: GỬI VÀO HƯ KHÔNG ---
  const sendToVoid = useCallback(() => {
    const state = gameState.current;
    const mood = state.selectedMood;
    
    console.log("Đã gửi:", mood.label, inputValue); // Debug log để kiểm tra

    // 1. Cập nhật Vitality & Màu sắc
    if (mood.type === 'good') {
        state.vitality = Math.min(100, state.vitality + 10);
        // Sáng lên (Vàng kim)
        state.trunkR = Math.min(200, state.trunkR + 10);
        state.trunkG = Math.min(180, state.trunkG + 8);
        state.trunkB = Math.min(100, state.trunkB + 2);
    } else {
        state.vitality = Math.min(100, state.vitality + 2);
        // Thấm màu buồn vào (nhưng làm tối đi)
        const hexToRgb = (hex: string) => {
            const bigint = parseInt(hex.slice(1), 16);
            return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
        };
        const moodColor = hexToRgb(mood.color);
        state.trunkR = state.trunkR * 0.9 + moodColor.r * 0.1 * 0.5;
        state.trunkG = state.trunkG * 0.9 + moodColor.g * 0.1 * 0.5;
        state.trunkB = state.trunkB * 0.9 + moodColor.b * 0.1 * 0.5;
    }
    
    // Đồng bộ lại với UI React
    setVitalityUI(Math.floor(state.vitality));

    // 2. Bắn Particles
    for(let i=0; i<12; i++) {
        state.particles.push({
            x: state.width / 2 + (Math.random() - 0.5) * 60, // Bắn từ giữa màn hình
            y: state.height - 120, // Cao hơn thanh input một chút
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 8 - 4, // Bay lên nhanh
            color: mood.color,
            type: mood.type,
            life: 120,
            size: Math.random() * 4 + 2
        });
    }

    setInputValue('');
  }, [inputValue]);

  const handleSelectMood = (mood: typeof EMOTIONS[0]) => {
    setCurrentMoodId(mood.id);
    gameState.current.selectedMood = mood;
  };

  return (
    <div className="relative w-full h-screen bg-[#020202] overflow-hidden font-sans text-white">
      {/* GLOBAL STYLES */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400&family=Playfair+Display:ital,wght@1,500&display=swap');
      `}</style>

      {/* --- CANVAS LAYER (Nằm dưới cùng) --- */}
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none" />

      {/* --- VITALITY METER (Góc phải) --- */}
      <div className="absolute top-6 right-6 text-right z-10 select-none">
        <div className="font-serif text-white/50 text-sm">Sức Sống Của Cây</div>
        <div className="w-40 h-1.5 bg-white/10 mt-2 rounded-full overflow-hidden shadow-lg backdrop-blur">
          <div 
            className="h-full transition-all duration-700 ease-out shadow-[0_0_15px_currentColor]"
            style={{ 
              width: `${vitalityUI}%`,
              background: vitalityUI > 60 ? 'linear-gradient(90deg, #FDB931, #fff)' : '#4facfe'
            }}
          ></div>
        </div>
      </div>

      {/* --- INTRO TEXT --- */}
      <div className={`absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none transition-opacity duration-1000 ${vitalityUI > 15 ? 'opacity-0' : 'opacity-80'}`}>
        <h1 className="font-serif text-3xl text-white/40 drop-shadow-xl tracking-widest">CÂY TÂM TƯ</h1>
        <p className="text-xs mt-3 font-light text-white/30 uppercase tracking-[2px]">Nuôi dưỡng bằng cảm xúc của bạn</p>
      </div>

      {/* --- CONTROLS LAYER (Nằm trên cùng z-50) --- */}
      <div className="absolute bottom-0 left-0 w-full pb-10 pt-20 px-4 flex flex-col items-center justify-end z-50 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
        
        <div className="w-full max-w-[600px] flex flex-col items-center gap-6 pointer-events-auto">
            
            {/* INPUT FIELD */}
            <div className="w-full relative group">
                <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Viết điều gì đó..."
                    className="w-full bg-transparent border-none text-center text-white/90 font-serif text-xl placeholder:text-white/20 focus:outline-none pb-3 border-b border-white/10 focus:border-white/60 transition-all z-50"
                />
            </div>

            {/* EMOTION BUTTONS */}
            <div className="flex gap-3 md:gap-5 p-3 md:p-4 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl z-50">
                {EMOTIONS.map((mood) => (
                    <button
                        key={mood.id}
                        onClick={() => handleSelectMood(mood)}
                        className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-all duration-200 flex items-center justify-center cursor-pointer group ${
                            currentMoodId === mood.id 
                            ? 'scale-110 border-white shadow-[0_0_20px_currentColor]' 
                            : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                        }`}
                        style={{ backgroundColor: mood.color, color: mood.color }}
                    >
                         {/* Tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
                            {mood.label}
                        </div>
                    </button>
                ))}
            </div>

            {/* ACTION BUTTON */}
            <button 
              onClick={sendToVoid}
              className="mt-2 px-10 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-full text-xs uppercase tracking-[4px] font-bold text-white/80 transition-all duration-200 hover:text-white hover:border-white/40 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 cursor-pointer z-50"
            >
              Gửi vào hư không
            </button>
        </div>
      </div>
    </div>
  );
};

export default TechRoom;
