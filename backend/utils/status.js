// Payment status is derived, never trusted from the client. "Overdue" changes with time,
// so it is computed on every read rather than stored.
const TZ = process.env.TZ_NAME || 'Asia/Kolkata';
const todayKey = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

function computeStatus(t) {
  if (t.amount - t.paidAmount <= 0) return 'Paid';
  if (t.dueDate && dayKey(t.dueDate) < todayKey()) return 'Overdue';
  return t.paidAmount > 0 ? 'Partially Paid' : 'Pending';
}

const decorate = (doc) => {
  const t = doc.toObject ? doc.toObject() : doc;
  return { ...t, remaining: Math.max(Math.round((t.amount - t.paidAmount) * 100) / 100, 0), status: computeStatus(t) };
};

module.exports = { computeStatus, decorate, todayKey, dayKey };
