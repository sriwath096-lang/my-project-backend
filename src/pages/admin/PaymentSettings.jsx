// src/pages/admin/PaymentSettings.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API from '../../services/api';
import { BASE_URL } from '../../config';

export default function PaymentSettings() {
  const [bankInfo, setBankInfo] = useState({
    bank_name: '',
    account_name: '',
    account_number: ''
  });
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [qrImageFile, setQrImageFile] = useState(null);
  const [qrPreview, setQrPreview] = useState('');
  const [slipImageUrl, setSlipImageUrl] = useState('');
  const [slipImageFile, setSlipImageFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // โหลดข้อมูลปัจจุบันจากฐานข้อมูลตอนเปิดหน้า
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await API.get('/payment-settings');
        setBankInfo({
          bank_name: res.data.bank_name || '',
          account_name: res.data.account_name || '',
          account_number: res.data.account_number || ''
        });
        setQrImageUrl(res.data.qr_image_url || '');
        setSlipImageUrl(res.data.slip_image_url || '');
      } catch (err) {
        console.error(err);
        toast.error('ไม่สามารถโหลดข้อมูลการชำระเงินได้');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setBankInfo({ ...bankInfo, [e.target.name]: e.target.value });
  };

  const handleQrFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQrImageFile(file);
      setQrPreview(URL.createObjectURL(file));
    }
  };

  const handleSlipFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSlipImageFile(file);
      setSlipPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('bank_name', bankInfo.bank_name);
      formData.append('account_name', bankInfo.account_name);
      formData.append('account_number', bankInfo.account_number);
      formData.append('existing_qr_image_url', qrImageUrl);
      formData.append('existing_slip_image_url', slipImageUrl);
      if (qrImageFile) {
        formData.append('qr_image', qrImageFile);
      }
      if (slipImageFile) {
        formData.append('shop_slip_image', slipImageFile);
      }

      const res = await API.put('/payment-settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setQrImageUrl(res.data.qr_image_url || '');
      setQrImageFile(null);
      setQrPreview('');
      setSlipImageUrl(res.data.slip_image_url || '');
      setSlipImageFile(null);
      setSlipPreview('');
      toast.success('บันทึกช่องทางการชำระเงินเรียบร้อยแล้ว!');
    } catch (err) {
      console.error(err);
      toast.error('บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '650px', margin: '40px auto', padding: '30px', textAlign: 'center', color: '#64748b' }}>
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '650px', margin: '40px auto', padding: '30px', background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#0f172a' }}>
        ⚙️ ตั้งค่าช่องทางการชำระเงิน
      </h2>
      <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '24px' }}>
        ข้อมูลบัญชีธนาคารและ QR โค้ดนี้จะแสดงให้ลูกค้าทุกคนเห็นที่หน้าชำระเงินในตะกร้าสินค้า
      </p>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1e293b', fontSize: '14px' }}>
            ชื่อธนาคาร / พร้อมเพย์
          </label>
          <input
            type="text"
            name="bank_name"
            value={bankInfo.bank_name}
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
            name="account_name"
            value={bankInfo.account_name}
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
            name="account_number"
            value={bankInfo.account_number}
            onChange={handleChange}
            placeholder="เช่น 123-4-56789-0"
            style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', background: '#f8fafc' }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1e293b', fontSize: '14px' }}>
            รูป QR Code สำหรับโอนเงิน
          </label>

          {(qrPreview || qrImageUrl) && (
            <img
              src={qrPreview || getImageUrl(qrImageUrl)}
              alt="QR Code ตัวอย่าง"
              style={{ width: '180px', height: '180px', objectFit: 'contain', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', marginBottom: '10px', display: 'block' }}
            />
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleQrFileChange}
            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#f8fafc' }}
          />
          <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '6px' }}>
            อัปโหลดรูปใหม่เพื่อแทนที่ QR เดิม (ถ้าไม่อัปโหลด จะใช้รูปเดิมต่อไป)
          </p>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1e293b', fontSize: '14px' }}>
            รูปสลิปของทางร้าน (แสดงที่หน้าชำระเงิน)
          </label>

          {(slipPreview || slipImageUrl) && (
            <img
              src={slipPreview || getImageUrl(slipImageUrl)}
              alt="รูปสลิปของร้าน ตัวอย่าง"
              style={{ width: '180px', height: '180px', objectFit: 'contain', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', marginBottom: '10px', display: 'block' }}
            />
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleSlipFileChange}
            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#f8fafc' }}
          />
          <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '6px' }}>
            รูปนี้จะไปแสดงคู่กับข้อมูลบัญชีที่หน้าชำระเงินของลูกค้าด้วย
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            marginTop: '10px',
            padding: '14px',
            background: saving ? '#94a3b8' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
            transition: 'background 0.2s'
          }}
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </form>
    </div>
  );
}
