# RD App - Advanced School Inventory & Pricing System

A production-grade, full-stack application architected for managing complex school uniform inventories, dynamic pricing models, and multi-school data structures. Built with performance, scalability, and strict data integrity in mind.

![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Security](https://img.shields.io/badge/Security-Fail%20Fast%20%7C%20Rate%20Limit-blue)
![Frontend](https://img.shields.io/badge/Frontend-React_19_%7C_Vite-61dafb)
![Backend](https://img.shields.io/badge/Backend-Node_%7C_Express_5_%7C_Mongo-339933)

## 🌟 Executive Summary

This application solves the problem of managing thousands of uniform variants (sizes, seasons, types) across multiple schools with varying pricing rules. It introduces a **"Smart Pricing Engine"** that allows for both global template-based pricing and granular, school-specific overrides.

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

## 🛠️ Technical Deep Dive

### Frontend (React 19 + Vite)

- **Image Compression**: Integrated `browser-image-compression` to resize and compress high-res uploads client-side before transmission, saving bandwidth and storage costs.
- **Complex Filtering Algorithm**: The `SchoolDashboard` implements a multi-layer filter (Season AND Class AND Type) that updates in real-time without backend re-fetching.
- **Dynamic Forms**: `PricingEditor` component dynamically adds/removes row inputs based on the complexity of the garment pricing.
- **Security**: `ProtectedRoute` wrappers prevent unauthorized access to admin panels, redirecting with state retention (`from: location`).

### Backend (Node.js + Express 5)

- **Fail-Fast Architecture**: `server.js` pre-validates all critical environment variables (`MONGO_URI`, Cloudinary Credentials) at startup. The process exits immediately if a key is missing, preventing "silent failures" in production.
- **Security hardening**:
  - **Rate Limiting**: Custom `apiLimiter` protects general endpoints, with a stricter `authLimiter` for the Login route to prevent brute-force attacks.
  - **NoSQL Injection Prevention**: Mongoose Schemas use strict typing (`enum: ['Summer', 'Winter']`), rejecting any malformed queries automatically.
  - **Secure Headers**: `cors` policy configuration ready for deployment.
- **Optimized Queries**: Heavy endpoints use `.populate('schoolId')` to reduce round-trips to the database.

---

## 📂 Project Structure Overview

```bash
RD_app/
├── backend/
│   ├── config/             # Cloudinary & DB Connection logic
│   ├── controllers/        # Business Logic Layers
│   │   ├── basePricing.js  # Template Propagation Logic
│   │   ├── schools.js      # Cascade Delete Logic
│   │   └── uniforms.js     # Auto-School Creation Logic
│   ├── middleware/
│   │   ├── authMiddleware.js # JWT Verification (handles deleted users safely)
│   │   ├── limiter.js        # Rate Limit Configurations
│   │   └── upload.js         # Multer Memory Storage
│   └── server.js           # App Entry & Fail-Fast Checks
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── SchoolDashboard.jsx # Complex Filtering & Collage View
    │   │   ├── AddUniform.jsx      # Image Compression & Form Logic
    │   │   └── alertPopUp.jsx      # Custom Modal UI
    │   ├── context/
    │   │   ├── AuthContext.jsx     # Global User State & 401 Interceptors
    │   │   └── AlertContext.jsx    # Promise-based Modal Logic
    │   └── styles/                 # CSS Modules (Glassmorphism)
```

---

## � Installation & Setup

### 1. Environment Setup

**Backend (`/backend/.env`)**

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=complex_secret_key
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 2. Install & Run

**Backend**

```bash
cd backend
npm install
npm run devstart
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

---

## 🔒 Security Audit Report

- **Hardcoded Secrets**: ✅ Scanned & Clean.
- **Auth Logic**: ✅ Verified. Token-based flow with auto-logout on 401.
- **Dependencies**: ✅ Reviewed. Clean `package.json`.
- **Error Handling**: ✅ Global try/catch blocks in all controllers prevent server crashes.

---

_Built with ❤️ by Shreyansh_
