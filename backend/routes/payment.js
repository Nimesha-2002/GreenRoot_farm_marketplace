const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTPEmail } = require('./email');

// Simple in-memory OTP store (userId -> { otp, expires })
const otpStore = new Map();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, 'receipt-' + Date.now() + path.extname(file.originalname))
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|pdf/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs allowed!'));
    }
  }
});

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

// Bank slip upload route
router.post('/upload-receipt', verifyToken, upload.single('receipt'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({ receiptUrl: `/uploads/${req.file.filename}` });
});

// Generate PayHere hash
router.post('/hash', verifyToken, async (req, res) => {
  try {
    const { orderId, amount, currency } = req.body;
    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const secret = process.env.PAYHERE_SECRET;

    const hashedSecret = crypto
      .createHash('md5')
      .update(secret)
      .digest('hex')
      .toUpperCase();

    const hash = crypto
      .createHash('md5')
      .update(merchantId + orderId + amount + currency + hashedSecret)
      .digest('hex')
      .toUpperCase();

    res.json({ hash, merchantId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Payment notification (PayHere calls this)
router.post('/notify', async (req, res) => {
  try {
    const { order_id, status_code } = req.body;

    if (status_code === '2') {
      // Payment successful
      await Order.findByIdAndUpdate(order_id, { status: 'processing' });
    }

    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Generate OTP and send to customer email
router.post('/generate-otp', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a cryptographically random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in-memory with 5 minutes expiration
    otpStore.set(req.user.id, {
      otp,
      expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    // Send email
    await sendOTPEmail(user.email, otp);

    res.json({ message: 'OTP sent to your registered email successfully.' });
  } catch (err) {
    console.error('Error generating OTP:', err);
    res.status(500).json({ message: err.message || 'Error generating OTP' });
  }
});

// Verify OTP
router.post('/verify-otp', verifyToken, (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const record = otpStore.get(req.user.id);
    if (!record) {
      return res.status(400).json({ message: 'No OTP generated or OTP has expired. Please request a new one.' });
    }

    if (Date.now() > record.expires) {
      otpStore.delete(req.user.id);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Success - remove from store so it cannot be reused
    otpStore.delete(req.user.id);

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ message: err.message || 'Error verifying OTP' });
  }
});

module.exports = router;