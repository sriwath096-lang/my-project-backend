// src/pages/AdminSupport.jsx
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import API from '../services/api';

export default function AdminSupport() {
  const [threads, setThreads] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchThreads = async (silent = false) => {
    if (!silent) setLoadingThreads(true);
    try {
      const res = await API.get('/admin/support/threads');
      setThreads(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoadingThreads(false);
    }
  };

  const fetchMessages = async (userId, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await API.get(`/admin/support/messages/${userId}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchThreads();
    const interval = setInterval(() => fetchThreads(true), 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    fetchMessages(selectedUserId);
    const interval = setInterval(() => fetchMessages(selectedUserId, true), 5000);
    return () => clearInterval(interval);
  }, [selectedUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectThread = (userId) => {
    setSelectedUserId(userId);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !selectedUserId) return;
    setSending(true);
    try {
      await API.post(`/admin/support/messages/${selectedUserId}`, { message: reply.trim() });
      setReply('');
      await fetchMessages(selectedUserId, true);
      await fetchThreads(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'ส่งข้อความไม่สำเร็จ');
    } finally {
      setSending(false);
    }
  };

  const selectedThread = threads.find((t) => t.user_id === selectedUserId);

  return (
    <div style={{ maxWidth: '1100px', margin: '30px auto', padding: '0 16px', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
        💬 ข้อความติดต่อจากลูกค้า
      </h2>

      <div style={{ display: 'flex', gap: '16px', height: '70vh', minHeight: '500px' }}>

        {/* รายชื่อผู้ส่งข้อความ */}
        <div style={{ width: '300px', flexShrink: 0, background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflowY: 'auto' }}>
          {loadingThreads ? (
            <p style={{ padding: '20px', color: '#94a3b8', textAlign: 'center' }}>กำลังโหลด...</p>
          ) : threads.length === 0 ? (
            <p style={{ padding: '20px', color: '#94a3b8', textAlign: 'center' }}>ยังไม่มีข้อความเข้ามา</p>
          ) : (
            threads.map((t) => (
              <div
                key={t.user_id}
                onClick={() => handleSelectThread(t.user_id)}
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  background: selectedUserId === t.user_id ? '#e0f2fe' : 'transparent'
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>
                  {t.first_name} {t.last_name}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{t.email}</div>
                <div style={{
                  fontSize: '13px',
                  color: '#475569',
                  marginTop: '6px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {t.last_message}
                </div>
              </div>
            ))
          )}
        </div>

        {/* กล่องสนทนา */}
        <div style={{ flex: 1, background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedUserId ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              เลือกลูกค้าทางซ้ายเพื่อดูบทสนทนา
            </div>
          ) : (
            <>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#0b3d63' }}>
                <div style={{ color: '#ffffff', fontWeight: '700', fontSize: '15px' }}>
                  {selectedThread?.first_name} {selectedThread?.last_name}
                </div>
                <div style={{ color: '#bfdbfe', fontSize: '12px' }}>{selectedThread?.email}</div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc' }}>
                {loadingMessages ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8' }}>กำลังโหลด...</p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: m.sender_role === 'admin' ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{
                        background: m.sender_role === 'admin' ? '#0b3d63' : '#e2e8f0',
                        color: m.sender_role === 'admin' ? '#ffffff' : '#0f172a',
                        padding: '10px 16px',
                        borderRadius: m.sender_role === 'admin' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        wordBreak: 'break-word'
                      }}>
                        {m.message}
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8', alignSelf: m.sender_role === 'admin' ? 'flex-end' : 'flex-start' }}>
                        {m.sender_role === 'admin' ? 'แอดมิน (คุณ)' : 'ลูกค้า'} · {new Date(m.created_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleReply} style={{ display: 'flex', gap: '10px', padding: '14px 16px', borderTop: '1px solid #e2e8f0' }}>
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="พิมพ์ข้อความตอบกลับ..."
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
                  disabled={sending || !reply.trim()}
                  style={{
                    padding: '12px 22px',
                    borderRadius: '999px',
                    border: 'none',
                    background: (sending || !reply.trim()) ? '#94a3b8' : '#0b3d63',
                    color: '#ffffff',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: (sending || !reply.trim()) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {sending ? '...' : 'ตอบกลับ'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
