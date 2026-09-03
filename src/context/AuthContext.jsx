// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลผู้ใช้จาก Token เมื่อเปิดหน้าเว็บ/รีเฟรช
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        // แนบ Token เข้า Authorization Header ของ Axios ทันที
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
          // เรียกไปที่ /me (ตรงตาม Endpoint ใน server.js)
          const res = await API.get('/me');
          setUser(res.data);
        } catch (err) {
          console.error('Session expired or invalid token:', err);
          localStorage.removeItem('token');
          delete API.defaults.headers.common['Authorization'];
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // ฟังก์ชัน เข้าสู่ระบบ
  const login = (userData, token) => {
    localStorage.setItem('token', token);
    
    // ตั้งค่า Authorization Header ทันทีเพื่อให้ Request ถัดไปใช้อนุญาตสิทธิ์ได้เลย
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    setUser(userData);
  };

  // ฟังก์ชัน ออกจากระบบ
  const logout = () => {
    localStorage.removeItem('token');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);