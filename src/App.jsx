import { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import './Navbar.css';

// Import หน้าต่าง ๆ
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminOrders from './pages/AdminOrders';
import ProductList from './pages/ProductList';
import Cart from './pages/Cart';
import OrderSuccess from './pages/OrderSuccess';

// -------------------------------------------------------------
// หน้าตั้งค่าช่องทางการชำระเงินสำหรับ Admin (Payment Settings)
// -------------------------------------------------------------
const PaymentSettings = () => {
  const [bankInfo, setBankInfo] = useState({
    bankName: 'กสิกรไทย (KBank)',
    accountName: 'บจก. อุดม ช้อป',
    accountNumber: '123-4-56789-0'
  });

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
};

// -------------------------------------------------------------
// หน้าประวัติการสั่งซื้อของ User (My Orders)
// -------------------------------------------------------------
const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `http://localhost:5000${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/orders/my-orders', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (error) {
        console.error('Error fetching user orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
      case 'DELIVERED':
        return <span className="order-badge badge-success">✓ จัดส่งสำเร็จ</span>;
      case 'shipped':
      case 'SHIPPED':
        return <span className="order-badge badge-info">สินค้าพร้อมแล้ว</span>;
      case 'paid':
      case 'PAID':
        return <span className="order-badge badge-primary">💳 ชำระเงินแล้ว</span>;
      case 'cancelled':
      case 'CANCELLED':
        return <span className="order-badge badge-danger">✕ ยกเลิกแล้ว</span>;
      default:
        return <span className="order-badge badge-warning">⏳ รอดำเนินการ</span>;
    }
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h2>📦 ประวัติการสั่งซื้อของฉัน</h2>
        <p>ตรวจสอบรายการสินค้าและสถานะการจัดส่งย้อนหลัง</p>
      </div>

      {loading ? (
        <div className="orders-empty-card">กำลังโหลดข้อมูลรายการสั่งซื้อ...</div>
      ) : orders.length === 0 ? (
        <div className="orders-empty-card">
          <p>🛒 คุณยังไม่มีรายการสั่งซื้อในขณะนี้</p>
          <Link to="/" className="btn-shop-now">ไปเลือกซื้อสินค้า</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const rawDate = order.createdAt || order.created_at || order.date || order.order_date;
            const validDate = rawDate ? new Date(rawDate) : null;
            const displayDate = validDate && !isNaN(validDate) 
              ? validDate.toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'ไม่ระบุวันที่';

            const itemsList = order.items || order.OrderItems || order.order_items || order.products || [];

            return (
              <div key={order.id || order._id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <span className="order-id">ออเดอร์ #{order.id || order._id}</span>
                    <span className="order-date">📅 {displayDate}</span>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="order-divider" />

                <div className="order-items-list">
                  {itemsList.length > 0 ? (
                    itemsList.map((item, idx) => {
                      const itemName = item.name || item.product_name || (item.Product && item.Product.name) || `สินค้า #${item.product_id || item.id || ''}`;
                      const itemQty = item.quantity || item.qty || 1;
                      const itemPrice = item.price || item.unit_price || (item.Product && item.Product.price) || 0;
                      const itemSize = item.size;
                      
                      const rawImage = item.image || item.image_url || (item.Product && item.Product.image);
                      const itemImage = getImageUrl(rawImage);

                      return (
                        <div key={idx} className="order-item-row">
                          <div className="order-item-info">
                            {itemImage ? (
                              <img 
                                src={itemImage} 
                                alt={itemName} 
                                className="order-item-img"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                }} 
                              />
                            ) : (
                              <div className="order-item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', fontSize: '20px' }}>📦</div>
                            )}
                            <div>
                              <p className="order-item-name">
                                {itemName}
                                {itemSize && (
                                  <span style={{ 
                                    marginLeft: '8px', 
                                    fontSize: '11px', 
                                    background: '#eff6ff', 
                                    color: '#1d4ed8', 
                                    padding: '2px 8px', 
                                    borderRadius: '4px', 
                                    border: '1px solid #bfdbfe',
                                    fontWeight: '500',
                                    display: 'inline-block'
                                  }}>
                                    ไซส์: {itemSize}
                                  </span>
                                )}
                              </p>
                              <p className="order-item-qty">จำนวน: {itemQty} ชิ้น</p>
                            </div>
                          </div>
                          <div className="order-item-price">
                            ฿{(itemPrice * itemQty).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ color: '#ef4444', fontSize: '14px', margin: '10px 0' }}>⚠️ ไม่พบข้อมูลรายการสินค้าในระบบ</p>
                  )}
                </div>

                <div className="order-divider" />

                <div className="order-card-footer">
                  <span>ราคารวมทั้งหมด:</span>
                  <span className="order-total-price">
                    ฿{Number(order.total_price || order.totalAmount || order.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// หน้าโปรไฟล์ส่วนตัว (Profile Page)
// -------------------------------------------------------------
const Profile = () => {
  const { user } = useAuth();
  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : 'U');

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">{getInitial(user?.first_name)}</div>
          <div className="profile-title-group">
            <h2 className="profile-name">{user?.first_name} {user?.last_name}</h2>
            <span className={`role-badge ${user?.role === 'admin' ? 'role-admin' : 'role-user'}`}>
              {user?.role === 'admin' ? '🛡️ ผู้ดูแลระบบ (Admin)' : '👤 สมาชิกทั่วไป (User)'}
            </span>
          </div>
        </div>

        <div className="profile-divider" />

        <div className="profile-info-grid">
          <div className="profile-info-item">
            <div className="info-icon">👤</div>
            <div className="info-content">
              <span className="info-label">ชื่อ-นามสกุล</span>
              <span className="info-value">{user?.first_name} {user?.last_name}</span>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="info-icon">📧</div>
            <div className="info-content">
              <span className="info-label">อีเมล</span>
              <span className="info-value">{user?.email}</span>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="info-icon">📞</div>
            <div className="info-content">
              <span className="info-label">เบอร์โทรศัพท์</span>
              <span className="info-value">{user?.phone || 'ไม่ได้ระบุ'}</span>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="info-icon">🔑</div>
            <div className="info-content">
              <span className="info-label">สถานะบัญชี</span>
              <span className="info-value status-active">● ปกติ (Active)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Navbar Component (อัปเดตใส่โลโก้วิทยาลัยคู่กับชื่อแบรนด์)
// -------------------------------------------------------------
function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef(null);

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsAdminDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img 
          src="/images (4).jpg" 
          alt="โลโก้วิทยาลัย" 
          style={{ 
            width: '38px', 
            height: '38px', 
            borderRadius: '50%', 
            objectFit: 'cover', 
            border: '2px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 0 10px rgba(37, 99, 235, 0.5)' 
          }} 
        />
        <Link to="/" style={{ fontFamily: "'Oxanium', sans-serif", fontSize: '22px', fontWeight: '800', color: '#ffffff', textDecoration: 'none', letterSpacing: '0.5px' }}>
          UDOM SHOP
        </Link>
      </div>

      <div className="navbar-links">
        <Link to="/" className="nav-link">หน้าร้านค้า</Link>
        
        <Link to="/cart" className="nav-link-cart">
          🛒 ตะกร้า ({totalItems})
        </Link>
        
        {!user ? (
          <>
            <Link to="/login" className="nav-link">เข้าสู่ระบบ</Link>
            <Link to="/register" className="nav-link-register">สมัครสมาชิก</Link>
          </>
        ) : (
          <>
            <Link to="/my-orders" className="nav-link">
              📋 ประวัติสั่งซื้อ
            </Link>

            <Link to="/profile" className="nav-link">
              👤 โปรไฟล์ ({user.first_name})
            </Link>

            {user.role === 'admin' && (
              <div className="admin-dropdown-container" ref={dropdownRef}>
                <button
                  onClick={() => setIsAdminDropdownOpen((prev) => !prev)}
                  className={`admin-dropdown-btn ${isAdminDropdownOpen ? 'open' : ''}`}
                  type="button"
                >
                  <span>⚙️ จัดการระบบ</span>
                  <span className="arrow">▾</span>
                </button>

                {isAdminDropdownOpen && (
                  <div className="admin-dropdown-menu">
                    <Link to="/admin" onClick={() => setIsAdminDropdownOpen(false)} className="admin-dropdown-item">
                      <span>📦</span> จัดการสินค้า
                    </Link>
                    <Link to="/admin/users" onClick={() => setIsAdminDropdownOpen(false)} className="admin-dropdown-item">
                      <span>👥</span> จัดการผู้ใช้
                    </Link>
                    <Link to="/admin/orders" onClick={() => setIsAdminDropdownOpen(false)} className="admin-dropdown-item">
                      <span>📋</span> จัดการออเดอร์
                    </Link>
                    <Link to="/admin/payment-settings" onClick={() => setIsAdminDropdownOpen(false)} className="admin-dropdown-item">
                      <span>💳</span> ตั้งค่าชำระเงิน
                    </Link>
                  </div>
                )}
              </div>
            )}

            <button onClick={() => setShowLogoutConfirm(true)} className="btn-logout">
              ออกจากระบบ
            </button>
          </>
        )}
      </div>

      {/* Modal ยืนยันการออกจากระบบ */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '35px 30px',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            textAlign: 'center',
            maxWidth: '400px',
            width: '90%',
            fontFamily: 'sans-serif',
            animation: 'fadeIn 0.2s ease-in-out'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
              ยืนยันการออกจากระบบ
            </h3>
            <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '24px' }}>
              คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบบัญชีนี้?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmLogout}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.25)',
                  transition: 'background 0.2s'
                }}
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// -------------------------------------------------------------
// Main App Component
// -------------------------------------------------------------
export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Toaster position="top-right" />
          <Navbar />

          <div className="app-container">
            <Routes>
              <Route path="/" element={<ProductList />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cart" element={<Cart />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/my-orders" element={<MyOrders />} />
                <Route path="/order-success/:id" element={<OrderSuccess />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUserManagement />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/payment-settings" element={<PaymentSettings />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}