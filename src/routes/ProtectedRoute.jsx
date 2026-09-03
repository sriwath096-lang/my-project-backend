// src/routes/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  // กำลังดึงข้อมูล Token ตอนกด F5 ให้แสดง Loading ชั่วคราว
  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>กำลังตรวจสอบสิทธิ์...</div>;
  }

  // ถ้ายังไม่ได้ Login ให้เด้งไปหน้า Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ถ้ามีการกำหนดสิทธิ์ (เช่น admin) แล้วสิทธิ์ไม่ตรง ให้เด้งกลับหน้าหลัก
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}