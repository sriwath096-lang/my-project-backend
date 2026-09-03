import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API from '../services/api';

// นำเข้าไฟล์ CSS ที่แยกไว้
import './AdminUserManagement.css';

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); 
  
  // State สำหรับจัดการหน้า (Pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false); // ✅ State สำหรับเปิด/ปิดการแสดงรหัสผ่าน
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    role: 'customer',
    password: '' 
  });

  const fetchUsers = async () => {
    try {
      const res = await API.get('/users');
      setUsers(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'ไม่สามารถดึงข้อมูลผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (user) => {
    setEditingUser(user);
    setShowPassword(false); // รีเซ็ตสถานะซ่อนรหัสผ่านทุกครั้งที่กดเปิด Modal
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      role: user.role || 'customer',
      password: '' 
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = { ...formData };
      if (!dataToSubmit.password || dataToSubmit.password.trim() === '') {
        delete dataToSubmit.password;
      }

      await API.put(`/users/${editingUser.id}`, dataToSubmit);
      toast.success('แก้ไขข้อมูลผู้ใช้สำเร็จ');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดต');
    }
  };

  const handleDelete = async (id, email) => {
    if (!window.confirm(`ยืนยันลบผู้ใช้ ${email} ใช่หรือไม่?`)) return;
    try {
      await API.delete(`/users/${id}`);
      toast.success('ลบผู้ใช้สำเร็จ');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'ไม่สามารถลบผู้ใช้ได้');
    }
  };

  const getRoleBadgeClass = (role) => {
    if (role === 'admin') return 'role-admin';
    if (role === 'customer') return 'role-customer';
    return 'role-user';
  };

  const filteredUsers = users
    .filter((u) => {
      const term = searchTerm.toLowerCase();
      const idStr = String(u.id || '').toLowerCase();
      const firstName = (u.first_name || '').toLowerCase();
      const lastName = (u.last_name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();

      return (
        idStr.includes(term) ||
        firstName.includes(term) ||
        lastName.includes(term) ||
        email.includes(term) ||
        phone.includes(term)
      );
    })
    .sort((a, b) => a.id - b.id);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <div className="loading-state">กำลังโหลดข้อมูลผู้ใช้...</div>;

  return (
    <div className="admin-user-container">
      <h2 className="admin-page-title">👥 ระบบจัดการผู้ใช้งาน (User Management)</h2>

      {/* ช่องค้นหา */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 ค้นหา"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '0.95rem',
            outline: 'none',
            boxSizing: 'border-box',
            background: '#ffffff',
            color: '#1f2937'
          }}
        />
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280' }}>
          พบทั้งหมด {filteredUsers.length} รายการ
        </div>
      </div>
      
      {/* ตารางแสดงรายชื่อผู้ใช้ */}
      <div className="table-responsive-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '60px', textAlign: 'center' }}>ลำดับ</th>
              <th>ID</th>
              <th>ชื่อ-นามสกุล</th>
              <th>อีเมล</th>
              <th>เบอร์โทรศัพท์</th>
              <th>สิทธิ์ (Role)</th>
              <th style={{ textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((u, index) => {
                const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;

                return (
                  <tr key={u.id}>
                    <td style={{ textAlign: 'center', color: '#6b7280', fontWeight: 'bold' }}>
                      {rowNumber}
                    </td>
                    <td>{u.id}</td>
                    <td>{u.first_name} {u.last_name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || '-'}</td>
                    <td>
                      <span className={`role-badge ${getRoleBadgeClass(u.role)}`}>
                        {u.role ? u.role.toUpperCase() : 'CUSTOMER'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons" style={{ justifyContent: 'center' }}>
                        <button className="btn-action btn-edit" onClick={() => handleEditClick(u)}>
                            แก้ไข
                        </button>
                        <button className="btn-action btn-delete" onClick={() => handleDelete(u.id, u.email)}>
                            ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                  ไม่พบข้อมูลผู้ใช้งานที่ค้นหา
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="pagination-container" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', background: currentPage === 1 ? '#f3f4f6' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              ก่อนหน้า
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{ 
                  padding: '8px 12px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '4px', 
                  background: currentPage === page ? '#2563eb' : '#fff', 
                  color: currentPage === page ? '#fff' : '#374151',
                  cursor: 'pointer',
                  fontWeight: currentPage === page ? 'bold' : 'normal'
                }}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', background: currentPage === totalPages ? '#f3f4f6' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              ถัดไป
            </button>
          </div>
        )}
      </div>

      {/* Modal ป๊อบอัพสำหรับแก้ไขข้อมูลผู้ใช้ */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-header">✏️ แก้ไขข้อมูลผู้ใช้: {editingUser.email}</h3>
            
            <form onSubmit={handleUpdate} className="modal-form">
              <div className="form-group">
                <label>ชื่อ:</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>นามสกุล:</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>เบอร์โทรศัพท์:</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>รหัสผ่านใหม่ (หากไม่ต้องการเปลี่ยน ให้เว้นว่างไว้):</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="กรอกรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร"
                    style={{ width: '100%', paddingRight: '45px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      padding: '0'
                    }}
                  >
                    {showPassword ? 'ปิด' : 'แสดง'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>สิทธิ์ผู้ใช้งาน (Role):</label>
                <select
                  className="form-select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="user">User (ลูกค้าทั่วไป)</option>
                  <option value="customer">Customer (ลูกค้า)</option>
                  <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-submit">
                  บันทึกข้อมูล
                </button>
                <button type="button" className="btn-cancel" onClick={() => setEditingUser(null)}>
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}