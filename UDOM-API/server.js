const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const db = require('./db');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// เปิดให้เข้าถึงรูปเก่าที่ยังอยู่ในโฟลเดอร์ uploads (ไฟล์ที่มากับโค้ดตอน deploy เท่านั้น
// รูปที่อัปโหลดใหม่หลังจากนี้จะถูกส่งไปเก็บที่ Cloudinary แทน เพราะ Vercel เขียนไฟล์ลงดิสก์ถาวรไม่ได้)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ตั้งค่า Cloudinary จาก Environment Variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// อัปโหลดไฟล์ (buffer) ขึ้น Cloudinary แล้วคืนค่า URL แบบ https
const uploadBufferToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

// ตั้งค่า Multer ให้เก็บไฟล์ไว้ใน memory ก่อน (ไม่เขียนลงดิสก์) แล้วค่อยส่งต่อขึ้น Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น'));
    }
  }
});

// Auth Middlewares
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'ต้องการ Token ในการเข้าถึง' });

  jwt.verify(token, process.env.JWT_SECRET || 'secretkey', (err, user) => {
    if (err) return res.status(403).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'ไม่มีสิทธิ์ใช้งาน' });
  }
  next();
};

// ==========================================
// 1. Auth APIs
// ==========================================

app.post('/api/register', async (req, res) => {
  const { first_name, last_name, email, password, phone } = req.body;

  if (!email || !password || !first_name) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
  }

  try {
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (first_name, last_name, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [first_name, last_name || '', email, hashedPassword, phone || '', 'user']
    );

    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ', userId: result.insertId });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลงทะเบียน', error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'ไม่พบอีเมลนี้ในระบบ' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: { id: user.id, first_name: user.first_name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
});

app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, first_name, last_name, email, phone, role FROM users WHERE id = ?',
      [req.user.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้นี้' });
    }
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลส่วนตัว' });
  }
});

// ==========================================
// 2. User Management APIs
// ==========================================

app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, first_name, last_name, email, phone, role, created_at FROM users ORDER BY id DESC'
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' });
  }
});

app.put('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
  const { first_name, last_name, phone, role, password } = req.body;
  const userId = req.params.id;

  try {
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE users SET first_name = ?, last_name = ?, phone = ?, role = ?, password = ? WHERE id = ?',
        [first_name, last_name, phone, role, hashedPassword, userId]
      );
    } else {
      await db.query(
        'UPDATE users SET first_name = ?, last_name = ?, phone = ?, role = ? WHERE id = ?',
        [first_name, last_name, phone, role, userId]
      );
    }
    res.json({ message: 'อัปเดตข้อมูลผู้ใช้สำเร็จ' });
  } catch (err) {
    console.error('Update User Error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้' });
  }
});

app.delete('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
  const userId = req.params.id;
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ message: 'ไม่สามารถลบบัญชีผู้ใช้ที่กำลังใช้งานอยู่ได้' });
  }

  try {
    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'ลบผู้ใช้สำเร็จ' });
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบผู้ใช้' });
  }
});

// ==========================================
// 3. Category APIs
// ==========================================

app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY id DESC');
    res.json(categories);
  } catch (err) {
    console.error('Fetch Categories Error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' });
  }
});

app.post('/api/categories', authenticateToken, isAdmin, async (req, res) => {
  const { name, parent_id } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อหมวดหมู่' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM categories WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'มีหมวดหมู่นี้อยู่ในระบบแล้ว' });
    }

    const [result] = await db.query(
      'INSERT INTO categories (name, parent_id) VALUES (?, ?)',
      [name, parent_id || null]
    );
    res.status(201).json({
      message: 'เพิ่มหมวดหมู่สำเร็จ',
      id: result.insertId,
      name,
      parent_id: parent_id || null
    });
  } catch (err) {
    console.error('Create Category Error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่' });
  }
});

app.delete('/api/categories/:id', authenticateToken, isAdmin, async (req, res) => {
  const categoryId = req.params.id;
  try {
    await db.query('DELETE FROM categories WHERE id = ?', [categoryId]);
    res.json({ message: 'ลบหมวดหมู่สำเร็จ' });
  } catch (err) {
    console.error('Delete Category Error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบหมวดหมู่' });
  }
});

