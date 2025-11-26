import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Wind, Music, Sparkles } from 'lucide-react';

// --- CẤU HÌNH CẢM XÚC ---
const EMOTIONS = [
  { id: 'joy', label: 'Niềm Vui', color: '#FFD700', type: 'good' },      // Vàng -> Hope Mode
  { id: 'sad', label: 'Nỗi Buồn', color: '#3498DB', type: 'heavy' },     
  { id: 'anger', label: 'Giận Dữ', color: '#E74C3C', type: 'heavy' },    // Đỏ -> Rage Mode
  { id: 'heal', label: 'Chữa Lành', color: '#2ECC71', type: 'good' },    // Xanh lá -> Happy Mode
  { id: 'dream', label: 'Giấc Mơ', color: '#9B59B6', type: 'good' },     
  { id: 'empty', label: 'Trống Rỗng', color: '#BDC3C7', type: 'heavy' }  
];

// --- TYPES ---
interface Projectile {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  speed: number;
  progress: number;
  type?: 'normal' | 'rocket'; // rocket bay thẳng lên trời
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
  gravity?: number;
}

interface Branch {
  x: number; y: number; endX: number; endY: number; 
  depth: number; width: number; angle: number;
}

// Hạt bụi đặc biệt cho hiệu ứng chữ và pháo hoa
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  targetX?: number; targetY?: number; // Nếu có target, nó sẽ bay về vị trí đó (xếp chữ)
  life: number;
  color: string;
  size: number;
  behavior: 'float' | 'target' | 'explode' | 'drop';
}

interface Star {
  x: number; y: number; size: number; alpha: number;
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
    particles: [] as Particle[], // Quản lý pháo hoa, chữ xếp
    
    // Special Effects State
    mode: 'normal' as 'normal' | 'rage' | 'hope' | 'happy',
    modeTimer: 0,
    
    // Anger Specifics
    mascotX: -100,
    mascotY: -100,
    textPoints: [] as {x: number, y: number}[], // Tọa độ các điểm tạo thành chữ
    textPointIndex: 0, // Đã rải đến điểm nào rồi
    
    // Hope Specifics
    hopeStar: null as Star | null,
    
    // Joy Specifics
    shakeIntensity: 0, // Cây rung lắc
    
