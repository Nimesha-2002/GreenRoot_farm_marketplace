const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  addedDate: { type: Date, default: Date.now },
  
  hidden: { type: Boolean, default: false },
  hideReason: { type: String, default: '' }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  subCategory: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  batches: {
    type: [batchSchema],
    default: []
  },
  description: {
    type: String
  },

  image:{
    type:String,
    default:''
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farmerName: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);