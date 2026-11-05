const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true, index: true },
  amount: { type: Number, required: true, min: [1, 'Payment must be at least ₹1'] },
  date: { type: Date, default: Date.now },
  note: { type: String, trim: true, maxlength: 250, default: '' },
  // Client-generated key: a double-click or retry cannot create the same payment twice.
  clientRef: { type: String },
}, { timestamps: true });

paymentSchema.index({ user: 1, clientRef: 1 }, { unique: true, partialFilterExpression: { clientRef: { $type: 'string' } } });
module.exports = mongoose.model('Payment', paymentSchema);
