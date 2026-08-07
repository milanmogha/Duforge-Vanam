// /controllers/orderController.js

import mongoose from 'mongoose';
import { Order } from '../models/Orders.js';
import AddressBook from '../models/AddressBook.js';
import Coupon from '../models/Coupon.js';
import PDFDocument from 'pdfkit';
import Product from '../models/Product.js';
import { sendAdminOrderNotification } from '../utils/emailService.js';
import { sendOrderConfirmationSMS, sendOrderStatusSMS } from '../utils/smsService.js';
import { createNotification } from './notificationController.js';
import shippingService from '../utils/shippingService.js';

// =================================================================
// 🛠️  Process & Save Order 
// =================================================================
export const processOrderCreation = async (orderData, userId, io) => {
  console.log(`🛠️ processOrderCreation called for User: ${userId}`);

  try {
    // 1. Generate Custom Order ID
    const dateStr = new Date().toISOString().split('T')[0].split('-').reverse().join('_');
    const count = await Order.countDocuments();
    const orderId = `OD-${dateStr}_${count + 1}`;

    // 2. Create Order (NO TRANSACTIONS)
    // Online (already-paid) orders are Confirmed/CAPTURED; COD orders await payment.
    const isOnlinePaid = String(orderData.paymentMethod).toLowerCase() === 'online';
    const newOrder = await Order.create({
      ...orderData,
      user: userId,
      orderId: orderId,
      status: isOnlinePaid ? 'Confirmed' : 'Pending',
      paymentStatus: isOnlinePaid ? 'CAPTURED' : 'PENDING',
    });

    // 3. Update Product Stock
    for (const item of orderData.products) {
      if (item.product) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } }
        );
      }
    }

    // 4. Update Coupon (if applied)
    if (orderData.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: orderData.couponCode },
        {
          $inc: { usedCount: 1 },
          $addToSet: { usedBy: userId }
        }
      );
    }

    // 5. Load full populated order
    const populatedOrder = await Order.findById(newOrder._id)
      .populate('products.product')
      .populate('userAddress');

    // 6. Emit socket event
    if (io) {
      io.emit('order-placed', populatedOrder);
    }

    // 7. Email notification (non-blocking)
    try {
      await sendAdminOrderNotification(populatedOrder);
    } catch (emailErr) {
      console.error('Failed to send email:', emailErr.message);
    }

    // 8. Create web notification for admin
    try {
      await createNotification({
        type: 'ORDER_PLACED',
        title: 'New Order Received',
        message: `Order ${orderId} has been placed. Payment: ${orderData.paymentMethod}`,
        orderId: newOrder._id,
        link: `/admin/orders/${newOrder._id}`,
        priority: 'high'
      });
    } catch (notifErr) {
      console.error('Failed to create notification:', notifErr.message);
    }

    // Note: SMS will be sent only when admin updates order status (not on order creation)

    return populatedOrder;

  } catch (error) {
    console.error('❌ Order creation failed:', error);
    throw error;
  }
};


// =================================================================
// 1) CREATE ORDER (Cash On Delivery)
// =================================================================
export const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId; // From verifyToken middleware
    const { userAddress, products, couponCode = null, paymentMethod = 'CashOnDelivery' } = req.body;

    if (!userAddress || !mongoose.Types.ObjectId.isValid(userAddress)) {
      return res.status(400).json({ message: 'A valid delivery address is required.' });
    }
    // Address must belong to the requester.
    const address = await AddressBook.findOne({ _id: userAddress, user: userId });
    if (!address) return res.status(404).json({ message: 'Address not found.' });

    const items = (Array.isArray(products) ? products : [])
      .map((it) => ({
        product: typeof it.product === 'object' ? it.product?._id : it.product,
        quantity: Math.max(1, Math.min(999, parseInt(it.quantity, 10) || 1)),
      }))
      .filter((it) => it.product && mongoose.Types.ObjectId.isValid(it.product));
    if (!items.length) return res.status(400).json({ message: 'Cart is empty or invalid.' });

    // Authoritative breakdown — client-supplied paymentBreakdown is ignored.
    const breakdown = await shippingService.calculateCharges({
      items, pincode: address.pincode, couponCode, userId,
    });

    const orderData = {
      userAddress,
      products: items,
      couponCode: breakdown.couponCode || null,
      paymentMethod: paymentMethod === 'Online' ? 'Online' : 'CashOnDelivery',
      paymentBreakdown: {
        itemsTotal: breakdown.itemsTotal,
        tax: breakdown.tax,
        shipping: breakdown.shipping,
        discount: breakdown.discount,
        total: breakdown.total,
      },
    };

    const newOrder = await processOrderCreation(orderData, userId, req.io);
    res.status(201).json(newOrder);
  } catch (err) {
    console.error('Error creating order:', err.message);
    res.status(500).json({ message: 'Failed to create order' });
  }
};

