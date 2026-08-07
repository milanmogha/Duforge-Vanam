// src/pages/WishlistContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchWishlist, addItemToWishlist, removeItemFromWishlist } from '../api/wishlistApi';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);

  // Load wishlist on mount using JWT token from localStorage
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setWishlistItems([]);
        return;
      }
      try {
        const serverWishlist = await fetchWishlist(token);
        setWishlistItems(serverWishlist.items || []);
      } catch (error) {
        console.error('Failed to fetch wishlist:', error);
        setWishlistItems([]);
      }
    })();
  }, []);

  const addToWishlist = async (product) => {
    const token = localStorage.getItem('token');
    if (!token || !product?._id) return;

    // Optimistic UI update: Add immediately to the frontend state
    setWishlistItems((prev) => {
      const exists = prev.some((p) => p._id === product._id);
      return exists ? prev : [...prev, product];
    });

    // Call the backend to save the change
    try {
      await addItemToWishlist(token, product._id);
    } catch (error) {
      console.error("Failed to add item to wishlist:", error);
      // Revert optimistic update on error
      setWishlistItems((prev) => prev.filter((p) => p._id !== product._id));
    }
  };

  const removeFromWishlist = async (productId) => {
    const token = localStorage.getItem('token');
    if (!token || !productId) return;

    const originalItems = [...wishlistItems];
    // Optimistic UI update: Remove immediately
    setWishlistItems((prev) => prev.filter((p) => p._id !== productId));
    
    // Call the backend
    try {
      await removeItemFromWishlist(token, productId);
    } catch (error) {
      console.error("Failed to remove item from wishlist:", error);
      // Revert on error
      setWishlistItems(originalItems);
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};