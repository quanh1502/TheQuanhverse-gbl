import React from 'react';
import { Cpu, Wifi, BatteryCharging } from 'lucide-react';

const TechRoom: React.FC = () => {
  return (
    <div className="h-full w-full flex items-center justify-center relative overflow-hidden">
       {/* Grid Background specialized for Tech */}
       <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"></div>

       <div className="relative z-10 flex flex-col items-center w-full max-w-4xl">
          
          {/* Glitch Title */}
          <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 mb-12 tracking-tighter relative">
             <span className="absolute top-0 left-0 -ml-1 opacity-50 text-red-500 animate-pulse">TECH</span>
             TECH
             <span className="absolute top-0 left-0 ml-1 opacity-50 text-blue-500 animate-pulse">TECH</span>
          </h1>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 px-6">
              
              {/* Item 1 */}
              <div className="group relative bg-slate-900/80 border border-emerald-500/30 p-6 rounded-lg overflow-hidden hover:border-emerald-400 transition-colors">
                 <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                 <div className="flex items-start justify-between">
                    <div>
                       <h3 className="text-emerald-400 font-mono text-xl mb-2">GADGETS_COLLECTION</h3>
                       <p className="text-slate-400 text-sm">Khám phá những món đồ chơi công nghệ mới nhất.</p>
                    </div>
                    <Cpu className="text-emerald-600 group-hover:text-emerald-400 transition-colors" size={32} />
                 </div>
                 <div className="mt-4 flex gap-2">
                    <span className="text-[10px] border border-emerald-900 text-emerald-700 px-2 py-1 rounded font-mono">v.2.0.5</span>
                    <span className="text-[10px] border border-emerald-900 text-emerald-700 px-2 py-1 rounded font-mono">SMART</span>
                 </div>
              </div>

              {/* Item 2 */}
               <div className="group relative bg-slate-900/80 border border-blue-500/30 p-6 rounded-lg overflow-hidden hover:border-blue-400 transition-colors">
                 <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                 <div className="flex items-start justify-between">
                    <div>
                       <h3 className="text-blue-400 font-mono text-xl mb-2">CONNECTIVITY</h3>
                       <p className="text-slate-400 text-sm">Luôn kết nối. Luôn cập nhật. Thế giới số là nhà.</p>
                    </div>
                    <Wifi className="text-blue-600 group-hover:text-blue-400 transition-colors" size={32} />
                 </div>
                 <div className="mt-4 flex gap-2">
                    <span className="text-[10px] border border-blue-900 text-blue-700 px-2 py-1 rounded font-mono">ONLINE</span>
                    <span className="text-[10px] border border-blue-900 text-blue-700 px-2 py-1 rounded font-mono">5G</span>
                 </div>
              </div>
          </div>

          <div className="mt-12 flex items-center gap-4 text-slate-500 font-mono text-xs">
             <BatteryCharging size={16} className="animate-pulse text-green-500" />
             <span>SYSTEM STATUS: OPTIMAL</span>
             <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
          </div>

       </div>
    </div>
  );
};

export default TechRoom;