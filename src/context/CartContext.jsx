// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth();

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  // เก็บ user.id ตัวก่อนหน้าไว้เทียบ เพื่อไม่ให้ล้างตะกร้าตอนเปิดหน้าเว็บ/รีเฟรชครั้งแรก
  const previousUserId = useRef(user?.id);

  // ล้างตะกร้าเฉพาะตอน "สลับผู้ใช้จริงๆ" (login คนละคน หรือ logout) เท่านั้น
  // ไม่ล้างตอนโหลดหน้าเว็บครั้งแรก เพราะ effect นี้จะรันทันทีตอน mount เสมอ
  useEffect(() => {
    if (previousUserId.current !== user?.id) {
      setCart([]);
      localStorage.removeItem('cart');
    }
    previousUserId.current = user?.id;
  }, [user?.id]);

  // บันทึกข้อมูลลง localStorage ทุกครั้งที่ตะกร้าเปลี่ยน
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // ฟังก์ชันสร้าง Key เฉพาะเพื่อแยก id และไซส์
  const getItemKey = (item) => `${item.id}_${item.selectedSize || 'nosize'}`;

  // เพิ่มสินค้าลงตะกร้า (แยกตาม id + selectedSize)
  // เพิ่มสินค้าลงตะกร้า (รองรับการระบุจำนวนชิ้น)
const addToCart = (product, quantityToAdd = 1) => {
  const qty = Number(quantityToAdd) || 1;
  const maxStock = Number(product.stock);
  const hasStockLimit = Number.isFinite(maxStock);

  setCart((prev) => {
    const targetKey = getItemKey(product);
    const existing = prev.find((item) => getItemKey(item) === targetKey);

    if (existing) {
      const newQty = existing.quantity + qty;
      const clampedQty = hasStockLimit ? Math.min(newQty, maxStock) : newQty;
      return prev.map((item) =>
        getItemKey(item) === targetKey
          ? { ...item, quantity: clampedQty }
          : item
      );
    }

    const clampedQty = hasStockLimit ? Math.min(qty, maxStock) : qty;
    return [...prev, { ...product, quantity: clampedQty, cartKey: targetKey }];
  });
};
  // ลบสินค้าออกจากตะกร้าโดยใช้ cartKey หรือ id+size
  const removeFromCart = (targetKey) => {
    setCart((prev) => prev.filter((item) => (item.cartKey || getItemKey(item)) !== targetKey));
  };

  // เปลี่ยนจำนวนสินค้า
  const updateQuantity = (targetKey, quantity) => {
    if (quantity <= 0) {
      removeFromCart(targetKey);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if ((item.cartKey || getItemKey(item)) !== targetKey) return item;
        const maxStock = Number(item.stock);
        const clampedQty = Number.isFinite(maxStock) ? Math.min(quantity, maxStock) : quantity;
        return { ...item, quantity: clampedQty };
      })
    );
  };

  // ล้างตะกร้าสินค้า
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  // คำนวณราคารวมทั้งหมด
  const totalPrice = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  // คำนวณจำนวนชิ้นรวม
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalPrice,
        totalItems,
        getItemKey,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);