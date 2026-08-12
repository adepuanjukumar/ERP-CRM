# Mini ERP + CRM Operations Portal

An enterprise-grade internal operations portal designed for wholesale and distribution enterprises. The portal unifies Customer Relationship Management (CRM), Product & Inventory Catalog management, Stock Movement audit tracking, and Sales Challan dispatch operations with strict Role-Based Access Control (RBAC) and atomic database transactions.

---

## 🌟 Key Features

### 1. 🔐 Authentication & Role-Based Access Control (RBAC)
- Secure JWT (JSON Web Token) authentication with bearer token state persistence.
- Password hashing using `bcryptjs` with 10 salt rounds.
- 4 Granular User Roles:
  - **ADMIN**: Full administrative read/write privileges across all modules.
  - **SALES**: Manage customer leads/accounts and create/confirm sales dispatch challans.
  - **WAREHOUSE**: Manage product catalog, low stock alerts, and execute IN/OUT stock adjustments.
  - **ACCOUNTS**: Read-only oversight across CRM, products, inventory history, and sales challans.

### 2. 📇 Customer CRM Management
- Complete customer CRUD lifecycle management.
- Status pipeline tracking: `LEAD` ➔ `CONTACTED` ➔ `PROSPECT` ➔ `CUSTOMER` ➔ `INACTIVE`.
- Customer type categorization (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`).
- Real-time search by name, business name, mobile number, email, or GST number.
- Server-side pagination and filter controls.
- Validation for Indian GST numbers (15-character alphanumeric format) and mobile numbers.

### 3. 📦 Product & Inventory Catalog
- SKU catalog with category filtering, unit pricing, current stock level, and minimum stock alerts.
- Visual low stock indicators and warning tags.
- Stock Movement audit logging:
  - **IN**: Stock additions from supplier receipts or inventory restocks.
  - **OUT**: Manual stock reductions or automated dispatch log entries.
  - **ADJUSTMENT**: Inventory audit write-offs or physical stock reconciliations.
- Full stock movement transaction history per product.

### 4. 📄 Sales Challan Dispatch & Stock Automation
- Auto-generated challan numbers (Format: `CH-YYYYMMDD-XXXX`).
- Item pricing and SKU snapshotting upon line item addition.
- Interactive status workflow: `DRAFT` ➔ `CONFIRMED` or `CANCELLED`.
- **Atomic PostgreSQL Stock Deduction**: Confirming a sales challan executes an isolated database transaction that:
  1. Validates real-time available inventory for all line items.
  2. Deducts item quantities from current product stock.
  3. Records corresponding `OUT` stock movement audit entries.
  4. Prevents confirmation if any item lacks sufficient stock (Zero Partial Updates).

---

## 🛠️ Tech Stack

### Frontend Architecture
- **Framework**: React 18 (TypeScript)
- **Bundler**: Vite
- **HTTP Client**: Axios with global JWT request/response interceptors
- **Routing**: React Router DOM (v6)
- **Iconography**: Lucide React
- **Styling**: Vanilla CSS (Responsive Flexbox/Grid with CSS Custom Properties)

### Backend Architecture
- **Runtime**: Node.js
- **Framework**: Express.js (TypeScript)
- **Database Driver**: PostgreSQL (`pg` Connection Pool with Parameterized Queries)
- **Security & Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **Development Tooling**: `ts-node-dev`

---

## 📁 Project Directory Structure

```
ERP+CRM/
├── backend/                  # Express + TypeScript REST API Server
│   ├── database/
│   │   └── schema.sql        # PostgreSQL DDL Table Schemas & Indexes
│   ├── scripts/
│   │   ├── setup-db.ts       # Database schema setup runner
│   │   ├── seed-users.ts     # User seeding runner (Bcrypt hashed)
│   │   ├── test-auth-api.ts  # Integration tests for Auth module
│   │   ├── test-customer-api.ts # Integration tests for CRM module
│   │   ├── test-product-api.ts  # Integration tests for Product module
│   │   ├── test-challan-api.ts  # Integration tests for Challan module
│   │   └── test-e2e-integration.ts # E2E Integration Test Suite
│   ├── src/
│   │   ├── config/           # DB pool & environment configs
│   │   ├── controllers/      # Express route controllers
│   │   ├── middlewares/      # JWT authentication, RBAC & validation middlewares
│   │   ├── models/           # Data access models (Parameterized SQL queries)
│   │   ├── routes/           # API routes definition
│   │   ├── services/         # Business logic & atomic SQL transactions
│   │   ├── types/            # Backend TypeScript interfaces
│   │   ├── utils/            # JWT & password helper utilities
│   │   ├── app.ts            # Express application middleware configuration
│   │   └── server.ts         # Server bootstrap entry point
│   ├── .env.example          # Backend environment template
│   ├── package.json          # Backend dependencies & npm scripts
│   └── tsconfig.json         # Backend TypeScript configuration
│
├── frontend/                 # React 18 + Vite SPA Client
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/       # Reusable UI components (Modal, Button, Input, Badges)
│   │   │   └── layout/       # Layout wrapper (Sidebar, Header, Navigation)
│   │   ├── context/          # Auth Context provider & state management
│   │   ├── pages/            # View pages (Login, Dashboard, Customers, Products, Challans)
│   │   ├── services/         # Axios API client setup
│   │   ├── types/            # Frontend TypeScript type definitions
│   │   ├── App.tsx           # React router routes & protected route guards
│   │   ├── main.tsx          # Client entry point
│   │   └── index.css         # Modern design system & responsive styling
│   ├── .env.example          # Frontend environment template
│   ├── package.json          # Frontend dependencies & npm scripts
│   └── vite.config.ts        # Vite configuration
│
└── README.md                 # Project Overview & Setup Documentation
```

---

## ⚙️ Environment Variables Setup

### 1. Backend Environment Variables (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and supply environment details:

```env
# Server Port & Node Environment
PORT=5000
NODE_ENV=development
CORS_ORIGIN=*

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mini_erp_crm
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password

# Authentication Configuration
JWT_SECRET=your_secure_jwt_secret_key_here
JWT_EXPIRES_IN=1d
```

### 2. Frontend Environment Variables (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:

```env
# API Base URL for backend REST API communication
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🚀 Quick Setup & Execution Guide

### Prerequisites
- **Node.js**: v18.x or higher
- **PostgreSQL**: v14.x or higher running locally or remotely

---

### Step 1: Database Initialization
1. Create PostgreSQL database:
```sql
CREATE DATABASE mini_erp_crm;
```
2. Initialize schema & seed test users:
```bash
cd backend
npm install
npm run db:setup
npm run db:seed
```

---

### Step 2: Running Backend API Server
```bash
cd backend

# Development hot-reload mode
npm run dev

# Production build & start
npm run build
npm start
```
The API server will run at `http://localhost:5000`. Health check endpoint: `http://localhost:5000/api/health`.

---

### Step 3: Running Frontend Client
```bash
cd frontend
npm install

# Development server mode
npm run dev

# Production build
npm run build
npm run preview
```
The Vite development client will be available at `http://localhost:3000`.

---

## 🔑 Test Login Credentials (Local Development)

The database seed script initializes test users for each operational role with default passwords:

| User Role | Email | Password | Allowed System Access |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@erp.com` | `Admin@123` | Full Read/Write access to all modules |
| **SALES** | `sales@erp.com` | `Sales@123` | CRM Customers, Sales Challans (Create/Confirm), Products (Read-Only) |
| **WAREHOUSE** | `warehouse@erp.com` | `Warehouse@123` | Product Catalog & Stock Movements, Challans (Read-Only) |
| **ACCOUNTS** | `accounts@erp.com` | `Accounts@123` | Read-Only oversight across CRM, Inventory, and Sales Challans |

---

## 📡 API Overview

### Authentication Routes (`/api/auth`)
- `POST /api/auth/login` - Authenticate user & receive JWT token.
- `GET /api/auth/me` - Fetch currently authenticated user profile.

### Customer CRM Routes (`/api/customers`)
- `GET /api/customers` - List customers (Supports search & pagination).
- `GET /api/customers/:id` - Get customer details by ID.
- `POST /api/customers` - Create customer (`ADMIN`, `SALES`).
- `PUT /api/customers/:id` - Update customer details (`ADMIN`, `SALES`).

### Product Catalog Routes (`/api/products`)
- `GET /api/products` - List products (Supports search & pagination).
- `GET /api/products/:id` - Get product details by ID.
- `POST /api/products` - Create product (`ADMIN`, `WAREHOUSE`).
- `PUT /api/products/:id` - Update product details (`ADMIN`, `WAREHOUSE`).

### Stock Movements Routes (`/api/stock-movements`)
- `GET /api/stock-movements/product/:productId` - Get stock movement history for a product.
- `POST /api/stock-movements` - Log inventory movement (`ADMIN`, `WAREHOUSE`).

### Sales Challans Routes (`/api/sales-challans`)
- `GET /api/sales-challans` - List sales challans (Supports status filter & pagination).
- `GET /api/sales-challans/:id` - Get sales challan details with line items.
- `POST /api/sales-challans` - Create DRAFT sales challan (`ADMIN`, `SALES`).
- `PUT /api/sales-challans/:id` - Edit DRAFT sales challan (`ADMIN`, `SALES`).
- `POST /api/sales-challans/:id/confirm` - Confirm challan & trigger atomic stock deduction (`ADMIN`, `SALES`).
- `POST /api/sales-challans/:id/cancel` - Cancel sales challan (`ADMIN`, `SALES`).

---

## 🧪 Integration Test Commands

Run automated backend integration tests from the `backend/` directory:

```bash
# Authentication & Role Access Tests
npm run test:auth

# Customer CRM Tests
npm run test:customer

# Product & Stock Movement Tests
npm run test:product

# Sales Challan & Atomic Stock Transaction Tests
npm run test:challan

# Comprehensive End-to-End Integration Suite
npm run test:e2e
```

---

## ☁️ AWS Deployment Architecture (Recommended Simple Setup)

For hosting the Mini ERP + CRM Portal on AWS in a production environment, the following simple, high-availability architecture is recommended:

```
[ Web Browser ]
      │
      ├─── HTTP(S) ───► [ AWS CloudFront CDN ]
      │                        │
      │                  (Static SPA Assets)
      │                        ▼
      │                 [ AWS S3 Bucket ]
      │
      └─── REST API ──► [ Application Load Balancer (ALB) ]
                               │
                         (Express API)
                               ▼
                   [ AWS Elastic Beanstalk / EC2 ]
                   (Node.js App in Private Subnet)
                               │
                         (PostgreSQL)
                               ▼
                   [ AWS RDS PostgreSQL ]
                   (Private Subnet Database)
```

### Component Breakdown
1. **Frontend Hosting (React SPA)**:
   - Host production build static files (`frontend/dist/`) on an **Amazon S3** static website bucket.
   - Distribute through **Amazon CloudFront** CDN with SSL/TLS certificate managed via **AWS Certificate Manager (ACM)** for low-latency delivery and HTTPS.

2. **Backend REST API (Node.js/Express)**:
   - Deploy backend application on **AWS Elastic Beanstalk** (Node.js platform) or **AWS EC2** instance running Node.js with PM2 and Nginx reverse proxy.
   - Place compute instances within an AWS Virtual Private Cloud (VPC) public/private subnet setup.

3. **Database Layer (PostgreSQL)**:
   - Provision an **Amazon RDS for PostgreSQL** database instance (Single-AZ or Multi-AZ for high availability).
   - Restrict RDS Security Group access to accept inbound connections on port 5432 exclusively from the backend App Server security group.

4. **Secrets & Environment Variables**:
   - Store sensitive keys (`JWT_SECRET`, database passwords) in **AWS Secrets Manager** or **AWS Systems Manager (SSM) Parameter Store**, injecting them dynamically at runtime into the backend server environment.
