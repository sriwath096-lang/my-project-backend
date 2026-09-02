// src/pages/ProductList.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API from '../services/api';
import { useCart } from '../context/CartContext';
import './ProductList.css';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // State จัดการ Modal และการเลือกซื้อ
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [buyQuantity, setBuyQuantity] = useState(1); // จำนวนชิ้นที่ต้องการซื้อ
  
  const { addToCart } = useCart();

  useEffect(() => {
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
    fetchData();
  }, []);

  const getProductImgUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/200?text=No+Image';
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    return `http://localhost:5000${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const parseSizes = (sizes) => {
    if (!sizes) return null;
    return typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
  };

  const mainCategories = categories.filter(c => !c.parent_id);
  const getSubCategories = (parentId) => categories.filter(c => String(c.parent_id) === String(parentId));

  const toggleCategoryDropdown = (catId, e) => {
    e.stopPropagation();
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    
    if (selectedCategory === 'all') return matchesSearch;

    const pCatId = String(p.category_id || p.category);
    const isDirectMatch = pCatId === String(selectedCategory);
    const subCats = getSubCategories(selectedCategory);
    const isSubMatch = subCats.some(sub => String(sub.id) === pCatId);

    return matchesSearch && (isDirectMatch || isSubMatch);
  });

  const handleOpenModal = (p) => {
    setSelectedProduct(p);
    setSelectedSize(null);
    setBuyQuantity(1); // รีเซ็ตจำนวนเป็น 1 ทุกครั้งที่เปิดดูสินค้า
  };

  // คำนวณสต็อกสูงสุดที่สามารถซื้อได้ในขณะนั้น
  const getMaxStock = () => {
    if (!selectedProduct) return 0;
    const currentSizes = parseSizes(selectedProduct.sizes);
    if (currentSizes && selectedSize) {
      return Number(currentSizes[selectedSize]) || 0;
    }
    return Number(selectedProduct.stock) || 0;
  };

  const handleAddToCart = (product, e) => {
    if (e) e.stopPropagation();

    const productSizes = parseSizes(product.sizes);
    
    if (productSizes && !selectedSize) {
      toast.error('กรุณาเลือกไซส์ก่อนใส่ตะกร้า');
      return;
    }

    const maxStock = getMaxStock();
    if (buyQuantity > maxStock) {
      toast.error(`สินค้าคงเหลือไม่เพียงพอ (มีเพียง ${maxStock} ชิ้น)`);
      return;
    }

    if (buyQuantity <= 0) {
      toast.error('กรุณาระบุจำนวนสินค้าอย่างน้อย 1 ชิ้น');
      return;
    }

    addToCart({ ...product, selectedSize }, buyQuantity);
    toast.success(`เพิ่ม "${product.name}${selectedSize ? ` (ไซส์ ${selectedSize})` : ''}" จำนวน ${buyQuantity} ชิ้น ลงในตะกร้าแล้ว`);
    setSelectedProduct(null);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>กำลังโหลดสินค้า...</div>;

  const currentSizes = selectedProduct ? parseSizes(selectedProduct.sizes) : null;
  const maxAvailableStock = getMaxStock();

  return (
    <div className="product-list-container">
      {/* ส่วนค้นหา */}
      <div className="product-header-toolbar">
        <h2 className="product-list-title">รายการสินค้าทั้งหมด</h2>
        <input
          type="text"
          placeholder="🔍 ค้นหาสินค้า..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="product-search-input"
        />
      </div>

      {/* โครงสร้างหมวดหมู่ และ การ์ดสินค้า */}
      <div className="product-main-layout">
        <aside className="category-sidebar">
          <h3 className="category-title">📂 หมวดหมู่สินค้า</h3>
          <div className="category-list">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`category-item ${selectedCategory === 'all' ? 'active' : ''}`}
            >
              ทั้งหมด
            </button>

            {mainCategories.map((cat) => {
              const subCats = getSubCategories(cat.id);
              const hasSub = subCats.length > 0;
              const isExpanded = expandedCategories[cat.id];
              const isMainSelected = String(selectedCategory) === String(cat.id);

              return (
                <div key={cat.id} className="category-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <button
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`category-item ${isMainSelected ? 'active' : ''}`}
                      style={{ flex: 1, textAlign: 'left' }}
                    >
                      {cat.name}
                    </button>
                    {hasSub && (
                      <button 
                        onClick={(e) => toggleCategoryDropdown(cat.id, e)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', color: '#64748b' }}
                      >
                        {isExpanded ? '▲' : '▼'}
                      </button>
                    )}
                  </div>

                  {hasSub && isExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '16px', borderLeft: '2px solid #e2e8f0', margin: '4px 0 8px 8px' }}>
                      {subCats.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => setSelectedCategory(sub.id)}
                          className={`category-item ${String(selectedCategory) === String(sub.id) ? 'active' : ''}`}
                          style={{ fontSize: '13px', padding: '6px 10px' }}
                        >
                          • {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ตารางแสดงสินค้า */}
        <div className="product-content-area">
          {filteredProducts.length === 0 ? (
            <div className="product-empty-text">ไม่พบสินค้าที่ตรงกับการค้นหา หรือในหมวดหมู่นี้</div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((p) => {
                const catObj = categories.find(c => String(c.id) === String(p.category_id));
                const categoryName = catObj ? catObj.name : (p.category || 'ไม่ระบุหมวดหมู่');

                return (
                  <div 
                    key={p.id} 
                    className="product-card product-card-clickable"
                    onClick={() => handleOpenModal(p)}
                  >
                    <div>
                      <img
                        src={getProductImgUrl(p.image_url)}
                        alt={p.name}
                        className="product-image"
                      />
                      <span style={{ display: 'inline-block', fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '6px', marginTop: '8px', fontWeight: '600' }}>
                        {categoryName}
                      </span>
                      <h3 className="product-name">{p.name}</h3>
                      <p className="product-desc">{p.description}</p>
                      <div className="product-price">
                        ฿{Number(p.price).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', color: p.stock > 0 ? '#16a34a' : '#dc2626', fontWeight: '600', marginTop: '10px' }}>
                      {p.stock > 0 ? `📦 คงเหลือ: ${p.stock} ชิ้น` : '❌ สินค้าหมด'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal รายละเอียดสินค้า */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-header">📦 รายละเอียดสินค้า</h3>
            
            <img
              src={getProductImgUrl(selectedProduct.image_url)}
              alt={selectedProduct.name}
              className="modal-img"
            />

            <div className="modal-body-info" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p><b>ชื่อสินค้า:</b> {selectedProduct.name}</p>
              <p><b>ราคา:</b> <span style={{ color: '#16a34a', fontWeight: 'bold' }}>฿{Number(selectedProduct.price).toLocaleString()}</span></p>
              <p><b>หมวดหมู่:</b> {categories.find(c => String(c.id) === String(selectedProduct.category_id))?.name || selectedProduct.category || '-'}</p>
              <p><b>สินค้าคงเหลือรวม:</b> {selectedProduct.stock} ชิ้น</p>

              {/* ส่วนเลือกไซส์สินค้า */}
              {currentSizes && (
                <div style={{ marginTop: '8px', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <b style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#1e293b' }}>
                    {Object.keys(currentSizes).some(k => ['S', 'M', 'L', 'XL', '2XL', '3XL'].includes(k)) ? 'เลือกไซส์เสื้อ:' : 'เลือกเบอร์รองเท้า:'}
                  </b>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                    {Object.keys(currentSizes).map((sizeKey) => {
                      const qty = Number(currentSizes[sizeKey]) || 0;
                      const isOutOfStock = qty <= 0;
                      const isSelected = selectedSize === sizeKey;

                      return (
                        <button
                          key={sizeKey}
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => {
                            setSelectedSize(sizeKey);
                            setBuyQuantity(1);
                          }}
                          style={{
                            padding: '10px 6px',
                            border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                            background: isOutOfStock ? '#f1f5f9' : (isSelected ? '#eff6ff' : '#fff'),
                            color: isOutOfStock ? '#94a3b8' : (isSelected ? '#1d4ed8' : '#334155'),
                            borderRadius: '8px',
                            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                            fontWeight: isSelected ? 'bold' : '500',
                            fontSize: '13px',
                            textAlign: 'center'
                          }}
                        >
                          {sizeKey} <small style={{ display: 'block', fontSize: '11px', color: isOutOfStock ? '#ef4444' : '#64748b' }}>({qty} ชิ้น)</small>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ส่วนเลือกจำนวนชิ้น */}
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>จำนวนที่ต้องการซื้อ:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setBuyQuantity(prev => Math.max(1, prev - 1))}
                    disabled={buyQuantity <= 1}
                    style={{
                      width: '36px',
                      height: '36px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      borderRadius: '8px',
                      cursor: buyQuantity <= 1 ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      color: buyQuantity <= 1 ? '#94a3b8' : '#1e293b'
                    }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={maxAvailableStock || 1}
                    value={buyQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (isNaN(val)) setBuyQuantity(1);
                      else setBuyQuantity(Math.min(Math.max(1, val), maxAvailableStock || 1));
                    }}
                    style={{
                      width: '60px',
                      textAlign: 'center',
                      padding: '8px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '15px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setBuyQuantity(prev => Math.min(maxAvailableStock, prev + 1))}
                    disabled={buyQuantity >= maxAvailableStock || maxAvailableStock <= 0}
                    style={{
                      width: '36px',
                      height: '36px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      borderRadius: '8px',
                      cursor: (buyQuantity >= maxAvailableStock || maxAvailableStock <= 0) ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      color: (buyQuantity >= maxAvailableStock || maxAvailableStock <= 0) ? '#94a3b8' : '#1e293b'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <p style={{ marginTop: '8px' }}><b>รายละเอียด:</b> {selectedProduct.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
            </div>

            {/* ปุ่มกดด้านล่าง */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', width: '100%', boxSizing: 'border-box' }}>
              <button
                type="button"
                disabled={selectedProduct.stock <= 0}
                onClick={(e) => handleAddToCart(selectedProduct, e)}
                style={{
                  flex: 1,
                  display: 'block',
                  padding: '14px 16px',
                  background: selectedProduct.stock > 0 ? '#0f172a' : '#cbd5e1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: selectedProduct.stock > 0 ? 'pointer' : 'not-allowed',
                  textAlign: 'center',
                  boxShadow: selectedProduct.stock > 0 ? '0 4px 12px rgba(15, 23, 42, 0.15)' : 'none',
                  boxSizing: 'border-box'
                }}
              >
                {selectedProduct.stock > 0 ? `🛒 ใส่ตะกร้า (${buyQuantity} ชิ้น)` : '❌ สินค้าหมด'}
              </button>

              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                style={{
                  flex: 1,
                  display: 'block',
                  padding: '14px 16px',
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxSizing: 'border-box'
                }}
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}