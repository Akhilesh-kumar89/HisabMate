# Udhaar Manager – Smart Payment Tracking System

MERN app for shopkeepers to track customer udhaar (credit), part-payments and due dates.

## Setup

Requirements: Node 18+, a MongoDB instance (local or Atlas).

```bash
# 1. Backend
cd backend
cp .env.example .env        # set MONGO_URI and a long random JWT_SECRET
npm install
npm run seed                # optional demo data: demo@udhaar.com / Demo@123
npm run dev                 # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173  (proxies /api to :5000)
```

For production, run `npm run build` in `frontend/`, serve `dist/`, and set `VITE_API_URL` and the backend `CLIENT_URL`.

## How it works

- **Status is derived, not stored.** Pending / Partially Paid / Paid / Overdue is computed from amount, paid amount and due date on every read, so "Overdue" updates by itself as days pass.
- **No overpayment, no duplicates.** Payments use an atomic guarded update (paid can never exceed the total) and a client-generated `clientRef`, so a double-click or retry records the payment once.
- **Tenant isolation.** Every query is scoped to the logged-in user's id; other users' records return 404.
- Deleting a customer or udhaar also deletes its payments. Editing an udhaar cannot reduce the amount below what is already paid.

## API

`POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me`
`/api/customers` (POST, GET, GET/PUT/DELETE `/:id`) · `/api/transactions` (same) · `POST|GET /api/payments` · `GET /api/dashboard/stats`
