const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const asyncHandler = require('../utils/asyncHandler');
const { decorate, todayKey, dayKey } = require('../utils/status');

const monthKey = (d) => new Date(d).toISOString().slice(0, 7);

exports.stats = asyncHandler(async (req, res) => {
  const user = req.user._id;
  const [customers, txDocs, payments] = await Promise.all([
    Customer.find({ user }).sort('-createdAt').lean(),
    Transaction.find({ user }).sort('-date -createdAt').populate('customer', 'name mobile').lean(),
    Payment.find({ user }).select('amount date').lean(),
  ]);
  const txs = txDocs.map(decorate);
  const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
  const totalUdhaar = sum(txs, (t) => t.amount);
  const totalReceived = sum(txs, (t) => t.paidAmount);
  const overdue = txs.filter((t) => t.status === 'Overdue');
  const overdueAmount = sum(overdue, (t) => t.remaining);

  // Last 6 months, oldest first
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push({ key: d.toISOString().slice(0, 7), month: d.toLocaleString('en-IN', { month: 'short', timeZone: 'UTC' }), udhaar: 0, received: 0 });
  }
  txs.forEach((t) => { const m = months.find((x) => x.key === monthKey(t.date)); if (m) m.udhaar += t.amount; });
  payments.forEach((p) => { const m = months.find((x) => x.key === monthKey(p.date)); if (m) m.received += p.amount; });

  const today = todayKey();
  res.json({
    stats: { totalCustomers: customers.length, totalUdhaar, totalReceived, totalPending: totalUdhaar - totalReceived, overdueCount: overdue.length, overdueAmount },
    monthly: months.map(({ key, ...m }) => m),
    overview: [
      { name: 'Received', value: totalReceived },
      { name: 'Pending', value: totalUdhaar - totalReceived - overdueAmount },
      { name: 'Overdue', value: overdueAmount },
    ],
    recentTransactions: txs.slice(0, 6),
    upcomingDues: txs.filter((t) => t.remaining > 0 && t.dueDate && dayKey(t.dueDate) >= today)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5),
    recentCustomers: customers.slice(0, 5),
  });
});
