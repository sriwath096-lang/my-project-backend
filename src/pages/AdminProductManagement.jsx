// src/pages/AdminProductManagement.jsx
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import API from '../services/api';

export default function AdminProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State (สำหรับเพิ่มสินค้าใหม่)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  
  const [hasSizes, setHasSizes] = useState(false);
  const [sizes, setSizes] = useState({ S: '', M: '', L: '', XL: '', '2XL': '', '3XL': '' });
  
  const [hasShoes, setHasShoes] = useState(false);
  const [shoesSizes, setShoesSizes] = useState({ '39': '', '40': '', '41': '', '42': '', '43': '', '44': '' });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');

  // Modal Edit State
  const [editingProduct, setEditingProduct] = useState(null);

  const fileInputRef = useRef(null);

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        API.get('/products'),
        API.get('/categories')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      toast.error('ไม่สามารถดึงข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSizeChange = (sizeKey, val) => {
    const updated = { ...sizes, [sizeKey]: val };
    setSizes(updated);
    const total = Object.values(updated).reduce((sum, count) => sum + (parseInt(count, 10) || 0), 0);
    setStock(total);
  };

  const handleShoesChange = (sizeKey, val) => {
    const updated = { ...shoesSizes, [sizeKey]: val };
    setShoesSizes(updated);
    const total = Object.values(updated).reduce((sum, count) => sum + (parseInt(count, 10) || 0), 0);
    setStock(total);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setStock('');
    setCategoryId('');
    setHasSizes(false);
    setSizes({ S: '', M: '', L: '', XL: '', '2XL': '', '3XL': '' });
    setHasShoes(false);
    setShoesSizes({ '39': '', '40': '', '41': '', '42': '', '43': '', '44': '' });
    setImageFile(null);
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setExistingImageUrl('');
    setEditingProduct(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('stock', stock || 0);
    if (categoryId) formData.append('category_id', categoryId);

    if (hasSizes) {
      const payload = {};
      Object.keys(sizes).forEach(k => {
        if (sizes[k] !== '') payload[k] = parseInt(sizes[k], 10) || 0;
      });
      formData.append('sizes', JSON.stringify(payload));
    } else if (hasShoes) {
      const payload = {};
      Object.keys(shoesSizes).forEach(k => {
        if (shoesSizes[k] !== '') payload[k] = parseInt(shoesSizes[k], 10) || 0;
      });
      formData.append('sizes', JSON.stringify(payload));
    }

    if (imageFile) {
      formData.append('image', imageFile);
    } else if (editingProduct && existingImageUrl) {
      formData.append('image_url', existingImageUrl);
    }

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editingProduct) {
        await API.put(`/products/${editingProduct.id}`, formData, config);
        toast.success('แก้ไขสินค้าสำเร็จ');
      } else {
        await API.post('/products', formData, config);
        toast.success('เพิ่มสินค้าสำเร็จ');
      }
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกสินค้า');
    }
  };

  const handleEditClick = (p) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description || '');
    setPrice(p.price);
    setStock(p.stock);
    setCategoryId(p.category_id || '');
    setImageFile(null);

    if (p.sizes) {
      const parsed = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes;
      const isShoe = Object.keys(parsed).some(k => ['39','40','41','42','43','44'].includes(k));
      if (isShoe) {
        setHasShoes(true);
        setHasSizes(false);
        setShoesSizes({ '39': parsed['39'] ?? '', '40': parsed['40'] ?? '', '41': parsed['41'] ?? '', '42': parsed['42'] ?? '', '43': parsed['43'] ?? '', '44': parsed['44'] ?? '' });
      } else {
        setHasSizes(true);
        setHasShoes(false);
        setSizes({ S: parsed.S ?? '', M: parsed.M ?? '', L: parsed.L ?? '', XL: parsed.XL ?? '', '2XL': parsed['2XL'] ?? '', '3XL': parsed['33'] ?? parsed['3XL'] ?? '' });
      }
    } else {
      setHasSizes(false);
      setHasShoes(false);
    }

    const fullImg = p.image_url ? (p.image_url.startsWith('http') ? p.image_url : `http://localhost:5000${p.image_url}`) : null;
    setExistingImageUrl(p.image_url || '');
    setImagePreview(fullImg);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('คุณต้องการลบสินค้านี้ใช่หรือไม่?')) return;
    try {
      await API.delete(`/products/${id}`);
      toast.success('ลบสินค้าสำเร็จ');
      fetchData();
    } catch (err) {
      toast.error('ไม่สามารถลบสินค้าได้');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>กำลังโหลด...</div>;

  return (
    <div style={{ padding: '30px 40px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginBottom: '24px' }}>📦 ระบบจัดการสินค้า (Product Management)</h2>

      {/* ฟอร์มเพิ่มสินค้าใหม่ */}
      <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', marginBottom: '40px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>➕ เพิ่มสินค้าใหม่</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>ชื่อสินค้า:</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="กรอกชื่อสินค้า..." style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '15px', background: '#f8fafc', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>รายละเอียด:</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="กรอกรายละเอียด..." rows="3" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '15px', background: '#f8fafc', boxSizing: 'border-box', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>ราคา (บาท):</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="0.00" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '15px', background: '#f8fafc', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>จำนวนสต็อกรวม:</label>
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} disabled={hasSizes || hasShoes} required placeholder="0" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '15px', background: (hasSizes || hasShoes) ? '#f1f5f9' : '#f8fafc', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>หมวดหมู่สินค้า:</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '15px', background: '#f8fafc', boxSizing: 'border-box' }}>
              <option value="">-- ไม่ระบุหมวดหมู่ --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <button type="submit" style={{ padding: '14px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>เพิ่มสินค้า</button>
        </form>
      </div>

      {/* ตารางสินค้า */}
      <div style={{ background: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#334155' }}>
              <th style={{ padding: '16px' }}>รูปภาพ</th>
              <th style={{ padding: '16px' }}>ชื่อสินค้า</th>
              <th style={{ padding: '16px' }}>ราคา</th>
              <th style={{ padding: '16px' }}>สต็อก</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px' }}>
                  {p.image_url ? <img src={p.image_url.startsWith('http') ? p.image_url : `http://localhost:5000${p.image_url}`} alt={p.name} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }} /> : <span style={{ color: '#94a3b8' }}>ไม่มีรูป</span>}
                </td>
                <td style={{ padding: '16px' }}><strong style={{ fontSize: '15px', color: '#0f172a' }}>{p.name}</strong></td>
                <td style={{ padding: '16px', fontWeight: '700' }}>{Number(p.price).toLocaleString()} ฿</td>
                <td style={{ padding: '16px' }}>{p.stock} ชิ้น</td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <button onClick={() => handleEditClick(p)} style={{ marginRight: '8px', padding: '8px 14px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>แก้ไข</button>
                  <button onClick={() => handleDelete(p.id)} style={{ padding: '8px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🌟 Modal แก้ไขสินค้าขนาดใหญ่พิเศษ 750px เต็มตา */}
      {editingProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }} onClick={() => resetForm()}>
          <div style={{ background: '#ffffff', padding: '36px', borderRadius: '30px', width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)', boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '24px' }}>✏️ แก้ไขรายการสินค้า</h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>ชื่อสินค้า:</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '15px', background: '#f8fafc', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>ราคา (บาท):</label>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '15px', background: '#f8fafc', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>จำนวนสต็อก:</label>
                  <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} disabled={hasSizes || hasShoes} required style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '15px', background: '#f1f5f9', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>หมวดหมู่สินค้า:</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '15px', background: '#f8fafc', boxSizing: 'border-box' }}>
                  <option value="">-- ไม่ระบุหมวดหมู่ --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* ส่วนเลือกไซส์เสื้อใน Modal */}
              <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', color: '#1e293b' }}>
                  <input type="checkbox" checked={hasSizes} onChange={(e) => { setHasSizes(e.target.checked); if(e.target.checked) setHasShoes(false); }} style={{ width: '18px', height: '18px' }} />
                  👕 สินค้านี้มีแยกไซส์เสื้อ
                </label>
                {hasSizes && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '14px' }}>
                    {Object.keys(sizes).map(sk => (
                      <div key={sk}>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>ไซส์ {sk}:</label>
                        <input type="number" min="0" value={sizes[sk]} onChange={(e) => handleSizeChange(sk, e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', boxSizing: 'border-box', marginTop: '4px' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>รูปภาพสินค้า:</label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'block', padding: '8px', background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: '10px', width: '100%', boxSizing: 'border-box' }} />
              </div>

              {imagePreview && (
                <div>
                  <img src={imagePreview} alt="Preview" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '14px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>บันทึกการแก้ไข</button>
                <button type="button" onClick={resetForm} style={{ flex: 1, padding: '14px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}