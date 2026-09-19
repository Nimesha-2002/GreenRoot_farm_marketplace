const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads folder if not exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed!'));
    }
  }
});

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

// Get all approved products (public)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ status: 'approved' });
    
    // Recalculate quantity excluding hidden batches
    const productsWithVisibleQty = products.map(p => {
  const visibleBatches = p.batches ? p.batches.filter(b => !b.hidden) : [];
  const visibleQty = visibleBatches.reduce((sum, b) => sum + b.quantity, 0);
  const activeBatch = visibleBatches.find(b => b.quantity > 0);
  const visiblePrice = activeBatch ? activeBatch.price : p.price;
  return { ...p.toObject(), quantity: visibleQty, price: visiblePrice };
});
    
    res.json(productsWithVisibleQty);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get pending products (admin only)
router.get('/pending', verifyToken, async (req, res) => {
  try {
    const products = await Product.find({ status: 'pending' });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get farmer's own products
router.get('/my', verifyToken, async (req, res) => {
  try {
    const products = await Product.find({ farmer: req.user.id });
    const productsWithVisibleQty = products.map(p => {
      const visibleBatches = p.batches ? p.batches.filter(b => !b.hidden) : [];
      const visibleQty = visibleBatches.reduce((sum, b) => sum + b.quantity, 0);
      const activeBatch = visibleBatches.find(b => b.quantity > 0);
      const visiblePrice = activeBatch ? activeBatch.price : p.price;
      return { ...p.toObject(), quantity: visibleQty, price: visiblePrice };
    });
    res.json(productsWithVisibleQty);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add product (farmer only)
router.post('/', verifyToken,upload.single('image'), async (req, res) => {
  try {
    const { name, category,subCategory, price, quantity, description, farmerName } = req.body;

    const existingProduct = await Product.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      subCategory: { $regex: new RegExp(`^${req.body.subCategory || ''}$`, 'i') },
      farmer: req.user.id
    });

    if (existingProduct) {
      // Restock = add a NEW batch (don't overwrite old price), no re-approval needed
      if (!existingProduct.batches || existingProduct.batches.length === 0) {
        existingProduct.batches = [{
          quantity: existingProduct.quantity,
          price: existingProduct.price
        }];
      }

      // Only add a new batch if restock quantity is actually greater than 0
      if (Number(quantity) > 0) {
        existingProduct.batches.push({
          quantity: Number(quantity),
          price: Number(price)
        });
      }

      existingProduct.quantity = existingProduct.batches
  .filter(b => !b.hidden)
  .reduce((sum, b) => sum + b.quantity, 0);

const activeBatch = existingProduct.batches.find(b => b.quantity > 0 && !b.hidden);
      existingProduct.price = activeBatch ? activeBatch.price : existingProduct.price;

      await existingProduct.save();
      return res.status(200).json({ message: 'Stock added!', product: existingProduct });
    }

    // New product - requires admin approval
    const product = new Product({
      name, category,subCategory, price, quantity, description,
      image:req.file? `/uploads/${req.file.filename}`:'',
      farmer: req.user.id,
      farmerName,
      status: 'pending',
      batches: [{ quantity: Number(quantity), price: Number(price) }]
    });
    await product.save();
    res.status(201).json({ message: 'Product submitted for approval!', product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update product (farmer only)
router.put('/:id', verifyToken,upload.single('image'), async (req, res) => {
  try {
    const { name, category, subCategory, description } = req.body;
const updateData = { name, category, subCategory, description };
if (req.file) updateData.image = `/uploads/${req.file.filename}`;

const product = await Product.findByIdAndUpdate(
  req.params.id,
  updateData,
  { new: true }
);
    res.json({ message: 'Product updated!', product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve or reject product (admin only)
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: `Product ${status}!`, product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete product (farmer only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Hide batch (farmer or admin only)
router.put('/:productId/batches/:batchId/hide', verifyToken, async (req, res) => {
  try {
    const { productId, batchId } = req.params;
    const { hideReason } = req.body;

    if (!hideReason || !hideReason.trim()) {
      return res.status(400).json({ message: 'Hide reason is required.' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    // Check authorization: must be admin or the farmer owner
    if (req.user.role !== 'admin' && product.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const batch = product.batches.id(batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found.' });

    batch.hidden = true;
batch.hideReason = hideReason;

product.quantity = product.batches
  .filter(b => !b.hidden)
  .reduce((sum, b) => sum + b.quantity, 0);

const activeBatch = product.batches.find(b => b.quantity > 0 && !b.hidden);
    product.price = activeBatch ? activeBatch.price : product.price;

    await product.save();
    res.json({ message: 'Batch hidden successfully', product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Unhide batch (farmer or admin only)
router.put('/:productId/batches/:batchId/unhide', verifyToken, async (req, res) => {
  try {
    const { productId, batchId } = req.params;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    if (req.user.role !== 'admin' && product.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const batch = product.batches.id(batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found.' });

    batch.hidden = false;
    batch.hideReason = '';

    product.quantity = product.batches
      .filter(b => !b.hidden)
      .reduce((sum, b) => sum + b.quantity, 0);

    const activeBatch = product.batches.find(b => b.quantity > 0 && !b.hidden);
    product.price = activeBatch ? activeBatch.price : product.price;

    await product.save();
    res.json({ message: 'Batch unhidden successfully', product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;