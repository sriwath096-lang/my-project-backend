// src/config.js
// อ่านค่า URL ของ Backend จาก Environment Variable (ตั้งค่าตอน deploy บน Vercel)
// ถ้าไม่มีค่า (เช่น ตอนรัน local) จะ fallback ไปที่ localhost:5000 แทน

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_URL = `${BASE_URL}/api`;
