import React, { useState } from 'react';

const PrismRoom: React.FC = () => {
  const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);

  return (
    <div className="h-full w-full flex items-center justify-center relative overflow-hidden">
      
      {/* Split Background */}
      <div className={`absolute inset-0 flex transition-all duration-1000 ${hoverSide === 'left' ? 'w-full' : hoverSide === 'right' ? 'w-0' : 'w-1/2'} bg-indigo-950/40 overflow-hidden border-r border-white/10`}>
         <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/introvert/1000/1000')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
      </div>
      <div className={`absolute right-0 top-0 h-full flex transition-all duration-1000 ${hoverSide === 'right' ? 'w-full' : hoverSide === 'left' ? 'w-0' : 'w-1/2'} bg-rose-950/40 overflow-hidden`}>
         <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/extrovert/1000/1000')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row w-full max-w-5xl h-3/4 gap-8 p-4">
         
         {/* Introvert Side */}
         <div 
            className="flex-1 flex flex-col justify-center items-center p-8 rounded-2xl border border-indigo-500/20 cursor-pointer hover:bg-indigo-900/30 transition-all duration-500 backdrop-blur-sm"
            onMouseEnter={() => setHoverSide('left')}
            onMouseLeave={() => setHoverSide(null)}
         >
            <h2 className={`text-4xl md:text-5xl font-bold text-indigo-200 mb-4 transition-transform duration-500 ${hoverSide === 'left' ? 'scale-110' : 'scale-100'}`}>Introvert?</h2>
            <p className={`text-indigo-300/70 text-center max-w-xs transition-opacity duration-500 ${hoverSide === 'left' ? 'opacity-100' : 'opacity-0'}`}>
               Sự tĩnh lặng. Suy ngẫm. Nạp năng lượng từ bên trong. Một mình không có nghĩa là cô đơn.
            </p>
         </div>

         {/* The Prism / Ambivert Center */}
         <div className="w-2 md:w-px bg-gradient-to-b from-transparent via-white/50 to-transparent self-center h-full hidden md:block"></div>

         {/* Extrovert Side */}
         <div 
            className="flex-1 flex flex-col justify-center items-center p-8 rounded-2xl border border-rose-500/20 cursor-pointer hover:bg-rose-900/30 transition-all duration-500 backdrop-blur-sm"
            onMouseEnter={() => setHoverSide('right')}
            onMouseLeave={() => setHoverSide(null)}
         >
            <h2 className={`text-4xl md:text-5xl font-bold text-rose-200 mb-4 transition-transform duration-500 ${hoverSide === 'right' ? 'scale-110' : 'scale-100'}`}>Extrovert?</h2>
             <p className={`text-rose-300/70 text-center max-w-xs transition-opacity duration-500 ${hoverSide === 'right' ? 'opacity-100' : 'opacity-0'}`}>
               Sự kết nối. Năng lượng từ đám đông. Chia sẻ và lan tỏa. Thế giới bên ngoài đầy màu sắc.
            </p>
         </div>

      </div>

      <div className="absolute bottom-10 text-center">
         <p className="text-white/50 text-sm uppercase tracking-[0.2em]">Chưa xác định • Ambivert</p>
      </div>

    </div>
  );
};

export default PrismRoom;