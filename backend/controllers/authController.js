const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, shopName: u.shopName, mobile: u.mobile });

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, shopName, mobile } = req.body;
  const user = await User.create({ name, email, password, shopName, mobile });
  res.status(201).json({ token: sign(user._id), user: publicUser(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw httpError(400, 'Email and password are required');
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw httpError(401, 'Incorrect email or password');
  res.json({ token: sign(user._id), user: publicUser(user) });
});

exports.me = asyncHandler(async (req, res) => res.json({ user: publicUser(req.user) }));
