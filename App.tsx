import React, { useState } from "react";
import Background from "./components/Background";
import TheVoid from "./views/TheVoid";
import RoomView from "./views/RoomView";
import { RoomType } from "./types";
import { DataProvider } from "./contexts/DataContext";
import SyncBoard from "./components/SyncBoard";

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
      {/* BACKGROUND MỚI: Cyber Punk Gradient */}
      <div className="relative w-full h-screen overflow-hidden text-slate-200 select-none font-space bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black">
        {/* Tạm ẩn Background cũ để hiện màu nền mới */}
        {/* <Background /> */}

        <main className="relative w-full h-full z-10">
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
              roomParams={roomParams}
              onNavigate={handleEnterRoom}
            />
          )}
        </main>

        {/* Lớp phủ mờ (Vignette) */}
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.4)_100%)] z-40"></div>
      </div>
      <SyncBoard />
    </DataProvider>
  );
};

export default App;
