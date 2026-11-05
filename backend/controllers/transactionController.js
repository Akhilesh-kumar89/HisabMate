const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { decorate } = require('../utils/status');

const fields = (b) => ({ amount: Number(b.amount), description: b.description, date: b.date || undefined, dueDate: b.dueDate || undefined });

exports.create = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.body.customer, user: req.user._id });
  if (!customer) throw httpError(400, 'Select a valid customer');
  const tx = await Transaction.create({ ...fields(req.body), customer: customer._id, user: req.user._id });
  res.status(201).json({ transaction: decorate(tx) });
});

exports.list = asyncHandler(async (req, res) => {
  const { customer, status, from, to } = req.query;
  const filter = { user: req.user._id };
  if (customer) filter.customer = customer;
  if (from || to) filter.date = { ...(from && { $gte: new Date(from) }), ...(to && { $lte: new Date(`${to}T23:59:59.999Z`) }) };
  const txs = await Transaction.find(filter).sort('-date -createdAt').populate('customer', 'name mobile').lean();
  let transactions = txs.map(decorate);
  if (status) transactions = transactions.filter((t) => t.status === status);
  res.json({ transactions });
});

exports.getOne = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({ _id: req.params.id, user: req.user._id }).populate('customer', 'name mobile').lean();
  if (!tx) throw httpError(404, 'Transaction not found');
  const payments = await Payment.find({ transaction: tx._id, user: req.user._id }).sort('-date').lean();
  res.json({ transaction: decorate(tx), payments });
});

exports.update = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!tx) throw httpError(404, 'Transaction not found');
  const next = fields(req.body);
  if (next.amount < tx.paidAmount) throw httpError(400, `Amount cannot be less than the ₹${tx.paidAmount} already paid`);
  tx.set({ ...next, dueDate: req.body.dueDate || null });
  await tx.save();
  res.json({ transaction: decorate(tx) });
});

exports.remove = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!tx) throw httpError(404, 'Transaction not found');
  await Payment.deleteMany({ transaction: tx._id });
  res.json({ message: 'Transaction deleted' });
});
