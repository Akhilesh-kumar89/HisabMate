// Demo data: npm run seed  ->  login with demo@udhaar.com / Demo@123
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');

const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteOne({ email: 'demo@udhaar.com' });
  const user = await User.create({ name: 'Amit Sharma', email: 'demo@udhaar.com', password: 'Demo@123', shopName: 'Sharma General Store', mobile: '9876543210' });
  await Promise.all([Customer.deleteMany({ user: user._id }), Transaction.deleteMany({ user: user._id }), Payment.deleteMany({ user: user._id })]);

  const people = [
    ['Rahul Kumar', '9811122233', 'Gali 4, Aminabad, Lucknow'], ['Priya Verma', '9822233344', '12 Hazratganj, Lucknow'],
    ['Mohammad Imran', '9833344455', 'Chowk Bazaar, Lucknow'], ['Sunita Devi', '9844455566', 'Indira Nagar, Lucknow'],
    ['Vikas Gupta', '9855566677', 'Gomti Nagar, Lucknow'], ['Anita Singh', '9866677788', 'Alambagh, Lucknow'],
  ];
  const customers = await Customer.insertMany(people.map(([name, mobile, address], i) => ({ user: user._id, name, mobile, address, createdAt: daysFromNow(-i * 4) })));

  // [customer index, amount, description, days ago, due in days, paid so far]
  const rows = [
    [0, 2000, 'Monthly grocery', 12, 8, 500], [0, 850, 'Cooking oil & flour', 70, -40, 850], [1, 3200, 'Wedding stationery', 20, 5, 0],
    [2, 1500, 'Rice 25 kg & pulses', 45, -10, 400], [3, 640, 'Daily essentials', 6, 0, 0], [4, 4800, 'Shop supplies', 95, -60, 4800],
    [4, 1200, 'Festival sweets', 15, 14, 1200], [5, 2750, 'Monthly grocery', 30, -3, 1000], [1, 900, 'Dairy & snacks', 50, -20, 900],
    [3, 1800, 'Ration advance', 120, -90, 1800],
  ];
  for (const [ci, amount, description, ago, due, paid] of rows) {
    const tx = await Transaction.create({ user: user._id, customer: customers[ci]._id, amount, description, date: daysFromNow(-ago), dueDate: daysFromNow(due), paidAmount: paid });
    if (paid) {
      const first = Math.ceil(paid / 2);
      const parts = paid === first ? [paid] : [first, paid - first];
      for (const [k, p] of parts.entries()) {
        await Payment.create({ user: user._id, customer: tx.customer, transaction: tx._id, amount: p, date: daysFromNow(-Math.max(ago - 3 - k * 6, 0)), note: k ? 'Balance part' : 'Cash' });
      }
    }
  }
  console.log('Seeded. Login: demo@udhaar.com / Demo@123');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
