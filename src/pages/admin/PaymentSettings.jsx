// src/pages/admin/PaymentSettings.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function PaymentSettings() {
  const [bankInfo, setBankInfo] = useState({
    bankName: 'กสิกรไทย (KBank)',
    accountName: 'บจก. อุดม ช้อป',
    accountNumber: '123-4-56789-0'
  });

  // โหลดข้อมูลเดิมที่มีการบันทึกไว้ (ถ้ามี)
  useEffect(() => {
    const saved = localStorage.getItem('paymentSettings');
    if (saved) {
      try {
        setBankInfo(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleChange = (e) => {
    setBankInfo({ ...bankInfo, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('paymentSettings', JSON.stringify(bankInfo));
    toast.success('บันทึกช่องทางการชำระเงินเรียบร้อยแล้ว!');
  };

  return (
    <div style={{ maxWidth: '650px', margin: '40px auto', padding: '30px', background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#0f172a' }}>
        ⚙️ ตั้งค่าช่องทางการชำระเงิน
      </h2>
      <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '24px' }}>
        ข้อมูลบัญชีธนาคารนี้จะแสดงให้ลูกค้าเห็นที่หน้าชำระเงินในตะกร้าสินค้า
      </p>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1e293b', fontSize: '14px' }}>
            ชื่อธนาคาร / พร้อมเพย์
          </label>
          <input
            type="text"
            name="bankName"
            value={bankInfo.bankName}
            onChange={handleChange}
            placeholder="เช่น กสิกรไทย (KBank) หรือ พร้อมเพย์"
            style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', background: '#f8fafc' }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1e293b', fontSize: '14px' }}>
            ชื่อบัญชี
          </label>
          <input
            type="text"
            name="accountName"
            value={bankInfo.accountName}
            onChange={handleChange}
            placeholder="เช่น บจก. อุดม ช้อป หรือ นายสมชาย ใจดี"
            style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', background: '#f8fafc' }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1e293b', fontSize: '14px' }}>
            เลขที่บัญชี / เบอร์พร้อมเพย์
          </label>
          <input
            type="text"
            name="accountNumber"
            value={bankInfo.accountNumber}
            onChange={handleChange}
            placeholder="เช่น 123-4-56789-0"
            style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', background: '#f8fafc' }}
            required
          />
        </div>

        <button
          type="submit"
          style={{
            marginTop: '10px',
            padding: '14px',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
            transition: 'background 0.2s'
          }}
        >
          บันทึกการตั้งค่า
        </button>
      </form>
    </div>
  );
}