// ==========================================
// 3.5. Payment Settings APIs (ข้อมูลบัญชี + QR สำหรับหน้าชำระเงิน)
// ==========================================
app.get('/api/payment-settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM payment_settings ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) {
      return res.json({ bank_name: '', account_name: '', account_number: '', qr_image_url: '' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Fetch Payment Settings Error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลช่องทางการชำระเงิน' });
  }
});

app.put('/api/payment-settings', authenticateToken, isAdmin, upload.single('qr_image'), async (req, res) => {
  const { bank_name, account_name, account_number, existing_qr_image_url } = req.body;

  try {
    let qrImageUrl = existing_qr_image_url || '';
    if (req.file) {
      qrImageUrl = await uploadBufferToCloudinary(req.file.buffer, 'udom/payment-qr');
    }

    const [rows] = await db.query('SELECT id FROM payment_settings ORDER BY id DESC LIMIT 1');

    if (rows.length === 0) {
      await db.query(
        'INSERT INTO payment_settings (bank_name, account_name, account_number, qr_image_url) VALUES (?, ?, ?, ?)',
        [bank_name, account_name, account_number, qrImageUrl]
      );
    } else {
      await db.query(
        'UPDATE payment_settings SET bank_name = ?, account_name = ?, account_number = ?, qr_image_url = ? WHERE id = ?',
        [bank_name, account_name, account_number, qrImageUrl, rows[0].id]
      );
    }

    res.json({ message: 'บันทึกช่องทางการชำระเงินเรียบร้อยแล้ว', qr_image_url: qrImageUrl });
  } catch (err) {
    console.error('Update Payment Settings Error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกช่องทางการชำระเงิน' });
  }
});

// ==========================================
// 4. Product APIs
// ==========================================

app.get('/api/products', async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products ORDER BY id DESC');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' });
  }
});

app.post('/api/products', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  const { name, description, price, stock, category_id, image_url, sizes } = req.body;

  try {
    let finalImageUrl = image_url || '';
    if (req.file) {
      finalImageUrl = await uploadBufferToCloudinary(req.file.buffer, 'udom/products');
    }

    const [result] = await db.query(
      'INSERT INTO products (name, description, price, stock, image_url, category_id, sizes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, price, stock, finalImageUrl, category_id || null, sizes || null]
    );

    res.status(201).json({ message: 'เพิ่มสินค้าสำเร็จ', id: result.insertId, image_url: finalImageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มสินค้า' });
  }
});

app.put('/api/products/:id', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  const { name, description, price, stock, category_id, image_url, sizes } = req.body;
  const productId = req.params.id;

  try {
    let finalImageUrl = image_url;
    if (req.file) {
      finalImageUrl = await uploadBufferToCloudinary(req.file.buffer, 'udom/products');
    }

    await db.query(
      'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category_id = ?, image_url = ?, sizes = ? WHERE id = ?',
      [name, description, price, stock, category_id || null, finalImageUrl, sizes || null, productId]
    );

    res.json({ message: 'อัปเดตข้อมูลและแก้ไขสินค้าสำเร็จ', image_url: finalImageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขสินค้า' });
  }
});

app.delete('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'ลบสินค้าสำเร็จ' });
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบสินค้า' });
  }
});

// ==========================================
// 5. Order APIs
// ==========================================

