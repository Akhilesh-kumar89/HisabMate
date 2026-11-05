const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  amount: { type: Number, required: [true, 'Amount is required'], min: [1, 'Amount must be at least ₹1'] },
  paidAmount: { type: Number, default: 0, min: 0 },
  description: { type: String, required: [true, 'Description is required'], trim: true, maxlength: 250 },
  date: { type: Date, required: [true, 'Transaction date is required'], default: Date.now },
  dueDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
