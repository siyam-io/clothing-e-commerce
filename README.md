<div align="center">

# 🛍️ Drip Nation — Command AI E-Commerce Suite

**A Next-Generation, Production-Ready Full-Stack E-Commerce Ecosystem**  
*Powered by Next.js 16, React 19, React Native (Expo 56), Node.js (Express 5), MongoDB, Redis & Command AI*

<p align="center">
  <a href="https://clothing-e-commerce-web.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel" alt="Live Demo" />
  </a>
  <img src="https://img.shields.io/badge/Next.js-16.2.4-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Expo-v56-000020?style=for-the-badge&logo=expo" alt="Expo" />
  <img src="https://img.shields.io/badge/Node.js-Express%205-green?style=for-the-badge&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-7.1-darkgreen?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Redis-ioredis-red?style=for-the-badge&logo=redis" alt="Redis" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
</p>

[🌐 Live Web Store](https://clothing-e-commerce-web.vercel.app) • [📖 API Documentation](./documentation/README.md) • [✨ Features](#-key-features) • [🚀 Getting Started](#-getting-started)

---

</div>

<div align="center">
  <img src="./documentation/preview.png" alt="Drip Nation Preview" width="95%" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />
</div>

---

## 🌟 Overview

**Drip Nation** is a complete, enterprise-grade e-commerce platform designed from the ground up to eliminate manual operational friction. Featuring a multi-tenant ready architecture, it blends a high-conversion modern web storefront, a fluid native mobile app, and a robust micro-service ready backend with an autonomous **Command AI Agent** capable of executing 35+ store administration workflows.

---

## ✨ Key Features

### 🤖 1. Command AI Storefront Agent
- **Natural Language Operations:** Execute catalog changes, coupon generation, customer email dispatches, and campaign launches via chat prompts.
- **AI Vision Asset Replacement:** Drag and drop product images into chat to instantly optimize, crop, and update product assets.
- **1-Click Undo Safety Net:** Built-in transaction logging with instant action reversion (`Undo` widget) for mutation rollback.
- **Automated SEO Generator:** Automatically generates meta titles, meta descriptions, and search indexing keywords.
- **Staff RBAC-Guarded Execution:** AI actions respect admin role permissions, preventing unauthorized mutations.

### 🌐 2. Modern Web Storefront & Admin Portal (`/web`)
- **Next.js 16 (App Router) + React 19:** Bleeding-edge React compiler optimizations, server rendering, and instant client navigation.
- **Visual Homepage Layout Builder:** Reorder, toggle, and customize hero sliders, promotional banners, and featured categories without code.
- **Real-Time Live Chat:** In-house customer support chat directly integrated into admin without third-party subscriptions.
- **Live Order & Sales Counter:** Powered by WebSocket (`Socket.io`) for zero-reload dashboard telemetry.
- **Storage Switcher:** 1-Click instant toggle between local server file storage and Cloudinary CDN.
- **Modern UI/UX:** Tailored glassmorphism theme, dark/light mode toggle, fluid animations with Framer Motion, and Accessible Radix UI / shadcn components.

### 📱 3. Cross-Platform Mobile Application (`/mobile`)
- **React Native 0.85 & Expo 56:** Powered by Expo Router with file-based nested tab and modal navigation.
- **NativeWind (Tailwind CSS v4):** Consistent design system token parity between web and mobile interfaces.
- **High-Performance FlatLists:** Memoized product grids with infinite scroll pagination, pull-to-refresh, and memoized card components.
- **Interactive Product Gallery:** 3:4 aspect-ratio viewports, thumbnail swipers, and bottom-sheet attribute selection modals.
- **Order Tracking Screen:** Status badges, order item breakdown, and instant retry states.

### ⚡ 4. Scalable Backend API (`/backend`)
- **Express 5 + Mongoose:** Modular service-controller architecture with validation schemas powered by Zod.
- **High-Speed Redis Caching:** Sub-millisecond response times for frequent catalog and category queries.
- **Winston & Swagger:** Comprehensive structured logging and auto-generated OpenAPI documentation.
- **Automated Email Notifications:** Nodemailer integration with dynamic HTML receipts and status alerts.

### 💳 5. Payment Gateways & Logistics
- **Multi-Gateway Checkout:** Full integration for **bKash Merchant Gateway**, **SSLCommerz**, and **Cash on Delivery (COD)**.
- **Automated Pathao Courier Dispatch:** 1-Click order fulfillment with real-time delivery charge calculation and tracking codes.
- **Conversion Tracking (CAPI):** Server-side Facebook & TikTok Conversions API (CAPI) with SHA-256 hashed customer identifiers for 100% ad signal retention.

---

## 🛠️ Technology Stack

| Domain | Technologies |
|---|---|
| **Web Frontend** | Next.js 16, React 19, Tailwind CSS v4, Radix UI, shadcn/ui, Framer Motion, TanStack Query, Zustand, Socket.io-client, Recharts |
| **Mobile App** | React Native 0.85, Expo 56, Expo Router, NativeWind, React Native Reanimated 4, Gesture Handler, Lucide Icons |
| **Backend API** | Node.js, Express 5, Mongoose (MongoDB 7), Redis (ioredis), Socket.io, Zod, Winston, Multer, Sharp |
| **Payment & Shipping** | SSLCommerz LTS, bKash Merchant API, Pathao Logistics API |
| **Media & Storage** | Cloudinary SDK, Local FS Storage, Jimp, @imgly/background-removal-node |
| **Analytics & SEO** | Facebook CAPI, TikTok Events API, Dynamic OpenGraph & Meta generator |

---

## 📂 Project Architecture

```plaintext
clothing-e-commerce/
├── backend/                  # RESTful API & WebSocket Server
│   ├── src/
│   │   ├── modules/          # Domain-driven modules (order, product, user, chat, etc.)
│   │   ├── middleware/       # Auth, RBAC, error handlers, rate-limiting
│   │   ├── config/           # Database, Redis, Cloudinary & socket configs
│   │   ├── utils/            # Helper functions, emailer, logger
│   │   └── server.js         # Entrypoint
│   └── package.json
├── web/                      # Next.js 16 Web Application
│   ├── src/
│   │   ├── app/              # App router (Storefront, Profile, Admin Portal)
│   │   ├── components/       # Reusable UI & Layout components
│   │   ├── store/            # Zustand stores (auth, cart, chat, theme)
│   │   └── lib/              # Client utilities, API fetchers & hooks
│   └── package.json
├── mobile/                   # Expo 56 / React Native Application
│   ├── src/
│   │   ├── app/              # Expo Router routes ((tabs), product, order, etc.)
│   │   ├── components/       # Native UI components & bottom sheets
│   │   ├── store/            # Client state stores
│   │   └── theme/            # Theme tokens & design system
│   ├── app.json              # Expo configuration (Drip Nation)
│   └── package.json
└── documentation/            # 22+ Comprehensive API & architectural guides
    ├── README.md             # API docs index
    ├── auth-flow.md          # Authentication lifecycle
    ├── product.md            # Catalog & inventory management
    ├── order.md              # Checkout & payment processing
    └── ...
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or Atlas connection URI)
- [Redis](https://redis.io/) (Optional for local dev, recommended for production caching)
- [Expo Go](https://expo.dev/go) or Android Studio / Xcode for mobile simulation

---

### 1. Clone the Repository
```bash
git clone https://github.com/Ssiyam0123/clothing-e-commerce.git
cd clothing-e-commerce
```

---

### 2. Backend Setup
```bash
cd backend
npm install

# Create environment configuration
cp .env.example .env # or configure your .env

# Run development server
npm run dev
```
*Backend will be running on `http://localhost:5000/api`*

---

### 3. Web Storefront Setup
```bash
cd ../web
npm install

# Create environment configuration
cp .env.example .env.local

# Run development server
npm run dev
```
*Web client will be running on `http://localhost:3000`*

---

### 4. Mobile App Setup
```bash
cd ../mobile
npm install

# Start the Expo development server
npx expo start
```
*Scan the QR code with Expo Go (Android/iOS) or press `w` to open web preview, `a` for Android emulator.*

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/ecommerce
JWT_SECRET=your_jwt_super_secret_key
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REDIS_URL=redis://localhost:6379

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment & Logistics
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
PATHAO_CLIENT_ID=your_pathao_client_id
PATHAO_CLIENT_SECRET=your_pathao_secret
```

### Web (`web/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## 📚 Complete API Documentation

Detailed endpoint specifications, request payloads, and status codes are documented in the [`documentation/`](./documentation/README.md) directory:

- 🔐 [Auth & Security Flow](./documentation/auth-flow.md)
- 📦 [Products & Inventory](./documentation/product.md)
- 🛒 [Cart & Checkout](./documentation/cart.md)
- 💳 [Orders & Payment Processing](./documentation/order.md)
- 🚚 [Pathao Logistics Integration](./documentation/pathao.md)
- 💬 [Real-Time Support Chat](./documentation/chat.md)
- 📊 [Server-Side Tracking (CAPI)](./documentation/tracking.md)

---

## 🔒 Security & Best Practices

- **Strict Validation:** Input sanitation with Zod across all public and protected mutation routes.
- **Protection Measures:** Rate-limiting via `express-rate-limit` with Redis store backend.
- **Secure Token Flow:** HttpOnly cookies for refresh tokens + short-lived JWT access tokens.
- **Protected File Uploads:** Magic-number mime validation with `file-type` and image sanitization via Sharp.

---

## 📄 License & Credits

Distributed under the **ISC License**. Developed with ❤️ by [Ssiyam0123](https://github.com/Ssiyam0123).
