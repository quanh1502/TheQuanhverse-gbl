
import React, { useState } from 'react';
import Background from './components/Background';
import TheVoid from './views/TheVoid';
import RoomView from './views/RoomView';
import { RoomType } from './types';
import { DataProvider } from './contexts/DataContext';
import SyncBoard from './components/SyncBoard';

const App: React.FC = () => {
  // REFACTOR 3: Mặc định vào thẳng AudioRoom để dev và trải nghiệm ngay
  const [currentRoom, setCurrentRoom] = useState<RoomType>(RoomType.AUDIO);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [roomParams, setRoomParams] = useState<any>(null);

  const handleEnterRoom = (room: RoomType, params?: any) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setRoomParams(params || null);
    
    setTimeout(() => {
      setCurrentRoom(room);
      setIsTransitioning(false);
    }, 800);
  };
  
  const handleBackToVoid = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setRoomParams(null);
    
    setTimeout(() => {
      setCurrentRoom(RoomType.VOID);
      setIsTransitioning(false);
    }, 600);
  };

  return (
    <DataProvider>
      <div className="relative w-full h-screen overflow-hidden text-slate-200 select-none font-sans">
        <Background />
        <main className="relative w-full h-full">
          {currentRoom === RoomType.VOID ? (
            <TheVoid onEnterRoom={handleEnterRoom} isExiting={isTransitioning} />
          ) : (
            <RoomView 
              room={currentRoom} 
              onBack={handleBackToVoid} 
              isExiting={isTransitioning}
              roomParams={roomParams}
              onNavigate={handleEnterRoom}
            />
          )}
        </main>
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.4)_100%)] z-40"></div>
      </div>
      <SyncBoard />
    </DataProvider>
  );
};
/* --- Dán vào cuối file index.css hoặc App.css --- */

/* 1. Hiệu ứng trôi lơ lửng (cho Quả cầu) */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.animate-float-delayed {
  animation: float 6s ease-in-out infinite;
}

/* 2. Hiệu ứng hiện hình từ hư vô (cho Đĩa nhạc) */
@keyframes appearFromVoid {
  0% { 
    opacity: 0; 
    transform: scale(0.9) translateY(20px) filter(blur(10px)); 
  }
  100% { 
    opacity: 1; 
    transform: scale(1) translateY(0) filter(blur(0)); 
  }
}

.animate-appear-from-void {
  animation: appearFromVoid 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* 3. Hiệu ứng Fade In cơ bản (cho nền tối) */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

/* 4. Hiệu ứng xoay chậm (nếu cần dùng lại) */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin-slow {
  animation: spin 8s linear infinite;
}

export default App;
