// src/pages/CartContext.jsx
// Cart with guest support: signed-out shoppers keep a local cart
// (product IDs + quantities in localStorage), which is merged into the
// server cart on login. The server cart remains authoritative for checkout.

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  getCart as fetchCartApi,
  addToCart as addToCartApi,
  updateCartItem as updateCartItemApi,
  removeFromCart as removeFromCartApi,
  clearCart as clearCartApi
} from '../api/cartApi';
import { getProductById } from '../api/productApi';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const GUEST_CART_KEY = 'guest_cart_v1';

// localStorage holds only [{ productId, quantity }] — product data is
// re-fetched so stale prices/images never persist.
const readGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((e) => e && e.productId) : [];
  } catch {
    return [];
  }
};

const writeGuestCart = (entries) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(entries));
  } catch { /* storage full/blocked — cart stays in memory */ }
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const loadServerCart = useCallback(async (token) => {
    try {
      const data = await fetchCartApi(token);
      setCart(data);
    } catch (e) {
      console.error('Failed to load cart', e);
      setCart({ items: [] });
    }
  }, []);

  const loadGuestCart = useCallback(async () => {
    const entries = readGuestCart();
    if (entries.length === 0) {
      setCart({ items: [] });
      return;
    }
    const items = [];
    const validEntries = [];
    await Promise.all(
      entries.map(async (entry) => {
        try {
          const product = await getProductById(entry.productId);
          if (product && product._id) {
            items.push({ product, quantity: entry.quantity });
            validEntries.push(entry);
          }
        } catch { /* product removed — drop it from the guest cart */ }
      })
    );
    if (validEntries.length !== entries.length) writeGuestCart(validEntries);
    setCart({ items });
  }, []);

  // Load the right cart whenever auth state changes; merge the guest
  // cart into the server cart on login.
  useEffect(() => {
    const token = localStorage.getItem('token');
    (async () => {
      if (token && isLoggedIn) {
        const guestEntries = readGuestCart();
        if (guestEntries.length > 0) {
          for (const entry of guestEntries) {
            try {
              await addToCartApi(token, entry.productId, entry.quantity);
            } catch { /* out of stock / removed — skip */ }
          }
          localStorage.removeItem(GUEST_CART_KEY);
        }
        await loadServerCart(token);
      } else if (!isLoggedIn) {
        await loadGuestCart();
      }
    })();
  }, [isLoggedIn, loadServerCart, loadGuestCart]);

  const addToCart = async (product, quantity = 1) => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Guest: keep it local.
      const entries = readGuestCart();
      const existing = entries.find((e) => e.productId === product._id);
      if (existing) existing.quantity += quantity;
      else entries.push({ productId: product._id, quantity });
      writeGuestCart(entries);
      setCart((prev) => {
        const items = [...(prev.items || [])];
        const idx = items.findIndex((i) => i.product?._id === product._id);
        if (idx >= 0) items[idx] = { ...items[idx], quantity: items[idx].quantity + quantity };
        else items.push({ product, quantity });
        return { ...prev, items };
      });
      return;
    }
    try {
      const updated = await addToCartApi(token, product._id, quantity);
      setCart(updated);
    } catch (e) {
      console.error('Add to cart failed', e);
    }
  };

  const updateCartItem = async (productId, quantity) => {
    if (quantity < 1) {
      return removeFromCart(productId);
    }
    const token = localStorage.getItem('token');
    if (!token) {
      const entries = readGuestCart().map((e) =>
        e.productId === productId ? { ...e, quantity } : e
      );
      writeGuestCart(entries);
      setCart((prev) => ({
        ...prev,
        items: (prev.items || []).map((i) =>
          i.product?._id === productId ? { ...i, quantity } : i
        ),
      }));
      return;
    }
    try {
      const updated = await updateCartItemApi(token, productId, quantity);
      setCart(updated);
    } catch (e) {
      console.error('Update cart item failed', e);
    }
  };

  const removeFromCart = async (productId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      writeGuestCart(readGuestCart().filter((e) => e.productId !== productId));
      setCart((prev) => ({
        ...prev,
        items: (prev.items || []).filter((i) => i.product?._id !== productId),
      }));
      return;
    }
    try {
      const updated = await removeFromCartApi(token, productId);
      setCart(updated);
    } catch (e) {
      console.error('Remove from cart failed', e);
    }
  };

  const clearCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.removeItem(GUEST_CART_KEY);
      setCart({ items: [] });
      return;
    }
    try {
      await clearCartApi(token);
      setCart({ items: [] });
    } catch (e) {
      console.error('Clear cart failed', e);
    }
  };

  // Memoize the items array for performance and convenience
  const cartItems = useMemo(() => cart?.items || [], [cart]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const discountedPrice = (item.product.price * (100 - (item.product.discount || 0))) / 100;
      return sum + Math.floor(discountedPrice) * item.quantity;
    }, 0);
  }, [cartItems]);


  return (
    <CartContext.Provider
      value={{
        cart,          // The full cart object { items: [...] }
        cartItems,     // --- The convenient items array ---
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        cartTotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
