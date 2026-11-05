const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Full name is required'], trim: true, maxlength: 80 },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'] },
  password: { type: String, required: true, minlength: [6, 'Password must be at least 6 characters'], select: false },
  shopName: { type: String, required: [true, 'Shop name is required'], trim: true, maxlength: 100 },
  mobile: { type: String, required: [true, 'Mobile number is required'], trim: true,
    match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'] },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.matchPassword = function (plain) { return bcrypt.compare(plain, this.password); };

module.exports = mongoose.model('User', userSchema);