    windForce: 0 
  });

  // --- HELPER: TẠO TỌA ĐỘ CHỮ TỪ CANVAS ẨN ---
  const generateTextPoints = (text: string, w: number, h: number) => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tCtx = tempCanvas.getContext('2d');
    if (!tCtx) return [];

    tCtx.font = "bold 80px Impact, sans-serif";
    tCtx.fillStyle = "red";
    tCtx.textAlign = "center";
    tCtx.textBaseline = "middle";
    
    // Vẽ chữ và biểu tượng
    tCtx.fillText(text, w / 2, h / 3);
    tCtx.font = "60px Arial";
    tCtx.fillText("🖕", w / 2, h / 3 + 80);

    const imageData = tCtx.getImageData(0, 0, w, h).data;
    const points = [];
    // Quét pixel (bước nhảy 4 để giảm tải)
    for (let y = 0; y < h; y += 4) {
      for (let x = 0; x < w; x += 4) {
        const index = (y * w + x) * 4;
        if (imageData[index + 3] > 128) { // Nếu pixel không trong suốt
          points.push({ x, y });
        }
      }
    }
    // Shuffle points để hiệu ứng xuất hiện ngẫu nhiên hơn
    return points.sort(() => Math.random() - 0.5);
  };

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

  // --- LOOP RENDER ---
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

    let animationId: number;

    const render = () => {
      const state = gameState.current;
      state.time += 0.03;

      // Xử lý Reset sau 20s (nếu đang ở chế độ đặc biệt)
      if (state.mode !== 'normal') {
        state.modeTimer -= 1;
        if (state.modeTimer <= 0) {
           // Reset Effects
           state.mode = 'normal';
           state.hopeStar = null;
           state.textPoints = [];
           state.particles = [];
        }
      }

      // Xử lý rung lắc (Shake Decay)
      if (state.shakeIntensity > 0) state.shakeIntensity *= 0.95;
      const shakeX = (Math.random() - 0.5) * state.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * state.shakeIntensity;

      // 1. Background (Có thể tối đi khi Anger, hoặc sáng lên khi Hope)
      let bgLevel = 5 + (state.vitality * 0.2); 
      if (state.mode === 'anger') bgLevel = 2; // Tối sầm
      if (state.mode === 'hope') bgLevel += 10; // Sáng hơn
      
      ctx.fillStyle = `rgb(${bgLevel}, ${bgLevel}, ${bgLevel + 5})`;
      ctx.fillRect(0, 0, state.width, state.height);
      
      // Save context để apply shake
      ctx.save();
      ctx.translate(shakeX, shakeY);

      // --- 2. VẼ CÁC HIỆU ỨNG ĐẶC BIỆT NỀN (Hope Star, Fireworks) ---
      
      // HOPE STAR (Ngôi sao hy vọng)
      if (state.mode === 'hope' && state.hopeStar) {
          const s = state.hopeStar;
          const flicker = 0.8 + Math.random() * 0.4;
          ctx.shadowBlur = 50 * flicker;
          ctx.shadowColor = "#FFD700";
          ctx.fillStyle = "#FFF";
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
          
          // Tia sáng
          ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(s.x - 50, s.y); ctx.lineTo(s.x + 50, s.y);
          ctx.moveTo(s.x, s.y - 50); ctx.lineTo(s.x, s.y + 50);
          ctx.stroke();
          ctx.shadowBlur = 0;
      }

      // 3. VẼ CÂY
      const breath = Math.sin(state.time) * 0.5 + 0.5;
      const trunkColor = `rgb(${Math.floor(state.trunkR)}, ${Math.floor(state.trunkG)}, ${Math.floor(state.trunkB)})`;
      
      ctx.lineCap = "round";
      state.branches.forEach(b => {
        ctx.beginPath();
        // Hope mode: cây lắc lư mạnh hơn
        const hopeSway = state.mode === 'hope' ? Math.sin(state.time * 2) * (b.depth * 1.5) : 0;
        const windSway = state.windForce * (b.depth * 0.05) * Math.sin(state.time * 5);
        const naturalSway = Math.sin(state.time + b.depth) * (b.depth * 0.5);
        
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.endX + naturalSway + windSway + hopeSway, b.endY);
        ctx.lineWidth = b.width;
        
        // Hope Mode: Cây phát sáng
        if (state.mode === 'hope') {
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#FFD700";
            ctx.strokeStyle = "#F1C40F"; // Thân cây chuyển vàng kim
        } else {
            ctx.strokeStyle = trunkColor;
            if (state.vitality > 40) {
                ctx.shadowBlur = (state.vitality - 40) * 0.2 * breath;
                ctx.shadowColor = trunkColor;
            } else {
                ctx.shadowBlur = 0;
            }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // 4. MASCOT (ANGER MODE) - Vẽ phù thủy bay
      if (state.mode === 'anger' && state.mascotX > -100) {
          // Move Mascot
          state.mascotX -= 8; // Bay từ phải sang trái
          const mx = state.mascotX;
          const my = state.mascotY + Math.sin(state.time * 10) * 20; // Nhấp nhô

          // Vẽ chổi
          ctx.strokeStyle = "#8B4513";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(mx + 40, my + 10); ctx.lineTo(mx - 40, my - 10);
          ctx.stroke();
          
          // Vẽ người (đơn giản hóa pixel)
          ctx.fillStyle = "#000";
          ctx.beginPath(); ctx.arc(mx, my - 15, 10, 0, Math.PI*2); ctx.fill(); // Đầu
          ctx.fillStyle = "red"; // Mắt đỏ
          ctx.fillRect(mx - 4, my - 18, 2, 2);
          ctx.fillStyle = "#333";
          ctx.fillRect(mx - 10, my - 5, 20, 20); // Áo

          // Rải "Đốm sáng đỏ" (Particles)
          if (state.textPointIndex < state.textPoints.length) {
             // Mỗi frame rải ra vài chục hạt để kịp tạo chữ
             const pointsPerFrame = 20;
             for (let k = 0; k < pointsPerFrame; k++) {
                 if (state.textPointIndex >= state.textPoints.length) break;
                 const target = state.textPoints[state.textPointIndex];
                 
                 state.particles.push({
                     x: mx, y: my,
                     vx: 0, vy: 0,
                     targetX: target.x, targetY: target.y,
                     life: 1000, // sống lâu để hiện chữ
                     color: '#E74C3C',
                     size: 3,
                     behavior: 'target'
                 });
                 state.textPointIndex++;
             }
          }
      }

      // 5. PROJECTILES
      for (let i = state.projectiles.length - 1; i >= 0; i--) {
          const p = state.projectiles[i];
          p.progress += p.speed;
          
          let currX, currY;
          
          if (p.type === 'rocket') {
              // Bay thẳng lên trời (cho Anger và Hope)
              currX = p.x;
              currY = p.y - p.progress * (p.y + 100); // Bay quá màn hình
              
              // Trail lửa
              ctx.fillStyle = `rgba(255, 100, 0, ${1-p.progress})`;
              ctx.beginPath(); ctx.arc(currX, currY + 10, 5 + Math.random()*5, 0, Math.PI*2); ctx.fill();
          } else {
             // Bay cong vào cây (Normal / Joy)
              const cx = (p.x + p.targetX) / 2 + Math.sin(state.time * 5) * 50; 
              const cy = Math.min(p.y, p.targetY) - 100;
              const t = p.progress;
              const invT = 1 - t;
              currX = invT * invT * p.x + 2 * invT * t * cx + t * t * p.targetX;
              currY = invT * invT * p.y + 2 * invT * t * cy + t * t * p.targetY;
          }

          // Vẽ thư/đốm sáng
          if (state.mode === 'anger' || state.mode === 'hope') {
               // Vẽ hình lá thư
               ctx.fillStyle = "#FFF";
               ctx.fillRect(currX - 10, currY - 8, 20, 16);
               ctx.strokeStyle = p.color;
               ctx.strokeRect(currX - 10, currY - 8, 20, 16);
               ctx.beginPath(); ctx.moveTo(currX-10, currY-8); ctx.lineTo(currX, currY); ctx.lineTo(currX+10, currY-8); ctx.stroke();
          } else {
               // Đốm sáng thường
               ctx.fillStyle = p.color;
               ctx.shadowBlur = 15; ctx.shadowColor = p.color;
               ctx.beginPath(); ctx.arc(currX, currY, 4, 0, Math.PI * 2); ctx.fill();
               ctx.shadowBlur = 0;
          }

          // Logic khi kết thúc hành trình
          if (p.progress >= 1) {
              state.projectiles.splice(i, 1);
              
              if (state.mode === 'anger') {
                  // Nổ ra thư -> Trigger Mascot
                  state.mascotX = state.width + 50;
                  state.mascotY = state.height * 0.2; // Bay trên cao
                  // Thêm hiệu ứng xé toạc (nổ nhỏ)
                  for(let k=0; k<20; k++) {
                      state.particles.push({
                          x: currX, y: currY,
                          vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
                          life: 50, color: '#FFF', size: 2, behavior: 'explode'
                      });
                  }
              } else if (state.mode === 'hope') {
                  // Biến thành ngôi sao
                  state.hopeStar = { x: currX, y: currY, size: 5, alpha: 1 };
                  // Kích hoạt cây sáng
                  state.vitality = 100;
              } else {
                  // Nở hoa (Normal / Green)
                  state.blooms.push({
                      id: Date.now() + i,
                      x: p.targetX, y: p.targetY,
                      color: p.color,
                      size: 0, maxSize: Math.random() * 5 + 3,
                      phase: Math.random() * Math.PI,
                      vx: 0, vy: 0,
                      isFlyingOff: false,
                      gravity: 0.1
                  });
              }
          }
      }

      // 6. BLOOMS (HOA TRÊN CÂY)
      for (let i = state.blooms.length - 1; i >= 0; i--) {
        const b = state.blooms[i];

        // Green Mode Logic: Rụng hoa rơi xuống
        if (state.mode === 'happy' && !b.isFlyingOff) {
            b.isFlyingOff = true;
            b.vx = (Math.random() - 0.5) * 5; // Bắn ra xung quanh
            b.vy = -Math.random() * 5; // Bắn lên chút rồi rơi
        }
        
        // Wind or Happy Mode Fall
        if (state.windForce > 0 || b.isFlyingOff) {
            b.isFlyingOff = true;
            b.x += b.vx;
            b.y += b.vy;
            b.vy += b.gravity || 0.05; // Trọng lực
            b.vx *= 0.99; // Drag
            
            if (b.y > state.height) {
                state.blooms.splice(i, 1);
                continue;
            }
        } else {
            // Hoa dính trên cây
            if (b.size < b.maxSize) b.size += 0.1;
            const stickSway = Math.sin(state.time * 5) * state.windForce * 10;
            const bloomBreath = Math.sin(state.time * 3 + b.phase) * 0.3 + 0.8;
            ctx.fillStyle = b.color;
            const glow = (state.vitality > 50 || state.mode === 'hope') ? 20 : 8;
            ctx.shadowBlur = glow * bloomBreath;
            ctx.shadowColor = b.color;
            ctx.beginPath();
            ctx.arc(b.x + stickSway, b.y, b.size * bloomBreath, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
      }

      // 7. PARTICLES SYSTEM (TEXT & FIREWORKS)
      for (let i = state.particles.length - 1; i >= 0; i--) {
          const pt = state.particles[i];
          
          if (pt.behavior === 'target') {
              // Hạt bay về vị trí xếp chữ
              if (pt.targetX !== undefined && pt.targetY !== undefined) {
                  pt.x += (pt.targetX - pt.x) * 0.1;
                  pt.y += (pt.targetY - pt.y) * 0.1;
              }
              // Chớp nháy
              if (Math.random() > 0.9) pt.size = 4; else pt.size = 2;
              
              // Nổ pháo hoa nền nếu chữ đã hình thành hòm hòm
              if (i % 100 === 0 && Math.random() > 0.95) {
                   // Spawn firework
                   state.particles.push({
                       x: Math.random() * state.width, y: Math.random() * state.height/2,
                       vx: 0, vy: 0, life: 60, color: ['#F00', '#FF0', '#FFF'][Math.floor(Math.random()*3)],
                       size: 0, behavior: 'explode' // Lợi dụng explode để vẽ pháo hoa đơn giản
                   });
              }
          } else if (pt.behavior === 'explode') {
              pt.x += pt.vx;
              pt.y += pt.vy;
              pt.life--;
              pt.size *= 0.95;
          }

          ctx.fillStyle = pt.color;
          ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI*2); ctx.fill();

          if (pt.life <= 0 || pt.size < 0.1) state.particles.splice(i, 1);
      }

      // Logic giảm gió
      if (!isWindBlowing && state.windForce > 0) {
          state.windForce -= 0.01;
          if (state.windForce < 0) state.windForce = 0;
      }
      
      ctx.restore(); // Restore shake
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
    
    // Logic đếm cảm xúc cho Popup nhạc
    setEmotionTracker(prev => {
        const currentCount = (prev[mood.id] || 0) + 1;
        if (currentCount >= 3) {
            setDominantMood(mood);
            setTimeout(() => setShowMusicPrompt(true), 1500);
            return {};
        }
        return { ...prev, [mood.id]: currentCount };
    });

    // --- LOGIC PHÂN LOẠI HIỆU ỨNG ĐẶC BIỆT ---
    
    // 1. ANGER / GIẬN DỮ (Đỏ)
    if (mood.id === 'anger') {
        state.mode = 'anger';
        state.modeTimer = 60 * 20; // 20 seconds
        state.textPoints = generateTextPoints("FUCK THIS SHIT", state.width, state.height);
        state.textPointIndex = 0;
        
        // Bắn lá thư (Rocket type)
        state.projectiles.push({
            x: state.width / 2, y: state.height - 80,
            targetX: state.width/2, targetY: 0,
            color: mood.color, speed: 0.02, progress: 0, type: 'rocket'
        });
    }
    // 2. JOY / HY VỌNG (Vàng - dùng logic Joy trong code nhưng user gọi là Hope)
    else if (mood.id === 'joy') {
        state.mode = 'hope';
        state.modeTimer = 60 * 20; 
        
        // Bắn lá thư bay cao hóa sao
        state.projectiles.push({
            x: state.width / 2, y: state.height - 80,
            targetX: state.width/2, targetY: state.height * 0.15, // Dừng trên trời
            color: '#FFD700', speed: 0.015, progress: 0, type: 'rocket'
        });
    }
    // 3. HEAL / HẠNH PHÚC (Xanh lá - dùng logic Heal nhưng user gọi là Happy/Sảng khoái)
    else if (mood.id === 'heal') {
        state.mode = 'happy';
        state.modeTimer = 60 * 20;
        state.shakeIntensity = 20; // Rung cây
        
        // Tạo ngay rất nhiều đốm sáng trên cây
        const tips = state.branches.filter(b => b.depth > 4);
        tips.forEach(tip => {
            if(Math.random() > 0.7) {
                state.blooms.push({
                      id: Date.now() + Math.random(),
                      x: tip.endX + (Math.random()-0.5)*20, 
                      y: tip.endY + (Math.random()-0.5)*20,
                      color: '#2ECC71',
                      size: 0, maxSize: Math.random() * 4 + 2,
                      phase: Math.random() * Math.PI,
                      vx: 0, vy: 0, isFlyingOff: false, gravity: 0.05 + Math.random()*0.05
                });
            }
        });

        // Vẫn bắn 1 đốm sáng lên cho đẹp
        state.projectiles.push({
            x: state.width / 2, y: state.height - 80,
            targetX: state.width/2, targetY: state.height/2,
            color: mood.color, speed: 0.03, progress: 0, type: 'normal'
        });
    }
    // CÁC MÀU KHÁC (Bình thường)
    else {
        // Logic cũ
        const tips = state.branches.filter(b => b.depth > 6);
        let targetX = state.width / 2;
        let targetY = state.height / 2;
        if (tips.length > 0) {
            const targetBranch = tips[Math.floor(Math.random() * tips.length)];
            targetX = targetBranch.endX + (Math.random() - 0.5) * 20;
            targetY = targetBranch.endY + (Math.random() - 0.5) * 20;
        }
        state.projectiles.push({
            x: state.width / 2, y: state.height - 80, 
            targetX: targetX, targetY: targetY,
            color: mood.color, speed: 0.01 + Math.random() * 0.01, progress: 0, type: 'normal'
        });
        
        // Cập nhật màu thân cây dần dần
        const hexToRgb = (hex: string) => {
            const bigint = parseInt(hex.slice(1), 16);
            return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
        };
        const c = hexToRgb(mood.color);
        state.trunkR = state.trunkR * 0.95 + c.r * 0.05;
        state.trunkG = state.trunkG * 0.95 + c.g * 0.05;
        state.trunkB = state.trunkB * 0.95 + c.b * 0.05;
    }

    setInputValue('');
  }, []); 

  const triggerWind = () => {
      setIsWindBlowing(true);
      gameState.current.windForce = 2;
      gameState.current.mode = 'normal'; // Reset special effects
      gameState.current.particles = [];
      gameState.current.hopeStar = null;
      
      setEmotionTracker({}); 
      setTimeout(() => {
          setIsWindBlowing(false);
      }, 3000);
  };

  const handleSelectMood = (mood: typeof EMOTIONS[0]) => {
    setCurrentMoodId(mood.id);
    gameState.current.selectedMood = mood;
  };

  const getPromptMessage = () => {
      switch(dominantMood?.id) {
          case 'joy': return "Năng lượng của bạn đang rất tuyệt! Muốn 'quẩy' thêm một chút không?";
          case 'anger': return "Có quá nhiều lửa trong lòng? Hãy để âm nhạc giúp bạn giải tỏa.";
          default: return "Bạn có muốn nghe một bản nhạc không?";
      }
  };

  return (
    <div className="relative w-full h-screen bg-[#020202] overflow-hidden font-sans text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400&family=Playfair+Display:ital,wght@1,500&display=swap');
      `}</style>

      {/* POPUP NHẠC */}
      {showMusicPrompt && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in px-4">
            <div className="bg-[#151515] border border-white/10 p-8 rounded-3xl max-w-sm text-center shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Music size={24} className="text-white/70" />
                </div>
                <h3 className="text-xl font-serif text-white/90 mb-3">{getPromptMessage()}</h3>
                <div className="flex gap-4 justify-center mt-6">
                    <button onClick={() => { setShowMusicPrompt(false); setEmotionTracker({}); }} className="px-6 py-3 rounded-full text-white/40 hover:text-white text-xs uppercase font-bold">Không cần đâu</button>
                    <button onClick={() => onNavigate('audio', { mood: dominantMood?.id })} className="px-8 py-3 bg-white text-black rounded-full font-bold text-xs uppercase hover:scale-105 transition-transform">Nghe ngay</button>
                </div>
            </div>
        </div>
      )}

      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none" />

      {/* HEADER INFO */}
      <div className="absolute top-6 right-6 text-right z-10 select-none pointer-events-none">
        <div className="font-serif text-white/50 text-sm">Sức Sống</div>
        <div className="w-32 h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
          <div className="h-full transition-all duration-700 ease-out bg-[#4facfe]" style={{ width: `${vitalityUI}%` }}></div>
        </div>
      </div>

      <button onClick={triggerWind} className={`absolute top-6 left-6 p-3 rounded-full border border-white/10 backdrop-blur-md z-50 hover:bg-white/10 group ${isWindBlowing ? 'rotate-180 bg-white/20' : ''}`}>
        <Wind className="w-5 h-5 text-white/60 group-hover:text-white" />
      </button>

      {/* INTRO TEXT */}
      <div className={`absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none transition-opacity duration-1000 ${vitalityUI > 15 ? 'opacity-0' : 'opacity-70'}`}>
        <h1 className="font-serif text-3xl text-white/40 tracking-widest">CÂY TÂM TƯ</h1>
      </div>

      {/* CONTROLS */}
      <div className="absolute bottom-0 left-0 w-full pb-8 pt-20 px-4 flex flex-col items-center justify-end z-50 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none">
        <div className="w-full max-w-[500px] flex flex-col items-center gap-5 pointer-events-auto">
            {/* EMOTION PALETTE */}
            <div className="flex justify-center gap-3 p-2">
                {EMOTIONS.map((mood) => (
                    <button
                        key={mood.id}
                        onClick={() => handleSelectMood(mood)}
                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${currentMoodId === mood.id ? 'scale-125 border-white shadow-[0_0_10px_currentColor]' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-110'}`}
                        style={{ backgroundColor: mood.color }}
                        title={mood.label}
                    />
                ))}
            </div>

            {/* INPUT */}
            <div className="w-full relative flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-2 py-2 shadow-2xl transition-all focus-within:bg-white/10 focus-within:border-white/30">
                <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendToVoid()}
                    placeholder="Gửi tâm tư vào cây..."
                    className="flex-1 bg-transparent border-none text-white/90 font-serif text-lg px-4 focus:outline-none placeholder:text-white/30"
                />
                <button onClick={sendToVoid} disabled={isWindBlowing} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white/80 transition-all hover:text-white hover:scale-105 active:scale-95">
                  <Send size={20} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TechRoom;
