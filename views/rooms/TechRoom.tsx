import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Wind, Music } from 'lucide-react';

// --- CẤU HÌNH ---
const EMOTIONS = [
  { id: 'anger', label: 'Xả Giận', color: '#E74C3C', type: 'fire' },     // Đỏ
  { id: 'hope', label: 'Hy Vọng', color: '#FFD700', type: 'light' },     // Vàng
  { id: 'happy', label: 'Hạnh Phúc', color: '#2ECC71', type: 'heal' },   // Xanh
];

// --- TYPES ---
interface Projectile {
  id: number;
  x: number; y: number; 
  targetX: number; targetY: number;
  startX: number; startY: number;
  color: string; 
  progress: number;
  speed: number;
  type: 'anger' | 'hope' | 'happy';
  state: 'flying' | 'tearing' | 'done'; // State cho hoạt ảnh xé thư
}

interface Bloom {
  id: number; x: number; y: number; color: string; 
  size: number; maxSize: number;
  vx: number; vy: number;
  life: number;
  type: 'static' | 'falling' | 'floating_text_part'; // Hạt tĩnh, hạt rơi, hoặc hạt tạo chữ
}

interface Firework {
  x: number; y: number; vx: number; vy: number; alpha: number; color: string; life: number;
}

interface Mascot {
  x: number; y: number; active: boolean; 
}

interface Branch {
  x: number; y: number; endX: number; endY: number; depth: number; width: number; angle: number; parentIndex: number;
}

interface TechRoomProps {
    onNavigate: (room: 'tech' | 'audio', params?: any) => void;
}

