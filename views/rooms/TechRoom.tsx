import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Wind, Music } from 'lucide-react';

// --- CẤU HÌNH CẢM XÚC ---
const EMOTIONS = [
  { id: 'joy', label: 'Hy Vọng', color: '#FFD700', type: 'good' },       // Vàng
  { id: 'sad', label: 'Nỗi Buồn', color: '#3498DB', type: 'heavy' },     // Xanh dương
  { id: 'anger', label: 'Xả Giận', color: '#E74C3C', type: 'heavy' },    // Đỏ
  { id: 'heal', label: 'Hạnh Phúc', color: '#2ECC71', type: 'good' },    // Xanh lá
  { id: 'dream', label: 'Giấc Mơ', color: '#9B59B6', type: 'good' },     // Tím
  { id: 'empty', label: 'Trống Rỗng', color: '#BDC3C7', type: 'heavy' }  // Trắng
];

// --- TYPES ---
interface Projectile {
  x: number; y: number; targetX: number; targetY: number;
  color: string; speed: number; progress: number;
  type: 'normal' | 'anger' | 'hope' | 'joy';
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
  const [emotionTracker, setEmotionTracker] = useState<{[key: string]: number}>({});
  const [dominantMood, setDominantMood] = useState<typeof EMOTIONS[0] | null>(null);
  const [showMusicPrompt, setShowMusicPrompt] = useState(false);

  // GAME STATE
  const gameState = useRef({
    selectedMood: EMOTIONS[0],
    vitality: 10,
    time: 0,
    width: 0, height: 0,
    trunkR: 40, trunkG: 40, trunkB: 40,
    
    branches: [] as Branch[],
    projectiles: [] as Projectile[],
    blooms: [] as Bloom[],
    fireworks: [] as Firework[],
    
    activeEffect: null as 'anger' | 'hope' | 'joy' | null,
    effectTimer: 0, 
    mascot: { x: 0, y: 0, active: false, trail: [] } as MascotFlyer,
    star: { x: 0, y: 0, active: false, brightness: 0 },
    
    windForce: 0,
    treeShake: 0,
  });

  // --- INIT TREE ---
  const generateTreeStructure = (w: number, h: number) => {
    const branches: Branch[] = [];
    const baseWidth = Math.min(w, h) * 0.025; 
    const baseHeight = h * 0.22; 

    const grow = (x: number, y: number, len: number, angle: number, wid: number, depth: number) => {
      const endX = x + len * Math.cos(angle);
      const endY = y + len * Math.sin(angle);
      branches.push({ x, y, endX, endY, angle, depth, width: wid });
      
      if (len < 10 || depth > 10) return;
      
      grow(endX, endY, len * 0.75, angle - 0.35 - Math.random() * 0.1, wid * 0.7, depth + 1);
      grow(endX, endY, len * 0.75, angle + 0.35 + Math.random() * 0.1, wid * 0.7, depth + 1);
    };
    
    grow(w / 2, h, baseHeight, -Math.PI / 2, baseWidth, 0);
    return branches;
  };

  // --- ANIMATION LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);

