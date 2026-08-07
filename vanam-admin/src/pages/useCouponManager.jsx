// src/hooks/useCouponManager.js

import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import {
  createCoupon,
  fetchAllCoupons,
  updateCoupon,
  deleteCoupon,
} from '../api/CouponApi';

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};


const BLANK_COUPON_FORM = {
  code: '',
  heading: '',
  description: '',
  expiryDate: getTodayDate(), // <-- Default to today
  expiryTime: '23:59',      // <-- Default to end of day
  usageLimit: 1,
  minOrderValue: 0,
  discountPercent: 0,
  discountAmount: 0,
  maxDiscountAmount: 0,
  visible: true,
  assignedTo: '',
};

export const useCouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(BLANK_COUPON_FORM);
  const [editingId, setEditingId] = useState(null);
  const adminToken = localStorage.getItem('adminToken');

  const loadCoupons = async () => {
    try {
      if (!adminToken) throw new Error('Not authenticated as admin');
      const data = await fetchAllCoupons(adminToken);
      setCoupons(data);
    } catch (err) {
      console.error('Failed to fetch coupons', err);
      alert(err.message || 'Could not load coupons.');
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: fieldValue }));
  };

  const generateCode = () => {
    const newCode = nanoid(8).toUpperCase();
    setFormData((prev) => ({ ...prev, code: newCode }));
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (!adminToken) throw new Error('Not authenticated as admin');

      // Combine date and time into a single ISO string
      const fullExpiryDate = new Date(`${formData.expiryDate}T${formData.expiryTime}:00`).toISOString();

      const payload = {
        ...formData,
        expiryDate: fullExpiryDate, // <-- Use the combined date
        code: formData.code.trim().toUpperCase(),
        usageLimit: Number(formData.usageLimit),
        minOrderValue: Number(formData.minOrderValue),
        discountPercent: Number(formData.discountPercent),
        discountAmount: Number(formData.discountAmount),
        maxDiscountAmount: Number(formData.maxDiscountAmount),
        assignedTo: formData.assignedTo.trim() || null,
      };
      // We don't want to send expiryTime to the API
      delete payload.expiryTime; 

      if (isEditing) {
        await updateCoupon(adminToken, editingId, payload);
        alert('Coupon updated successfully');
      } else {
        await createCoupon(adminToken, payload);
        alert('Coupon created successfully');
      }

      cancelEdit();
      loadCoupons();
    } catch (err) {
      console.error('Failed to save coupon', err);
      alert(err.response?.data?.error || err.message || 'Error saving coupon');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      if (!adminToken) throw new Error('Not authenticated as admin');
      await deleteCoupon(adminToken, id);
      loadCoupons();
    } catch (err) {
      console.error('Delete failed', err);
      alert(err.response?.data?.error || err.message || 'Error deleting coupon');
    }
  };

  const startEdit = (coupon) => {
    setEditingId(coupon._id);
    setIsEditing(true);

    // Split the ISO date string into date and time parts for the form
    const date = new Date(coupon.expiryDate);
    const datePart = date.toISOString().split('T')[0];
    const timePart = date.toTimeString().slice(0, 5);

    setFormData({
      ...coupon,
      expiryDate: datePart,
      expiryTime: timePart,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      assignedTo: coupon.assignedTo || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsEditing(false);
    setFormData(BLANK_COUPON_FORM);
  };

  return {
    coupons,
    formData,
    isEditing,
    handleChange,
    generateCode,
    handleCreateOrUpdate,
    handleDelete,
    startEdit,
    cancelEdit,
  };
};
