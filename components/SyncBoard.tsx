// src/components/SyncBoard.tsx
import { useEffect, useState } from 'react';
import { db } from '../services/firebase'; // Import kết nối bạn vừa tạo
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

// Định nghĩa kiểu dữ liệu cho Ghi chú
interface Note {
  id: string;
  content: string;
  createdAt: any;
}

export default function SyncBoard() {
  const [notes, setNotes] = useState<Note[]>([]); // Chứa danh sách ghi chú
  const [input, setInput] = useState(''); // Chứa nội dung đang nhập
  const [loading, setLoading] = useState(true);

  // 1. CƠ CHẾ LẮNG NGHE (REAL-TIME LISTENER)
  useEffect(() => {
    // Tạo câu lệnh: Lấy collection "mind-notes", sắp xếp mới nhất lên đầu
    const q = query(collection(db, "mind-notes"), orderBy("createdAt", "desc"));

    // onSnapshot: Giữ kết nối mở liên tục. 
    // Khi Database thay đổi (ở bất kỳ máy nào), hàm này sẽ tự động chạy lại.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];
      
      setNotes(liveData);
      setLoading(false);
    });

    // Dọn dẹp kết nối khi tắt component
    return () => unsubscribe();
  }, []);

  // 2. HÀM GỬI DỮ LIỆU LÊN MÂY
  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      await addDoc(collection(db, "mind-notes"), {
        content: input,
        createdAt: serverTimestamp() // Dùng giờ của Server Google để đồng bộ
      });
      setInput(''); // Xóa ô nhập sau khi gửi
    } catch (error) {
      console.error("Lỗi gửi dữ liệu:", error);
      alert("Không gửi được! Kiểm tra lại console.");
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', color: 'black' }}>
      <h2 className="text-xl font-bold mb-4 text-white">Mind Palace - Đồng bộ thời gian thực</h2>
      
      {/* Ô nhập liệu */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập suy nghĩ của bạn..."
          style={{ flex: 1, padding: '10px', borderRadius: '5px' }}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button 
          onClick={handleSend}
          style={{ padding: '10px 20px', background: '#007bff', color: 'white', borderRadius: '5px' }}
        >
          Gửi
        </button>
      </div>

      {/* Danh sách hiển thị */}
      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '10px', minHeight: '200px' }}>
        {loading ? <p>Đang tải dữ liệu...</p> : null}
        
        {notes.map((note) => (
          <div key={note.id} style={{ 
            background: 'white', 
            padding: '10px', 
            marginBottom: '8px', 
            borderRadius: '5px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {note.content}
          </div>
        ))}
        
        {!loading && notes.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888' }}>Chưa có ghi chú nào. Hãy nhập thử!</p>
        )}
      </div>
    </div>
  );
}
