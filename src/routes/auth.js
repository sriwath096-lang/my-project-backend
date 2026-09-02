// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // ไฟล์เชื่อมต่อ MySQL

const JWT_SECRET = 'your_jwt_secret_key'; // คีย์สำหรับสร้าง Token

// 1. สมัครสมาชิก
router.post('/register', async (req, res) => {
  const { email, password, first_name, last_name, phone } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (email, password, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)';
    await db.query(sql, [email, hashedPassword, first_name, last_name, phone]);
    res.status(201).json({ message: 'ลงทะเบียนสำเร็จ' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// 2. เข้าสู่ระบบ
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(400).json({ message: 'ไม่พบบัญชีผู้ใช้' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'รหัสผ่านไม่ถูกต้อง' });

    // สร้าง JWT Token
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    
    delete user.password; // ไม่ส่ง password กลับไป
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// 3. ดึงข้อมูลผู้ใช้ปัจจุบัน (ใช้โทเคน)
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'ไม่มีสิทธิ์เข้าถึง' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [users] = await db.query('SELECT id, email, first_name, last_name, phone, role FROM users WHERE id = ?', [decoded.id]);
    if (users.length === 0) return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    
    res.json({ user: users[0] });
  } catch (err) {
    res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
});

module.exports = router;