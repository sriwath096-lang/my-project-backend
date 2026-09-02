import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API from '../services/api';
import './AdminOrders.css'; 

export default function AdminOrders() {
  const getLocalDateString = (dateInput) => {
    const d = new Date(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getLocalMonthString = (dateInput) => {
    const d = new Date(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null); 
  
  const [selectedOrderItems, setSelectedOrderItems] = useState([]);
  const [orderItemsLoading, setOrderItemsLoading] = useState(false);
  const [currentOrderHeader, setCurrentOrderHeader] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showRevenueReport, setShowRevenueReport] = useState(false);

  const [filterType, setFilterType] = useState('day'); 
  const [reportStatusFilter, setReportStatusFilter] = useState('paid'); 
  const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date())); 
  const [selectedMonth, setSelectedMonth] = useState(getLocalMonthString(new Date())); 
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear())); 
  const [customStartDate, setCustomStartDate] = useState(getLocalDateString(new Date()));
  const [customEndDate, setCustomEndDate] = useState(getLocalDateString(new Date()));

  const [revenueProductSummary, setRevenueProductSummary] = useState([]);
  const [revenueReportLoading, setRevenueReportLoading] = useState(false);

  const [showClearModal, setShowClearModal] = useState(false);
  const [clearFilterType, setClearFilterType] = useState('day');
  const [clearDate, setClearDate] = useState(getLocalDateString(new Date()));
  const [clearMonth, setClearMonth] = useState(getLocalMonthString(new Date()));
  const [clearYear, setClearYear] = useState(String(new Date().getFullYear()));
  const [clearStartDate, setClearStartDate] = useState(getLocalDateString(new Date()));
  const [clearEndDate, setClearEndDate] = useState(getLocalDateString(new Date()));

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const triggerConfirm = (title, message, callback) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm: callback
    });
  };

  const fetchOrders = async () => {
    try {
      const res = await API.get('/admin/orders'); 
      setOrders(res.data);
    } catch (err) {
      toast.error('ไม่สามารถดึงข้อมูลคำสั่งซื้อได้');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleViewItems = async (order) => {
    setCurrentOrderHeader(order);
    setOrderItemsLoading(true);
    setSelectedOrderItems([]);
    try {
      const res = await API.get(`/admin/orders/${order.id}/items`);
      setSelectedOrderItems(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('ไม่สามารถดึงรายการสินค้าในออเดอร์ได้');
    } finally {
      setOrderItemsLoading(false);
    }
  };

  const handleStatusChange = (orderId, newStatus) => {
    const statusLabels = {
      pending: 'รอตรวจสอบ',
      paid: 'ยืนยันชำระเงินแล้ว',
      shipped: 'จัดส่งแล้ว',
      cancelled: 'ยกเลิก (คืนสต็อก)'
    };

    const statusName = statusLabels[newStatus] || newStatus;

    triggerConfirm(
      'ยืนยันการเปลี่ยนสถานะ',
      `คุณแน่ใจหรือไม่ว่าต้องการเปลี่ยนสถานะคำสั่งซื้อ #${orderId} เป็น "${statusName}"?`,
      async () => {
        try {
          await API.put(`/admin/orders/${orderId}/status`, { status: newStatus });
          toast.success(newStatus === 'cancelled' ? 'ยกเลิกออเดอร์และคืนสินค้าเข้าคลังเรียบร้อย!' : 'อัปเดตสถานะสำเร็จ!');
          
          setOrders(orders.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
          ));
        } catch (err) {
          toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
        }
      }
    );
  };

  const handleDeleteOrder = (orderId) => {
    triggerConfirm(
      'ยืนยันการลบคำสั่งซื้อ',
      `⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบคำสั่งซื้อ #${orderId}?\n(เมื่อลบแล้วจะไม่สามารถกู้คืนได้)`,
      async () => {
        try {
          await API.delete(`/admin/orders/${orderId}`);
          toast.success(`ลบคำสั่งซื้อ #${orderId} เรียบร้อยแล้ว`);
          setOrders(prev => prev.filter(order => order.id !== orderId));
        } catch (err) {
          console.error(err);
          toast.error('เกิดข้อผิดพลาดในการลบคำสั่งซื้อ');
        }
      }
    );
  };

  const ordersToClear = orders.filter(order => {
    const orderDateIso = getLocalDateString(order.created_at);
    const orderMonthIso = getLocalMonthString(order.created_at);
    const orderYearIso = String(new Date(order.created_at).getFullYear());

    if (clearFilterType === 'day') return orderDateIso === clearDate;
    if (clearFilterType === 'month') return orderMonthIso === clearMonth;
    if (clearFilterType === 'year') return orderYearIso === clearYear;
    if (clearFilterType === 'custom') return orderDateIso >= clearStartDate && orderDateIso <= clearEndDate;
    if (clearFilterType === 'all') return true;
    return false;
  });

  const handleClearOrdersSubmit = () => {
    if (ordersToClear.length === 0) {
      toast.error('ไม่พบรายการคำสั่งซื้อที่ตรงกับช่วงเวลาที่เลือก');
      return;
    }

    triggerConfirm(
      'ยืนยันการเคลียร์ออเดอร์',
      `🚨 เตือนสติ! คุณกำลังจะลบคำสั่งซื้อจำนวน ${ordersToClear.length} รายการ!\nคุณแน่ใจหรือไม่ที่จะลบข้อมูลช่วงเวลานี้?`,
      async () => {
        try {
          await API.post('/admin/orders/clear', {
            orderIds: ordersToClear.map(o => o.id),
            filterType: clearFilterType,
            date: clearDate,
            month: clearMonth,
            year: clearYear,
            startDate: clearStartDate,
            endDate: clearEndDate
          }).catch(async () => {
            await Promise.all(ordersToClear.map(o => API.delete(`/admin/orders/${o.id}`)));
          });

          toast.success(`เคลียร์คำสั่งซื้อเรียบร้อยแล้ว (${ordersToClear.length} รายการ)`);
          setShowClearModal(false);
          fetchOrders();
        } catch (err) {
          console.error(err);
          toast.error('เกิดข้อผิดพลาดในการเคลียร์คำสั่งซื้อ');
        }
      }
    );
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const getSlipUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const getProductImgUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/60?text=No+Image';
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const getCustomerPhone = (order) => {
    if (!order) return '-';
    if (order.user_phone) return order.user_phone;
    if (order.phone) return order.phone;

    const directKeys = [
      'phone_number', 'phoneNumber', 'phoneNo', 'phone_no',
      'tel', 'telephone', 'mobile', 'mobile_no', 'mobileNumber',
      'shipping_phone', 'shippingPhone', 'customer_phone', 'customerPhone',
      'user_tel', 'userTel', 'contact', 'contact_number'
    ];

    for (const key of directKeys) {
      if (order[key]) return order[key];
    }

    const nestedObjects = ['user', 'address', 'shipping', 'customer', 'profile', 'shipping_address'];
    for (const objKey of nestedObjects) {
      if (order[objKey] && typeof order[objKey] === 'object') {
        for (const key of directKeys) {
          if (order[objKey][key]) return order[objKey][key];
        }
      }
    }

    return '-';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="badge badge-pending">รอตรวจสอบ</span>;
      case 'paid': return <span className="badge badge-paid">ชำระเงินแล้ว</span>;
      case 'shipped': return <span className="badge badge-shipped">จัดส่งแล้ว</span>;
      case 'cancelled': return <span className="badge badge-cancelled">ยกเลิก</span>;
      default: return <span>{status}</span>;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const revenueFilteredOrders = orders.filter(order => {
    const status = order.status;
    
    if (reportStatusFilter !== 'all' && status !== reportStatusFilter) {
      return false; 
    }

    const orderDateIso = getLocalDateString(order.created_at);
    const orderMonthIso = getLocalMonthString(order.created_at);
    const orderYearIso = String(new Date(order.created_at).getFullYear());

    if (filterType === 'day') {
      return orderDateIso === selectedDate;
    } else if (filterType === 'month') {
      return orderMonthIso === selectedMonth;
    } else if (filterType === 'year') {
      return orderYearIso === selectedYear;
    } else if (filterType === 'custom') {
      return orderDateIso >= customStartDate && orderDateIso <= customEndDate;
    }
    return true; 
  });

  const totalRevenue = revenueFilteredOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
  const totalSuccessfulOrders = revenueFilteredOrders.length;

  useEffect(() => {
    if (showRevenueReport && revenueFilteredOrders.length > 0) {
      fetchRevenueProductSummary();
    } else {
      setRevenueProductSummary([]);
    }
  }, [showRevenueReport, filterType, reportStatusFilter, selectedDate, selectedMonth, selectedYear, customStartDate, customEndDate, orders]);

  const fetchRevenueProductSummary = async () => {
    setRevenueReportLoading(true);
    try {
      const promises = revenueFilteredOrders.map(order => 
        API.get(`/admin/orders/${order.id}/items`).then(res => res.data || []).catch(() => [])
      );
      const results = await Promise.all(promises);
      
      const productMap = {};
      results.forEach(items => {
        items.forEach(item => {
          const name = item.product_name || item.name || 'สินค้าไม่มีชื่อ';
          const image = item.product_image || item.image_url || item.image;
          const price = Number(item.price || 0);
          const qty = Number(item.quantity || 1);
          const size = item.size || item.selected_size || item.product_size || item.size_option || '';
          
          const mapKey = `${name}_${size}`;
          
          if (!productMap[mapKey]) {
            productMap[mapKey] = { name, size, image, totalQty: 0, totalRevenue: 0 };
          }
          productMap[mapKey].totalQty += qty;
          productMap[mapKey].totalRevenue += price * qty;
        });
      });

      const summaryList = Object.values(productMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
      setRevenueProductSummary(summaryList);
    } catch (err) {
      console.error(err);
      toast.error('ไม่สามารถโหลดสรุปรายการสินค้าได้');
    } finally {
      setRevenueReportLoading(false);
    }
  };

  const filteredOrders = orders
    .filter(order => {
      const term = searchTerm.toLowerCase();
      const dateObj = new Date(order.created_at);
      
      const dateFormatted = dateObj.toLocaleDateString('th-TH', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
      const dateIso = getLocalDateString(order.created_at);

      const idMatch = String(order.id).includes(term);
      const nameMatch = `${order.first_name || ''} ${order.last_name || ''}`.toLowerCase().includes(term);
      const emailMatch = (order.email || '').toLowerCase().includes(term);
      const phoneMatch = String(getCustomerPhone(order) || '').toLowerCase().includes(term);
      const dateMatch = dateFormatted.includes(term) || dateIso.includes(term);

      return idMatch || nameMatch || emailMatch || phoneMatch || dateMatch;
    })
    .sort((a, b) => a.id - b.id);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const reportTableOrders = revenueFilteredOrders.sort((a, b) => a.id - b.id);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>กำลังโหลดข้อมูล...</div>;

  return (
    <div className="admin-orders-container">
      <h2 className="admin-orders-title">
        📦 จัดการคำสั่งซื้อ (Admin)
      </h2>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
        <button 
          onClick={() => setShowRevenueReport(!showRevenueReport)}
          className="btn-action"
          style={{ background: '#2563eb', color: '#fff', borderColor: '#2563eb', padding: '10px 18px', fontSize: '15px', fontWeight: 'bold' }}
        >
          {showRevenueReport ? '📊 ซ่อนรายงานสรุปรายได้และสินค้า' : '📊 เปิดรายงานสรุปรายได้และสินค้าขายดี'}
        </button>

        {showRevenueReport && (
          <button 
            onClick={handlePrintPDF}
            className="btn-action"
            style={{ background: '#16a34a', color: '#fff', borderColor: '#16a34a', padding: '10px 18px', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            🖨️ พิมพ์ / บันทึกเป็น PDF
          </button>
        )}

        <button 
          onClick={() => setShowClearModal(true)}
          className="btn-action"
          style={{ background: '#ef4444', color: '#fff', borderColor: '#ef4444', padding: '10px 18px', fontSize: '15px', fontWeight: 'bold' }}
        >
          🗑️ เคลียร์ออเดอร์ตามช่วงเวลา
        </button>
      </div>

      {showRevenueReport && (
        <div className="revenue-summary-card" style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontWeight: '700', fontSize: '18px', color: '#1e293b', marginBottom: '16px' }}>
            📊 รายงานสรุปรายได้และสินค้าที่ขายได้
          </div>
          
          {/* จัดกล่องกรองข้อมูลให้อยู่ใน Grid สวยงาม เป็นระเบียบ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>ช่วงเวลา:</label>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="revenue-select"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
              >
                <option value="day">รายวัน</option>
                <option value="month">รายเดือน</option>
                <option value="year">รายปี</option>
                <option value="custom">กำหนดช่วงวันที่เอง (Custom)</option>
                <option value="all">ทั้งหมด</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>สถานะ:</label>
              <select 
                value={reportStatusFilter} 
                onChange={(e) => setReportStatusFilter(e.target.value)}
                className="revenue-select"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
              >
                <option value="all">ทั้งหมดทุกสถานะ</option>
                <option value="paid">ชำระเงินแล้ว (Paid)</option>
                <option value="shipped">จัดส่งแล้ว (Shipped)</option>
                <option value="pending">รอตรวจสอบ (Pending)</option>
                <option value="cancelled">ยกเลิก (Cancelled)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>ระบุเวลา:</label>
              {filterType === 'day' && (
                <input 
                  type="date" 
                  lang="en-GB"
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="revenue-date-input"
                  style={{ width: '100%', padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', boxSizing: 'border-box' }}
                />
              )}

              {filterType === 'month' && (
                <input 
                  type="month" 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="revenue-date-input"
                  style={{ width: '100%', padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', boxSizing: 'border-box' }}
                />
              )}

              {filterType === 'year' && (
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="revenue-select"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                >
                  {['2024', '2025', '2026', '2027', '2028'].map(yr => (
                    <option key={yr} value={yr}>ปี {yr}</option>
                  ))}
                </select>
              )}

              {filterType === 'all' && (
                <div style={{ fontSize: '13px', color: '#64748b', padding: '8px 0' }}>แสดงข้อมูลทุกช่วงเวลา</div>
              )}
            </div>

            {filterType === 'custom' && (
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>จากวันที่:</label>
                  <input 
                    type="date" 
                    lang="en-GB"
                    value={customStartDate} 
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="revenue-date-input"
                    style={{ width: '100%', padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>ถึงวันที่:</label>
                  <input 
                    type="date" 
                    lang="en-GB"
                    value={customEndDate} 
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="revenue-date-input"
                    style={{ width: '100%', padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="revenue-stats-grid">
            <div className="stat-box">
              <div className="stat-box-title">ยอดขายรวมตามสถานะที่เลือก</div>
              <div className="stat-box-value">฿{totalRevenue.toLocaleString()}</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-title">จำนวนออเดอร์</div>
              <div className="stat-box-sub">{totalSuccessfulOrders} คำสั่งซื้อ</div>
            </div>
          </div>

          <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <div style={{ fontWeight: '600', fontSize: '15px', color: '#1e293b', marginBottom: '12px' }}>
              🛒 รายการสินค้าในรายงานนี้
            </div>

            {revenueReportLoading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>กำลังคำนวณรายการสินค้า...</div>
            ) : revenueProductSummary.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                ไม่มีสินค้าในช่วงเวลาและสถานะดังกล่าว
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {revenueProductSummary.map((prod, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img 
                        src={getProductImgUrl(prod.image)} 
                        alt={prod.name} 
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} 
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                          {prod.name}
                          {prod.size && (
                            <span style={{ marginLeft: '6px', fontSize: '11px', background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                              ไซส์: {prod.size}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>จำนวน: <strong>{prod.totalQty}</strong> ชิ้น</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#16a34a', fontSize: '15px' }}>
                      ฿{prod.totalRevenue.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: '30px', borderTop: '2px solid #cbd5e1', paddingTop: '20px', clear: 'both' }}>
            <div style={{ fontWeight: '700', fontSize: '16px', color: '#1e293b', marginBottom: '12px' }}>
              📋 รายการออเดอร์ตามเงื่อนไขที่เลือก ({reportTableOrders.length} รายการ)
            </div>
            <div className="orders-table-wrapper" style={{ margin: 0, boxShadow: 'none' }}>
              <table className="orders-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center', width: '60px' }}>ลำดับ</th>
                    <th>รหัสออเดอร์</th>
                    <th>ลูกค้า</th>
                    <th>วันที่</th>
                    <th>ยอดรวม (บาท)</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {reportTableOrders.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                        ไม่มีรายการออเดอร์ในช่วงเวลาและสถานะดังกล่าว
                      </td>
                    </tr>
                  ) : (
                    reportTableOrders.map((order, index) => (
                      <tr key={order.id}>
                        <td style={{ textAlign: 'center', fontWeight: '600', color: '#64748b' }}>{index + 1}</td>
                        <td style={{ fontWeight: '600', color: '#1e293b' }}>#{order.id}</td>
                        <td style={{ color: '#475569', fontSize: '14px' }}>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>{order.first_name} {order.last_name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{getCustomerPhone(order)}</div>
                        </td>
                        <td style={{ color: '#475569', fontSize: '14px' }}>{formatDateTime(order.created_at)}</td>
                        <td style={{ fontWeight: '700', color: '#16a34a' }}>฿{Number(order.total_price).toLocaleString()}</td>
                        <td>{getStatusBadge(order.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="orders-toolbar">
        <input
          type="text"
          placeholder="🔍 ค้นหา (ชื่อ, อีเมล, เบอร์โทร, รหัสออเดอร์, วันที่)"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="order-search-input"
        />
        <div className="orders-count-text">
          พบทั้งหมด {filteredOrders.length} รายการ 
        </div>
      </div>

      <div className="orders-table-wrapper">
        <table className="orders-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'center', width: '60px' }}>ลำดับ</th>
              <th>รหัสออเดอร์</th>
              <th>ลูกค้า</th>
              <th>วันที่</th>
              <th>ยอดรวม (บาท)</th>
              <th style={{ textAlign: 'center' }}>รายการสินค้า</th>
              <th style={{ textAlign: 'center' }}>สลิปโอนเงิน</th>
              <th>สถานะ</th>
              <th style={{ textAlign: 'center', minWidth: '220px' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  ไม่พบรายการคำสั่งซื้อที่ค้นหา
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order, index) => (
                <tr key={order.id}>
                  <td style={{ textAlign: 'center', fontWeight: '600', color: '#64748b' }}>
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td style={{ fontWeight: '600', color: '#1e293b' }}>#{order.id}</td>
                  <td style={{ color: '#475569', fontSize: '14px' }}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{order.first_name} {order.last_name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {getCustomerPhone(order)}
                    </div>
                  </td>
                  <td style={{ color: '#475569', fontSize: '14px' }}>{formatDateTime(order.created_at)}</td>
                  <td style={{ fontWeight: '700', color: '#16a34a' }}>฿{Number(order.total_price).toLocaleString()}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => handleViewItems(order)} className="btn-action">
                      🔍 ดูสินค้า
                    </button>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {order.slip_image ? (
                      <button onClick={() => setSelectedSlip(order.slip_image)} className="btn-slip">
                        ดูสลิป
                      </button>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>ไม่มีสลิป</span>
                    )}
                  </td>
                  <td>{getStatusBadge(order.status || 'pending')}</td>

                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                      <select
                        value={order.status || 'pending'}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="status-select"
                        style={{ flex: 1 }}
                      >
                        <option value="pending">รอตรวจสอบ</option>
                        <option value="paid">ยืนยันชำระเงินแล้ว</option>
                        <option value="shipped">จัดส่งแล้ว</option>
                        <option value="cancelled">ยกเลิก (คืนสต็อก)</option>
                      </select>

                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        title="ลบคำสั่งซื้อนี้"
                        style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fca5a5',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        🗑️ ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="pagination-container">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="page-btn"
            >
              ก่อนหน้า
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`page-btn ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="page-btn"
            >
              ถัดไป
            </button>
          </div>
        )}
      </div>

      {showClearModal && (
        <div className="modal-overlay">
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', maxWidth: '500px', width: '100%', position: 'relative' }}>
            <button onClick={() => setShowClearModal(false)} className="modal-close-x">
              &times;
            </button>

            <h3 style={{ margin: '0 0 12px 0', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🗑️ เคลียร์คำสั่งซื้อตามช่วงเวลา
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
              เลือกช่วงเวลาที่ต้องการลบออเดอร์ออกจากระบบ (ไม่สามารถกู้คืนได้):
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  รูปแบบช่วงเวลา:
                </label>
                <select 
                  value={clearFilterType} 
                  onChange={(e) => setClearFilterType(e.target.value)}
                  className="revenue-select"
                  style={{ width: '100%', padding: '8px 12px' }}
                >
                  <option value="day">รายวัน (ระบุวัน)</option>
                  <option value="month">รายเดือน (ระบุเดือน/ปี)</option>
                  <option value="year">รายปี (ระบุปี)</option>
                  <option value="custom">กำหนดช่วงวันที่เอง (Custom)</option>
                  <option value="all">คำสั่งซื้อทั้งหมด (All)</option>
                </select>
              </div>

              {clearFilterType === 'day' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>เลือกวันที่:</label>
                  <input 
                    type="date" 
                    lang="en-GB"
                    value={clearDate} 
                    onChange={(e) => setClearDate(e.target.value)}
                    className="revenue-date-input"
                    style={{ width: '100%', boxSizing: 'border-box', paddingRight: '8px' }}
                  />
                </div>
              )}

              {clearFilterType === 'month' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>เลือกเดือน/ปี:</label>
                  <input 
                    type="month" 
                    value={clearMonth} 
                    onChange={(e) => setClearMonth(e.target.value)}
                    className="revenue-date-input"
                    style={{ width: '100%', boxSizing: 'border-box', paddingRight: '8px' }}
                  />
                </div>
              )}
              
              {clearFilterType === 'year' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>เลือกปี:</label>
                  <select 
                    value={clearYear} 
                    onChange={(e) => setClearYear(e.target.value)}
                    className="revenue-select"
                    style={{ width: '100%' }}
                  >
                    {['2024', '2025', '2026', '2027', '2028'].map(yr => (
                      <option key={yr} value={yr}>ปี {yr}</option>
                    ))}
                  </select>
                </div>
              )}

              {clearFilterType === 'custom' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>ตั้งแต่วันที่:</label>
                    <input 
                      type="date" 
                      value={clearStartDate} 
                      onChange={(e) => setClearStartDate(e.target.value)}
                      className="revenue-date-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>ถึงวันที่:</label>
                    <input 
                      type="date" 
                      value={clearEndDate} 
                      onChange={(e) => setClearEndDate(e.target.value)}
                      className="revenue-date-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '14px', color: '#991b1b' }}>
                  คำสั่งซื้อที่จะถูกลบ: <strong style={{ fontSize: '18px', color: '#dc2626' }}>{ordersToClear.length}</strong> รายการ
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowClearModal(false)}
                style={{ padding: '10px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#475569' }}
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleClearOrdersSubmit}
                disabled={ordersToClear.length === 0}
                style={{ 
                  padding: '10px 18px', 
                  background: ordersToClear.length === 0 ? '#fca5a5' : '#dc2626', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: ordersToClear.length === 0 ? 'not-allowed' : 'pointer', 
                  fontWeight: 'bold' 
                }}
              >
                ยืนยันลบ {ordersToClear.length} รายการ
              </button>
            </div>
          </div>
        </div>
      )}

      {currentOrderHeader && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={() => { setSelectedOrderItems([]); setCurrentOrderHeader(null); }} className="modal-close-x">
              &times;
            </button>
            <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>รายการสินค้าในออเดอร์ #{currentOrderHeader.id}</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
              ลูกค้า: {currentOrderHeader.first_name} {currentOrderHeader.last_name} | {getCustomerPhone(currentOrderHeader)} | ยอดรวม: ฿{Number(currentOrderHeader.total_price).toLocaleString()}
            </p>

            {orderItemsLoading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>กำลังโหลดรายการสินค้า...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedOrderItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>ไม่พบรายการสินค้าในคำสั่งซื้อนี้</div>
                ) : (
                  selectedOrderItems.map((item, index) => {
                    const itemName = item.product_name || item.name || 'สินค้าไม่มีชื่อ';
                    const itemImage = item.product_image || item.image_url || item.image;
                    const itemPrice = Number(item.price || 0);
                    const itemQty = Number(item.quantity || 1);
                    const itemSize = item.size || item.selected_size || item.product_size || item.size_option;

                    return (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <img 
                          src={getProductImgUrl(itemImage)} 
                          alt={itemName} 
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
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
                                fontWeight: '500'
                              }}>
                                ไซส์: {itemSize}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>ราคา: ฿{itemPrice.toLocaleString()} x {itemQty}</div>
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#16a34a' }}>
                          ฿{(itemPrice * itemQty).toLocaleString()}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedSlip && (
        <div className="modal-overlay" onClick={() => setSelectedSlip(null)}>
          <div className="modal-content" style={{ textAlign: 'center', maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedSlip(null)} className="modal-close-x">
              &times;
            </button>
            <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>หลักฐานการชำระเงิน (สลิปโอนเงิน)</h3>
            <img 
              src={getSlipUrl(selectedSlip)} 
              alt="Payment Slip" 
              style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
            />
          </div>
        </div>
      )}

      {confirmModal.show && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(6px)', zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center', padding: '32px 24px', borderRadius: '24px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '42px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
              {confirmModal.title}
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '50px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                  setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