const TechRoom: React.FC<TechRoomProps> = ({ onNavigate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [currentMoodId, setCurrentMoodId] = useState('hope');
  const [vitalityUI, setVitalityUI] = useState(50);

  // GAME STATE
  const gameState = useRef({
    width: 0, height: 0,
    branches: [] as Branch[],
    projectiles: [] as Projectile[],
    blooms: [] as Bloom[], // Đốm sáng / Hạt
    fireworks: [] as Firework[],
    
    // --- SPECIAL EFFECTS ---
    activeEffect: null as 'anger' | 'hope' | 'happy' | null,
    effectTimer: 0, // Max 20s (approx 1200 frames)
    
    // Anger Props
    mascot: { x: 0, y: 0, active: false } as Mascot,
    textAlpha: 0, // Độ hiện rõ của chữ FUCK THIS SHIT

    // Hope Props
    star: { x: 0, y: 0, active: false, scale: 0 },

    // Tree Props
    treeShake: 0,   // Cường độ rung
    shakeSpeed: 0,  // Tốc độ rung (nhanh/chậm)
    treeColorOverride: null as string | null,
    time: 0,
  });

  // --- INIT TREE ---
  const generateTreeStructure = (w: number, h: number) => {
    const branches: Branch[] = [];
    const grow = (x: number, y: number, len: number, angle: number, wid: number, depth: number, pIdx: number) => {
      const endX = x + len * Math.cos(angle);
      const endY = y + len * Math.sin(angle);
      const newIndex = branches.push({ x, y, endX, endY, angle, depth, width: wid, parentIndex: pIdx }) - 1;
      if (len < 10 || depth > 10) return;
      grow(endX, endY, len * 0.75, angle - 0.3 - Math.random() * 0.2, wid * 0.7, depth + 1, newIndex);
      grow(endX, endY, len * 0.75, angle + 0.3 + Math.random() * 0.2, wid * 0.7, depth + 1, newIndex);
    };
    grow(w / 2, h, h * 0.18, -Math.PI / 2, 16, 0, -1);
    return branches;
  };

  // --- ANIMATION LOOP ---
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

    const render = () => {
      const state = gameState.current;
      state.time += 0.05;
      
      // Countdown Timer (20s)
      if (state.activeEffect) {
          state.effectTimer--;
          if (state.effectTimer <= 0) {
              // RESET MỌI THỨ
              state.activeEffect = null;
              state.treeColorOverride = null;
              state.mascot.active = false;
              state.star.active = false;
              state.textAlpha = 0;
              // Clear particles dần dần
              state.blooms.forEach(b => b.life = Math.min(b.life, 20)); 
          }
      }

      // --- 1. BACKGROUND ---
      let bgR = 10, bgG = 10, bgB = 15;
      if (state.activeEffect === 'anger') {
          // Nền đỏ nhấp nháy theo nhịp tim
          const flash = Math.sin(state.time * 10) * 10;
          bgR = 30 + flash; bgG = 5; bgB = 5; 
      } else if (state.activeEffect === 'hope') {
          // Nền vàng ấm nhẹ
          bgR = 20; bgG = 20; bgB = 25;
      } else if (state.activeEffect === 'happy') {
          // Nền xanh dịu
          bgR = 10; bgG = 25; bgB = 15;
      }
      
      ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
      ctx.fillRect(0, 0, state.width, state.height);

      // --- 2. LOGIC ANGER (Mascot & Text) ---
      if (state.activeEffect === 'anger') {
          // Mascot bay từ phải sang trái
          if (state.mascot.active) {
              state.mascot.x -= 15; // Bay nhanh
              state.mascot.y = state.height * 0.2 + Math.sin(state.time * 5) * 50;

              // Rải hạt đỏ (Blooms)
              if (state.mascot.x > -100) {
                  for(let k=0; k<3; k++) {
                      state.blooms.push({
                          id: Math.random(), x: state.mascot.x, y: state.mascot.y,
                          color: '#E74C3C', size: 3, maxSize: 5,
                          vx: (Math.random()-0.5)*2, vy: Math.random() * 2, // Rơi xuống
                          life: 100, type: 'floating_text_part'
                      });
                  }
              } else {
                  // Mascot bay xong -> Text hiện lên
                  state.textAlpha = Math.min(1, state.textAlpha + 0.05);
              }
          }

          // Vẽ Text "FUCK THIS SHIT"
          if (state.textAlpha > 0) {
              ctx.save();
              ctx.globalAlpha = state.textAlpha;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              
              // Hiệu ứng rung chữ (Glitch)
              const shakeX = Math.random() * 5;
              const shakeY = Math.random() * 5;
              
              ctx.font = "900 80px 'Arial Black', sans-serif";
              ctx.fillStyle = "#fff";
              ctx.shadowColor = "#E74C3C";
              ctx.shadowBlur = 20;
              ctx.fillText("FUCK THIS SHIT", state.width/2 + shakeX, state.height/3 + shakeY);
              
              ctx.font = "120px sans-serif";
              ctx.fillText("🖕", state.width/2 + shakeX, state.height/3 + 120 + shakeY);
              ctx.restore();
          }

          // Pháo hoa ngẫu nhiên
          if (Math.random() > 0.9) {
              const fx = Math.random() * state.width;
              const fy = Math.random() * state.height * 0.8;
              for(let k=0; k<15; k++) state.fireworks.push({
                  x: fx, y: fy, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8,
                  color: k%2===0 ? '#E74C3C' : '#FFFFFF', life: 40, alpha: 1
              });
          }
      }

      // --- 3. LOGIC HOPE (Star) ---
      if (state.activeEffect === 'hope' && state.star.active) {
          if (state.star.scale < 1) state.star.scale += 0.02;
          
          ctx.save();
          ctx.translate(state.star.x, state.star.y);
          ctx.scale(state.star.scale, state.star.scale);
          
          // Glow ngôi sao
          const pulse = 1 + Math.sin(state.time * 3) * 0.2;
          const grad = ctx.createRadialGradient(0,0,5, 0,0,60);
          grad.addColorStop(0, "white");
          grad.addColorStop(0.4, "rgba(255, 215, 0, 0.8)");
          grad.addColorStop(1, "transparent");
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(0,0, 70 * pulse, 0, Math.PI*2); ctx.fill();

          // Vẽ hình sao 5 cánh
          ctx.fillStyle = "#FFF";
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
              ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * 20,
                        -Math.sin((18 + i * 72) * Math.PI / 180) * 20);
              ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * 8,
                        -Math.sin((54 + i * 72) * Math.PI / 180) * 8);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
      }

      // --- 4. VẼ CÂY (Xử lý rung lắc theo mood) ---
      // Tính độ rung
      let swayOffset = 0;
      if (state.activeEffect === 'hope') {
          // Lắc lư cảm nhận năng lượng (Sóng chậm, biên độ lớn)
          swayOffset = Math.sin(state.time * 2) * 5; 
      } else if (state.activeEffect === 'happy') {
          // Rùng mình sảng khoái (Sóng nhanh, tắt dần theo timer nhưng ở đây ta giữ nó liên tục trong 20s)
          swayOffset = Math.sin(state.time * 20) * 2;
      }

      // Màu thân cây
      let trunkColor = `rgb(60, 60, 60)`; // Mặc định
      if (state.activeEffect === 'hope') trunkColor = `rgb(255, 223, 0)`; // Vàng rực
      if (state.activeEffect === 'happy') trunkColor = `rgb(46, 204, 113)`; // Xanh rực

      ctx.strokeStyle = trunkColor;
      ctx.lineCap = "round";

      state.branches.forEach(b => {
        ctx.beginPath();
        // Hiệu ứng gió + Hiệu ứng lắc
        const totalSway = (Math.sin(state.time + b.depth) * b.depth * 0.5) + (swayOffset * (b.depth * 0.2));
        
        ctx.lineWidth = b.width;
        
        // Glow cho cây
        if (state.activeEffect) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = trunkColor;
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.endX + totalSway, b.endY);
        ctx.stroke();
      });
      ctx.shadowBlur = 0; // Reset

      // --- 5. VẼ PROJECTILES (LÁ THƯ) ---
      for (let i = state.projectiles.length - 1; i >= 0; i--) {
          const p = state.projectiles[i];
          
          if (p.state === 'flying') {
              p.progress += p.speed;
              // Bezier Curve
              const cx = (p.startX + p.targetX) / 2;
              const cy = Math.min(p.startY, p.targetY) - 100;
              const t = p.progress; const invT = 1 - t;
              p.x = invT*invT*p.startX + 2*invT*t*cx + t*t*p.targetX;
              p.y = invT*invT*p.startY + 2*invT*t*cy + t*t*p.targetY;

              // Vẽ Lá Thư (Envelope)
              ctx.save();
              ctx.translate(p.x, p.y);
              ctx.rotate(t * 5); // Xoay nhẹ
              ctx.fillStyle = "#ecf0f1";
              ctx.fillRect(-10, -7, 20, 14); // Bao thư
              // Nắp bao thư
              ctx.beginPath(); ctx.moveTo(-10, -7); ctx.lineTo(0, 0); ctx.lineTo(10, -7); ctx.stroke();
              ctx.restore();

              // Trigger khi đến đích
              if (p.progress >= 1) {
                  if (p.type === 'anger') {
                      p.state = 'tearing'; // Chuyển sang xé
                      // Tạo hiệu ứng xé (confetti)
                      for(let k=0; k<10; k++) state.fireworks.push({
                          x: p.x, y: p.y, vx: (Math.random()-0.5)*10, vy: Math.random()*5,
                          color: '#ecf0f1', life: 30, alpha: 1
                      });
                      // Start Anger Sequence
                      state.activeEffect = 'anger';
                      state.effectTimer = 1200; // 20s
                      state.mascot = { x: state.width, y: 100, active: true }; // Mascot xuất phát bên phải
                      state.projectiles.splice(i, 1);
                  } 
                  else if (p.type === 'hope') {
                      // Start Hope Sequence
                      state.activeEffect = 'hope';
                      state.effectTimer = 1200;
                      state.star = { x: p.targetX, y: p.targetY, active: true, scale: 0 };
                      state.projectiles.splice(i, 1);
                  }
                  else if (p.type === 'happy') {
                      // Start Happy Sequence
                      state.activeEffect = 'happy';
                      state.effectTimer = 1200;
                      // Tạo nổ bloom xanh từ tán cây
                      const tips = state.branches.filter(b => b.depth > 6);
                      tips.forEach(tip => {
                          if (Math.random() > 0.5) {
                              state.blooms.push({
                                  id: Math.random(), x: tip.endX, y: tip.endY,
                                  color: '#2ECC71', size: Math.random()*4, maxSize: 6,
                                  vx: 0, vy: 0.5 + Math.random(), // Rơi xuống
                                  life: 300, type: 'falling'
                              });
                          }
                      });
                      state.projectiles.splice(i, 1);
                  }
              }
          }
      }

      // --- 6. EFFECTS RENDER (Blooms, Fireworks, Mascot Text Part) ---
      
      // Vẽ Mascot (Emoji)
      if (state.activeEffect === 'anger' && state.mascot.active) {
          ctx.font = "60px serif";
          ctx.fillText("🧙‍♀️", state.mascot.x, state.mascot.y);
      }

      // Vẽ Blooms (Hạt)
      for (let i = state.blooms.length - 1; i >= 0; i--) {
          const b = state.blooms[i];
          
          if (b.type === 'falling' || b.type === 'floating_text_part') {
              b.x += b.vx;
              b.y += b.vy;
              b.life--;
          }
          
          if (b.type === 'floating_text_part' && state.textAlpha > 0.5) {
              // Khi chữ hiện lên, hạt mờ đi nhanh
              b.life -= 5;
          }

          if (b.life <= 0) { state.blooms.splice(i, 1); continue; }

          ctx.fillStyle = b.color;
          ctx.shadowBlur = 10; ctx.shadowColor = b.color;
          ctx.globalAlpha = Math.min(1, b.life / 50);
          ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI*2); ctx.fill();
          ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      }

      // Vẽ Pháo hoa (Fireworks)
      for (let i = state.fireworks.length - 1; i >= 0; i--) {
          const f = state.fireworks[i];
          f.x += f.vx; f.y += f.vy; f.vy += 0.2; // Gravity
          f.life--; f.alpha -= 0.02;
          if (f.life <= 0) { state.fireworks.splice(i, 1); continue; }
          
          ctx.fillStyle = f.color;
          ctx.globalAlpha = f.alpha;
          ctx.beginPath(); ctx.arc(f.x, f.y, 2, 0, Math.PI*2); ctx.fill();
          ctx.globalAlpha = 1;
      }

      requestAnimationFrame(render);
    };
    render();
  }, []);

  // --- ACTIONS ---

  const sendToVoid = useCallback(() => {
    const state = gameState.current;
    
    // Config Target & Logic dựa trên màu đã chọn
    const mood = EMOTIONS.find(e => e.id === currentMoodId)!;
    
    let targetX = state.width / 2;
    let targetY = state.height / 2;
    let type: Projectile['type'] = 'happy';

    if (mood.id === 'anger') {
        type = 'anger';
        targetY = state.height * 0.2; // Bay lên cao để xé
    } else if (mood.id === 'hope') {
        type = 'hope';
        targetY = 100; // Bay lên đỉnh trời thành sao
    } else {
        type = 'happy';
        targetY = state.height * 0.4; // Bay vào tán cây
    }

    state.projectiles.push({
        id: Date.now(),
        x: state.width / 2, y: state.height - 50,
        startX: state.width / 2, startY: state.height - 50,
        targetX, targetY,
        color: mood.color,
        progress: 0,
        speed: 0.01,
        type: type,
        state: 'flying'
    });

    setInputValue('');
  }, [currentMoodId]);

  return (
    <div className="relative w-full h-screen bg-[#020202] overflow-hidden font-sans text-white">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,500&display=swap');`}</style>

      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />

      {/* --- UI INPUT --- */}
      <div className="absolute bottom-0 left-0 w-full pb-10 pt-20 px-4 flex flex-col items-center justify-end z-50 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none">
        <div className="w-full max-w-[500px] flex flex-col items-center gap-5 pointer-events-auto">
            
            {/* COLOR SELECTION */}
            <div className="flex justify-center gap-6 p-4 bg-white/5 rounded-full backdrop-blur-md border border-white/10">
                {EMOTIONS.map((mood) => (
                    <button 
                        key={mood.id} 
                        onClick={() => setCurrentMoodId(mood.id)} 
                        className={`group relative w-12 h-12 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${currentMoodId === mood.id ? 'scale-110 border-white shadow-[0_0_20px_currentColor]' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-110'}`} 
                        style={{ backgroundColor: mood.color, color: mood.color }}
                    >
                        {/* Tooltip */}
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-white bg-black/80 px-2 py-1 rounded">
                            {mood.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* INPUT BOX */}
            <div className="w-full relative flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-2 py-2 shadow-2xl focus-within:bg-white/10 focus-within:border-white/30 transition-all">
                <input 
                    type="text" 
                    value={inputValue} 
                    onChange={(e) => setInputValue(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && sendToVoid()} 
                    placeholder="Gửi tâm thư..." 
                    className="flex-1 bg-transparent border-none text-white/90 font-serif text-lg px-4 focus:outline-none placeholder:text-white/30" 
                />
                <button 
                    onClick={sendToVoid} 
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white/80 transition-all hover:text-white hover:scale-105 active:scale-95"
                >
                  <Send size={20} />
                </button>
            </div>
            
            <div className="text-[10px] text-white/30 font-light tracking-widest uppercase mt-2">
                Chế độ: {EMOTIONS.find(e => e.id === currentMoodId)?.label}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TechRoom;
