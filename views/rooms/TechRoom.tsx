import React, { useEffect, useRef, useState } from 'react';

// --- CONFIG & TYPES ---
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  type: string;
  life: number;
}

interface TreeElement {
  x: number;
  y: number;
  color: string;
  size: number;
  maxSize: number;
  type: 'bloom' | 'fall';
  vx?: number;
  vy?: number;
  rot?: number;
}

interface Message {
  text: string;
  x: number;
  y: number;
  alpha: number;
  life: number;
}

const config = {
  maxDepth: 10,
  trunkWidth: 16,
  branchAngle: Math.PI / 4.5,
  lengthRatio: 0.75,
  widthRatio: 0.7
};

const TechRoom: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const [inputValue, setInputValue] = useState('');
  
  // State UI
  const [vitality, setVitality] = useState(20);
  const [selectedMood, setSelectedMood] = useState({ color: "#FFD700", type: "good" });

  // Animation State (dùng Ref để không gây re-render liên tục)
  const animState = useRef({
    vitality: 20,
    time: 0,
    colorR: 60,
    colorG: 60,
    colorB: 60,
    targetR: 60,
    targetG: 60,
    targetB: 60,
    width: 0,
    height: 0,
    trunkLength: 150
  });

  const objects = useRef({
    particles: [] as Particle[],
    elements: [] as TreeElement[],
    messages: [] as Message[]
  });

  // --- INIT & RESIZE ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      animState.current.width = window.innerWidth;
      animState.current.height = window.innerHeight;
      animState.current.trunkLength = window.innerHeight * 0.18;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Start Loop
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // --- LOGIC: FEED TREE ---
  const feedTree = () => {
    const text = inputValue.trim();
    const state = animState.current;

    // 1. Update Vitality & Colors logic inside Ref
    if (selectedMood.type === 'good') {
      state.vitality = Math.min(100, state.vitality + 10);
      state.targetR = 100; state.targetG = 90; state.targetB = 50;
    } else {
      state.vitality = Math.min(100, state.vitality + 5);
      state.targetR = 50; state.targetG = 40; state.targetB = 60;
    }
    
    // Sync with React State for UI Bar
    setVitality(state.vitality);

    // 2. Spawn Particles
    for(let i=0; i<15; i++) {
      objects.current.particles.push({
        x: state.width / 2 + (Math.random() - 0.5) * 100,
        y: state.height + 20,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 6 - 4,
        color: selectedMood.color,
        type: selectedMood.type,
        life: 80 + Math.random() * 40
      });
    }

    // 3. Spawn Message
    if(text) {
      objects.current.messages.push({
        text: text,
        x: state.width/2,
        y: state.height - 100,
        alpha: 1,
        life: 200
      });
      setInputValue("");
    }
  };

  // --- ANIMATION LOOP ---
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = animState.current;
    const { width, height } = state;
    const { particles, elements, messages } = objects.current;

    state.time++;

    // Entropy (Giảm sức sống theo thời gian)
    if (state.time % 100 === 0 && state.vitality > 10) {
      state.vitality -= 0.5;
      setVitality(state.vitality); // Sync UI
    }

    // Background
    const bgVal = 5 + (state.vitality * 0.15);
    ctx.fillStyle = `rgb(${bgVal}, ${bgVal}, ${bgVal + 5})`;
    ctx.fillRect(0, 0, width, height);

    // --- DRAW TREE (Recursive) ---
    const drawBranch = (x: number, y: number, len: number, angle: number, wid: number, depth: number) => {
      const sway = Math.sin(state.time * 0.002 + depth * 0.5) * 0.05 * (depth * 0.5);
      const finalAngle = angle + sway;
      const endX = x + len * Math.cos(finalAngle);
      const endY = y + len * Math.sin(finalAngle);

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(endX, endY);
      ctx.lineWidth = wid;
      ctx.lineCap = "round";

      // Color Lerp
      state.colorR += (state.targetR - state.colorR) * 0.01;
      state.colorG += (state.targetG - state.colorG) * 0.01;
      state.colorB += (state.targetB - state.colorB) * 0.01;

      const darkening = depth * 15;
      const r = Math.max(0, state.colorR - darkening * 0.5 + state.vitality);
      const g = Math.max(0, state.colorG - darkening * 0.5 + state.vitality * 0.8);
      const b = Math.max(0, state.colorB - darkening * 0.5 + state.vitality * 0.5);

      ctx.strokeStyle = `rgb(${r},${g},${b})`;

      if(state.vitality > 60) {
        ctx.shadowBlur = (state.vitality - 60) * 0.5;
        ctx.shadowColor = `rgba(${r},${g},${b},0.5)`;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;

      if (len < 10 || depth >= config.maxDepth) {
         // Vẽ hoa ở ngọn (visual trick)
         if (state.vitality > 30) {
            const size = (state.vitality / 100) * 4;
            ctx.fillStyle = `rgba(${state.targetR + 100}, ${state.targetG + 50}, ${state.targetB + 100}, 0.6)`;
            ctx.beginPath();
            ctx.arc(endX, endY, size, 0, Math.PI*2);
            ctx.fill();
        }
        return;
      }

      drawBranch(endX, endY, len * config.lengthRatio, finalAngle - config.branchAngle, wid * config.widthRatio, depth + 1);
      drawBranch(endX, endY, len * config.lengthRatio, finalAngle + config.branchAngle, wid * config.widthRatio, depth + 1);
    };

    // Draw Trunk
    drawBranch(width / 2, height, state.trunkLength, -Math.PI / 2, config.trunkWidth, 0);

    // --- DRAW PARTICLES ---
    for (let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.life--;
      p.x += Math.sin(state.time * 0.1 + i) * 1;

      ctx.fillStyle = p.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * (p.life / 100), 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (p.life <= 0 || (p.y < height * 0.6 && Math.random() > 0.9)) {
        if (p.type === 'good') {
          elements.push({ x: p.x, y: p.y, color: p.color, size: 0, maxSize: Math.random()*5+2, type: 'bloom' });
        } else {
          elements.push({ x: p.x, y: p.y, color: p.color, size: 4, maxSize: 4, type: 'fall', vx: (Math.random()-0.5)*2, vy: Math.random()*1 + 0.5, rot: Math.random() * Math.PI });
        }
        particles.splice(i, 1);
      }
    }

    // --- DRAW ELEMENTS ---
    for (let i = elements.length - 1; i >= 0; i--) {
      let e = elements[i];
      if (e.type === 'bloom') {
        if(e.size < e.maxSize) e.size += 0.1;
        e.y -= 0.2;
        e.x += Math.sin(state.time * 0.05 + i) * 0.2;
        if(elements.length > 100 && Math.random() > 0.95) elements.splice(i, 1);
        
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (e.type === 'fall') {
        e.x += (e.vx || 0) + Math.sin(state.time * 0.05) * 1;
        e.y += (e.vy || 0);
        e.rot = (e.rot || 0) + 0.05;
        
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.rot);
        ctx.fillStyle = e.color;
        ctx.fillRect(-e.size/2, -e.size/2, e.size, e.size);
        ctx.restore();

        if(e.y > height) elements.splice(i, 1);
      }
    }

    // --- DRAW MESSAGES ---
    ctx.font = "italic 14px 'Playfair Display', serif";
    ctx.textAlign = "center";
    for (let i = messages.length - 1; i >= 0; i--) {
      let m = messages[i];
      m.y -= 1.5;
      m.alpha -= 0.005;
      m.life--;
      ctx.fillStyle = `rgba(255, 255, 255, ${m.alpha})`;
      ctx.fillText(m.text, m.x, m.y);
      if (m.life <= 0 || m.alpha <= 0) messages.splice(i, 1);
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  // --- JSX RENDER ---
  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden font-sans text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400&family=Playfair+Display:ital,wght@1,500&display=swap');
      `}</style>

      {/* VITALITY METER */}
      <div className="absolute top-8 right-8 text-right z-10 font-serif text-sm drop-shadow-md">
        <div>Hơi thở của cây</div>
        <div className="w-36 h-1.5 bg-white/10 mt-2 rounded-full overflow-hidden shadow-lg">
          <div 
            className="h-full transition-all duration-500 ease-out shadow-[0_0_15px_currentColor]"
            style={{ 
              width: `${vitality}%`,
              background: vitality > 80 ? 'linear-gradient(90deg, #FDB931, #fff)' : 
                          vitality > 40 ? 'linear-gradient(90deg, #4facfe, #00f2fe)' : 
                          'linear-gradient(90deg, #555, #888)'
            }}
          ></div>
        </div>
      </div>

      {/* INTRO TEXT */}
      <div className={`absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none transition-opacity duration-1000 ${vitality > 25 ? 'opacity-0' : 'opacity-100'}`}>
        <h1 className="font-serif text-3xl text-white/30 drop-shadow-xl">Cây đang lắng nghe</h1>
        <p className="text-sm mt-2 font-light opacity-70">Chọn cảm xúc và gửi vào lòng đất</p>
      </div>

      {/* CANVAS */}
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />

      {/* UI CONTROLS */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-[550px] flex flex-col items-center gap-4">
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Bạn đang cảm thấy thế nào?"
          className="w-full max-w-[400px] bg-black/30 border-none border-b border-white/30 text-gray-200 font-serif text-lg text-center p-4 outline-none rounded-t-lg focus:border-[#4facfe] focus:bg-black/60 transition-all placeholder:text-gray-500"
        />

        <div className="bg-[#0f0f14]/85 backdrop-blur-xl px-8 py-5 rounded-[50px] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.9)] flex items-center gap-5 hover:scale-105 transition-transform duration-300">
          
          {/* GOOD ENERGY */}
          <div className="flex gap-3 items-center">
            {[
              { color: "#FFD700", type: "good", label: "Niềm Vui" },
              { color: "#00ff88", type: "good", label: "Hy Vọng" },
              { color: "#00f2fe", type: "good", label: "Bình Yên" }
            ].map((mood) => (
              <button
                key={mood.label}
                onClick={() => setSelectedMood({ color: mood.color, type: mood.type })}
                className={`w-10 h-10 rounded-full border-2 transition-all duration-300 relative group shadow-lg ${selectedMood.label === mood.label ? 'scale-125 border-white shadow-[0_0_20px_currentColor]' : 'border-transparent hover:scale-115'}`}
                style={{ backgroundColor: mood.color, color: mood.color }}
              >
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-serif pointer-events-none">{mood.label}</span>
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-white/20"></div>

          {/* HEAVY ENERGY */}
          <div className="flex gap-3 items-center">
             {[
              { color: "#aaa", bg: "#555", type: "heavy", label: "Trống Rỗng" },
              { color: "#6a11cb", bg: "#6a11cb", type: "heavy", label: "Nỗi Buồn" },
              { color: "#ff416c", bg: "#ff416c", type: "heavy", label: "Tức Giận" }
            ].map((mood) => (
              <button
                key={mood.label}
                onClick={() => setSelectedMood({ color: mood.color, type: mood.type })}
                className={`w-10 h-10 rounded-full border-2 transition-all duration-300 relative group shadow-lg ${selectedMood.label === mood.label ? 'scale-125 border-white shadow-[0_0_20px_currentColor]' : 'border-transparent hover:scale-115'}`}
                style={{ backgroundColor: mood.bg, color: mood.color }}
              >
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-serif pointer-events-none">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={feedTree}
          className="mt-2 bg-gradient-to-br from-white/10 to-white/5 text-white/80 border border-white/20 px-8 py-2.5 rounded-full text-xs tracking-[3px] uppercase font-bold transition-all hover:text-white hover:bg-white/20 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 active:translate-y-0"
        >
          Gửi Vào Cây
        </button>
      </div>
    </div>
  );
};

export default TechRoom;
