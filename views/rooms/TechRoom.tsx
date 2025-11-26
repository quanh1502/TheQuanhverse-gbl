import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Wind, Music } from 'lucide-react';

// --- CẤU HÌNH CẢM XÚC ---
// Logic màu sắc theo yêu cầu: Đỏ (Giận), Vàng (Hy vọng/Vui), Xanh (Hạnh phúc/Chữa lành)
const EMOTIONS = [
  { id: 'joy', label: 'Hy Vọng', color: '#FFD700', type: 'good' },       // Vàng -> Sao sáng
  { id: 'sad', label: 'Nỗi Buồn', color: '#3498DB', type: 'heavy' },     // Xanh dương -> (Giữ nguyên logic thấm cây)
  { id: 'anger', label: 'Xả Giận', color: '#E74C3C', type: 'heavy' },    // Đỏ -> Fuck this shit
  { id: 'heal', label: 'Hạnh Phúc', color: '#2ECC71', type: 'good' },    // Xanh lá -> Cây nhảy múa
  { id: 'dream', label: 'Giấc Mơ', color: '#9B59B6', type: 'good' },     
  { id: 'empty', label: 'Trống Rỗng', color: '#BDC3C7', type: 'heavy' }  
];

// --- TYPES ---
interface Projectile {
  x: number; y: number; targetX: number; targetY: number;
  color: string; speed: number; progress: number;
  type: 'normal' | 'anger' | 'hope' | 'joy'; // Loại đạn để kích hoạt hiệu ứng
}

interface Bloom {
  id: number; x: number; y: number; color: string; size: number; maxSize: number;
  phase: number; vx: number; vy: number; isFlyingOff: boolean; type: 'static' | 'falling';
}

interface Firework {
  x: number; y: number; vx: number; vy: number; alpha: number; color: string; life: number;
}

interface MascotFlyer {
  x: number; y: number; active: boolean; trail: {x: number, y: number, alpha: number}[];
}

interface Branch {
  x: number; y: number; endX: number; endY: number; depth: number; width: number; angle: number;
}

// Props
interface TechRoomProps {
    onNavigate: (room: 'tech' | 'audio', params?: any) => void;
}

