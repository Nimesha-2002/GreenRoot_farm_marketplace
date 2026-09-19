const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');
const { sendOrderConfirmation, sendFarmerNotification, sendStatusUpdate, sendFarmerCancellationNotification } = require('./email');
const User = require('../models/User');

// Middleware - verify token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Place order (consumer only)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { productId, quantity, deliveryAddress } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.quantity < quantity) return res.status(400).json({ message: 'Not enough stock' });

    let qtyToDeduct = quantity;
    let totalAmount = 0;

    if (product.batches && product.batches.length > 0) {
      // FIFO deduction across batches
      for (const batch of product.batches) {
        if (qtyToDeduct <= 0) break;
        if (batch.quantity <= 0 ) continue;
        if(batch.hidden) continue;

        const deductFromThisBatch = Math.min(batch.quantity, qtyToDeduct);
        totalAmount += deductFromThisBatch * batch.price;
        batch.quantity -= deductFromThisBatch;
        qtyToDeduct -= deductFromThisBatch;
      }

      product.quantity = product.batches
        .filter(b => !b.hidden)
        .reduce((sum, b) => sum + b.quantity, 0);

      // Update displayed price to next active batch
      const activeBatch = product.batches.find(b => b.quantity > 0 && !b.hidden);
      product.price = activeBatch ? activeBatch.price : product.price;
    } else {
      // Fallback for old products without batches
      totalAmount = product.price * quantity;
      product.quantity -= quantity;
    }


    const deliveryFee = Number(req.body.deliveryFee)||0;

    const order = new Order({
      consumer: req.user.id,
      consumerName: req.body.consumerName,
      product: productId,
      productName: product.name,
      subCategory: product.subCategory ||'',
      farmer: product.farmer,
      farmerName: product.farmerName,
      quantity,
      totalAmount: totalAmount+deliveryFee,
      deliveryFee,
      paymentMethod:req.body.paymentMethod ||'card',
      bankReceipt: req.body.bankReceipt || '',
      deliveryAddress
    });

    await order.save();
    await product.save();

    // Send emails
    try {
      const consumer = await User.findById(req.user.id);
      const farmer = await User.findById(product.farmer);

      const cartSummary = req.body.cartSummary || null;
      const cartTotal = cartSummary
        ? cartSummary.reduce((sum, item) => sum + item.price, 0) + deliveryFee
        : totalAmount + deliveryFee;

      const orderDetails = {
        productName: product.name,
        subCategory: product.subCategory || '',
        quantity,
        totalAmount: cartSummary ? cartTotal : totalAmount + deliveryFee,
        deliveryFee,
        paymentMethod: req.body.paymentMethod || 'card',
        deliveryAddress,
        consumerName: req.body.consumerName,
        farmerName: product.farmerName,
        cartSummary
      };

      const isCartOrder = req.body.isCart || false;
const isLastCartItem = req.body.isLastCartItem || false;

console.log('=== Email Debug ===');
console.log('isCart:', isCartOrder);
console.log('isLastCartItem:', isLastCartItem);
console.log('cartSummary:', req.body.cartSummary);
console.log('==================');


if (consumer?.email && (!isCartOrder || isLastCartItem)) {
  await sendOrderConfirmation(consumer.email, orderDetails);
}
const isLastItemForFarmer = req.body.isLastItemForFarmer || false;
const farmerCartSummary = req.body.farmerCartSummary || null;

if (farmer?.email && (!isCartOrder || isLastItemForFarmer)) {
  await sendFarmerNotification(farmer.email, {
    ...orderDetails,
    cartSummary: farmerCartSummary,
    totalAmount: farmerCartSummary
      ? farmerCartSummary.reduce((sum, item) => sum + item.price, 0)
      : totalAmount,
    deliveryFee: 0
  });
}
    } catch (emailErr) {
      console.log('Email sending error:', emailErr.message);
    }

    res.status(201).json({ message: 'Order placed!', order });

  } catch (err) {
    console.error('ORDER ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});
    
// Get consumer's orders
router.get('/my', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ consumer: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get farmer's orders
router.get('/farmer', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ farmer: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all orders (admin only)
router.get('/all', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update order status (farmer only)
// Update order status (farmer only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isTransitioningToCancelled = req.body.status === 'cancelled' && order.status !== 'cancelled';

    // If cancelling, restore stock back into batches
    if (isTransitioningToCancelled) {
      const product = await Product.findById(order.product);
      if (product) {
        if (product.batches && product.batches.length > 0) {
          // Restore as a new batch using the average price paid in this order
          const avgPrice = order.totalAmount / order.quantity;
          product.batches.unshift({
            quantity: order.quantity,
            price: Math.round(avgPrice)
          });

          product.quantity = product.batches
            .filter(b => !b.isHidden)
            .reduce((sum, b) => sum + b.quantity, 0);

          const activeBatch = product.batches.find(b => b.quantity > 0 && !b.isHidden);
          product.price = activeBatch ? activeBatch.price : product.price;
        } else {
          // Fallback for legacy products without batches
          product.quantity += order.quantity;
        }
        await product.save();
      }
    }

    order.status = req.body.status;
    await order.save();

    // Send status update email to consumer
    try {
      const consumer = await User.findById(order.consumer);
      console.log('=== Status Email Debug ===');
      console.log('Consumer found:', consumer?.email);
      console.log('New status:', req.body.status);
      if (consumer?.email) {
        await sendStatusUpdate(consumer.email, {
          orderId: order._id.toString().slice(-6).toUpperCase(),
          productName: order.productName,
          quantity: order.quantity,
          totalAmount: order.totalAmount,
          status: req.body.status,
          consumerName: order.consumerName,
          farmerName: order.farmerName,
          deliveryAddress: order.deliveryAddress
        });
        console.log('Status email sent!');
      }
      console.log('========================');
    } catch (emailErr) {
      console.log('Status email error:', emailErr.message);
    }

    // Send cancellation email to farmer if cancelled by customer (role === 'consumer')
    if (isTransitioningToCancelled && req.user.role === 'consumer') {
      try {
        const farmer = await User.findById(order.farmer);
        if (farmer?.email) {
          await sendFarmerCancellationNotification(farmer.email, {
            orderId: order._id.toString().slice(-6).toUpperCase(),
            productName: order.productName,
            subCategory: order.subCategory || '',
            quantity: order.quantity,
            totalAmount: order.totalAmount,
            deliveryFee: order.deliveryFee,
            consumerName: order.consumerName,
            farmerName: order.farmerName
          });
        }
      } catch (farmerEmailErr) {
        console.log('Farmer cancellation email error:', farmerEmailErr.message);
      }
    }

    res.json({ message: 'Order updated!', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;