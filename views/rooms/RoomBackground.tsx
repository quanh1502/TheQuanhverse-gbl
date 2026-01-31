import React from "react";

const RoomBackground: React.FC = () => {
  return (
    // [THAY ĐỔI]: Đã đổi màu nền sang mã màu xám từ ảnh bạn cung cấp (#1F1F2E)
    <div className="fixed inset-0 w-full h-full pointer-events-none -z-50 overflow-hidden bg-[#1F1F2E]">
      {/* --- LỚP 1: AMBIENT LIGHTING (ÁNH SÁNG MÔI TRƯỜNG) --- */}
      {/* Top Spotlight: Giữ lại hiệu ứng ánh sáng từ trần rọi xuống để tạo chiều sâu */}
      <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] bg-white/5 blur-[120px] rounded-full mix-blend-soft-light" />

      {/* --- LỚP 2: NOISE TEXTURE (HẠT NHIỄU) --- */}
      {/* Giữ lại lớp nhiễu hạt mờ để tạo chất liệu "thật" cho nền */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          filter: "contrast(120%) brightness(100%)",
        }}
      />

      {/* --- LỚP 3: VIGNETTE (TỐI 4 GÓC) --- */}
      {/* Hiệu ứng tối góc nhẹ để tập trung sự chú ý vào trung tâm */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
};

export default RoomBackground;
