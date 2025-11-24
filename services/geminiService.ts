import { GoogleGenAI } from "@google/genai";
import { RoomType } from '../types';

// --- PHẦN QUAN TRỌNG NHẤT: CƠ CHẾ CHỐNG SẬP ---
// 1. Dùng (import.meta as any) để tránh lỗi gạch đỏ của TypeScript
// 2. Dùng || "" để đảm bảo nếu không có key thì nó là chuỗi rỗng chứ không phải undefined (gây sập)
const rawApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
const apiKey = rawApiKey ? rawApiKey : "KEY_GIA_DE_WEB_KHONG_SAP";

// Khởi tạo AI (Dù key giả hay thật cũng khởi tạo được, không bị lỗi đen màn hình)
const ai = new GoogleGenAI({ apiKey: apiKey });

export const getRoomAtmosphere = async (room: RoomType): Promise<string> => {
  // Nếu đang dùng key giả thì trả về câu mặc định luôn, không gọi Google (đỡ lỗi)
  if (apiKey === "KEY_GIA_DE_WEB_KHONG_SAP") {
      console.warn("Đang dùng Key giả. Hãy kiểm tra lại file .env.local");
      return "Hệ thống chưa kết nối được với tâm trí (Thiếu API Key)...";
  }

  const model = 'gemini-1.5-flash';
  const persona = "Bạn là linh hồn của Mind Palace. Hãy nói ngắn gọn, triết lý 2 câu.";
  let prompt = `${persona} Nói về phòng: ${room}`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    // Lấy text an toàn
    return response.text || "Không gian im lặng..."; 
  } catch (error) {
    console.error("Lỗi kết nối Gemini:", error);
    return "Tín hiệu bị gián đoạn...";
  }
};

// --- HÀM YOUTUBE (GIỮ NGUYÊN KHÔNG ĐỔI) ---
export const analyzeYoutubeMetadata = async (url: string) => {
  try {
    const response = await fetch(`https://noembed.com/embed?url=${url}`);
    const data = await response.json();
    if (data.error || !data.title) return null;
    
    // Xử lý đơn giản để trả về kết quả nhanh
    return {
        title: data.title,
        artist: data.author_name,
        year: new Date().getFullYear().toString()
    };
  } catch (error) {
    return null;
  }
};