// =================================================================
// 1.5) CALCULATE DELIVERY CHARGES
// =================================================================
export const calculateDeliveryCharges = async (req, res) => {
  try {
    const { products, addressId } = req.body;
    const userId = req.user.userId;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Products array is required' });
    }

    if (!addressId) {
      return res.status(400).json({ message: 'Address ID is required' });
    }

    // Fetch address
    const address = await AddressBook.findOne({ _id: addressId, user: userId });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const shippingDetails = await shippingService.calculateCharges({
      items: products,
      pincode: address.pincode,
      userId,
    });

    res.json({
      zone: shippingDetails.zone,
      totalWeight: shippingDetails.weightKg,
      deliveryCharge: shippingDetails.shipping,
      shipping: shippingDetails.shipping,
      itemsTotal: shippingDetails.itemsTotal,
      discount: shippingDetails.discount,
      tax: shippingDetails.tax,
      total: shippingDetails.total,
    });
  } catch (err) {
    console.error('Error calculating delivery charges:', err);
    res.status(500).json({ message: 'Failed to calculate delivery charges' });
  }
};

// =================================================================
// 2) GET MY ORDERS (Optimized for Speed)
// =================================================================
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.userId;

    // OPTIMIZATION: Select only essential product fields + image1
    const orders = await Order.find({ user: userId })
      .populate({
        path: 'products.product',
        select: 'name price discount stock images.image1' // Only select needed fields including stock
      })
      .select('-__v') // Exclude version key
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance

    // OPTIMIZATION: Only send image1 (main product image) instead of all images
    const formattedOrders = orders.map(order => {
      if (order.products) {
        order.products = order.products.map(item => {
          if (item.product && item.product.images?.image1?.data) {
            const img = item.product.images.image1;
            item.product.imageUrl = `data:${img.contentType};base64,${img.data.toString('base64')}`;
            delete item.product.images; // Remove heavy binary data
          }
          return item;
        });
      }
      return order;
    });

    res.json(formattedOrders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// =================================================================
// 3) GET ORDER BY ID (Optimized)
// =================================================================
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { orderId: id };

    // OPTIMIZATION: Only populate needed fields
    const order = await Order.findOne(query)
      .populate({
        path: 'products.product',
        select: 'name price discount stock images.image1' // Only image1 for performance, include stock
      })
      .populate('userAddress')
      .lean();

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Security check - compare IDs as strings to avoid ObjectId vs string mismatch
    const orderUserId = order.user ? String(order.user) : null;
    const requesterId = req.user ? String(req.user.userId) : null;
    if (orderUserId !== requesterId && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Convert image1 to base64 URL
    if (order.products) {
      order.products = order.products.map(item => {
        if (item.product && item.product.images?.image1?.data) {
          const img = item.product.images.image1;
          item.product.imageUrl = `data:${img.contentType};base64,${img.data.toString('base64')}`;
          delete item.product.images;
        }
        return item;
      });
    }

    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =================================================================
// 4) GENERATE INVOICE (Your Original PDFKit Logic)
// =================================================================
export const generateOrderInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    // user check logic if needed...
    const order = await Order.findOne({ _id: id, user: req.user.userId })
      .populate('products.product')
      .populate('userAddress');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderId}.pdf`);

    doc.pipe(res);

    // --- Header ---
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Order ID: ${order.orderId}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.moveDown();

    // --- Address ---
    if (order.userAddress) {
      doc.text('Ship To:', { underline: true });
      doc.text(order.userAddress.fullName);
      doc.text(`${order.userAddress.flat}, ${order.userAddress.area}`);
      doc.text(`${order.userAddress.city}, ${order.userAddress.state} - ${order.userAddress.pincode}`);
      doc.text(`Phone: ${order.userAddress.phone}`);
    }
    doc.moveDown();

    // --- Table Header ---
    const tableTop = doc.y;
    doc.text('Product', 50, tableTop, { width: 250 });
    doc.text('Qty', 300, tableTop, { width: 50, align: 'center' });
    doc.text('Price', 350, tableTop, { width: 100, align: 'right' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // --- Table Rows ---
    order.products.forEach(item => {
      if (item.product) {
        const y = doc.y;
        doc.text(item.product.name, 50, y, { width: 250 });
        doc.text(item.quantity.toString(), 300, y, { width: 50, align: 'center' });
        doc.text(`Rs. ${item.product.price}`, 350, y, { width: 100, align: 'right' });
        doc.moveDown();
      }
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // --- Total ---
    doc.fontSize(14).text(`Total: Rs. ${order.paymentBreakdown.total}`, { align: 'right' });

    doc.end();

  } catch (err) {
    console.error('Invoice generation failed:', err);
    res.status(500).json({ message: 'Failed to generate invoice' });
  };
};


// =================================================================
// 5) UPDATE ORDER STATUS (Admin with Smart SMS Logic) — FIXED
// =================================================================
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingLink } = req.body;

    const order = await Order.findById(id).populate('userAddress');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const updateData = { status };
    if (trackingLink !== undefined) updateData.trackingLink = trackingLink;

    // Normalize status
    const normalizedStatus =
      status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    // Smart SMS flags
    let shouldSendSMS = false;
    let smsFlag = null;

    switch (normalizedStatus) {
      case 'Confirmed':
        if (!order.notificationFlags.confirmed_sms_sent) {
          shouldSendSMS = true;
          smsFlag = 'notificationFlags.confirmed_sms_sent';
        }
        break;
      case 'Shipped':
        if (!order.notificationFlags.shipped_sms_sent) {
          shouldSendSMS = true;
          smsFlag = 'notificationFlags.shipped_sms_sent';
        }
        break;
      case 'Delivered':
        if (!order.notificationFlags.delivered_sms_sent) {
          shouldSendSMS = true;
          smsFlag = 'notificationFlags.delivered_sms_sent';
        }
        break;
      case 'Cancelled':
        if (!order.notificationFlags.cancelled_sms_sent) {
          shouldSendSMS = true;
          smsFlag = 'notificationFlags.cancelled_sms_sent';
        }
        break;
    }

    await Order.findByIdAndUpdate(id, updateData);

    if (shouldSendSMS && smsFlag && order.userAddress?.phone) {
      try {
        await sendOrderStatusSMS(
          order.userAddress.phone,
          {
            orderId: order.orderId,
            customerName: order.userAddress.fullName,
            trackingLink: normalizedStatus === 'Shipped' ? trackingLink : null,
          },
          normalizedStatus
        );
        await Order.findByIdAndUpdate(id, { [smsFlag]: true });
      } catch (err) {
        console.error('SMS failed:', err.message);
      }
    }

    // 🔥 FETCH FRESH + LEAN ORDER (CRITICAL)
    const finalOrder = await Order.findById(id)
      .populate('userAddress')
      .populate({
        path: 'products.product',
        select: 'name price discount stock images.image1',
      })
      .lean();

    // 🔥 BUILD imageUrl WITHOUT mutating mongoose doc
    if (finalOrder.products) {
      finalOrder.products = finalOrder.products.map(item => {
        if (item.product?.images?.image1?.data) {
          const img = item.product.images.image1;
          return {
            ...item,
            product: {
              ...item.product,
              imageUrl: `data:${img.contentType};base64,${img.data.toString('base64')}`,
            },
          };
        }
        return item;
      });
    }

    // 🔥 SOCKET: send clean JSON
    if (req.io) {
      req.io.emit('order-status-updated', {
        orderId: finalOrder._id,
        status: finalOrder.status,
        order: finalOrder,
      });
    }

    res.json(finalOrder);
  } catch (err) {
    console.error('❌ updateOrderStatus error:', err);
    res.status(500).json({ message: err.message });
  }
};


// =================================================================
// 6) GET ALL ORDERS (Admin - Optimized)
// =================================================================
export const getAllOrders = async (req, res) => {
  try {
    // OPTIMIZATION: Only populate essential fields and image1
    const orders = await Order.find()
      .populate({
        path: 'products.product',
        select: 'name price discount stock images.image1' // Only image1 for performance, include stock
      })
      .populate('userAddress')
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    // Convert image1 to base64 URL for each product
    const formattedOrders = orders.map(order => {
      if (order.products) {
        order.products = order.products.map(item => {
          if (item.product && item.product.images?.image1?.data) {
            const img = item.product.images.image1;
            item.product.imageUrl = `data:${img.contentType};base64,${img.data.toString('base64')}`;
            delete item.product.images;
          }
          return item;
        });
      }
      return order;
    });

    res.json(formattedOrders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};