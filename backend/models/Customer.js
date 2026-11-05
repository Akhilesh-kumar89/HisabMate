const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: [true, 'Customer name is required'], trim: true, maxlength: 80 },
  mobile: { type: String, required: [true, 'Mobile number is required'], trim: true,
    match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'] },
  address: { type: String, required: [true, 'Address is required'], trim: true, maxlength: 250 },
  notes: { type: String, trim: true, maxlength: 500, default: '' },
}, { timestamps: true });

customerSchema.index({ user: 1, mobile: 1 }, { unique: true });
module.exports = mongoose.model('Customer', customerSchema);
