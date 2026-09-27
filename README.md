# 🍽️ SymbiEat — Centralized Canteen Management System

SymbiEat digitizes the entire campus dining experience for **Symbiosis International University**: a real-time digital menu, token-based ordering, UPI/card payments, live order tracking, notifications, feedback, stock & menu management, chef assignment, attendance tracking, and admin analytics — in one modern, responsive app.

**Stack:** React 18 + Vite + Tailwind CSS · Node.js + Express · MongoDB (Mongoose) · JWT auth with role-based access · Socket.IO realtime · Razorpay payments

---

## ⚡ Quick start (zero configuration)

The project runs **out of the box in demo mode** — no database or payment keys needed:

```bash
npm install            # installs server + client workspaces
npm run dev            # API on :5000 + Vite dev server on :5173
```

Demo mode automatically spins up an **in-memory MongoDB** and seeds realistic data. Payments run through a built-in simulated gateway until Razorpay keys are added.

### Demo accounts (seeded automatically)

| Role    | Email                  | Password    | Lands on          |
| ------- | ---------------------- | ----------- | ----------------- |
| Student | student@symbieat.dev   | student123  | Menu & ordering   |
| Chef    | chef@symbieat.dev      | chef123     | Kitchen queue     |
| Staff   | staff@symbieat.dev     | staff123    | Kitchen queue     |
| Admin   | admin@symbieat.dev     | admin123    | Analytics dashboard |

---

## 🔧 Production setup

### 1. MongoDB (Atlas free tier recommended)

