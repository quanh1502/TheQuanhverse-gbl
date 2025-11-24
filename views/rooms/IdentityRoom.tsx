import React from 'react';
import { User, Calendar, Brain, Shield } from 'lucide-react';

const IdentityRoom: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full perspective-container">
        
        {/* Card 1: The Archtype (ISTJ) */}
        <div className="bg-slate-900/40 border border-green-800/50 p-8 rounded-xl backdrop-blur-sm hover:rotate-y-6 hover:scale-105 transition-transform duration-500 preserve-3d group relative overflow-hidden">
           {/* Logic Grid Background */}
           <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
           
          <div className="flex items-center justify-between mb-4 relative z-10">
             <h2 className="text-3xl font-bold text-emerald-400 tracking-tighter">ISTJ</h2>
             <Shield className="text-emerald-500" size={32} />
          </div>
          <p className="text-slate-400 mb-6 text-sm relative z-10">The Logistician</p>
          <div className="space-y-4 relative z-10">
             <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[85%] animate-pulse"></div>
             </div>
             <div className="flex justify-between text-xs text-emerald-200/70 uppercase tracking-widest">
                <span>Logic</span>
                <span>Order</span>
                <span>Duty</span>
             </div>
             <p className="text-slate-300 text-sm leading-relaxed mt-4">
                Thế giới này cần cấu trúc. Mọi thứ đều là những mảnh ghép hỗn độn cần được sắp xếp vào đúng vị trí của nó. Tôi quan sát, phân tích và thực thi.
             </p>
          </div>
        </div>

        {/* Card 2: The Origin (Taurus) */}
        <div className="bg-slate-900/40 border border-amber-800/50 p-8 rounded-xl backdrop-blur-sm hover:rotate-y-6 hover:scale-105 transition-transform duration-500 preserve-3d delay-100 group relative overflow-hidden">
          
          {/* Grounding / Earth Visual Effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
             {/* Heavy bottom gradient (Gravity) */}
             <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-amber-950/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>
             
             {/* Floating Earth Debris / Geometric Stones */}
             <div className="absolute bottom-8 left-8 w-12 h-12 border border-amber-700/30 bg-amber-900/10 backdrop-blur-md rotate-12 animate-float rounded-lg" style={{ animationDuration: '6s' }}></div>
             <div className="absolute bottom-20 right-12 w-8 h-8 border border-amber-600/30 bg-amber-800/10 backdrop-blur-md -rotate-6 animate-float rounded-md" style={{ animationDuration: '8s', animationDelay: '1s' }}></div>
             <div className="absolute -bottom-4 left-1/2 w-24 h-24 bg-amber-600/5 blur-2xl rounded-full"></div>
             
             {/* Connecting 'Roots' Lines */}
             <div className="absolute bottom-0 w-full h-32 opacity-10 flex justify-around items-end">
                <div className="w-px h-20 bg-amber-500/50"></div>
                <div className="w-px h-12 bg-amber-500/50"></div>
                <div className="w-px h-24 bg-amber-500/50"></div>
                <div className="w-px h-16 bg-amber-500/50"></div>
             </div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-3xl font-bold text-amber-400 serif">Taurus</h2>
               <User className="text-amber-500" size={32} />
            </div>
            <p className="text-slate-400 mb-6 text-sm">04 . 05 . 2005</p>
            
            <div className="relative h-32 flex items-center justify-center border border-amber-900/30 rounded-lg bg-black/20 group-hover:border-amber-700/50 transition-colors duration-500">
               <div className="absolute inset-0 flex items-center justify-center opacity-20 text-6xl font-serif text-amber-600 select-none transform group-hover:scale-110 transition-transform duration-700">♉</div>
               <p className="text-center text-sm text-amber-100/80 italic relative z-10 px-4">
                 "Vững chãi như đất, kiên định và trân trọng những giá trị thực tế."
               </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {['Reliable', 'Patient', 'Practical', 'Devoted'].map((trait, i) => (
                 <span 
                    key={trait} 
                    className="px-3 py-1 rounded-full border border-amber-700/50 text-xs text-amber-300 bg-amber-900/10 group-hover:bg-amber-900/30 transition-colors duration-300"
                    style={{ transitionDelay: `${i * 100}ms` }}
                 >
                    {trait}
                 </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default IdentityRoom;