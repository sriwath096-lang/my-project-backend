// AppRouter.jsx
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Import หน้าต่าง ๆ
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import Cart from './pages/Cart';
import OrderSuccess from './pages/OrderSuccess'; // <-- 1. Import เข้ามาที่นี่

export default function AppRouter() {
  return (
    <Routes>
      {/* หน้าทั่วไป */}
      <Route path="/" element={<ProductList />} />
      <Route path="/cart" element={<Cart />} />
      
      {/* หน้าที่ต้องล็อกอิน */}
      <Route element={<ProtectedRoute />}>
        {/* ... Route อื่นๆ เช่น profile ... */}
        
        {/* 2. เพิ่ม Route สำหรับ Order Success ตรงนี้ */}
        <Route path="/order-success/:id" element={<OrderSuccess />} />
      </Route>
    </Routes>
  );
}