1. Create a free [MongoDB Atlas](https://www.mongodb.com/atlas) M0 cluster.
2. Create a database user and allow your IP (or `0.0.0.0/0` for demos).
3. Copy the connection string into `server/.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/symbieat?retryWrites=true&w=majority
```

Without `MONGODB_URI`, the app stays in demo mode (in-memory DB, data resets on restart).

### 2. JWT

```env
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=7d
```

### 3. Payments — Razorpay (UPI + cards)

1. Create a [Razorpay](https://razorpay.com) account → Settings → API Keys.
2. Add the keys:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
# optional: RAZORPAY_WEBHOOK_SECRET=xxxxxxxx
```

* With keys present, checkout opens the real **Razorpay UPI/card** modal; signature verification happens server-side (`/api/payments/verify`) and a webhook endpoint is included.
* Without keys, checkout uses the built-in simulated gateway so the flow stays testable.

### 4. Full env reference (see `env.example`)

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=
JWT_SECRET=...
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
CLIENT_URL=http://localhost:5173
```

### 5. Build & run (single process)

```bash
npm run build         # builds the client into client/dist
npm start             # Express serves the API + built client on $PORT (default 5000)
npm run seed          # optional: force-seed demo data (skips if data exists)
```

---

## 🏗️ Architecture

```
symbieat/
├─ client/                     # React 18 + Vite + Tailwind SPA
│  ├─ src/
│  │  ├─ components/           # Navbar, Footer, StatusBadge
│  │  ├─ context/              # Auth, Theme (dark/light), Socket, Cart
│  │  ├─ lib/api.js            # fetch wrapper with JWT + error handling
│  │  ├─ pages/                # Landing, Login, Register, Menu, Cart,
│  │  │  ├─ admin/             # Dashboard, Menu, Orders, Stock, Users,
│  │  │  │                     #   Attendance, Feedback
│  │  └─ pages/…               # Checkout, Orders, OrderDetail, Kitchen,
│  │                           #   Notifications, Feedback, Profile
│  └─ index.html
├─ server/
│  ├─ src/
│  │  ├─ config.js             # env config + demo-mode detection
│  │  ├─ db.js                 # Atlas connection / in-memory fallback
│  │  ├─ index.js              # Express app: helmet, CORS, rate-limit,
│  │  │                        #   REST routes, socket.io, static client
│  │  ├─ routes.js             # all endpoints + role guards
│  │  ├─ realtime.js           # socket.io with JWT handshake + rooms
│  │  ├─ seed.js               # demo users/menu/stock/orders
│  │  ├─ models/               # User, MenuItem, Order, Payment, StockItem,
│  │  │                        #   Feedback, Attendance, Notification, Counter
│  │  ├─ controllers/          # one module per domain
│  │  ├─ middleware/           # auth (JWT + RBAC), error handler
│  │  └─ services/             # notification service (DB + socket push)
└─ shared/                     # shared enums/constants
```

**Security:** bcrypt password hashing, JWT (Bearer + httpOnly cookie), role-based route guards, helmet, CORS allow-list, rate limiting on login/orders, input validation via Mongoose schema validators and centralized error mapping.

---

## 📡 REST API

All routes are prefixed with `/api`. Protected routes expect `Authorization: Bearer <jwt>`.

### Auth
| Method | Route | Access | Description |
| ------ | ----- | ------ | ----------- |
| POST | `/auth/register` | public | Student self-registration |
| POST | `/auth/login` | public | Returns JWT + sets httpOnly cookie |
| GET | `/auth/me` | any | Current user profile |
| PUT | `/auth/profile` | any | Update profile / change password |

### Menu
| Method | Route | Access | Description |
| ------ | ----- | ------ | ----------- |
| GET | `/menu` | public | Digital menu board (`?category=&search=&available=true`) |
| GET | `/menu/:id` | public | Item detail + recent reviews |
| POST | `/menu` | admin | Create item |
| PUT | `/menu/:id` | admin | Update item |
| PATCH | `/menu/:id/availability` | admin, chef | Toggle sold-out / available |
| DELETE | `/menu/:id` | admin | Remove item |

### Orders
| Method | Route | Access | Description |
| ------ | ----- | ------ | ----------- |
| POST | `/orders` | any | Place order → token `SIE-xxxxxx` + pickup code |
| GET | `/orders/mine` | any | My order history |
| GET | `/orders/queue` | chef, staff, admin | Live kitchen queue |
| GET | `/orders/:id` | owner/staff | Order detail + status history |
| PATCH | `/orders/:id/status` | chef, staff, admin | Advance/cancel (flow validated) |
| PATCH | `/orders/:id/assign` | admin | Assign chef |
| GET | `/orders/stats/today` | staff | Kitchen summary cards |

### Payments
| Method | Route | Access | Description |
| ------ | ----- | ------ | ----------- |
| POST | `/payments/create` | customer | Create Razorpay order or simulated payment |
| POST | `/payments/verify` | customer | Razorpay signature check / simulated confirm |
| POST | `/payments/webhook` | Razorpay | `payment.captured` handler (HMAC verified) |
| POST | `/payments/cash` | staff, admin | Record cash at counter |

### Feedback · Stock · Users · Attendance · Notifications · Analytics
| Method | Route | Access | Description |
| ------ | ----- | ------ | ----------- |
| GET/POST | `/feedback` | any | List (own) / submit rating+comment |
| PATCH | `/feedback/:id/reply` | admin | Public reply (notifies student) |
| DELETE | `/feedback/:id` | admin | Remove feedback |
| GET/POST | `/stock` | staff, admin | Inventory list / create |
| PUT | `/stock/:id` | staff, admin | Update stock item |
| PATCH | `/stock/:id/restock` | staff, admin | Add quantity |
| DELETE | `/stock/:id` | staff, admin | Remove |
| GET | `/stock/low` | staff | Items at/below threshold |
| GET | `/users?role=&search=` | admin | Manage users |
| POST/PATCH/DELETE | `/users(/:id)` | admin | Create staff/chef/admin, role change, deactivate |
| GET | `/users/chefs` | any | Chef list for assignment |
| GET | `/attendance?date=` | staff, admin | Daily roster |
| GET | `/attendance/me` | any | My history |
| POST | `/attendance` | staff, admin | Mark present/absent/leave/half-day |
| GET | `/notifications` | any | List + unread count |
| PATCH | `/notifications/read-all` · `/notifications/:id/read` | any | Mark read |
| GET | `/analytics/dashboard?days=7` | admin | Revenue trend, top items, status mix, ratings |
| GET | `/health` | public | Service health + mode |

---

## ⚡ Realtime events (Socket.IO)

Clients authenticate with their JWT in the handshake and join personal + role rooms.

| Event | Audience | Payload |
| ----- | -------- | ------- |
| `menu:updated` | everyone | `{ action, id, isAvailable? }` |
| `order:new` | kitchen + admins | full order object |
| `order:status` | customer + kitchen | `{ orderId, token, status }` |
| `stock:low` | admins, staff | `{ name, quantity, unit }` |
| `notification:new` | individual user | notification object |

Notifications persist in MongoDB *and* push live — order updates, payment receipts, chef assignments, low-stock alerts, feedback replies.

---

## 🎨 Design

* **Light theme:** clean white/stone with crimson-red brand (`#DC2626`) — collegiate, crisp.
* **Dark theme:** deep zinc with red accents, toggled from the navbar, persisted in localStorage, respects OS preference.
* Smooth fade/scale/hover animations, skeleton loaders, animated order tracker, sticky mobile-friendly cart bar. Fully responsive from phones to desktops.

## 🧪 Verified end-to-end

Login → menu → cart → checkout (UPI) → token + pickup code → payment verified → chef advances status → customer notified → admin analytics reflect revenue & top items. `npm run build` passes; API flow tested with seeded data.
