# LuxeStore Admin Panel

An elegant, full-stack e-commerce admin panel built with Node.js + Express + React.

## Quick Start

```bash
# 1. Install all dependencies
npm run install:all

# 2. Configure environment
# Edit server/.env — set your MONGO_URI and JWT_SECRET

# 3. Start both servers
npm start

# 4. (Optional) Seed demo data
npm run seed
```

## URLs

| URL | Description |
|-----|-------------|
| `http://localhost:3000/admin` | Admin Panel |
| `http://localhost:3000/login` | Login Page |
| `http://localhost:5000/api` | REST API |
| `http://localhost:5000/api/health` | Health Check |

## Default Admin Login

```
Email:    admin@luxestore.com
Password: Admin@123
```

*(Run `npm run seed` first to create this account)*

## Features

### Admin Dashboard
- Revenue, orders, customers & avg order value stats with growth %
- Weekly revenue bar chart
- Recent orders table
- Quick action buttons

### Products (`/admin/products`)
- Full product catalogue with search
- Color-coded stock indicators (OK / Low / Out)
- Add product with 7-section form:
  1. Basic Info (name, SKU, brand, category, tags, status toggles)
  2. Images (drag-drop upload, URL input)
  3. Pricing (selling/compare/cost price + live margin calculator)
  4. Inventory (stock health bar, dimensions)
  5. Variants (dynamic rows)
  6. Attributes (key-value pairs)
  7. SEO (meta title/description + Google preview card)

### Orders (`/admin/orders`)
- Status filter tabs (all / pending / confirmed / processing / shipped / delivered / cancelled)
- Inline order status and payment status dropdowns
- Real-time updates

### Categories (`/admin/categories`)
- Visual emoji/icon category cards
- Inline active toggle
- Create/edit form with emoji picker

### Coupons (`/admin/coupons`)
- Percentage and fixed amount coupons
- Usage progress bars
- Expiry tracking

### Users (`/admin/users`)
- User stats (total/active/blocked/admin+staff)
- Inline role change dropdown
- Block/unblock users

## Tech Stack

**Backend:** Node.js, Express, MongoDB (Mongoose), JWT, Multer, Stripe  
**Frontend:** React 18, Redux Toolkit, React Router v6, Axios, React-Toastify  
**Design:** Playfair Display + DM Sans + DM Mono, inline CSS only

## Project Structure

```
luxestore-admin/
├── package.json          ← root (concurrently)
├── server/
│   ├── index.js          ← Express app
│   ├── seed.js           ← Demo data seeder
│   ├── models/           ← Mongoose models
│   ├── routes/           ← API routes
│   └── middleware/       ← JWT auth
└── client/
    └── src/
        ├── App.js
        ├── store/        ← Redux slices
        ├── utils/api.js  ← Axios helpers
        └── pages/admin/  ← All admin pages
```

## Notes

- MongoDB is optional — server starts without it (shows mock data in UI)
- Stripe key is optional — payment returns demo secret if missing
- Cart and wishlist persist to localStorage
- All admin pages gracefully fall back to mock data if API is unreachable
