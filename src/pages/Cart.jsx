// src/pages/Cart.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import API from '../services/api';
import { BASE_URL } from '../config';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart, totalPrice, getItemKey } = useCart();
  const navigate = useNavigate();

  // State สำหรับเก็บไฟล์สลิปและรูปตัวอย่าง
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);

  // State สำหรับควบคุมการเปิด/ปิด Popup คำเตือน 3 เดือน
  const [showWarningModal, setShowWarningModal] = useState(false);

  // State สำหรับเก็บข้อมูลบัญชีธนาคารที่ตั้งค่าจากฝั่ง Admin
  const [paymentInfo, setPaymentInfo] = useState({
    bankName: '',
    accountName: '',
    accountNumber: ''
  });
  const [qrImageUrl, setQrImageUrl] = useState('');

  // โหลดข้อมูลบัญชีธนาคาร + QR จาก Backend (เห็นเหมือนกันทุกคนทุกเครื่อง)
  useEffect(() => {
    const fetchPaymentInfo = async () => {
      try {
        const res = await API.get('/payment-settings');
        setPaymentInfo({
          bankName: res.data.bank_name || '',
          accountName: res.data.account_name || '',
          accountNumber: res.data.account_number || ''
        });
        setQrImageUrl(res.data.qr_image_url || '');
      } catch (e) {
        console.error(e);
      }
    };
    fetchPaymentInfo();
  }, []);

  // ฟังก์ชันช่วยจัดการ URL ของรูปภาพ
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/80?text=No+Image';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  // จัดการเมื่อเลือกไฟล์รูปสลิป
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSlipFile(file);
      setSlipPreview(URL.createObjectURL(file));
    }
  };

  // ฟังก์ชันยืนยันการลบสินค้า
  const handleRemoveItem = (itemKey, itemName, itemSize) => {
    const displayName = itemSize ? `${itemName} (ไซส์ ${itemSize})` : itemName;
    const isConfirmed = window.confirm(`คุณต้องการลบ "${displayName}" ออกจากตะกร้าใช่หรือไม่?`);
    if (isConfirmed) {
      removeFromCart(itemKey);
      toast.success('ลบสินค้าออกจากตะกร้าแล้ว');
    }
  };

  // ฟังก์ชันล้างตะกร้าทั้งหมด
  const handleClearCartClick = () => {
    if (cart.length === 0) return;
    const isConfirmed = window.confirm('คุณต้องการล้างสินค้าทั้งหมดในตะกร้าใช่หรือไม่?');
    if (isConfirmed) {
      clearCart();
      toast.success('ล้างตะกร้าเรียบร้อยแล้ว');
    }
  };

  // ฟังก์ชันส่งคำสั่งซื้อ
  const executeCheckout = async () => {
    try {
      const formData = new FormData();
      formData.append('items', JSON.stringify(cart));
      formData.append('total_price', totalPrice);
      formData.append('slip_image', slipFile);

      const res = await API.post('/orders', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('สั่งซื้อสินค้าและแนบสลิปสำเร็จ!');
      
      const orderDataResult = res.data.orderData || {
        order: { id: res.data.orderId || res.data.id, total_price: totalPrice },
        items: cart
      };

      clearCart();

      navigate(`/order-success/${res.data.orderId || res.data.id}`, {
        state: { orderData: orderDataResult }
      });

    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ');
    }
  };

  // ฟังก์ชันกดปุ่มชำระเงิน
  const handleCheckoutClick = () => {
    if (cart.length === 0) return;

    if (!slipFile) {
      toast.error('กรุณาแนบหลักฐานการโอนเงิน (สลิป) ก่อนยืนยันการสั่งซื้อ');
      return;
    }

    setShowWarningModal(true);
  };

  // ตะกร้าว่างเปล่า
  if (cart.length === 0) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '60px auto',
        padding: '40px 20px',
        textAlign: 'center',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</div>
        <h2 style={{ fontSize: '24px', color: '#1e293b', margin: '0 0 8px 0', fontWeight: '700' }}>
          ตะกร้าสินค้าของคุณว่างเปล่า
        </h2>
        <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 24px 0' }}>
          ยังไม่มีสินค้าในตะกร้า เริ่มต้นเลือกซื้อสินค้าที่คุณชื่นชอบได้เลย!
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 28px',
            background: '#2563eb',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
          }}
        >
          กลับไปเลือกซื้อสินค้า
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', color: '#0f172a', margin: 0, fontWeight: '700' }}>
          ตะกร้าสินค้า ({cart.reduce((sum, item) => sum + item.quantity, 0)} ชิ้น)
        </h2>
        <button
          onClick={handleClearCartClick}
          style={{
            background: 'transparent',
            color: '#ef4444',
            border: '1px solid #fee2e2',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          ล้างตะกร้า
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {/* รายการสินค้าในตะกร้า */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          border: '1px solid #f1f5f9',
          overflow: 'hidden'
        }}>
          {cart.map((item, index) => {
            const itemKey = item.cartKey || (getItemKey ? getItemKey(item) : `${item.id}_${item.selectedSize || 'nosize'}`);

            return (
              <div
                key={itemKey}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px',
                  borderBottom: index !== cart.length - 1 ? '1px solid #f1f5f9' : 'none',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                {/* ข้อมูลสินค้า */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 250px' }}>
                  <img
                    src={getImageUrl(item.image_url)}
                    alt={item.name}
                    style={{
                      width: '70px',
                      height: '70px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      border: '1px solid #f1f5f9',
                      background: '#f8fafc'
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/80?text=No+Image';
                    }}
                  />
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '16px', fontWeight: '600' }}>
                      {item.name}
                      {item.selectedSize && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                          ไซส์ {item.selectedSize}
                        </span>
                      )}
                    </h4>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                      ฿{Number(item.price).toLocaleString()} / ชิ้น
                    </p>
                  </div>
                </div>

                {/* ปุ่มเพิ่ม/ลด จำนวน */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  padding: '4px',
                  border: '1px solid #e2e8f0'
                }}>
                  <button
                    onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                    style={{
                      width: '32px',
                      height: '32px',
                      border: 'none',
                      background: '#ffffff',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      color: '#334155',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    -
                  </button>
                  <span style={{ width: '40px', textAlign: 'center', fontWeight: '600', color: '#0f172a' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                    style={{
                      width: '32px',
                      height: '32px',
                      border: 'none',
                      background: '#ffffff',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      color: '#334155',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    +
                  </button>
                </div>

                {/* ราคารวมของชิ้นนั้น และปุ่มลบ */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'flex-end', flex: '0 0 auto' }}>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#16a34a', minWidth: '90px', textAlign: 'right' }}>
                    ฿{(item.price * item.quantity).toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleRemoveItem(itemKey, item.name, item.selectedSize)}
                    style={{
                      background: '#fef2f2',
                      color: '#ef4444',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}
                  >
                    ลบ
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* สรุปรายการคำสั่งซื้อ และ อัปโหลดสลิป */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px dashed #f1f5f9', paddingBottom: '20px' }}>
            <span style={{ fontSize: '18px', color: '#475569', fontWeight: '500' }}>ยอดรวมทั้งหมดที่ต้องชำระ</span>
            <span style={{ fontSize: '32px', color: '#16a34a', fontWeight: '800' }}>
              ฿{totalPrice.toLocaleString()}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '30px' }}>
            {/* กล่องข้อมูลบัญชีธนาคาร */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '16px' }}>🏦 บัญชีสำหรับโอนเงิน</h4>
              <p style={{ margin: '6px 0', color: '#475569', fontSize: '15px' }}>ธนาคาร/ช่องทาง: <strong>{paymentInfo.bankName}</strong></p>
              <p style={{ margin: '6px 0', color: '#475569', fontSize: '15px' }}>ชื่อบัญชี: <strong>{paymentInfo.accountName}</strong></p>
              <p style={{ margin: '12px 0 0 0', fontSize: '22px', fontWeight: 'bold', color: '#2563eb', letterSpacing: '1px' }}>
                {paymentInfo.accountNumber}
              </p>

              {qrImageUrl && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <img
                    src={getImageUrl(qrImageUrl)}
                    alt="QR Code สำหรับโอนเงิน"
                    style={{ width: '160px', height: '160px', objectFit: 'contain', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff' }}
                  />
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b' }}>สแกน QR เพื่อโอนเงิน</p>
                </div>
              )}
            </div>

            {/* กล่องอัปโหลดสลิป */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
              <label style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>
                แนบหลักฐานการโอนเงิน (สลิป) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                style={{ 
                  padding: '10px', 
                  border: '1px dashed #cbd5e1', 
                  borderRadius: '8px',
                  background: '#f8fafc',
                  cursor: 'pointer'
                }}
              />
              {slipPreview && (
                <div style={{ marginTop: '8px', textAlign: 'center' }}>
                  <img 
                    src={slipPreview} 
                    alt="Slip Preview" 
                    style={{ maxHeight: '150px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} 
                  />
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                flex: '1',
                padding: '14px',
                background: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              เลือกซื้อสินค้าเพิ่ม
            </button>
            <button
              onClick={handleCheckoutClick}
              style={{
                flex: '2',
                minWidth: '200px',
                padding: '14px',
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(22,163,74,0.25)'
              }}
            >
              ยืนยันการชำระเงินและสั่งซื้อ
            </button>
          </div>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarningModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            textAlign: 'center',
            fontFamily: 'sans-serif'
          }}>
            <div style={{ fontSize: '50px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '20px', fontWeight: '700' }}>
              คำเตือนสำคัญ
            </h3>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '15px', lineHeight: '1.6' }}>
              หากไม่มีการมารับของภายใน <strong style={{ color: '#ef4444' }}>3 เดือน</strong> ทางเราจะตัดสิทธิ์และจะไม่มีการคืนเงินทุกกรณี
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowWarningModal(false)}
                style={{
                  flex: '1',
                  padding: '12px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  executeCheckout();
                }}
                style={{
                  flex: '1',
                  padding: '12px',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(22,163,74,0.2)'
                }}
              >
                ยืนยันการสั่งซื้อ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
