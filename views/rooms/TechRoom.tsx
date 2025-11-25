import React, { useEffect, useRef, useState } from 'react';

// --- TYPES & CONFIG ---

// Định nghĩa 6 loại cảm xúc
const EMOTIONS = [
  { id: 'joy', label: 'Niềm Vui', color: '#FFD700', type: 'good' },      // Vàng
  { id: 'sad', label: 'Nỗi Buồn', color: '#3498DB', type: 'heavy' },     // Xanh dương
  { id: 'anger', label: 'Giận Dữ', color: '#E74C3C', type: 'heavy' },    // Đỏ
  { id: 'heal', label: 'Chữa Lành', color: '#2ECC71', type: 'good' },    // Xanh lá
  { id: 'dream', label: 'Giấc Mơ', color: '#9B59B6', type: 'good' },     // Tím
  { id: 'empty', label: 'Trống Rỗng', color: '#BDC3C7', type: 'heavy' }  // Trắng/Xám
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  type: string; // 'good' | 'heavy'
  life: number;
}

interface Bloom {
  x: number;
  y: number;
  color: string;
  size: number;
  maxSize: number;
  phase: number; // Để tạo hiệu ứng thở cho hoa
}

const TechRoom: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const [inputValue, setInputValue] = useState('');
  
  // State UI (Chỉ dùng để hiển thị HTML, logic vẽ dùng Ref)
  const [vitalityUI, setVitalityUI] = useState(10);
  const [currentMoodId, setCurrentMoodId] = useState('joy');

  // Ref chứa dữ liệu logic (Mutable, không gây re-render)
  // Giúp animation mượt mà và nút bấm nhạy hơn
  const logicRef = useRef({
    selectedMood: EMOTIONS[0],
    vitality: 10, // 0 - 100
    time: 0,
    width: 0,
    height: 0,
    
    // Màu thân cây (RGB). Bắt đầu là màu tối (đen/xám)
    trunkR: 30, trunkG: 30, trunkB: 30,
    
    // Mảng chứa các vật thể
    particles: [] as Particle[],
    blooms: [] as Bloom[], // Hoa vĩnh viễn
    
    // Cấu trúc cây (Lưu lại để cây không bị đổi hình dạng mỗi frame)
    branches: [] as {x: number, y: number, endX: number, endY: number, angle: number, depth: number, width: number}[]
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initTree = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      logicRef.current.width = window.innerWidth;
      logicRef.current.height = window.innerHeight;

      // Sinh cấu trúc cây 1 lần duy nhất (Procedural Generation)
      logicRef.current.branches = [];
      generateBranch(
        window.innerWidth / 2, 
        window.innerHeight, 
        window.innerHeight * 0.18, 
        -Math.PI / 2, 
        16, 
        0
      );
    };

    window.addEventListener('resize', initTree);
    initTree(); // Gọi lần đầu

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', initTree);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Hàm sinh cây đệ quy (lưu vào mảng để vẽ lại mỗi frame)
  const generateBranch = (x: number, y: number, len: number, angle: number, wid: number, depth: number) => {
    const endX = x + len * Math.cos(angle);
    const endY = y + len * Math.sin(angle);
    
    logicRef.current.branches.push({ x, y, endX, endY, angle, depth, width: wid });

    if (len < 10 || depth > 10) return;

    const subLen = len * 0.75;
    const subWid = wid * 0.7;
    // Ngẫu nhiên góc lệch để cây tự nhiên
    const angleSpread = 0.5; 

    generateBranch(endX, endY, subLen, angle - 0.3 - Math.random() * 0.2, subWid, depth + 1);
    generateBranch(endX, endY, subLen, angle + 0.3 + Math.random() * 0.2, subWid, depth + 1);
  };

  // --- LOGIC: GỬI VÀO HƯ KHÔNG ---
  const sendToVoid = () => {
    const state = logicRef.current;
    const mood = state.selectedMood;

    // 1. Cập nhật Vitality & Màu thân cây
    if (mood.type === 'good') {
      // Năng lượng tốt: Tăng sức sống nhanh, thân cây sáng lên (vàng/nâu)
      state.vitality = Math.min(100, state.vitality + 8);
      
      // Pha thêm màu vàng kim vào thân cây
      state.trunkR = Math.min(180, state.trunkR + 5); 
      state.trunkG = Math.min(140, state.trunkG + 4); 
      state.trunkB = Math.min(50, state.trunkB + 1); 

    } else {
      // Năng lượng nặng: Tăng sức sống rất ít (chỉ để tồn tại)
      state.vitality = Math.min(100, state.vitality + 1);
      
      // Thấm vào thân cây -> Màu thân cây đổi theo cảm xúc (trầm xuống)
      // Pha màu của cảm xúc vào thân cây nhưng làm tối đi
      const hexToRgb = (hex: string) => {
        const bigint = parseInt(hex.slice(1), 16);
        return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
      };
      const moodRGB = hexToRgb(mood.color);
      
      // Lerp màu hiện tại về phía màu cảm xúc (tỷ lệ nhỏ để thấm từ từ)
      state.trunkR = state.trunkR * 0.95 + moodRGB.r * 0.05;
      state.trunkG = state.trunkG * 0.95 + moodRGB.g * 0.05;
      state.trunkB = state.trunkB * 0.95 + moodRGB.b * 0.05;
    }
    
    setVitalityUI(Math.floor(state.vitality));

    // 2. Tạo luồng sáng (Particle) bay lên
    // Tạo 1 luồng gồm nhiều hạt nhỏ
    for(let i=0; i<8; i++) {
        state.particles.push({
            x: state.width / 2 + (Math.random() - 0.5) * 50, // Xuất phát từ input
            y: state.height - 100,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 5 - 3, // Bay lên
            color: mood.color,
            type: mood.type,
            life: 100 + Math.random() * 50
        });
    }

    // Reset input text
    setInputValue('');
  };

  // --- ANIMATION LOOP (VẼ MỌI THỨ) ---
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = logicRef.current;
    state.time += 0.02; // Time step cho nhịp thở

    // 1. Background (Đen trũi -> Sáng dần theo Vitality)
    // Vitality càng cao, nền càng bớt tối (nhưng vẫn giữ độ tương phản)
    const bgLevel = 5 + (state.vitality * 0.15); 
    ctx.fillStyle = `rgb(${bgLevel}, ${bgLevel}, ${bgLevel + 5})`;
    ctx.fillRect(0, 0, state.width, state.height);

    // 2. Vẽ Cây (Từ cấu trúc đã lưu)
    // Tính toán "Nhịp thở" (Breath)
    const breath = Math.sin(state.time) * 0.5 + 0.5; // 0 -> 1 -> 0
    
    // Màu thân cây hiện tại
    const trunkColor = `rgb(${Math.floor(state.trunkR)}, ${Math.floor(state.trunkG)}, ${Math.floor(state.trunkB)})`;

    state.branches.forEach((b) => {
        ctx.beginPath();
        // Hiệu ứng thở nhẹ cho cành cây (sway)
        const sway = Math.sin(state.time + b.depth) * 0.002 * (b.depth * b.depth);
        const drawEndX = b.endX + sway * 20;

        ctx.moveTo(b.x, b.y);
        ctx.lineTo(drawEndX, b.endY);
        ctx.lineWidth = b.width;
        ctx.lineCap = "round";
        ctx.strokeStyle = trunkColor;
        
        // Hiệu ứng Glow cho thân cây khi Vitality cao
        if (state.vitality > 50) {
            ctx.shadowBlur = (state.vitality - 50) * 0.3 * breath; // Glow phập phồng
            ctx.shadowColor = trunkColor;
        } else {
            ctx.shadowBlur = 0;
        }
        
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset
    });

    // 3. Vẽ Hạt Năng Lượng (Đang bay)
    for (let i = state.particles.length - 1; i >= 0; i--) {
        let p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy; // Bay lên
        p.life--;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
        ctx.fill();

        // Xử lý va chạm/đến đích
        // Nếu hạt bay cao quá hoặc hết đời sống
        if (p.y < state.height * 0.5 || p.life <= 0) {
            if (p.type === 'good') {
                // Năng lượng tốt -> Nở hoa
                // Chọn ngẫu nhiên một cành ở ngọn để nở hoa
                const tips = state.branches.filter(b => b.depth > 7);
                if (tips.length > 0) {
                    const target = tips[Math.floor(Math.random() * tips.length)];
                    state.blooms.push({
                        x: target.endX + (Math.random()-0.5)*30,
                        y: target.endY + (Math.random()-0.5)*30,
                        color: p.color,
                        size: 0,
                        maxSize: Math.random() * 4 + 2,
                        phase: Math.random() * Math.PI * 2
                    });
                }
            } 
            // Năng lượng nặng -> Biến mất (Đã thấm vào thân cây ở bước sendToVoid)
            
            state.particles.splice(i, 1);
        }
    }

    // 4. Vẽ Hoa (Những đốm sáng vĩnh viễn)
    state.blooms.forEach(bloom => {
        // Hiệu ứng hoa lớn dần khi mới nở
        if (bloom.size < bloom.maxSize) bloom.size += 0.1;

        // Hiệu ứng thở cho hoa (lấp lánh)
        const bloomBreath = Math.sin(state.time * 2 + bloom.phase) * 0.3 + 0.7;
        
        ctx.fillStyle = bloom.color;
        ctx.shadowColor = bloom.color;
        
        // Nếu vitality cao, hoa rực rỡ hơn
        const glowIntensity = state.vitality > 40 ? 15 : 5;
        ctx.shadowBlur = glowIntensity * bloomBreath;

        ctx.beginPath();
        ctx.arc(bloom.x, bloom.y, bloom.size * bloomBreath, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    requestRef.current = requestAnimationFrame(animate);
  };

  // --- XỬ LÝ CHỌN CẢM XÚC ---
  const handleSelectMood = (mood: typeof EMOTIONS[0]) => {
    setCurrentMoodId(mood.id);
    logicRef.current.selectedMood = mood;
  };

  return (
    <div className="relative w-full h-screen bg-[#020202] overflow-hidden font-sans text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400&family=Playfair+Display:ital,wght@1,500&display=swap');
      `}</style>

      {/* VITALITY METER */}
      <div className="absolute top-6 right-6 text-right z-10 pointer-events-none">
        <div className="font-serif text-white/50 text-sm">Sức Sống (Vitality)</div>
        <div className="w-40 h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-700 ease-out shadow-[0_0_10px_currentColor]"
            style={{ 
              width: `${vitalityUI}%`,
              background: vitalityUI > 60 ? '#FFD700' : '#4facfe'
            }}
          ></div>
        </div>
      </div>

      {/* CANVAS LAYER */}
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />

      {/* UI CONTROLS LAYER */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-[600px] flex flex-col items-center gap-6">
        
        {/* INPUT BOX */}
        <div className="w-full relative group">
            <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Gõ điều bạn nghĩ... (hoặc giữ trong đầu)"
            className="w-full bg-transparent border-none text-center text-white/80 font-serif text-xl placeholder:text-white/20 focus:outline-none pb-2 border-b border-white/10 focus:border-white/50 transition-all"
            />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-white group-focus-within:w-full transition-all duration-500"></div>
        </div>

        {/* EMOTION PALETTE */}
        <div className="flex gap-4 p-4 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-2xl">
            {EMOTIONS.map((mood) => (
                <button
                    key={mood.id}
                    onClick={() => handleSelectMood(mood)}
                    className={`relative w-10 h-10 rounded-full border-2 transition-all duration-300 hover:scale-110 flex items-center justify-center group ${
                        currentMoodId === mood.id 
                        ? 'border-white scale-110 shadow-[0_0_15px_currentColor]' 
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: mood.color, color: mood.color }}
                    title={mood.label}
                >
                    {/* Tooltip */}
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {mood.label}
                    </span>
                    {/* Active Indicator */}
                    {currentMoodId === mood.id && (
                        <div className="absolute inset-0 rounded-full animate-ping opacity-30 bg-current"></div>
                    )}
                </button>
            ))}
        </div>

        {/* SEND BUTTON */}
        <button 
          onClick={sendToVoid}
          className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs uppercase tracking-[4px] font-bold text-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95"
        >
          Gửi vào hư không
        </button>
      </div>
    </div>
  );
};

export default TechRoom;
