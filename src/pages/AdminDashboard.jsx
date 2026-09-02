// src/pages/AdminDashboard.jsx
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import API from '../services/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '', 
    image_url: ''
  });

  // State สำหรับจัดการไซส์เสื้อ
  const [hasSizes, setHasSizes] = useState(false);
  const [sizes, setSizes] = useState({ S: '', M: '', L: '', XL: '', '2XL': '', '3XL': '' });

  // State สำหรับจัดการไซส์รองเท้า
  const [isShoe, setIsShoe] = useState(false);
  const [shoeSizes, setShoeSizes] = useState({});

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('id'); 

  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false); 

  const [newCategoryName, setNewCategoryName] = useState(''); 
  const [newCategoryParentId, setNewCategoryParentId] = useState(''); 

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchProducts = async () => {
    try {
      const res = await API.get('/products');
      setProducts(res.data);
    } catch (err) {
      toast.error('ไม่สามารถโหลดข้อมูลสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await API.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories(); 
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  const getProductImgUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/50?text=No+Image';
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    return `http://localhost:5000${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
      toast.success(`เลือกไฟล์ ${file.name} เรียบร้อยแล้ว`);
    }
  };

  const handleSizeChange = (sizeKey, val) => {
    const updatedSizes = { ...sizes, [sizeKey]: val };
    setSizes(updatedSizes);
    const total = Object.values(updatedSizes).reduce(
      (sum, count) => sum + (parseInt(count, 10) || 0),
      0
    );
    setFormData((prev) => ({ ...prev, stock: total }));
  };

  const handleShoeSizeChange = (sizeKey, val) => {
    const updatedShoes = { ...shoeSizes, [sizeKey]: val };
    setShoeSizes(updatedShoes);
    const total = Object.values(updatedShoes).reduce(
      (sum, count) => sum + (parseInt(count, 10) || 0),
      0
    );
    setFormData((prev) => ({ ...prev, stock: total }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description || '');
      data.append('price', formData.price);
      data.append('stock', formData.stock || 0);
      data.append('category_id', formData.category_id); 

      if (hasSizes) {
        const sizesPayload = {
          S: parseInt(sizes.S, 10) || 0,
          M: parseInt(sizes.M, 10) || 0,
          L: parseInt(sizes.L, 10) || 0,
          XL: parseInt(sizes.XL, 10) || 0,
          '2XL': parseInt(sizes['2XL'], 10) || 0,
          '3XL': parseInt(sizes['3XL'], 10) || 0,
        };
        data.append('sizes', JSON.stringify(sizesPayload));
      } else if (isShoe) {
        const shoePayload = {};
        Object.keys(shoeSizes).forEach(k => {
          shoePayload[k] = parseInt(shoeSizes[k], 10) || 0;
        });
        data.append('sizes', JSON.stringify(shoePayload));
      } else {
        data.append('sizes', '');
      }

      if (selectedFile) {
        data.append('image', selectedFile);
      } else {
        data.append('image_url', formData.image_url);
      }

      if (editingId) {
        await API.put(`/products/${editingId}`, data);
        toast.success('อัปเดตข้อมูลสินค้าสำเร็จ');
      } else {
        await API.post('/products', data);
        toast.success('เพิ่มสินค้าใหม่สำเร็จ');
      }

      resetForm();
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', stock: '', category_id: '', image_url: '' });
    setHasSizes(false);
    setSizes({ S: '', M: '', L: '', XL: '', '2XL': '', '3XL': '' });
    setIsShoe(false);
    setShoeSizes({});
    setSelectedFile(null);
    setPreviewImage('');
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category_id: product.category_id || '', 
      image_url: product.image_url || ''
    });

    if (product.sizes) {
      const parsed = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
      const keys = Object.keys(parsed);
      
      const isShirtSizes = keys.some(k => ['S', 'M', 'L', 'XL', '2XL', '3XL'].includes(k));

      if (isShirtSizes) {
        setHasSizes(true);
        setIsShoe(false);
        setSizes({
          S: parsed.S ?? '',
          M: parsed.M ?? '',
          L: parsed.L ?? '',
          XL: parsed.XL ?? '',
          '2XL': parsed['2XL'] ?? '',
          '3XL': parsed['3XL'] ?? ''
        });
      } else {
        setIsShoe(true);
        setHasSizes(false);
        setShoeSizes(parsed);
      }
    } else {
      setHasSizes(false);
      setIsShoe(false);
      setSizes({ S: '', M: '', L: '', XL: '', '2XL': '', '3XL': '' });
      setShoeSizes({});
    }

    setSelectedFile(null);
    setPreviewImage(product.image_url ? getProductImgUrl(product.image_url) : '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('คุณต้องการลบสินค้านี้ใช่หรือไม่?')) return;
    try {
      await API.delete(`/products/${id}`);
      toast.success('ลบสินค้าเรียบร้อย');
      fetchProducts();
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการลบสินค้า');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return toast.error('กรุณากรอกชื่อหมวดหมู่');
    try {
      const payload = {
        name: newCategoryName,
        parent_id: newCategoryParentId ? Number(newCategoryParentId) : null 
      };
      await API.post('/categories', payload);
      toast.success('เพิ่มหมวดหมู่สำเร็จ');
      setNewCategoryName('');
      setNewCategoryParentId('');
      fetchCategories(); 
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('ต้องการลบหมวดหมู่นี้ใช่หรือไม่?')) return;
    try {
      await API.delete(`/categories/${id}`);
      toast.success('ลบหมวดหมู่สำเร็จ');
      fetchCategories(); 
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการลบหมวดหมู่');
    }
  };

  const mainCategories = categories.filter(c => !c.parent_id);

  const filteredProducts = products
    .filter((p) => {
      const term = searchTerm.toLowerCase();
      const nameMatch = (p.name || '').toLowerCase().includes(term);
      const descMatch = (p.description || '').toLowerCase().includes(term);
      const idMatch = String(p.id).includes(term);
      const categoryName = categories.find(c => c.id === p.category_id)?.name || '';
      const catMatch = categoryName.toLowerCase().includes(term);

      return nameMatch || descMatch || idMatch || catMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'price') return Number(a.price) - Number(b.price);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return Number(a.id) - Number(b.id);
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const getCategoryName = (id) => {
    if (!id) return <span style={{ color: '#94a3b8' }}>- ไม่ระบุ -</span>;
    const category = categories.find((c) => c.id === id);
    if (!category) return '-';

    if (category.parent_id) {
      const parent = categories.find((c) => c.id === category.parent_id);
      return (
        <div style={{ fontSize: '0.85rem' }}>
          <span style={{ color: '#64748b' }}>{parent?.name || '...'}</span>
          <br />
          <span style={{ fontWeight: '600', color: '#334155' }}>└ {category.name}</span>
        </div>
      );
    }
    return <span style={{ fontWeight: '600', color: '#1e293b' }}>{category.name}</span>;
  };

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header-section">
        <div>
          <h2 className="admin-title">⚙️ ระบบจัดการหลังบ้าน (Admin Dashboard)</h2>
          <p className="admin-subtitle">จัดการข้อมูลรายการสินค้าและหมวดหมู่ เพิ่ม แก้ไข ลบ และค้นหา</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 20px', 
              background: '#ffffff', 
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '50px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease'
            }} 
            onClick={() => setIsCategoryModalOpen(true)}
          >
            <span>📁</span> <span>จัดการหมวดหมู่</span>
          </button>

          <button 
            className="btn-primary-add" 
            onClick={handleOpenAddModal}
            style={{ borderRadius: '50px' }}
          >
            ➕ เพิ่มสินค้าใหม่
          </button>
        </div>
      </div>

      {/* Modal จัดการหมวดหมู่ */}
      {isCategoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', maxHeight: '80vh', overflowY: 'auto', borderRadius: '24px' }}>
            <h3 className="modal-title-header">📂 จัดการหมวดหมู่สินค้า</h3>
            
            <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="กรอกชื่อหมวดหมู่ใหม่..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="form-input"
                style={{ borderRadius: '12px' }}
                required
              />
              <select
                value={newCategoryParentId}
                onChange={(e) => setNewCategoryParentId(e.target.value)}
                className="form-input"
                style={{ backgroundColor: '#fff', cursor: 'pointer', borderRadius: '12px' }}
              >
                <option value="">-- สร้างเป็นหมวดหมู่หลัก --</option>
                {mainCategories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>📁 {cat.name}</option>
                ))}
              </select>
              
              {/* ปุ่มเพิ่มหมวดหมู่บังคับขยายเต็มร้อยด้วย CSS Inline แบบเจาะจง */}
              <button 
                type="submit" 
                style={{ 
                  width: '100%', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  padding: '14px 20px', 
                  fontSize: '16px', 
                  fontWeight: '700',
                  borderRadius: '50px', 
                  background: '#0f172a', 
                  color: '#ffffff', 
                  border: 'none', 
                  cursor: 'pointer', 
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
                  boxSizing: 'border-box',
                  marginTop: '6px'
                }}
              >
                ➕ เพิ่มหมวดหมู่
              </button>
            </form>

            <hr style={{ border: '0', borderTop: '1px solid #e2e8f0', margin: '15px 0' }} />

            <h4 style={{ fontSize: '15px', color: '#334155', marginBottom: '10px' }}>📋 รายชื่อหมวดหมู่ที่มีอยู่:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
              {categories.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>ยังไม่มีหมวดหมู่ในระบบ</p>
              ) : (
                categories.map((cat) => {
                  const parentCat = categories.find(c => c.id === cat.parent_id);
                  return (
                    <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div>
                        <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{cat.name}</span>
                        {parentCat && <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>(ย่อยของ: {parentCat.name})</span>}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteCategory(cat.id)}
                        style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '50px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                      >
                        ลบ
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="btn-cancel" style={{ width: '100%', borderRadius: '50px' }}>ปิดหน้าต่าง</button>
          </div>
        </div>
      )}

      {/* Modal เพิ่ม/แก้ไขสินค้า */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ borderRadius: '24px' }}>
            <h3 className="modal-title-header">
              {editingId ? '✏️ แก้ไขรายการสินค้า' : '➕ เพิ่มสินค้าใหม่'}
            </h3>

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>ชื่อสินค้า</label>
                <input
                  type="text"
                  placeholder="กรอกชื่อสินค้า"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="form-input"
                  style={{ borderRadius: '12px' }}
                />
              </div>

              <div className="form-row-group">
                <div className="form-group">
                  <label>ราคา (บาท)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="form-input"
                    style={{ borderRadius: '12px' }}
                  />
                </div>

                <div className="form-group">
                  <label>จำนวนสต็อก {(hasSizes || isShoe) && '(คำนวณจากผลรวมไซส์)'}</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    disabled={hasSizes || isShoe}
                    required
                    className="form-input"
                    style={{ backgroundColor: (hasSizes || isShoe) ? '#f1f5f9' : '#fff', borderRadius: '12px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>หมวดหมู่สินค้า</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="form-input"
                  style={{ backgroundColor: '#fff', borderRadius: '12px' }}
                >
                  <option value="">-- ไม่ระบุหมวดหมู่ --</option>
                  {categories.filter((cat) => !cat.parent_id).map((parent) => (
                    <optgroup key={parent.id} label={`📁 ${parent.name}`}>
                      <option value={parent.id}>📁 {parent.name} (หมวดหมู่หลัก)</option>
                      {categories.filter((sub) => String(sub.parent_id) === String(parent.id)).map((sub) => (
                        <option key={sub.id} value={sub.id}>&nbsp;&nbsp;&nbsp;&nbsp;└ 📄 {sub.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* ส่วนตั้งค่าไซส์เสื้อ */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#1e293b' }}>
                  <input
                    type="checkbox"
                    checked={hasSizes}
                    disabled={isShoe}
                    onChange={(e) => {
                      setHasSizes(e.target.checked);
                      if (!e.target.checked) setSizes({ S: '', M: '', L: '', XL: '', '2XL': '', '3XL': '' });
                    }}
                  />
                  👕 สินค้านี้มีแยกไซส์เสื้อ
                </label>

                {hasSizes && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
                    {['S', 'M', 'L', 'XL', '2XL', '3XL'].map((sKey) => (
                      <div key={sKey}>
                        <label style={{ fontSize: '13px', color: '#475569' }}>ไซส์ {sKey}:</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={sizes[sKey]}
                          onChange={(e) => handleSizeChange(sKey, e.target.value)}
                          className="form-input"
                          style={{ padding: '8px 10px', marginTop: '4px', borderRadius: '10px' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ส่วนตั้งค่ารองเท้า */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#1e293b' }}>
                  <input 
                    type="checkbox" 
                    checked={isShoe} 
                    disabled={hasSizes}
                    onChange={(e) => {
                      setIsShoe(e.target.checked);
                      if (!e.target.checked) setShoeSizes({});
                    }} 
                  />
                  👟 สินค้านี้มีแยกไซส์รองเท้า
                </label>

                {isShoe && (
                  <div style={{ marginTop: '10px' }}>
                    <select 
                      className="form-input"
                      onChange={(e) => {
                        const range = e.target.value.split('-').map(Number);
                        const newSizes = {};
                        for(let i = range[0]; i <= range[1]; i++) newSizes[i] = shoeSizes[i] || 0;
                        setShoeSizes(newSizes);
                      }}
                      style={{ backgroundColor: '#fff', marginBottom: '10px', borderRadius: '12px' }}
                    >
                      <option value="">-- เลือกช่วงไซส์รองเท้า --</option>
                      <option value="30-40">ไซส์ 30 - 40</option>
                      <option value="35-45">ไซส์ 35 - 45</option>
                    </select>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                      {Object.keys(shoeSizes).map(size => (
                        <div key={size}>
                          <small style={{ color: '#475569' }}>เบอร์ {size}:</small>
                          <input 
                            type="number" 
                            min="0"
                            value={shoeSizes[size]}
                            onChange={(e) => handleShoeSizeChange(size, e.target.value)}
                            className="form-input"
                            style={{ padding: '6px 8px', borderRadius: '10px' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>รูปภาพสินค้า</label>
                <div className="image-input-group">
                  <input
                    type="text"
                    placeholder="ลิงก์ URL รูปภาพ หรือเลือกไฟล์"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="form-input"
                    style={{ borderRadius: '12px' }}
                  />
                  <button type="button" onClick={() => fileInputRef.current.click()} className="btn-file-select" style={{ borderRadius: '12px' }}>📁 เลือกไฟล์</button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                </div>
              </div>

              <div className="form-group">
                <label>รายละเอียดสินค้า</label>
                <textarea
                  placeholder="กรอกรายละเอียดสินค้าเพิ่มเติม..."
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-textarea"
                  style={{ borderRadius: '12px' }}
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-submit" style={{ borderRadius: '50px' }}>
                  {editingId ? '💾 บันทึกการแก้ไข' : '➕ เพิ่มสินค้า'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel" style={{ borderRadius: '50px' }}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ตารางแสดงสินค้า */}
      <div className="product-list-header">
        <h3 className="product-list-title">📦 รายการสินค้าทั้งหมด ({filteredProducts.length} รายการ)</h3>
        <input
          type="text"
          placeholder="🔍 ค้นหาสินค้า..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          style={{ borderRadius: '50px' }}
        />
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>รูปภาพ</th>
            <th>ชื่อสินค้า</th>
            <th>หมวดหมู่</th>
            <th>ราคา</th>
            <th>คงเหลือ</th>
            <th style={{ textAlign: 'center' }}>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {currentProducts.map((p, index) => (
            <tr key={p.id}>
              <td>{indexOfFirstItem + index + 1}</td>
              <td><img src={getProductImgUrl(p.image_url)} alt={p.name} className="table-product-img" /></td>
              <td>{p.name}</td>
              <td>{getCategoryName(p.category_id)}</td>
              <td>฿{Number(p.price).toLocaleString()}</td>
              <td>{p.stock} ชิ้น</td>
              
              <td style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                  <button 
                    onClick={() => handleEdit(p)} 
                    className="btn-edit"
                    style={{ borderRadius: '50px', padding: '6px 16px', fontWeight: '600' }}
                  >
                    แก้ไข
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id)} 
                    className="btn-delete"
                    style={{ borderRadius: '50px', padding: '6px 16px', fontWeight: '600' }}
                  >
                    ลบ
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}