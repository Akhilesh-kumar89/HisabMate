const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { decorate } = require('../utils/status');

const pick = (b) => ({ name: b.name, mobile: b.mobile, address: b.address, notes: b.notes });
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Totals per customer: how much was lent, how much came back, what is still pending.
async function balances(userId) {
  const rows = await Transaction.aggregate([
    { $match: { user: userId } },
    { $group: { _id: '$customer', totalUdhaar: { $sum: '$amount' }, totalPaid: { $sum: '$paidAmount' } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r]));
}

exports.create = asyncHandler(async (req, res) => {
  const customer = await Customer.create({ ...pick(req.body), user: req.user._id });
  res.status(201).json({ customer });
});

exports.list = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  const q = (req.query.search || '').trim();
  if (q) filter.$or = [{ name: new RegExp(esc(q), 'i') }, { mobile: new RegExp(esc(q)) }];
  const [customers, map] = await Promise.all([Customer.find(filter).sort('-createdAt').lean(), balances(req.user._id)]);
  res.json({
    customers: customers.map((c) => {
      const b = map.get(String(c._id)) || { totalUdhaar: 0, totalPaid: 0 };
      return { ...c, totalUdhaar: b.totalUdhaar, totalPaid: b.totalPaid, pending: b.totalUdhaar - b.totalPaid };
    }),
  });
});

exports.getOne = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!customer) throw httpError(404, 'Customer not found');
  const [txs, payments] = await Promise.all([
    Transaction.find({ customer: customer._id, user: req.user._id }).sort('-date').lean(),
    Payment.find({ customer: customer._id, user: req.user._id }).sort('-date').populate('transaction', 'description').lean(),
  ]);
  const transactions = txs.map(decorate);
  const totalUdhaar = txs.reduce((s, t) => s + t.amount, 0);
  const totalPaid = txs.reduce((s, t) => s + t.paidAmount, 0);
  res.json({ customer, transactions, payments, totals: { totalUdhaar, totalPaid, pending: totalUdhaar - totalPaid } });
});

exports.update = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, user: req.user._id });
  if (!customer) throw httpError(404, 'Customer not found');
  customer.set(pick(req.body));
  await customer.save();
  res.json({ customer });
});

exports.remove = asyncHandler(async (req, res) => {
  const customer = await Customer.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!customer) throw httpError(404, 'Customer not found');
  await Promise.all([Transaction.deleteMany({ customer: customer._id }), Payment.deleteMany({ customer: customer._id })]);
  res.json({ message: 'Customer deleted' });
});
