// src/views/RoomView.tsx
import React from 'react';
import { RoomType } from '../types';
import { ArrowLeft } from 'lucide-react';

// Import các phòng
import IdentityRoom from '../rooms/IdentityRoom'; // Kiểm tra lại đường dẫn import thực tế của bạn
import CafeRoom from './rooms/CafeRoom';
import AudioRoom from './rooms/AudioRoom';
import TechRoom from './rooms/TechRoom';
import PrismRoom from './rooms/PrismRoom';

interface RoomViewProps {
  room: RoomType;
  onBack: () => void;
  isExiting: boolean;
  // Props điều hướng và dữ liệu
  onNavigate: (room: RoomType, params?: any) => void;
  roomParams?: any;
}

const RoomView: React.FC<RoomViewProps> = ({ 
  room, 
  onBack, 
  isExiting,
  onNavigate,
  roomParams
}) => {
  
  // Logic: AudioRoom đã có header và nút thoát riêng, nên ta sẽ ẩn nút Back mặc định của RoomView
  const showGlobalBackButton = room !== RoomType.AUDIO;

  const renderRoomContent = () => {
    switch (room) {
      case RoomType.IDENTITY: 
        return <IdentityRoom />; // Nếu IdentityRoom cần thoát, bạn có thể truyền onExit={onBack}
        
      case RoomType.CAFE: 
        return <CafeRoom />;
        
      case RoomType.AUDIO: 
        return (
          <AudioRoom 
            // 1. Nhận mood từ TechRoom (nếu có)
            initialMood={roomParams?.mood} 
            // 2. QUAN TRỌNG: Truyền hàm onBack vào để nút X trong AudioRoom hoạt động
            onExit={onBack} 
          />
        );
        
      case RoomType.TECH: 
        return (
          <TechRoom 
            // Mapping string 'audio' từ TechRoom sang Enum RoomType.AUDIO
            onNavigate={(targetRoom: string, params: any) => {
               const target = targetRoom === 'audio' ? RoomType.AUDIO : RoomType.TECH;
               onNavigate(target, params);
            }} 
          />
        );
        
      case RoomType.PRISM: 
        return <PrismRoom />;
        
      default: 
        return (
            <div className="flex flex-col items-center justify-center h-full text-white">
                <h2 className="text-xl font-bold mb-4">404 - Room Not Found</h2>
                <button onClick={onBack} className="px-4 py-2 bg-white/10 rounded-full hover:bg-white/20">Go Back</button>
            </div>
        );
    }
  };

  return (
    <div 
      className={`
        fixed inset-0 z-20 bg-slate-950 
        ${isExiting ? 'animate-fade-away' : 'animate-zoom-in'}
      `}
    >
      {/* Background Effect cho RoomView */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950/80 to-slate-950 -z-10"></div>

      {/* Navigation Controls (Global Back Button) */}
      {/* Chỉ hiện khi KHÔNG PHẢI AudioRoom và KHÔNG ĐANG THOÁT */}
      {showGlobalBackButton && (
          <div className={`absolute top-6 left-6 z-50 flex gap-4 transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
            <button 
              onClick={onBack}
              className="group flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-white/10 rounded-full text-slate-300 hover:text-white hover:bg-indigo-900/40 hover:border-indigo-500/50 transition-all duration-300 backdrop-blur-md shadow-lg"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-mono uppercase tracking-wider">Return to Void</span>
            </button>
          </div>
      )}

      {/* Main Room Content */}
      <div className="h-full w-full overflow-hidden relative">
        {renderRoomContent()}
      </div>
    </div>
  );
};

export default RoomView;
