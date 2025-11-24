import React from 'react';
import { RoomType } from '../types';
import { ArrowLeft } from 'lucide-react';
import IdentityRoom from './rooms/IdentityRoom';
import CafeRoom from './rooms/CafeRoom';
import AudioRoom from './rooms/AudioRoom';
import TechRoom from './rooms/TechRoom';
import PrismRoom from './rooms/PrismRoom';

interface RoomViewProps {
  room: RoomType;
  onBack: () => void;
  isExiting: boolean;
}

const RoomView: React.FC<RoomViewProps> = ({ room, onBack, isExiting }) => {
  
  const renderRoomContent = () => {
    switch (room) {
      case RoomType.IDENTITY: return <IdentityRoom />;
      case RoomType.CAFE: return <CafeRoom />;
      case RoomType.AUDIO: return <AudioRoom />;
      case RoomType.TECH: return <TechRoom />;
      case RoomType.PRISM: return <PrismRoom />;
      default: return <div className="text-white">Room Not Found</div>;
    }
  };

  return (
    <div 
      className={`
        fixed inset-0 z-20 bg-slate-950 
        ${isExiting ? 'animate-fade-away' : 'animate-zoom-in'}
      `}
    >
      {/* Darker background for room focus */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950/80 to-slate-950 -z-10"></div>

      {/* Navigation Controls - Hide during exit for cleaner transition */}
      <div className={`absolute top-6 left-6 z-30 flex gap-4 transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-white/10 rounded-full text-slate-300 hover:text-white hover:bg-indigo-900/40 hover:border-indigo-500/50 transition-all duration-300 backdrop-blur-md"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-mono uppercase tracking-wider">Return to Void</span>
        </button>
      </div>

      <div className="h-full w-full overflow-hidden relative">
        {renderRoomContent()}
      </div>
    </div>
  );
};

export default RoomView;