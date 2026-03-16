# 🍛 Famous 99 Variety Dosa — Ordering System
### Angular 17 + Spring Boot 3 + MySQL (No JWT · No Lombok)

---

## 🏗️ Tech Stack

| Layer     | Technology                                       |
|-----------|--------------------------------------------------|
| Frontend  | Angular 17 (Standalone Components, SCSS)         |
| Backend   | Spring Boot 3.2, Java 17                         |
| Auth      | HTTP Session (cookie-based, no JWT)              |
| Database  | MySQL 8                                          |
| No JWT    | ✅ Session cookies only                          |
| No Lombok | ✅ Plain Java getters/setters                    |

---

## 📁 Project Structure

```
dosa-nojwt/
│
├── src/                              ← Angular 17 frontend
│   └── app/
│       ├── app.config.ts             ← Session interceptor (withCredentials)
│       ├── app.routes.ts             ← Lazy-loaded routes
│       ├── models/models.ts          ← TypeScript interfaces
│       ├── services/
│       │   ├── auth.service.ts       ← Session login/logout/check
│       │   ├── cart.service.ts       ← BehaviorSubject cart state
│       │   ├── menu.service.ts       ← Menu API calls
│       │   ├── order.service.ts      ← Order + dashboard API
│       │   └── toast.service.ts      ← Notifications
│       ├── interceptors/
│       │   └── jwt.interceptor.ts    ← Adds withCredentials to all requests
│       ├── guards/auth.guard.ts      ← Protects /admin routes
│       └── components/
│           ├── client/               ← Public ordering page (no login)
│           └── admin/
│               ├── login/            ← Session login form
│               ├── admin-shell/      ← Sidebar layout
│               ├── dashboard/        ← Stats + recent orders
│               ├── menu/             ← CRUD menu items + image upload
│               └── orders/           ← View & update order status
│
├── backend/                          ← Spring Boot (Java 17, no Lombok)
│   ├── pom.xml                       ← No JWT / No Lombok deps
│   └── src/main/java/com/dosa/ordering/
│       ├── model/
│       │   ├── MenuItem.java         ← Plain Java entity
│       │   ├── Order.java            ← Plain Java entity
│       │   └── OrderItem.java        ← Plain Java entity
│       ├── dto/DTOs.java             ← All DTOs with plain getters/setters
│       ├── repository/               ← Spring Data JPA interfaces
│       ├── service/                  ← Business logic
│       ├── controller/               ← REST endpoints
│       └── config/
│           ├── WebConfig.java        ← CORS + static file serving
│           ├── SecurityConfig.java   ← Public vs protected routes
│           └── SessionAuthFilter.java ← Reads session cookie, sets auth context
│
└── database/
    └── setup.sql                     ← Seeds all 99 dosa menu items
```

---

## 🔐 How Authentication Works (Session, No JWT)

### Login Flow
1. Admin submits username + password to `POST /api/auth/login`
2. Spring creates an **HTTP session** and stores `ADMIN_LOGGED_IN = true`
3. Spring returns a **`JSESSIONID` cookie** to the browser
4. Angular stores **nothing** — the cookie is managed entirely by the browser

### Subsequent Requests
1. Browser automatically sends `JSESSIONID` cookie with every request
2. `SessionAuthFilter` reads the cookie → looks up the session → sets Spring Security context
3. Protected endpoints work normally

### Logout
1. `POST /api/auth/logout` → Spring invalidates the session
2. Cookie becomes invalid; admin is redirected to login

---

## 🚀 Setup Instructions

### Prerequisites
- Java 17+, Maven 3.8+
- Node.js 18+, Angular CLI 17 (`npm install -g @angular/cli@17`)
- MySQL 8

### 1. Create Database
```sql
mysql -u root -p
CREATE DATABASE IF NOT EXISTS dosa_ordering_db;
EXIT;
```

### 2. Configure Backend
Edit `backend/src/main/resources/application.properties`:
```properties
spring.datasource.username=root       # your MySQL username
spring.datasource.password=root       # your MySQL password
app.admin.username=admin              # admin login username
app.admin.password=admin123           # admin login password
```

### 3. Start Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
# Runs at http://localhost:8080
```

### 4. Seed Menu (99 dosas)
```bash
mysql -u root -p dosa_ordering_db < database/setup.sql
```

### 5. Start Angular Frontend
```bash
npm install
ng serve
# Runs at http://localhost:4200
```

---

## 🌐 Pages

| URL | Description |
|-----|-------------|
| `http://localhost:4200/` | Client menu — no login required |
| `http://localhost:4200/admin/login` | Admin login |
| `http://localhost:4200/admin/dashboard` | Dashboard |
| `http://localhost:4200/admin/menu` | Manage menu items |
| `http://localhost:4200/admin/orders` | View & manage orders |

**Default admin login:** `admin` / `admin123`

---

## 🔌 API Endpoints

### Public (no session needed)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login → creates session |
| POST | `/api/auth/logout` | Logout → invalidates session |
| GET | `/api/auth/check` | Check session validity |
| GET | `/api/menu/public/items` | Get available menu items |
| POST | `/api/orders/client` | Place a new order |

### Admin (session required via `JSESSIONID` cookie)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu/items` | All items (incl. unavailable) |
| POST | `/api/menu/items` | Add item + image upload |
| PUT | `/api/menu/items/{id}` | Update item |
| PUT | `/api/menu/items/{id}/toggle` | Toggle availability |
| DELETE | `/api/menu/items/{id}` | Delete item |
| GET | `/api/orders` | All orders (newest first) |
| GET | `/api/orders/dashboard` | Stats |
| PUT | `/api/orders/{id}/status` | Update order status |

---

## 🏗️ Build for Production

```bash
# Angular
ng build --configuration production
# Output: dist/dosa-ordering-frontend/

# Spring Boot
cd backend && mvn clean package
java -jar target/dosa-ordering-1.0.0.jar
```

Update `src/environments/environment.prod.ts` with your production API URL before building.
