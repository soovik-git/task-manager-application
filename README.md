# Task Master - Full-Stack Web Application

A robust, enterprise-grade Task Management web application built with a modern React + Node.js ecosystem. Specifically designed to adhere to industry standard **Clean Architecture** patterns and **Advanced Dual-Token Security**.

---

## 🏗️ Architecture & How It Works

The system is rigorously partitioned to maintain the Single Responsibility Principle:

### Backend Logic (Node.js + Express + MongoDB)
The backend completely avoids "Spaghetti Code" by strictly routing HTTP requests through five separate architectural namespaces:
1. **Routes**: Maps string endpoints to specific Controller functions.
2. **Controllers**: Purely handles the *HTTP Transport Layer*. It strips data from headers/bodies, sets cookies, and formats final JSON responses.
3. **Services**: Contains zero knowledge of HTTP or Express. It solely handles *Business Logic* (e.g., verifying user credentials, hashing passwords).
4. **Repositories**: The active *Data Access Layer*. Responsible for standardizing direct reads/writes to MongoDB, keeping Mongoose schemas out of the Services layer.
5. **Validations**: All endpoints pass through `Joi` interceptors that strictly analyze schema types before the Controller is ever invoked.

### Advanced Dual-Token Authentication
Security relies on a modern, decoupled token mechanism to prevent Cross-Site Scripting (XSS) and Session Hijacking:
- **Refresh Token (Long-lived)**: Encrypted by the backend and embedded into a strict `HTTPOnly`, `Secure` browser cookie. It is virtually unreadable by malicious JavaScript and only valid at the `/refresh` endpoint.
- **Access Token (Short-lived)**: Kept cleanly in React's active memory state (never saved to `localStorage`). 
- **Axios Interceptors**: The React frontend utilizes a silent request/response hook sequence. If an Access Token expires mid-session and the backend throws a `401 Unauthorized`, Axios instantly pauses the user request, silently queries the `/refresh` endpoint using the `HTTPOnly` cookie, retrieves a fresh Access Token, assigns it to memory, and replays the original backend call. The user experiences absolutely zero interruption.

---

## 🚀 Installation & Running the System

To get the system running locally, you will need two active terminal windows (one for the backend, one for the frontend).

### 1. Database Setup
1. You must have a MongoDB instance running (either locally or via MongoDB Atlas).
2. Gather your connection URL (e.g., `mongodb+srv://admin:<password>@cluster.mongodb.net/taskmanager`).

### 2. Backend Setup
Navigate into the backend directory and install dependencies:
```bash
cd backend
npm install
```

Ensure your `.env` file is properly configured inside the `backend/` directory:
```env
PORT=5000
MONGODB_URI=YOUR_MONGO_DB_URL_HERE
JWT_SECRET=super_secret_dev_key
JWT_REFRESH_SECRET=super_secret_refresh_key
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Start the backend server in development mode:
```bash
npm run dev
```

### 3. Frontend Setup
In a new terminal window, navigate to the frontend directory:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```

The application will now dynamically boot! You can access the UI at `http://localhost:5173`.
