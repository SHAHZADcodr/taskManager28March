# Task Manager — Backend Developer Intern Assignment

A secure, scalable REST API with JWT authentication, role-based access control,
and a React frontend. Built as part of the PrimeTrade.ai Backend Developer Intern assignment.

---

## 🔗 Live Links
- **Frontend:** Coming soon after deployment
- **Backend API:** Coming soon after deployment
- **API Docs (Swagger):** Coming soon after deployment

---

## 🔐 Default Admin Account
| Field    | Value                 |
|----------|-----------------------|
| Email    | admin@taskmanager.com |
| Password | Admin@1234            |

---

## 🛠️ Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Node.js, Express.js                 |
| Database  | PostgreSQL                          |
| Auth      | JWT (HttpOnly cookies), bcryptjs    |
| Frontend  | React.js, Axios, React Router       |
| Docs      | Swagger UI                          |
| Hosting   | Render (backend), Vercel (frontend) |

---

## 🔒 Security Highlights

- **HttpOnly cookies** — JWT tokens invisible to JavaScript, XSS attacks blocked
- **Access + Refresh token pair** — 15min access token, 7-day revocable refresh token
- **Refresh tokens hashed in DB** — DB breach does not expose usable tokens
- **Role fetched live from DB** — role changes take effect instantly, no stale tokens
- **Rate limiting** — 5 login attempts per 15 min per IP (brute-force protection)
- **Timing-safe login** — bcrypt runs even for unknown emails (timing attacks blocked)
- **UUID primary keys** — task IDs are not guessable (IDOR protection)
- **Input validation** — all inputs sanitised via express-validator
- **Helmet.js** — 15+ secure HTTP headers set automatically

---

## 📁 Project Structure
```
task-manager/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js            # PostgreSQL connection pool
│   │   │   ├── initDb.js        # Auto-creates all tables on startup
│   │   │   ├── cookies.js       # Centralised cookie configuration
│   │   │   └── seed.js          # Creates default admin account
│   │   ├── controllers/
│   │   │   ├── auth.controller.js   # register, login, refresh, logout, me
│   │   │   └── task.controller.js   # full CRUD for tasks
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT verification from HttpOnly cookie
│   │   │   ├── rbac.js          # Role-based access control
│   │   │   ├── rateLimiter.js   # Brute-force protection
│   │   │   └── errorHandler.js  # Central error sanitiser
│   │   ├── routes/
│   │   │   ├── auth.routes.js   # /api/v1/auth/*
│   │   │   └── task.routes.js   # /api/v1/tasks/*
│   │   ├── validators/
│   │   │   ├── auth.validator.js
│   │   │   └── task.validator.js
│   │   └── app.js               # Express entry point
│   ├── swagger.yaml             # Full API documentation
│   └── .env.example             # Environment variables template
└── frontend/
    └── src/
        ├── api/
        │   └── axios.js         # Axios with silent token refresh
        ├── context/
        │   └── AuthContext.jsx  # Global auth state
        ├── pages/
        │   ├── Register.jsx     # Live password validation UI
        │   ├── Login.jsx
        │   └── Dashboard.jsx    # Task CRUD with filters
        ├── components/
        │   └── ProtectedRoute.jsx
        └── App.jsx
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- PostgreSQL 14+

### 1. Clone the repo
```bash
git clone https://github.com/SHAHZADcodr/taskManager28March.git
cd taskManager28March
```

### 2. Backend setup
```bash
cd backend
cp .env.example .env
# Fill in your PostgreSQL credentials
# Generate JWT secrets with:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
npm install
npm start
```

> ✅ Tables and default admin are created automatically on first run — no SQL needed.

### 3. Frontend setup
```bash
cd frontend
npm install
npm start
```

### 4. Open the app
| Service   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:3000        |
| API Docs  | http://localhost:5000/api/docs |
| Health    | http://localhost:5000/health |

---

## 📡 API Endpoints

### Auth — `/api/v1/auth`
| Method | Endpoint    | Access | Description               |
|--------|-------------|--------|---------------------------|
| POST   | /register   | Public | Register new user         |
| POST   | /login      | Public | Login, sets HttpOnly cookies |
| POST   | /refresh    | Public | Silent access token refresh |
| POST   | /logout     | Public | Logout, clears all cookies |
| GET    | /me         | Auth   | Get current user profile  |

### Tasks — `/api/v1/tasks`
| Method | Endpoint | Access | Description                      |
|--------|----------|--------|----------------------------------|
| GET    | /        | Auth   | Get tasks (admin sees all users) |
| GET    | /:id     | Auth   | Get single task                  |
| POST   | /        | Auth   | Create task                      |
| PUT    | /:id     | Auth   | Update task                      |
| DELETE | /:id     | Auth   | Delete task                      |

### Query Parameters for GET /tasks
| Param    | Values                          |
|----------|---------------------------------|
| status   | pending, in_progress, completed |
| priority | low, medium, high               |
| page     | number (default: 1)             |
| limit    | number (default: 10, max: 50)   |

---

## 👥 Role-Based Access

| Action              | User | Admin |
|---------------------|------|-------|
| See own tasks       | ✅   | ✅    |
| See all users tasks | ❌   | ✅    |
| Create task         | ✅   | ✅    |
| Edit own task       | ✅   | ✅    |
| Edit anyone's task  | ❌   | ✅    |
| Delete own task     | ✅   | ✅    |
| Delete anyone's task| ❌   | ✅    |

---

## 📈 Scalability Notes

- **Stateless access tokens** — any number of server instances behind a load
  balancer with no sticky sessions needed
- **DB-backed refresh tokens** — centralised revocation works across all instances
- **Modular structure** — auth and tasks are isolated, ready to split into
  microservices by extracting each into its own Express app
- **Caching ready** — add Redis to cache GET /tasks per user, invalidate on write
- **Rate limiter** — swap to Redis-backed store in production so limits are
  shared across all server instances
- **Docker ready** — containerise each service independently for horizontal scaling

---

## 👤 Author
Shahzad
GitHub: https://github.com/SHAHZADcodr