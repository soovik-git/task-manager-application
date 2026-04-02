# Task Master - Full-Stack Web Application

A robust, enterprise-grade Task Management web application built with a modern React + Node.js ecosystem. Specifically designed to adhere to industry standard **Clean Architecture** patterns and **Advanced Dual-Token Security**.

This project demonstrates real-world backend engineering practices including **secure authentication flows**, **scalable architecture**, and **production-ready design patterns**.

---

## 🏗️ Architecture & How It Works

The system is structured to maintain the Single Responsibility Principle and ensure long-term scalability.

### Backend (Node.js + Express + MongoDB)

The backend is divided into five layers:

1. **Routes**
   Maps API endpoints to controllers.

2. **Controllers**
   Handles HTTP logic:

   * Request parsing
   * Cookie handling
   * Response formatting

3. **Services**
   Contains core business logic:

   * Authentication workflows
   * Token generation & validation
   * Password hashing

4. **Repositories**
   Handles database operations:

   * Abstracts MongoDB access
   * Keeps services clean and decoupled

5. **Validations**
   Uses `Joi` to validate all incoming requests before processing.

---

## 🔐 Authentication System

Implements a **Dual-Token Strategy** for enhanced security.

### Token Design

* **Refresh Token (Long-lived)**

  * Stored in `HTTPOnly`, `Secure` cookie
  * Not accessible via JavaScript
  * Rotated on every use

* **Access Token (Short-lived)**

  * Stored in memory
  * Sent via Authorization headers
  * Automatically refreshed when expired

---

## ⚙️ Security Features

* Refresh Token Rotation (single-use tokens)
* Hashed refresh tokens in database
* Session limit (max 5 active sessions)
* Basic replay attack protection
* Race-condition safe refresh flow

---

## ⚡ Frontend (React + Axios)

The frontend uses Axios interceptors to handle authentication seamlessly:

* Automatically attaches access token to requests
* On `401`:

  * Pauses request
  * Calls `/auth/refresh`
  * Retries original request

### Concurrency Handling

* Mutex lock ensures only one refresh call
* Queue system retries all failed requests safely

---

## 🚀 Setup & Installation

Run backend and frontend separately.

---

### 1. Database

Use MongoDB (local or Atlas)

---

### 2. Backend

```bash
cd backend
npm install
```

Create `.env`:

```env
PORT=3000
MONGODB_URI=YOUR_MONGO_DB_URL
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Run:

```bash
npm run dev
```

---

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open:

```
http://localhost:5173
```

---


