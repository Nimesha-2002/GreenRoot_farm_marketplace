require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const result = await Product.updateMany(
    { status: { $exists: false } },
    { $set: { status: 'approved' } }
  );
  console.log(`Updated ${result.modifiedCount} products`);
  mongoose.disconnect();
});