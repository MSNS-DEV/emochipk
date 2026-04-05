'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Cart, CartItem } from './types';

interface CartContextType {
  cart: Cart;
  itemCount: number;
  isLoading: boolean;
  addToCart: (variantId: string, productData: { name: string; price: number; image?: string }, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; error?: string }>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const SHIPPING_THRESHOLD = 5000;
const SHIPPING_COST = 250;

function createEmptyCart(): Cart {
  return {
    id: `cart-${Date.now()}`, items: [], subtotal: 0, discountAmount: 0,
    shippingAmount: 0, taxAmount: 0, total: 0, createdAt: new Date(), updatedAt: new Date(),
  };
}

function calculateTotals(items: CartItem[], couponDiscount = 0): Partial<Cart> {
  const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
  const shippingAmount = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = Math.max(0, subtotal - couponDiscount + shippingAmount);
  return { subtotal, discountAmount: couponDiscount, shippingAmount, taxAmount: 0, total };
}

/**
 * LocalStorage-backed cart for guest users.
 * Authenticated users should call api.cart.mergeGuestCart to sync on login.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(createEmptyCart);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('mochi_cart');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Cart;
        setCart({ ...parsed, ...calculateTotals(parsed.items, parsed.discountAmount) });
      } catch {
        localStorage.removeItem('mochi_cart');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('mochi_cart', JSON.stringify(cart));
  }, [cart, isLoading]);

  const addToCart = useCallback((variantId: string, productData: { name: string; price: number; image?: string }, quantity = 1) => {
    setCart((prev) => {
      const idx = prev.items.findIndex((i) => i.variantId === variantId);
      let items: CartItem[];
      if (idx > -1) {
        items = prev.items.map((item, i) => i === idx ? {
          ...item, quantity: item.quantity + quantity,
          totalPrice: item.unitPrice * (item.quantity + quantity),
        } : item);
      } else {
        const newItem: CartItem = {
          id: `item-${Date.now()}`, cartId: prev.id, variantId,
          variant: { id: variantId, name: productData.name, image: productData.image },
          quantity, unitPrice: productData.price, totalPrice: productData.price * quantity,
        };
        items = [...prev.items, newItem];
      }
      return { ...prev, items, ...calculateTotals(items, prev.discountAmount), updatedAt: new Date() };
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => {
      const items = prev.items.filter((i) => i.id !== itemId);
      return { ...prev, items, ...calculateTotals(items, prev.discountAmount), updatedAt: new Date() };
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) => {
      const items = prev.items.map((i) => i.id === itemId ? { ...i, quantity, totalPrice: i.unitPrice * quantity } : i);
      return { ...prev, items, ...calculateTotals(items, prev.discountAmount), updatedAt: new Date() };
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart(createEmptyCart());
    localStorage.removeItem('mochi_cart');
  }, []);

  const applyCoupon = useCallback(async (code: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise((r) => setTimeout(r, 400));
    const coupons: Record<string, number> = { WELCOME10: 0.10, MOCHI20: 0.20, EID500: 500 };
    const discount = coupons[code.toUpperCase()];
    if (!discount) return { success: false, error: 'Invalid coupon code' };
    setCart((prev) => {
      const amount = discount < 1 ? Math.round(prev.subtotal * discount) : discount;
      return { ...prev, ...calculateTotals(prev.items, amount), couponCode: code.toUpperCase(), updatedAt: new Date() };
    });
    return { success: true };
  }, []);

  const removeCoupon = useCallback(() => {
    setCart((prev) => ({ ...prev, ...calculateTotals(prev.items, 0), couponCode: undefined, updatedAt: new Date() }));
  }, []);

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, itemCount, isLoading, addToCart, removeFromCart, updateQuantity, clearCart, applyCoupon, removeCoupon }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
