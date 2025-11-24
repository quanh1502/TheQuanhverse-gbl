// Import các hàm cần thiết
import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore"; // Chỉ cần cái này để config mạng

const firebaseConfig = {
  apiKey: "AIzaSyAMPQSZ68sk8RTuCZKRphNjNuAG-1rio8o",
  authDomain: "thequanhverse-17e10.firebaseapp.com",
  projectId: "thequanhverse-17e10",
  storageBucket: "thequanhverse-17e10.firebasestorage.app",
  messagingSenderId: "350865127672",
  appId: "1:350865127672:web:3e5f5ccf7adfd6bd57630d",
};

// Khởi tạo Firebase App
const app = initializeApp(firebaseConfig);

// --- PHẦN QUAN TRỌNG NHẤT ĐỂ SỬA LỖI MẠNG ---
// Thay vì dùng getFirestore(app) mặc định, ta dùng cấu hình này:
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Ép buộc dùng giao thức HTTP thường, mạng nào cũng qua được
});
