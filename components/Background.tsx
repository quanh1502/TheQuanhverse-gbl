import React, { useEffect, useRef } from 'react';

const Background: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // --- CẤU HÌNH 1: PARTICLES (HẠT BỤI VŨ TRỤ) ---
    const particles: { x: number; y: number; size: number; speedX: number; speedY: number; opacity: number }[] = [];
    const particleCount = 60; // Giảm số lượng để đỡ rối, tập trung vào ánh sáng

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5, // Hạt nhỏ mịn hơn
        speedX: (Math.random() - 0.5) * 0.15, // Bay chậm hơn -> Chill hơn
        speedY: (Math.random() - 0.5) * 0.15,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    // --- CẤU HÌNH 2: AMBIENT BLOBS (CÁC ĐỐM SÁNG MÀU) ---
    // Đây là chìa khóa để xóa bỏ sự "U Tối"
    const blobs = [
      { x: width * 0.2, y: height * 0.2, r: 400, color: 'rgba(88, 28, 135, 0.4)', vx: 0.2, vy: 0.2 }, // Tím (Purple)
      { x: width * 0.8, y: height * 0.8, r: 500, color: 'rgba(12, 74, 110, 0.3)', vx: -0.3, vy: -0.2 }, // Xanh đậm (Sky)
      { x: width * 0.5, y: height * 0.5, r: 300, color: 'rgba(190, 18, 60, 0.15)', vx: 0.1, vy: -0.1 }, // Hồng nhẹ (Rose) - Điểm nhấn
    ];

    const animate = () => {
      // 1. Xóa nền cũ
      ctx.clearRect(0, 0, width, height);

      // 2. Vẽ nền tảng tối (Deep Base) nhưng không đen kịt
      // Dùng Gradient dọc để tạo chiều sâu cho trang web
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#020617'); // Slate 950 (Trên cùng)
      bgGradient.addColorStop(1, '#0f172a'); // Slate 900 (Dưới cùng - sáng hơn xíu)
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // 3. Vẽ các Blobs (Đốm sáng) di chuyển
      blobs.forEach(blob => {
        blob.x += blob.vx;
        blob.y += blob.vy;

        // Đập tường nảy lại (để đốm sáng không bay mất)
        if (blob.x < -100 || blob.x > width + 100) blob.vx *= -1;
        if (blob.y < -100 || blob.y > height + 100) blob.vy *= -1;

        // Vẽ hiệu ứng Glow mềm mại
        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Vẽ Grid (Lưới) - Làm mờ đi để tinh tế hơn
      const time = Date.now() * 0.0003; // Chậm lại
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.03)'; // Sky Blue cực mờ (Tinh tế hơn màu cũ)
      ctx.lineWidth = 1;
      const gridSize = 120; // Ô lưới to hơn cho thoáng mắt

      // Grid dọc
      for (let x = (time * 15) % gridSize; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Grid ngang
      for (let y = (time * 15) % gridSize; y < height; y += gridSize) {
         ctx.beginPath();
         ctx.moveTo(0, y);
         ctx.lineTo(width, y);
         ctx.stroke();
      }

      // 5. Vẽ Particles (Hạt bụi)
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`; // Đổi sang màu trắng để nổi trên nền màu
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 6. [NEW] Noise Layer giả lập (Vẽ các hạt li ti ngẫu nhiên cực nhanh)
      // Tạo cảm giác "Film Grain" điện ảnh, bớt cảm giác nhựa
      for (let i = 0; i < 20; i++) { // Vẽ ít thôi để ko lag
         const nx = Math.random() * width;
         const ny = Math.random() * height;
         ctx.fillStyle = 'rgba(255,255,255,0.05)';
         ctx.fillRect(nx, ny, 1, 1);
      }

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};

export default Background;
