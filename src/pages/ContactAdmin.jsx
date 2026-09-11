// src/pages/ContactAdmin.jsx
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import API from '../services/api';

export default function ContactAdmin() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await API.get('/support/messages');
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // เช็คข้อความใหม่ทุก 5 วินาที เผื่อแอดมินตอบกลับมา
    const interval = setInterval(() => fetchMessages(true), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await API.post('/support/messages', { message: newMessage.trim() });
      setNewMessage('');
      await fetchMessages(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'ส่งข้อความไม่สำเร็จ');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '30px auto', padding: '0 16px', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '75vh' }}>

        {/* หัวข้อ */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0', background: '#0b3d63' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>💬 ติดต่อแอดมิน</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#bfdbfe' }}>มีปัญหาการใช้งาน? พิมพ์ข้อความหาแอดมินได้ที่นี่</p>
        </div>

        {/* กล่องข้อความ */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#94a3b8' }}>กำลังโหลด...</p>
          ) : messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>
              ยังไม่มีข้อความ พิมพ์ข้อความแรกเพื่อเริ่มสนทนากับแอดมินได้เลย
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender_role === 'admin' ? 'flex-start' : 'flex-end',
                  maxWidth: '75%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{
                  background: m.sender_role === 'admin' ? '#e0f2fe' : '#0b3d63',
                  color: m.sender_role === 'admin' ? '#0f172a' : '#ffffff',
                  padding: '10px 16px',
                  borderRadius: m.sender_role === 'admin' ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  wordBreak: 'break-word'
                }}>
                  {m.message}
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8', alignSelf: m.sender_role === 'admin' ? 'flex-start' : 'flex-end' }}>
                  {m.sender_role === 'admin' ? 'แอดมิน' : 'คุณ'} · {new Date(m.created_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                </span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ช่องพิมพ์ */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', padding: '14px 16px', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="พิมพ์ข้อความ..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '999px',
              border: '1.5px solid #cbd5e1',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            style={{
              padding: '12px 22px',
              borderRadius: '999px',
              border: 'none',
              background: (sending || !newMessage.trim()) ? '#94a3b8' : '#0b3d63',
              color: '#ffffff',
              fontWeight: '600',
              fontSize: '14px',
              cursor: (sending || !newMessage.trim()) ? 'not-allowed' : 'pointer'
            }}
          >
            {sending ? '...' : 'ส่ง'}
          </button>
        </form>
      </div>
    </div>
  );
}
