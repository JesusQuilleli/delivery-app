import React, { createContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export interface CartItem {
  product_id: number;
  name: string;
  unit_price: number;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: { id: number; name: string; price: number }) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  total: number;
  isCartOpen: boolean;
  setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CartContext = createContext<CartContextType>({} as CartContextType);

const getStoreSlug = (pathname: string) => {
  const first = pathname.split('/').filter(Boolean)[0];
  if (!first || ['admin', 'admin-login', 'superadmin'].includes(first)) return null;
  return first;
};

const storageKey = (slug: string) => `cart:${slug}`;

const readCart = (slug: string | null): CartItem[] => {
  if (!slug) return [];
  try {
    const saved = localStorage.getItem(storageKey(slug));
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const storeSlug = getStoreSlug(location.pathname);
  const [cart, setCart] = useState<CartItem[]>(() => readCart(storeSlug));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const activeSlug = useRef(storeSlug);

  useEffect(() => {
    if (activeSlug.current !== storeSlug) {
      activeSlug.current = storeSlug;
      setCart(readCart(storeSlug));
      return;
    }

    if (storeSlug) {
      localStorage.setItem(storageKey(storeSlug), JSON.stringify(cart));
    }
  }, [cart, storeSlug]);

  const addToCart = (product: { id: number; name: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product_id: product.id, name: product.name, unit_price: product.price, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total, isCartOpen, setIsCartOpen }}>
      {children}
    </CartContext.Provider>
  );
};
