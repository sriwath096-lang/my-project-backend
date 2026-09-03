import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../services/api';

export default function Register() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    try {
      await API.post('/register', data);
      toast.success('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 70px)',
      background: '#f8fafc',
      padding: '40px 20px',
      fontFamily: 'sans-serif',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: '#ffffff',
        padding: '60px 56px',
        borderRadius: '32px',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.1)',
        border: '1px solid #e2e8f0',
        width: '100%',
        maxWidth: '640px',
        boxSizing: 'border-box'
      }}>
        
        {/* ส่วนหัวแสดงโลโก้ใหญ่พิเศษและชื่อโครงงาน */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '120px',
            height: '120px',
            background: '#ffffff',
            border: '3px solid #bfdbfe',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 auto 20px auto',
            boxShadow: '0 10px 25px rgba(37, 99, 235, 0.15)',
            overflow: 'hidden'
          }}>
            <img 
              src="/images (4).jpg" 
              alt="โลโก้วิทยาลัย" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#2563eb', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '8px' }}>
            วิทยาลัยเทคโนโลยีอุดมศึกษาพณิชยการหาดใหญ่
          </div>
          
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0', lineHeight: '1.3' }}>
            ระบบจัดการคลังสินค้าของสหกรณ์
          </h1>
          
          <div style={{ width: '70px', height: '4px', background: '#2563eb', margin: '0 auto 14px auto', borderRadius: '2px' }}></div>

          <p style={{ color: '#64748b', fontSize: '15px', margin: 0, fontWeight: '500' }}>
            สมัครสมาชิกเพื่อเริ่มต้นใช้งานระบบ
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          
          {/* ชื่อจริง และ นามสกุล */}
          <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>ชื่อจริง</label>
              <input
                type="text"
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  border: errors.firstName ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                  borderRadius: '14px',
                  fontSize: '16px',
                  background: '#f8fafc',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                {...register('firstName', { required: 'กรุณากรอกชื่อ' })}
                placeholder="ชื่อ"
              />
              {errors.firstName && <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>{errors.firstName.message}</span>}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>นามสกุล</label>
              <input
                type="text"
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  border: errors.lastName ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                  borderRadius: '14px',
                  fontSize: '16px',
                  background: '#f8fafc',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                {...register('lastName', { required: 'กรุณากรอกนามสกุล' })}
                placeholder="นามสกุล"
              />
              {errors.lastName && <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>{errors.lastName.message}</span>}
            </div>
          </div>

          {/* อีเมล */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>อีเมลผู้ใช้งาน (Email)</label>
            <input
              type="email"
              style={{
                width: '100%',
                padding: '16px 18px',
                border: errors.email ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                borderRadius: '14px',
                fontSize: '16px',
                background: '#f8fafc',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              {...register('email', { 
                required: 'กรุณากรอกอีเมล',
                pattern: { value: /^\S+@\S+$/i, message: 'รูปแบบอีเมลไม่ถูกต้อง' }
              })}
              placeholder="name@example.com"
            />
            {errors.email && <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>{errors.email.message}</span>}
          </div>

          {/* รหัสผ่าน */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>รหัสผ่าน (Password)</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                style={{
                  width: '100%',
                  padding: '16px 50px 16px 18px',
                  border: errors.password ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                  borderRadius: '14px',
                  fontSize: '16px',
                  background: '#f8fafc',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                {...register('password', { required: 'กรุณากรอกรหัสผ่าน', minLength: { value: 6, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' } })}
                placeholder="••••••••"
              />
              <button
                type="button"
                style={{
                  position: 'absolute',
                  right: '16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>{errors.password.message}</span>}
          </div>

          {/* เบอร์โทรศัพท์ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>เบอร์โทรศัพท์ (Phone)</label>
            <input
              type="text"
              style={{
                width: '100%',
                padding: '16px 18px',
                border: errors.phone ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                borderRadius: '14px',
                fontSize: '16px',
                background: '#f8fafc',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              {...register('phone', { required: 'กรุณากรอกเบอร์โทรศัพท์' })}
              placeholder="08xxxxxxxx"
            />
            {errors.phone && <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>{errors.phone.message}</span>}
          </div>

          {/* ปุ่มสมัครสมาชิก */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              display: 'block',
              padding: '16px 20px',
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '14px',
              fontSize: '17px',
              fontWeight: '700',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 6px 18px rgba(15, 23, 42, 0.2)',
              marginTop: '8px',
              boxSizing: 'border-box',
              textAlign: 'center',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '15px', color: '#64748b' }}>
          มีบัญชีอยู่แล้วใช่ไหม? <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>เข้าสู่ระบบที่นี่</Link>
        </div>

      </div>
    </div>
  );
}