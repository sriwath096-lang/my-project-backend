import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API from '../services/api';
import './AdminCategoryManagement.css';

export default function AdminCategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');
  const [parentId, setParentId] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await API.get('/categories');
      setCategories(res.data);
    } catch (err) {
      toast.error('ไม่สามารถดึงข้อมูลหมวดหมู่ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error('กรุณากรอกชื่อหมวดหมู่');
      return;
    }
    try {
      await API.post('/categories', { 
        name: categoryName, 
        parent_id: parentId ? Number(parentId) : null 
      });
      toast.success('เพิ่มหมวดหมู่สำเร็จ');
      setCategoryName('');
      setParentId('');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'ไม่สามารถเพิ่มหมวดหมู่ได้');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`ยืนยันลบหมวดหมู่ "${name}" ใช่หรือไม่?`)) return;
    try {
      await API.delete(`/categories/${id}`);
      toast.success('ลบหมวดหมู่สำเร็จ');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'ไม่สามารถลบหมวดหมู่ได้');
    }
  };

  const mainCategories = categories.filter(c => !c.parent_id);

  if (loading) return <div className="loading-state">กำลังโหลดข้อมูลหมวดหมู่...</div>;

  return (
    <div className="admin-category-container">
      <h2 className="admin-page-title">📂 จัดการหมวดหมู่สินค้า (Category Management)</h2>
      
      {/* 🌟 บังคับฟอร์มให้ยืดเต็มความกว้างด้วย Inline Style */}
      <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxSizing: 'border-box', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="เช่น เสื้อ หรือ อุปกรณ์เกม..."
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', outline: 'none', background: '#ffffff', color: '#1e293b', boxSizing: 'border-box' }}
        />

        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', cursor: 'pointer', background: '#fff', color: '#1e293b', boxSizing: 'border-box' }}
        >
          <option value="">-- สร้างเป็นหมวดหมู่หลัก --</option>
          {mainCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              📁 {cat.name}
            </option>
          ))}
        </select>

        {/* 🌟 ปุ่มเพิ่มหมวดหมู่ บังคับเต็ม 100% สวยเด่นชัด */}
        <button
          type="submit"
          style={{
            width: '100%',
            display: 'block',
            padding: '14px 20px',
            background: '#0f172a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
            boxSizing: 'border-box'
          }}
        >
          + เพิ่มหมวดหมู่
        </button>
      </form>

      {/* ตารางแสดงรายการหมวดหมู่ทั้งหมด */}
      <div className="table-responsive-wrapper" style={{ marginTop: '30px' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ชื่อหมวดหมู่</th>
              <th>ประเภท</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 ? (
              categories.map((cat) => {
                const isSub = Boolean(cat.parent_id);
                const parentObj = isSub ? categories.find(c => c.id === cat.parent_id) : null;

                return (
                  <tr key={cat.id}>
                    <td>{cat.id}</td>
                    <td style={{ paddingLeft: isSub ? '30px' : '12px' }}>
                      {isSub ? `└── 📄 ${cat.name}` : `📂 ${cat.name}`}
                    </td>
                    <td>
                      {isSub ? (
                        <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px' }}>
                          หมวดหมู่ย่อยของ: <b>{parentObj ? parentObj.name : '-'}</b>
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>
                          หมวดหมู่หลัก
                        </span>
                      )}
                    </td>
                    <td>
                      <button className="btn-action btn-delete" onClick={() => handleDelete(cat.id, cat.name)}>
                        ลบ
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                  ยังไม่มีหมวดหมู่สินค้า
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}