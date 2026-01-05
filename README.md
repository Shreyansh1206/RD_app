# RD App - Advanced School Inventory & Pricing System

A production-grade, full-stack application architected for managing complex school uniform inventories, dynamic pricing models, and multi-school data structures. Built with performance, scalability, and strict data integrity in mind.

![Status](https://img.shields.io/badge/Status-Deployment%20Ready-green)
![Security](https://img.shields.io/badge/Security-Fail%20Fast%20%7C%20Rate%20Limit-blue)
![Frontend](https://img.shields.io/badge/Frontend-React_19_%7C_Vite-61dafb)
![Backend](https://img.shields.io/badge/Backend-Node_%7C_Express_5_%7C_Vercel-339933)

Currently hosted publically at [https://rastogidresses.vercel.app](https://rastogidresses.vercel.app)

## 🌟 Executive Summary

This application solves the problem of managing thousands of uniform variants (sizes, seasons, types) across multiple schools with varying pricing rules. It introduces a **"Smart Pricing Engine"** that allows for both global template-based pricing and granular, school-specific overrides.

**Deployed Architecture:** Optimized for Serverless environments (Vercel) with "Fail-Fast" config validation and connection pooling.

---

## 🏗️ System Architecture

### 1. The "Smart Pricing Engine" & Detachment Logic

The core technical achievement of this system is how it handles pricing updates.

- **Base Templates (`BasePricing`)**: Master templates (e.g., "Regular Cotton Shirt Pricing") define price-per-size rules.
- **Inheritance**: When a new Uniform is created, it can "subscribe" to a Base Template. It strictly follows the master prices.
- **Propagation**: Updating a Base Template on the backend triggers a **cascade update** that instantly modifies thousands of linked Uniforms.
- **Smart Detachment**: If a specific school needs a custom price for just _one_ size, the system automatically detects this deviation on the frontend. It **"detaches"** the uniform from the template, converting it to a `Custom Pricing` model, ensuring global updates no longer overwrite this specific customization.

### 2. Intelligent Data Integrity (Cascade Deletes)

To prevent "Zombie Data" (orphan records that clog databases), the system implements strict cascade deletion logic:

- **Deleting a School** -> Automatically identifies and deletes all **Uniforms** associated with it.
- **Deleting a Uniform** -> Automatically deletes its **Pricing Structure** and triggers a Cloudinary API call to remove the **Hosted Image**.
- **Deleting a Base Template** -> Offers two modes: `Detach Children` (keep pricing, just unlink) or `Cascade Delete` (remove pricing everywhere).

### 3. Asynchronous UI/UX (Promise-Based Alerts)

Instead of blocking the browser with native `alert()` or `confirm()`, the application features a custom **Glassmorphism Alert System** built on React Context and Promises.

- **Technical Implementation**: The `useAlert` hook exposes functions that return `Promise<boolean>`.
- **Benefit**: Developers can write synchronous-looking code:
  ```javascript
  // No callback hell!
  if (await showConfirm("Delete this item?")) {
    await deleteItem();
  }
  ```

---

## 🛠️ Technical Deep Dive & Serverless Optimizations

### Backend (Node.js + Express 5)

- **Serverless-Ready**:
  - **Lambda Optimized**: `server.js` exports the app module (`module.exports = app`) for Vercel consumption.
  - **Connection Pooling**: logic added to `mongoose.connect` to check `readyState`, preventing "Max Connection" errors during function warm starts.
  - **Proxy Trust**: `app.set('trust proxy', 1)` enabled to allow correct Rate Limiting behind Vercel/AWS load balancers.
- **Fail-Fast Architecture**: Pre-validates all critical environment variables (`MONGO_URI`, Cloudinary Credentials) at startup. The process refuses to boot if a key is missing.
- **Security hardening**:
  - **Rate Limiting**: Custom `authLimiter` protects Login routes (5 attempts/15min).
  - **NoSQL Injection Prevention**: Mongoose Schemas use strict typing (`enum: ['Summer', 'Winter']`).

### Frontend (React 19 + Vite)

- **Image Compression**: Integrated `browser-image-compression` to resize and compress high-res uploads client-side before transmission, saving bandwidth and storage costs.
- **Complex Filtering Algorithm**: The `SchoolDashboard` implements a multi-layer filter (Season AND Class AND Type) that updates in real-time without backend re-fetching.
- **Dynamic Forms**: `PricingEditor` component dynamically adds/removes row inputs based on the complexity of the garment pricing.

---

## 🚀 Installation & Setup

### 1. Environment Setup

**Backend (`/backend/.env`)**

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=complex_secret_key
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NODE_ENV=development  # Set to 'production' on Vercel
```

**Frontend (`/frontend/.env`)**

```env
VITE_API_URL=http://localhost:5000  # Set to your Vercel Backend URL in production
```

### 2. Install & Run Locally

```bash
# Backend
cd backend && npm install && npm run devstart

# Frontend
cd frontend && npm install && npm run dev
```

### 3. Deployment (Vercel)

1.  **Push** to GitHub.
2.  Import project into Vercel.
3.  **Backend Project**: Point Root Directory to `backend`. Vercel will auto-detect `express`. Add Environment Variables.
4.  **Frontend Project**: Point Root Directory to `frontend`. Vercel will auto-detect `vite`. Add `VITE_API_URL` environment variable pointing to the deployed Backend URL.

---

## 🔒 Security Audit Report

- **Hardcoded Secrets**: ✅ Scanned & Clean.
- **Auth Logic**: ✅ Verified. Token-based flow with auto-logout on 401.
- **Dependencies**: ✅ Reviewed. Clean `package.json`.
- **Error Handling**: ✅ Global try/catch blocks in all controllers.

---

_Built with ❤️ by Shreyansh_