const TechRoom: React.FC<TechRoomProps> = ({ onNavigate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [vitalityUI, setVitalityUI] = useState(10);
  const [currentMoodId, setCurrentMoodId] = useState('joy');
  const [isWindBlowing, setIsWindBlowing] = useState(false);

  // State Logic
  const [showMusicPrompt, setShowMusicPrompt] = useState(false);

  // GAME STATE (Ref mutable để tối ưu animation)
  const gameState = useRef({
    selectedMood: EMOTIONS[0],
    vitality: 10,
    time: 0,
    width: 0, height: 0,
    trunkR: 40, trunkG: 40, trunkB: 40, // Màu cây
    
    branches: [] as Branch[],
    projectiles: [] as Projectile[],
    blooms: [] as Bloom[],
    fireworks: [] as Firework[],
    
    // --- SPECIAL EFFECTS STATE ---
    activeEffect: null as 'anger' | 'hope' | 'joy' | null,
    effectTimer: 0, // Đếm lùi 20s
    
    mascot: { x: 0, y: 0, active: false, trail: [] } as MascotFlyer, // Cho Anger mode
    star: { x: 0, y: 0, active: false, brightness: 0 }, // Cho Hope mode
    
    windForce: 0,
    treeShake: 0, // Độ rung của cây
  });

  // --- INIT TREE ---
  const generateTreeStructure = (w: number, h: number) => {
    const branches: Branch[] = [];
    const grow = (x: number, y: number, len: number, angle: number, wid: number, depth: number) => {
      const endX = x + len * Math.cos(angle);
      const endY = y + len * Math.sin(angle);
      branches.push({ x, y, endX, endY, angle, depth, width: wid });
      if (len < 10 || depth > 10) return;
      grow(endX, endY, len * 0.75, angle - 0.3 - Math.random() * 0.2, wid * 0.7, depth + 1);
      grow(endX, endY, len * 0.75, angle + 0.3 + Math.random() * 0.2, wid * 0.7, depth + 1);
    };
    grow(w / 2, h, h * 0.18, -Math.PI / 2, 16, 0);
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

    // --- RENDER FUNCTION ---
    let animationId: number;
    const render = () => {
      const state = gameState.current;
      state.time += 0.03;

      // Countdown Timer cho hiệu ứng đặc biệt (20s ~ 1200 frames tại 60fps)
      if (state.activeEffect) {
          state.effectTimer--;
          if (state.effectTimer <= 0) {
              // Reset effects
              state.activeEffect = null;
              state.mascot.active = false;
              state.star.active = false;
              state.treeShake = 0;
          }
      }

      // 1. Background
      // Nếu đang Hope mode (Vàng), trời sáng hơn chút
      let baseBg = 5 + (state.vitality * 0.2);
      if (state.activeEffect === 'hope') baseBg += 5; 
      ctx.fillStyle = `rgb(${baseBg}, ${baseBg}, ${baseBg + 5})`;
      ctx.fillRect(0, 0, state.width, state.height);

      // --- VẼ HIỆU ỨNG ĐẶC BIỆT NỀN (SAO / PHÁO HOA) ---
      
      // A. ANGER MODE: TEXT & FIREWORKS
      if (state.activeEffect === 'anger') {
          // Vẽ dòng chữ FUCK THIS SHIT
          if (state.effectTimer < 1100) { // Hiện sau khi mascot bay qua 1 chút
              ctx.save();
              ctx.globalAlpha = Math.min(1, (1100 - state.effectTimer) * 0.02); // Fade in
              ctx.font = "900 80px 'Arial Black', sans-serif";
              ctx.textAlign = "center";
              ctx.shadowColor = "#E74C3C";
              ctx.shadowBlur = 20 + Math.sin(state.time * 20) * 10; // Chớp chớp
              ctx.fillStyle = "#fff";
              ctx.fillText("FUCK THIS SHIT 🖕", state.width / 2, state.height / 3);
              
              // Pháo sáng nền
              ctx.fillStyle = `rgba(231, 76, 60, ${Math.abs(Math.sin(state.time * 10)) * 0.2})`;
              ctx.fillRect(0, 0, state.width, state.height);
              ctx.restore();
          }

          // Vẽ Pháo hoa
          for (let i = state.fireworks.length - 1; i >= 0; i--) {
              const f = state.fireworks[i];
              f.x += f.vx; f.y += f.vy; f.vy += 0.05; f.life--; f.alpha -= 0.01;
              if (f.life <= 0) { state.fireworks.splice(i, 1); continue; }
              ctx.fillStyle = f.color;
              ctx.globalAlpha = f.alpha;
              ctx.beginPath(); ctx.arc(f.x, f.y, 2, 0, Math.PI*2); ctx.fill();
              ctx.globalAlpha = 1;
          }
          // Spawn pháo hoa ngẫu nhiên
          if (Math.random() > 0.9) {
              const fx = Math.random() * state.width;
              const fy = Math.random() * state.height / 2;
              for(let k=0; k<20; k++) state.fireworks.push({
                  x: fx, y: fy, vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5,
                  color: ['#E74C3C', '#F1C40F', '#ECF0F1'][Math.floor(Math.random()*3)],
                  life: 60, alpha: 1
              });
          }
      }

      // B. HOPE MODE: STAR
      if (state.activeEffect === 'hope' && state.star.active) {
          const s = state.star;
          // Vẽ ngôi sao sáng
          ctx.save();
          ctx.translate(s.x, s.y);
          // Hiệu ứng tỏa sáng
          const glow = 20 + Math.sin(state.time * 3) * 10;
          const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 40);
          gradient.addColorStop(0, "white");
          gradient.addColorStop(0.2, "#FFD700");
          gradient.addColorStop(1, "transparent");
          ctx.fillStyle = gradient;
          ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI*2); ctx.fill();
          
          // Vẽ hình sao
          ctx.rotate(state.time * 0.1);
          ctx.fillStyle = "#FFF";
          ctx.font = "40px serif";
          ctx.fillText("✨", -15, 15);
          ctx.restore();
      }

      // 2. Vẽ Cây
      const breath = Math.sin(state.time) * 0.5 + 0.5;
      let trunkColorStr = `rgb(${Math.floor(state.trunkR)}, ${Math.floor(state.trunkG)}, ${Math.floor(state.trunkB)})`;
      
      // Nếu Hope mode, cây sáng rực màu vàng
      if (state.activeEffect === 'hope') trunkColorStr = `rgb(255, 223, 0)`;
      // Nếu Joy mode, cây sáng màu xanh
      if (state.activeEffect === 'joy') trunkColorStr = `rgb(46, 204, 113)`;

      ctx.lineCap = "round";
      state.branches.forEach(b => {
        ctx.beginPath();
        
        // Tính toán độ rung (Sway + Shake)
        let activeSway = Math.sin(state.time + b.depth) * (b.depth * 0.5); // Gió tự nhiên
        
        // Hiệu ứng rung lắc đặc biệt
        if (state.activeEffect === 'joy') {
            // Rung sảng khoái (nhanh hơn)
            activeSway += Math.sin(state.time * 20) * 2; 
        } else if (state.activeEffect === 'hope') {
            // Lắc lư cảm nhận năng lượng (chậm, biên độ rộng)
            activeSway += Math.sin(state.time * 2) * 5;
        }

        const windSway = state.windForce * (b.depth * 0.05) * Math.sin(state.time * 5);
        
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.endX + activeSway + windSway, b.endY);
        ctx.lineWidth = b.width;
        ctx.strokeStyle = trunkColorStr;
        
        // Glow logic
        let shadowBlur = 0;
        if (state.vitality > 40) shadowBlur = (state.vitality - 40) * 0.2 * breath;
        if (state.activeEffect) shadowBlur = 20; // Luôn sáng khi có hiệu ứng

        ctx.shadowBlur = shadowBlur;
        ctx.shadowColor = trunkColorStr;
        
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // C. ANGER MODE: MASCOT BAY
      if (state.activeEffect === 'anger' && state.mascot.active) {
          const m = state.mascot;
          m.x -= 15; // Bay nhanh sang trái
          m.y += Math.sin(state.time * 10) * 2; // Lượn sóng
          
          // Rải hạt đỏ
          if (m.x > 0) {
              m.trail.push({ x: m.x, y: m.y, alpha: 1 });
          }
          
          // Vẽ Mascot (Emoji Phù thủy)
          if (m.x > -100) {
              ctx.font = "40px serif";
              ctx.fillText("🧙‍♀️", m.x, m.y);
          }

          // Vẽ Trail (Hạt rơi)
          for(let i=m.trail.length-1; i>=0; i--) {
              const t = m.trail[i];
              t.y += 2; t.alpha -= 0.02; // Rơi xuống
              if(t.alpha <= 0) { m.trail.splice(i, 1); continue; }
              ctx.fillStyle = `rgba(231, 76, 60, ${t.alpha})`;
              ctx.beginPath(); ctx.arc(t.x, t.y, 3, 0, Math.PI*2); ctx.fill();
          }
      }

      // 3. Vẽ Projectiles (Lá thư đang bay)
      for (let i = state.projectiles.length - 1; i >= 0; i--) {
          const p = state.projectiles[i];
          p.progress += p.speed;
          
          // Tính vị trí (Bezier)
          const cx = (p.x + p.targetX) / 2; 
          const cy = Math.min(p.y, p.targetY) - 200; // Bay vòng cung cao
          const t = p.progress; const invT = 1 - t;
          const currX = invT * invT * p.x + 2 * invT * t * cx + t * t * p.targetX;
          const currY = invT * invT * p.y + 2 * invT * t * cy + t * t * p.targetY;

          // Vẽ lá thư (Hình chữ nhật nhỏ)
          ctx.save();
          ctx.translate(currX, currY);
          ctx.rotate(t * 10); // Xoay xoay
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10; ctx.shadowColor = p.color;
          ctx.fillRect(-6, -4, 12, 8); // Giả lập phong bì
          ctx.restore();

          // KHI ĐẾN ĐÍCH (KÍCH HOẠT HIỆU ỨNG)
          if (p.progress >= 1) {
              state.projectiles.splice(i, 1); // Xóa đạn

              // --- TRIGGER EFFECTS ---
              if (p.type === 'anger') {
                  // Kích hoạt Anger Mode
                  state.activeEffect = 'anger';
                  state.effectTimer = 1200; // 20s
                  state.mascot = { x: state.width, y: 100, active: true, trail: [] }; // Mascot xuất phát bên phải
                  // Nổ tung tại chỗ lá thư biến mất
                  for(let k=0; k<30; k++) state.fireworks.push({
                      x: currX, y: currY, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
                      color: '#E74C3C', life: 40, alpha: 1
                  });
              } 
              else if (p.type === 'hope') {
                  // Kích hoạt Hope Mode
                  state.activeEffect = 'hope';
                  state.effectTimer = 1200;
                  state.star = { x: currX, y: 100, active: true, brightness: 1 }; // Sao xuất hiện trên cao
              }
              else if (p.type === 'joy') {
                  // Kích hoạt Joy Mode
                  state.activeEffect = 'joy';
                  state.effectTimer = 1200;
                  // Spawn đốm sáng xanh rơi xuống từ tán cây
                  const tips = state.branches.filter(b => b.depth > 6);
                  tips.forEach(tip => {
                      if(Math.random() > 0.7) { // 30% cành sẽ rớt hạt
                          state.blooms.push({
                              id: Math.random(), x: tip.endX, y: tip.endY,
                              color: '#2ECC71', size: Math.random()*4+2, maxSize: 5,
                              phase: 0, vx: 0, vy: 0.5 + Math.random(), // Rơi xuống
                              isFlyingOff: false, type: 'falling'
                          });
                      }
                  });
              }
              else {
                  // Normal Mode (Biến thành hoa trên cây như cũ)
                  state.blooms.push({
                      id: Date.now() + i, x: p.targetX, y: p.targetY,
                      color: p.color, size: 0, maxSize: Math.random() * 5 + 3,
                      phase: Math.random() * Math.PI, vx: 0, vy: 0, isFlyingOff: false, type: 'static'
                  });
              }
          }
      }

      // 4. Vẽ Blooms (Đốm sáng / Hạt rơi)
      for (let i = state.blooms.length - 1; i >= 0; i--) {
        const b = state.blooms[i];

        // Logic Gió thổi (Reset)
        if (state.windForce > 0) {
            b.isFlyingOff = true;
            b.vx += state.windForce * 0.5 + (Math.random()-0.5);
            b.vy += (Math.random() - 0.2) * 2;
        }

        // Logic Hạt rơi (Joy Mode)
        if (b.type === 'falling') {
            b.y += b.vy;
            b.x += Math.sin(state.time + b.id) * 0.5; // Lắc lư khi rơi
            if (b.y > state.height) { state.blooms.splice(i, 1); continue; }
        }

        if (b.isFlyingOff) {
            b.x += b.vx; b.y += b.vy; b.vx *= 0.98; b.size *= 0.99;
            if (b.x > state.width || b.x < 0 || b.y < 0 || b.size < 0.5) { state.blooms.splice(i, 1); continue; }
        } 
        
        // VẼ
        if (b.size < b.maxSize) b.size += 0.1;
        let stickSway = 0;
        if (b.type === 'static') {
             stickSway = Math.sin(state.time * 5) * state.windForce * 10;
             // Nếu cây đang shake (joy mode), hoa trên cây cũng rung
             if (state.activeEffect === 'joy') stickSway += Math.sin(state.time * 20) * 2;
        }

        const bloomBreath = Math.sin(state.time * 3 + b.phase) * 0.3 + 0.8;
        ctx.fillStyle = b.color;
        const glow = state.vitality > 50 || state.activeEffect ? 20 : 8;
        ctx.shadowBlur = glow * bloomBreath; ctx.shadowColor = b.color;
        ctx.beginPath(); ctx.arc(b.x + stickSway, b.y, b.size * bloomBreath, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      }
      
      if (!isWindBlowing && state.windForce > 0) {
          state.windForce -= 0.01; if (state.windForce < 0) state.windForce = 0;
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
    
    // Logic đếm cảm xúc để gợi ý nhạc
    setEmotionTracker(prev => {
        const currentCount = (prev[mood.id] || 0) + 1;
        const newTracker = { ...prev, [mood.id]: currentCount };
        if (currentCount >= 3) {
            setDominantMood(mood);
            setTimeout(() => setShowMusicPrompt(true), 2000);
            return {}; 
        }
        return newTracker;
    });

    // Cập nhật chỉ số cây cơ bản (luôn xảy ra)
    if (mood.type === 'good') {
        state.vitality = Math.min(100, state.vitality + 5);
    } else {
        state.vitality = Math.min(100, state.vitality + 1);
    }
    setVitalityUI(Math.floor(state.vitality));

    // XÁC ĐỊNH LOẠI ĐẠN & MỤC TIÊU
    let targetX = state.width / 2;
    let targetY = state.height / 2;
    let projectileType: Projectile['type'] = 'normal';

    if (mood.id === 'anger') { // Đỏ - Xả giận
        projectileType = 'anger';
        targetY = state.height * 0.3; // Bay lên trời nổ
    } 
    else if (mood.id === 'joy') { // Vàng - Hy Vọng
        projectileType = 'hope';
        targetY = 100; // Bay lên đỉnh trời thành sao
    }
    else if (mood.id === 'heal') { // Xanh - Hạnh Phúc
        projectileType = 'joy';
        targetY = state.height * 0.4; // Bay vào giữa tán cây để rùng mình
    }
    else {
        // Các màu khác: Bay vào cành cây như cũ
        const tips = state.branches.filter(b => b.depth > 6);
        if (tips.length > 0) {
            const targetBranch = tips[Math.floor(Math.random() * tips.length)];
            targetX = targetBranch.endX + (Math.random() - 0.5) * 20;
            targetY = targetBranch.endY + (Math.random() - 0.5) * 20;
        }
    }

    // Bắn đạn
    state.projectiles.push({
        x: state.width / 2, y: state.height - 80, 
        targetX: targetX, targetY: targetY,
        color: mood.color, 
        speed: 0.015, // Bay nhanh hơn chút
        progress: 0,
        type: projectileType
    });

    setInputValue('');
  }, []);

  const triggerWind = () => {
      setIsWindBlowing(true);
      gameState.current.windForce = 2;
      // Reset effect ngay lập tức khi gió thổi
      gameState.current.activeEffect = null;
      
      setTimeout(() => setIsWindBlowing(false), 3000);
  };

  const handleSelectMood = (mood: typeof EMOTIONS[0]) => {
    setCurrentMoodId(mood.id);
    gameState.current.selectedMood = mood;
  };

  const getPromptMessage = () => {
      switch(dominantMood?.id) {
          case 'joy': return "Tia hy vọng này xứng đáng với một giai điệu tươi sáng!";
          case 'sad': return "Ngày hôm nay có vẻ hơi nặng nề. Để âm nhạc xoa dịu bạn nhé?";
          case 'anger': return "Xả hết rồi! Giờ hãy để nhạc Rock cuốn phăng mọi thứ đi.";
          case 'heal': return "Cảm giác hạnh phúc này thật tuyệt. Cùng nghe nhạc để kéo dài nó nhé.";
          default: return "Bạn có muốn nghe một bản nhạc không?";
      }
  };

  return (
    <div className="relative w-full h-screen bg-[#020202] overflow-hidden font-sans text-white">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400&family=Playfair+Display:ital,wght@1,500&display=swap');`}</style>

      {/* POPUP NHẠC */}
      {showMusicPrompt && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in px-4">
            <div className="bg-[#151515] border border-white/10 p-8 rounded-3xl max-w-sm text-center shadow-[0_0_50px_rgba(255,255,255,0.05)] transform scale-100 transition-all">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Music size={24} className="text-white/70" />
                </div>
                <h3 className="text-xl font-serif text-white/90 mb-3 leading-snug">{getPromptMessage()}</h3>
                <div className="flex gap-4 justify-center mt-6">
                    <button onClick={() => { setShowMusicPrompt(false); setEmotionTracker({}); }} className="px-6 py-3 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors text-xs uppercase tracking-widest font-bold">Không cần đâu</button>
                    <button onClick={() => onNavigate('audio', { mood: dominantMood?.id })} className="px-8 py-3 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all transform hover:scale-105">Nghe ngay</button>
                </div>
            </div>
        </div>
      )}

      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none" />

      <div className="absolute top-6 right-6 text-right z-10 select-none pointer-events-none">
        <div className="font-serif text-white/50 text-sm">Sức Sống</div>
        <div className="w-32 h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
          <div className="h-full transition-all duration-700 ease-out" style={{ width: `${vitalityUI}%`, background: vitalityUI > 60 ? '#FFD700' : '#4facfe' }}></div>
        </div>
      </div>

      <button onClick={triggerWind} title="Thổi bay ký ức" className={`absolute top-6 left-16 md:left-20 p-3 rounded-full border border-white/10 backdrop-blur-md transition-all duration-500 z-50 hover:bg-white/10 group ${isWindBlowing ? 'rotate-180 bg-white/20' : ''}`}>
        <Wind className={`w-5 h-5 text-white/60 group-hover:text-white ${isWindBlowing ? 'animate-pulse' : ''}`} />
      </button>

      <div className={`absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none transition-opacity duration-1000 ${vitalityUI > 15 ? 'opacity-0' : 'opacity-70'}`}>
        <h1 className="font-serif text-3xl text-white/40 tracking-widest">CÂY TÂM TƯ</h1>
      </div>

      <div className="absolute bottom-0 left-0 w-full pb-8 pt-20 px-4 flex flex-col items-center justify-end z-50 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none">
        <div className="w-full max-w-[500px] flex flex-col items-center gap-5 pointer-events-auto">
            <div className="flex justify-center gap-3 p-2">
                {EMOTIONS.map((mood) => (
                    <button key={mood.id} onClick={() => handleSelectMood(mood)} className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${currentMoodId === mood.id ? 'scale-125 border-white shadow-[0_0_10px_currentColor]' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-110'}`} style={{ backgroundColor: mood.color }} title={mood.label} />
                ))}
            </div>
            <div className="w-full relative flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-2 py-2 shadow-2xl focus-within:bg-white/10 focus-within:border-white/30">
                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendToVoid()} placeholder="Gửi tâm tư vào cây..." className="flex-1 bg-transparent border-none text-white/90 font-serif text-lg px-4 focus:outline-none placeholder:text-white/30" />
                <button onClick={sendToVoid} disabled={isWindBlowing} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white/80 transition-all hover:text-white hover:scale-105 active:scale-95 disabled:opacity-50">
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
