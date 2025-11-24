import React, { useState } from 'react';
import Background from './components/Background';
import TheVoid from './views/TheVoid';
import RoomView from './views/RoomView';
import { RoomType } from './types';
import { DataProvider } from './contexts/DataContext';
import SyncBoard from './components/SyncBoard';
const App: React.FC = () => {
  const [currentRoom, setCurrentRoom] = useState<RoomType>(RoomType.VOID);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const handleEnterRoom = (room: RoomType) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    // Wait for the "fly-through" animation to complete before switching components
    setTimeout(() => {
      setCurrentRoom(room);
      setIsTransitioning(false);
    }, 800); // 800ms matches the CSS animation duration
  };
  

  const handleBackToVoid = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    // Wait for the "fade-away" animation to complete
    setTimeout(() => {
      setCurrentRoom(RoomType.VOID);
      setIsTransitioning(false);
    }, 600);
  };

  return (
    <DataProvider>
      <div className="relative w-full h-screen overflow-hidden text-slate-200 select-none">
        {/* Global Background Effect */}
        <Background />

        {/* Main Content Switcher */}
        <main className="relative w-full h-full">
          {currentRoom === RoomType.VOID ? (
            <TheVoid 
              onEnterRoom={handleEnterRoom} 
              isExiting={isTransitioning} 
            />
          ) : (
            <RoomView 
              room={currentRoom} 
              onBack={handleBackToVoid} 
              isExiting={isTransitioning}
            />
          )}
        </main>

        {/* Vignette Effect for Atmosphere */}
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.4)_100%)] z-40"></div>
      </div>
      <SyncBoard />
    </DataProvider>

  
  );
};

export default App;

