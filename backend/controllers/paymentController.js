const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { decorate } = require('../utils/status');

exports.create = asyncHandler(async (req, res) => {
  const { transaction: txId, date, note, clientRef } = req.body;
  const amount = Math.round(Number(req.body.amount) * 100) / 100;
  if (!(amount > 0)) throw httpError(400, 'Enter a payment amount greater than zero');

  // Same clientRef = same payment. Return the original instead of recording it again.
  if (clientRef) {
    const existing = await Payment.findOne({ user: req.user._id, clientRef });
    if (existing) {
      const tx = await Transaction.findById(existing.transaction);
      return res.status(200).json({ payment: existing, transaction: decorate(tx), duplicate: true });
    }
  }

  const owned = await Transaction.findOne({ _id: txId, user: req.user._id });
  if (!owned) throw httpError(404, 'Transaction not found');

  // Atomic guard: the increment only applies if it does not push paid above the total,
  // so two simultaneous requests can never overpay.
  const tx = await Transaction.findOneAndUpdate(
    { _id: txId, user: req.user._id, $expr: { $lte: [{ $add: ['$paidAmount', amount] }, '$amount'] } },
    { $inc: { paidAmount: amount } },
    { new: true }
  );
  if (!tx) throw httpError(400, `Payment exceeds the remaining balance of ₹${Math.max(owned.amount - owned.paidAmount, 0)}`);

  try {
    const payment = await Payment.create({ user: req.user._id, customer: tx.customer, transaction: tx._id, amount, date: date || undefined, note, clientRef });
    res.status(201).json({ payment, transaction: decorate(tx) });
  } catch (err) {
    await Transaction.updateOne({ _id: tx._id }, { $inc: { paidAmount: -amount } }); // roll back
    throw err;
  }
});

exports.list = asyncHandler(async (req, res) => {
  const { customer, transaction, from, to } = req.query;
  const filter = { user: req.user._id };
  if (customer) filter.customer = customer;
  if (transaction) filter.transaction = transaction;
  if (from || to) filter.date = { ...(from && { $gte: new Date(from) }), ...(to && { $lte: new Date(`${to}T23:59:59.999Z`) }) };
  const payments = await Payment.find(filter).sort('-date -createdAt')
    .populate('customer', 'name mobile').populate('transaction', 'description amount').lean();
  res.json({ payments });
});
