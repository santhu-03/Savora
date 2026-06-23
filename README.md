# Savora — Restaurant Management Platform

> A full-stack restaurant management platform with customer-facing app, admin dashboard, and mobile app.

## Packages

| Package | Stack | Port |
|---------|-------|------|
| `client` | React 18 + Vite + TypeScript + Tailwind | 5173 |
| `admin` | React 18 + Vite + TypeScript + Tailwind | 5174 |
| `mobile` | React Native + Expo | — |
| `server` | Node.js + Express + TypeScript + MongoDB | 5000 |
| `shared` | Shared types & utilities | — |

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| `savora-dark` | `#260B10` | Backgrounds |
| `savora-gold` | `#BF8B5E` | Headings, accents |
| `savora-blush` | `#D9B89C` | Body text |
| `savora-red` | `#733122` | Cards, hover states |
| `savora-copper` | `#A6523F` | Borders, highlights |

**Fonts:** Cormorant Garamond (headings) · Inter (body) · Playfair Display (accent)

## Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Redis (optional — for caching)

## Setup

### 1. Clone & install

```bash
git clone https://github.com/your-org/savora.git
cd savora
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Run in development

```bash
# Start everything (server + client + admin)
npm run dev

# Individual packages
npm run dev:server   # http://localhost:5000
npm run dev:client   # http://localhost:5173
npm run dev:admin    # http://localhost:5174

# Mobile (requires Expo CLI)
cd mobile && npx expo start
```

### 4. Build for production

```bash
npm run build
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server + client + admin concurrently |
| `npm run dev:server` | Express API only |
| `npm run dev:client` | Customer-facing React app only |
| `npm run dev:admin` | Admin dashboard only |
| `npm run build` | Build all packages |
| `npm run lint` | ESLint across all packages |
| `npm run format` | Prettier format |

## Project Structure

```
savora/
├── client/          # Customer-facing web app
│   └── src/
│       ├── App.tsx
│       ├── index.css
│       └── main.tsx
├── admin/           # Admin dashboard
│   └── src/
│       ├── App.tsx
│       ├── index.css
│       └── main.tsx
├── mobile/          # React Native (Expo) app
│   └── App.tsx
├── server/          # Express API + Socket.IO
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       └── index.ts
├── shared/          # Shared types, utils, constants
│   └── src/
│       ├── types/
│       ├── utils.ts
│       └── constants.ts
├── .env.example
├── .eslintrc.js
├── .prettierrc
└── package.json
```

## Environment Variables

See `.env.example` for a full list. Key variables:

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_REFRESH_SECRET` | JWT refresh token secret |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `CLOUDINARY_URL` | Cloudinary media storage |
| `REDIS_URL` | Redis connection string |
| `SMTP_*` | Email (SMTP) credentials |
| `CLIENT_URL` | Customer app URL (CORS) |
| `ADMIN_URL` | Admin app URL (CORS) |

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, React Query, React Router, Framer Motion
- **Backend:** Node.js, Express, TypeScript, Mongoose, Socket.IO, JWT, Stripe, Cloudinary
- **Mobile:** React Native, Expo, Expo Router
- **Database:** MongoDB + Redis
- **Tooling:** ESLint, Prettier, npm Workspaces, concurrently