app.post('/api/orders', authenticateToken, upload.single('slip_image'), async (req, res) => {
  try {
    const items = JSON.parse(req.body.items);
    const total_price = req.body.total_price;
    const userId = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'ไม่มีสินค้าในตะกร้า' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'กรุณาแนบหลักฐานการโอนเงิน (สลิป)' });
    }

    const slipImageUrl = await uploadBufferToCloudinary(req.file.buffer, 'udom/slips');
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [orderResult] = await connection.query(
        'INSERT INTO orders (user_id, total_price, slip_image, status) VALUES (?, ?, ?, ?)',
        [userId, total_price, slipImageUrl, 'pending']
      );
      const orderId = orderResult.insertId;

      const orderItemsValues = items.map(item => [
        orderId,
        item.id,
        item.quantity,
        item.price,
        item.selectedSize || null
      ]);

      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price, size) VALUES ?',
        [orderItemsValues]
      );

      for (const item of items) {
        const [rows] = await connection.query('SELECT stock, sizes FROM products WHERE id = ? FOR UPDATE', [item.id]);

        if (rows.length > 0) {
          const product = rows[0];
          let newSizes = null;
          const buyQty = Number(item.quantity) || 1;

          if (product.sizes) {
            const sizesObj = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;

            if (item.selectedSize && sizesObj[item.selectedSize] !== undefined) {
              const availableForSize = Number(sizesObj[item.selectedSize]) || 0;
              if (buyQty > availableForSize) {
                await connection.rollback();
                return res.status(400).json({ message: `สินค้าไซส์ ${item.selectedSize} เหลือไม่พอ (เหลือ ${availableForSize} ชิ้น)` });
              }
              sizesObj[item.selectedSize] = availableForSize - buyQty;
              newSizes = JSON.stringify(sizesObj);
            }
          } else {
            const availableStock = Number(product.stock) || 0;
            if (buyQty > availableStock) {
              await connection.rollback();
              return res.status(400).json({ message: `สินค้าเหลือไม่พอ (เหลือ ${availableStock} ชิ้น)` });
            }
          }

          await connection.query(
            'UPDATE products SET stock = GREATEST(0, stock - ?), sizes = COALESCE(?, sizes) WHERE id = ?',
            [buyQty, newSizes, item.id]
          );
        }
      }

      await connection.commit();
      res.status(201).json({ message: 'สร้างคำสั่งซื้อและแนบสลิปสำเร็จ', orderId });
    } catch (err) {
      await connection.rollback();
      console.error(err);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสั่งซื้อสินค้า' });
    } finally {
      if (connection) connection.release();
    }
  } catch (err) {
    res.status(400).json({ message: 'รูปแบบข้อมูลไม่ถูกต้อง' });
  }
});

app.get('/api/orders/my-orders', authenticateToken, async (req, res) => {
  try {
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    for (let order of orders) {
      const [items] = await db.query(
        `SELECT 
          oi.id,
          oi.product_id,
          oi.quantity,
          oi.price,
          oi.size,
          p.name,
          p.image_url AS image
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (err) {
    console.error('Fetch My Orders Error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ' });
  }
});

app.get('/api/admin/orders', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, u.first_name, u.last_name, u.email, u.phone AS user_phone 
       FROM orders o 
       LEFT JOIN users u ON o.user_id = u.id 
       ORDER BY o.created_at DESC`
    );
    res.json(orders);
  } catch (err) {
    console.error('Fetch Admin Orders Error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

app.get('/api/admin/orders/:id/items', authenticateToken, isAdmin, async (req, res) => {
  try {
    const orderId = req.params.id;

    const [items] = await db.query(
      `SELECT 
         oi.*, 
         p.name AS product_name, 
         p.image_url AS product_image 
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    res.json(items);
  } catch (err) {
    console.error('Fetch Order Items Error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการสินค้าในออเดอร์' });
  }
});

app.put('/api/admin/orders/:id/status', authenticateToken, isAdmin, async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  const validStatuses = ['pending', 'paid', 'shipped', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [orders] = await connection.query('SELECT status FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      await connection.release();
      return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อนี้' });
    }
    const oldStatus = orders[0].status;

    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      const [items] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
      for (const item of items) {
        await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
    }

    await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);

    await connection.commit();
    res.json({ message: 'อัปเดตสถานะคำสั่งซื้อสำเร็จ' });
  } catch (err) {
    await connection.rollback();
    console.error('Update Order Status Error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะคำสั่งซื้อ' });
  } finally {
    if (connection) connection.release();
  }
});

app.delete('/api/admin/orders/:id', authenticateToken, isAdmin, async (req, res) => {
  const orderId = req.params.id;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [orders] = await connection.query('SELECT id FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      await connection.release();
      return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อนี้' });
    }

    await connection.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
    await connection.query('DELETE FROM orders WHERE id = ?', [orderId]);

    await connection.commit();
    res.json({ message: 'ลบคำสั่งซื้อสำเร็จ' });
  } catch (err) {
    await connection.rollback();
    console.error('Delete Order Error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบคำสั่งซื้อ' });
  } finally {
    if (connection) connection.release();
  }
});

// ==========================================
// 6. Start Server
// ==========================================
const PORT = process.env.PORT || 5000;

// รัน app.listen() เฉพาะตอนพัฒนาบนเครื่อง (local) เท่านั้น
// บน Vercel จะไม่เรียก listen() เพราะ Vercel จัดการ request แบบ Serverless Function เอง
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
}

module.exports = app;