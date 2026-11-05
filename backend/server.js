// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const connectDB = require('./config/db');
// const { notFound, errorHandler } = require('./middleware/error');

// const app = express();
// app.use(helmet());
// app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(','), credentials: true }));
// app.use(express.json({ limit: '1mb' }));

// app.get('/api/health', (_req, res) => res.json({ ok: true }));
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/customers', require('./routes/customers'));
// app.use('/api/transactions', require('./routes/transactions'));
// app.use('/api/payments', require('./routes/payments'));
// app.use('/api/dashboard', require('./routes/dashboard'));

// app.use(notFound);
// app.use(errorHandler);

// const PORT = process.env.PORT || 5000;
// connectDB().then(() => app.listen(PORT, () => console.log(`API running on port ${PORT}`)));
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    'https://frontend-lake-iota-93.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet());

app.use(express.json({ limit: '1mb' }));

// Health Check
app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`API running on port ${PORT}`);
    });
}).catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
});