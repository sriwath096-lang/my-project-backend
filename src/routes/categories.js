const express = require('express');
const router = express.Router();
// สมมติว่าคุณมีไฟล์ db.js ที่ export การเชื่อมต่อฐานข้อมูลไว้
const db = require('../db'); 

// 1. ดึงรายการหมวดหมู่ทั้งหมด
router.get('/categories', async (req, res) => {
  try {
    // ใช้ Query จริงดึงข้อมูลจาก Database
    const [rows] = await db.query('SELECT * FROM categories');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลหมวดหมู่ได้' });
  }
});

// 2. เพิ่มหมวดหมู่ใหม่
router.post('/categories', async (req, res) => {
  try {
    const { name, parent_id } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'กรุณาระบุชื่อหมวดหมู่' });
    }
    
    // บันทึกลงฐานข้อมูลจริงๆ โดยส่งค่า parent_id (ถ้าไม่มีให้เป็น null)
    await db.query('INSERT INTO categories (name, parent_id) VALUES (?, ?)', [
      name, 
      parent_id || null
    ]);
    
    res.status(201).json({ message: 'เพิ่มหมวดหมู่สำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่' });
  }
});

// 3. ลบหมวดหมู่
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: 'ลบหมวดหมู่สำเร็จ' });
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบหมวดหมู่' });
  }
});

module.exports = router;