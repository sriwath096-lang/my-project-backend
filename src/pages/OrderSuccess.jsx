// src/pages/OrderSuccess.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';

export default function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // 1. เช็กว่ามีข้อมูลส่งผ่านมาทาง state หรือไม่ (ป้องกัน Error 404 ตอนเปลี่ยนหน้าทันที)
  const [orderDetails, setOrderDetails] = useState(location.state?.orderData || null);
  const [loading, setLoading] = useState(!location.state?.orderData);

  useEffect(() => {
    // 2. ถ้าไม่มีข้อมูลผ่าน state (เช่น กด F5 รีเฟรชหน้าเว็บ) ค่อยยิง API ไปดึงข้อมูลมา
    if (!orderDetails) {
      const fetchOrder = async () => {
        try {
          const res = await API.get(`/orders/${id}`);
          setOrderDetails(res.data);
        } catch (err) {
          console.error('Fetch order detail failed', err);
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [id, orderDetails]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>กำลังโหลดข้อมูลคำสั่งซื้อ...</div>;
  }

  if (!orderDetails) {
    return <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>ไม่พบข้อมูลคำสั่งซื้อ</div>;
  }

  const { order, items } = orderDetails;

  return (
    <div style={{ maxWidth: '650px', margin: '40px auto', padding: '30px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', textAlign: 'center' }}>
        <div style={{ fontSize: '56px', color: '#16a34a', marginBottom: '12px' }}>🪙</div>
        <h2 style={{ fontSize: '24px', color: '#0f172a', margin: '0 0 8px 0', fontWeight: '700' }}>สั่งซื้อสินค้าสำเร็จ!</h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 24px 0' }}>หมายเลขคำสั่งซื้อ: <strong>#{order.id}</strong></p>

        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', textAlign: 'left', marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>รายการสินค้า</h4>
          {items && items.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>{item.name}</span>
                <span style={{ color: '#64748b', fontSize: '13px', marginLeft: '8px' }}>x{item.quantity}</span>
              </div>
              <span style={{ fontWeight: '600', color: '#0f172a' }}>฿{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', color: '#1e293b' }}>ยอดรวมสุทธิ</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#16a34a' }}>฿{Number(order.total_price || order.total || 0).toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          style={{ padding: '12px 28px', background: '#2563eb', color: '#fff', fontSize: '15px', fontWeight: '600', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
        >
          กลับไปหน้าหลัก
        </button>
      </div>
    </div>
  );
}