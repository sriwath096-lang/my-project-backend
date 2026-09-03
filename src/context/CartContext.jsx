// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth();

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  // รีเซ็ตและล้างตะกร้าสินค้าเมื่อมีการสลับผู้ใช้หรือ Logout
  useEffect(() => {
    setCart([]);
    localStorage.removeItem('cart');
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
  setCart((prev) => {
    const targetKey = getItemKey(product);
    const existing = prev.find((item) => getItemKey(item) === targetKey);

    if (existing) {
      return prev.map((item) =>
        getItemKey(item) === targetKey
          ? { ...item, quantity: item.quantity + qty }
          : item
      );
    }
    return [...prev, { ...product, quantity: qty, cartKey: targetKey }];
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
      prev.map((item) =>
        (item.cartKey || getItemKey(item)) === targetKey ? { ...item, quantity } : item
      )
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