      gameState.current.width = window.innerWidth;
      gameState.current.height = window.innerHeight;
      gameState.current.branches = generateTreeStructure(window.innerWidth, window.innerHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let animationId: number;
    const render = () => {
      const state = gameState.current;
      state.time += 0.05; // Tăng tốc độ thời gian tổng thể (mọi thứ nhanh hơn 1 chút)

      if (state.activeEffect) {
          state.effectTimer--;
          if (state.effectTimer <= 0) {
              state.activeEffect = null;
              state.mascot.active = false;
              state.star.active = false;
              state.treeShake = 0;
          }
      }

      // 1. Background
      let baseBg = 5 + (state.vitality * 0.2);
      if (state.activeEffect === 'hope') baseBg += 5; 
      ctx.fillStyle = `rgb(${baseBg}, ${baseBg}, ${baseBg + 5})`;
      ctx.fillRect(0, 0, state.width, state.height);

      // --- SPECIAL EFFECTS ---
      
      // A. ANGER MODE (Tăng tốc độ & Giảm độ trễ)
      if (state.activeEffect === 'anger') {
          if (state.effectTimer < 750) { // Hiện chữ sớm hơn
              ctx.save();
              ctx.globalAlpha = Math.min(1, (750 - state.effectTimer) * 0.05); // Fade in nhanh hơn
              ctx.font = `900 ${Math.min(state.width/10, 80)}px sans-serif`; 
              ctx.textAlign = "center";
              ctx.shadowColor = "#E74C3C";
              ctx.shadowBlur = 0; // Bỏ blur nặng để đỡ lag
              ctx.fillStyle = "#fff";
              ctx.fillText("FUCK THIS SHIT 🖕", state.width / 2, state.height / 3);
              
              ctx.fillStyle = `rgba(231, 76, 60, ${Math.abs(Math.sin(state.time * 10)) * 0.15})`;
              ctx.fillRect(0, 0, state.width, state.height);
              ctx.restore();
          }

          // Fireworks: Tối ưu loop
          for (let i = state.fireworks.length - 1; i >= 0; i--) {
              const f = state.fireworks[i];
              f.x += f.vx; f.y += f.vy; 
              f.vy += 0.1; // Trọng lực mạnh hơn rơi cho nhanh
              f.life -= 1.5; // Nổ nhanh tàn nhanh
              f.alpha -= 0.02;
              if (f.life <= 0) { state.fireworks.splice(i, 1); continue; }
              ctx.fillStyle = f.color;
              ctx.globalAlpha = f.alpha;
              ctx.beginPath(); ctx.arc(f.x, f.y, 2.5, 0, Math.PI*2); ctx.fill();
              ctx.globalAlpha = 1;
          }
          if (Math.random() > 0.85) { // Spawn nhiều hơn
              const fx = Math.random() * state.width;
              const fy = Math.random() * state.height / 2;
              for(let k=0; k<25; k++) state.fireworks.push({
                  x: fx, y: fy, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8,
                  color: ['#E74C3C', '#F1C40F', '#ECF0F1'][Math.floor(Math.random()*3)],
                  life: 50, alpha: 1
              });
          }
      }

      // B. HOPE MODE
      if (state.activeEffect === 'hope' && state.star.active) {
          const s = state.star;
          ctx.save();
          ctx.translate(s.x, s.y);
          // Giảm blur radius để tăng performance
          const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
          gradient.addColorStop(0, "white");
          gradient.addColorStop(0.4, "#FFD700");
          gradient.addColorStop(1, "transparent");
          ctx.fillStyle = gradient;
          ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI*2); ctx.fill();
          
          ctx.rotate(state.time * 0.2); // Xoay nhanh hơn
          ctx.fillStyle = "#FFF";
          ctx.font = "40px serif";
          ctx.fillText("✨", -15, 15);
          ctx.restore();
      }

      // 2. Tree Drawing
      const breath = Math.sin(state.time) * 0.5 + 0.5;
      let trunkColorStr = `rgb(${Math.floor(state.trunkR)}, ${Math.floor(state.trunkG)}, ${Math.floor(state.trunkB)})`;
      if (state.activeEffect === 'hope') trunkColorStr = `rgb(255, 223, 0)`;
      if (state.activeEffect === 'joy') trunkColorStr = `rgb(46, 204, 113)`;

      ctx.lineCap = "round";
      // Tối ưu: Tính toán các biến static ngoài loop
      const windSwayBase = state.windForce * Math.sin(state.time * 5);
      let activeSwayBase = 0;
      if (state.activeEffect === 'joy') activeSwayBase = Math.sin(state.time * 20) * 2;
      else if (state.activeEffect === 'hope') activeSwayBase = Math.sin(state.time * 2) * 5;

      state.branches.forEach(b => {
        ctx.beginPath();
        // Công thức sway đơn giản hóa để tính toán nhanh hơn
        const sway = Math.sin(state.time + b.depth) * (b.depth * 0.5) + activeSwayBase + (windSwayBase * b.depth * 0.05);
        
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.endX + sway, b.endY);
        ctx.lineWidth = b.width;
        ctx.strokeStyle = trunkColorStr;
        
        // CHỈ VẼ SHADOW KHI CẦN THIẾT (Tối ưu FPS cực mạnh)
        if (state.vitality > 60 || state.activeEffect) {
             // Chỉ shadow nhẹ, tránh shadow lớn gây lag
             ctx.shadowBlur = 10; 
             ctx.shadowColor = trunkColorStr;
        } else {
             ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // C. ANGER MASCOT (Bay nhanh hơn)
      if (state.activeEffect === 'anger' && state.mascot.active) {
          const m = state.mascot;
          m.x -= 25; // TỐC ĐỘ BAY TĂNG GẤP ĐÔI (Cũ là 15)
          m.y += Math.sin(state.time * 15) * 5; // Lượn biên độ rộng hơn
          
          if (m.x > 0) m.trail.push({ x: m.x, y: m.y, alpha: 1 });
          if (m.x > -100) { ctx.font = "50px serif"; ctx.fillText("🧙‍♀️", m.x, m.y); }
          
          for(let i=m.trail.length-1; i>=0; i--) {
              const t = m.trail[i];
              t.y += 4; // Rơi nhanh hơn
              t.alpha -= 0.05; // Tan nhanh hơn
              if(t.alpha <= 0) { m.trail.splice(i, 1); continue; }
              ctx.fillStyle = `rgba(231, 76, 60, ${t.alpha})`;
              ctx.beginPath(); ctx.arc(t.x, t.y, 3, 0, Math.PI*2); ctx.fill();
          }
      }

      // 3. Projectiles (Bay cực nhanh)
      for (let i = state.projectiles.length - 1; i >= 0; i--) {
          const p = state.projectiles[i];
          p.progress += p.speed; 
          
          const cx = (p.x + p.targetX) / 2; 
          const cy = Math.min(p.y, p.targetY) - 200;
          const t = p.progress; const invT = 1 - t;
          const currX = invT * invT * p.x + 2 * invT * t * cx + t * t * p.targetX;
          const currY = invT * invT * p.y + 2 * invT * t * cy + t * t * p.targetY;

          ctx.save();
          ctx.translate(currX, currY);
          ctx.rotate(t * 15);
          ctx.fillStyle = p.color;
          // Bỏ shadow khi đang bay nhanh để mượt
          ctx.fillRect(-6, -4, 12, 8);
          ctx.restore();

          if (p.progress >= 1) {
              state.projectiles.splice(i, 1);
              if (p.type === 'anger') {
                  state.activeEffect = 'anger'; state.effectTimer = 800; // Giảm thời gian chờ hiệu ứng
                  state.mascot = { x: state.width, y: 100, active: true, trail: [] };
                  for(let k=0; k<40; k++) state.fireworks.push({ x: currX, y: currY, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15, color: '#E74C3C', life: 50, alpha: 1 });
              } 
              else if (p.type === 'hope') {
                  state.activeEffect = 'hope'; state.effectTimer = 800;
                  state.star = { x: currX, y: 100, active: true, brightness: 1 };
              }
              else if (p.type === 'joy') {
                  state.activeEffect = 'joy'; state.effectTimer = 800;
                  const tips = state.branches.filter(b => b.depth > 6);
                  tips.forEach(tip => {
                      if(Math.random() > 0.6) state.blooms.push({ id: Math.random(), x: tip.endX, y: tip.endY, color: '#2ECC71', size: Math.random()*4+2, maxSize: 5, phase: 0, vx: 0, vy: 1 + Math.random(), isFlyingOff: false, type: 'falling' });
                  });
              }
              else {
                  state.blooms.push({ id: Date.now() + i, x: p.targetX, y: p.targetY, color: p.color, size: 0, maxSize: Math.random() * 5 + 3, phase: Math.random() * Math.PI, vx: 0, vy: 0, isFlyingOff: false, type: 'static' });
              }
          }
      }

      // 4. Blooms
      for (let i = state.blooms.length - 1; i >= 0; i--) {
        const b = state.blooms[i];

        if (state.windForce > 0) {
            b.isFlyingOff = true;
            b.vx += state.windForce * 0.5 + (Math.random()-0.5);
            b.vy += (Math.random() - 0.2) * 2;
        }

        if (b.type === 'falling') {
            b.y += b.vy; 
            b.x += Math.sin(state.time + b.id) * 1; // Rơi lượn sóng mạnh hơn
            if (b.y > state.height) { state.blooms.splice(i, 1); continue; }
        }

        if (b.isFlyingOff) {
            b.x += b.vx; b.y += b.vy; b.vx *= 0.98; b.size *= 0.99;
            if (b.x > state.width || b.x < 0 || b.y < 0 || b.size < 0.5) { state.blooms.splice(i, 1); continue; }
        } 
        
        if (b.size < b.maxSize) b.size += 0.2; // Nở nhanh hơn
        let stickSway = 0;
        if (b.type === 'static') {
             stickSway = Math.sin(state.time * 5) * state.windForce * 10;
             if (state.activeEffect === 'joy') stickSway += Math.sin(state.time * 20) * 2;
        }

        const bloomBreath = Math.sin(state.time * 3 + b.phase) * 0.3 + 0.8;
        ctx.fillStyle = b.color;
        // Chỉ glow nhẹ
        if(state.vitality > 80) {
             ctx.shadowBlur = 5; ctx.shadowColor = b.color;
        } else {
             ctx.shadowBlur = 0;
        }
        ctx.beginPath(); ctx.arc(b.x + stickSway, b.y, b.size * bloomBreath, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      }
      
      if (!isWindBlowing && state.windForce > 0) {
          state.windForce -= 0.02; if (state.windForce < 0) state.windForce = 0;
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
    if (mood.type === 'good') state.vitality = Math.min(100, state.vitality + 5);
    else state.vitality = Math.min(100, state.vitality + 1);
    setVitalityUI(Math.floor(state.vitality));

    let targetX = state.width / 2; let targetY = state.height / 2;
    let projectileType: Projectile['type'] = 'normal';

    if (mood.id === 'anger') { projectileType = 'anger'; targetY = state.height * 0.3; } 
    else if (mood.id === 'joy') { projectileType = 'hope'; targetY = 100; }
    else if (mood.id === 'heal') { projectileType = 'joy'; targetY = state.height * 0.4; }
    else {
        const tips = state.branches.filter(b => b.depth > 6);
        if (tips.length > 0) {
            const targetBranch = tips[Math.floor(Math.random() * tips.length)];
            targetX = targetBranch.endX + (Math.random() - 0.5) * 20;
            targetY = targetBranch.endY + (Math.random() - 0.5) * 20;
        }
    }
    state.projectiles.push({
        x: state.width / 2, y: state.height - 120, 
        targetX: targetX, targetY: targetY,
        color: mood.color, 
        speed: 0.04, // TĂNG TỐC ĐỘ ĐẠN (Gấp đôi, cũ là 0.015)
        progress: 0, type: projectileType
    });
    setInputValue('');
  }, []);

  const triggerWind = () => {
      setIsWindBlowing(true);
      gameState.current.windForce = 2;
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

      {showMusicPrompt && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in px-4">
            <div className="bg-[#151515] border border-white/10 p-8 rounded-3xl max-w-sm text-center shadow-[0_0_50px_rgba(255,255,255,0.05)] transform scale-100 transition-all">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4"><Music size={24} className="text-white/70" /></div>
                <h3 className="text-xl font-serif text-white/90 mb-3 leading-snug">{getPromptMessage()}</h3>
                <div className="flex gap-4 justify-center mt-6">
                    <button onClick={() => { setShowMusicPrompt(false); setEmotionTracker({}); }} className="px-6 py-3 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors text-xs uppercase tracking-widest font-bold">Không cần đâu</button>
                    <button onClick={() => onNavigate('audio', { mood: dominantMood?.id })} className="px-8 py-3 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all transform hover:scale-105">Nghe ngay</button>
                </div>
            </div>
        </div>
      )}

      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none" />

      <div className="absolute top-4 right-4 md:top-6 md:right-6 text-right z-10 select-none pointer-events-none">
        <div className="font-serif text-white/50 text-xs md:text-sm">Sức Sống</div>
        <div className="w-24 md:w-32 h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
          <div className="h-full transition-all duration-700 ease-out" style={{ width: `${vitalityUI}%`, background: vitalityUI > 60 ? '#FFD700' : '#4facfe' }}></div>
        </div>
      </div>

      <button onClick={triggerWind} title="Thổi bay ký ức" className={`absolute top-4 left-16 md:top-6 md:left-24 p-3 md:p-4 rounded-full border border-white/10 backdrop-blur-md transition-all duration-500 z-50 hover:bg-white/10 group ${isWindBlowing ? 'rotate-180 bg-white/20' : ''}`}>
        <Wind className={`w-5 h-5 md:w-6 md:h-6 text-white/60 group-hover:text-white ${isWindBlowing ? 'animate-pulse' : ''}`} />
      </button>

      <div className={`absolute top-[30%] md:top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none transition-opacity duration-1000 ${vitalityUI > 15 ? 'opacity-0' : 'opacity-70'}`}>
        <h1 className="font-serif text-2xl md:text-3xl text-white/40 tracking-widest whitespace-nowrap">CÂY TÂM TƯ</h1>
      </div>

      <div className="absolute bottom-0 left-0 w-full pb-6 pt-10 md:pb-8 md:pt-20 px-4 flex flex-col items-center justify-end z-50 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none">
        <div className="w-full max-w-[500px] flex flex-col items-center gap-3 md:gap-5 pointer-events-auto">
            <div className="flex justify-center gap-3 md:gap-4 p-2 flex-wrap">
                {EMOTIONS.map((mood) => (
                    <button key={mood.id} onClick={() => handleSelectMood(mood)} className={`w-10 h-10 md:w-10 md:h-10 rounded-full border-2 transition-all duration-200 ${currentMoodId === mood.id ? 'scale-125 border-white shadow-[0_0_10px_currentColor]' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-110'}`} style={{ backgroundColor: mood.color }} title={mood.label} />
                ))}
            </div>
            <div className="w-full relative flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-3 py-3 md:px-4 md:py-3 shadow-2xl focus-within:bg-white/10 focus-within:border-white/30">
                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendToVoid()} placeholder="Gửi tâm tư vào cây..." className="flex-1 bg-transparent border-none text-white/90 font-serif text-base md:text-lg px-2 md:px-4 focus:outline-none placeholder:text-white/30" />
                <button onClick={sendToVoid} disabled={isWindBlowing} className="p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white/80 transition-all hover:text-white hover:scale-105 active:scale-95 disabled:opacity-50">
                  <Send size={20} />
                </button>
            </div>
            <div className="text-[10px] md:text-xs text-white/30 font-light tracking-widest uppercase mt-1">
                {EMOTIONS.find(e => e.id === currentMoodId)?.label}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TechRoom;
