# Lead Management SaaS Platform

A complete multi-tenant SaaS platform for lead management built with NestJS, React, PostgreSQL, and Stripe.

## Features

- **Multi-tenant Architecture**: Complete tenant isolation with tenant-specific data
- **JWT Authentication**: Secure authentication with role-based access (admin, user)
- **Lead Management**: Full CRUD operations for leads with status tracking
- **User Management**: Admin can create and manage users within their tenant
- **Stripe Integration**: Subscription management with webhook support
- **Dashboard UI**: React-based dashboard with Material-UI components
- **REST API**: Comprehensive API for all operations
- **PostgreSQL**: TypeORM integration with proper entity relationships
- **Docker Ready**: Full containerization with docker-compose

## Tech Stack

**Backend:**
- NestJS (Node.js framework)
- TypeORM (PostgreSQL ORM)
- PostgreSQL (Database)
- Passport + JWT (Authentication)
- Stripe (Subscription management)
- bcrypt (Password hashing)

**Frontend:**
- React 18
- React Router v6
- Material-UI (MUI)
- Axios (HTTP client)
- JWT Decode

## Project Structure

```
├── server/                 # NestJS backend
│   ├── src/
│   │   ├── auth/          # JWT authentication & roles
│   │   ├── entities/      # TypeORM entities (Tenant, User, Lead, Subscription)
│   │   ├── tenants/       # Tenant management
│   │   ├── users/         # User management
│   │   ├── leads/         # Lead CRUD operations
│   │   └── stripe/        # Stripe integration
│   ├── package.json
│   └── Dockerfile
├── client/                # React frontend
│   ├── src/
│   │   ├── pages/        # Dashboard, Leads, Users, Login
│   │   ├── components/   # Layout, shared components
│   │   ├── contexts/     # Auth context
│   │   └── services/     # API services
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml     # Multi-container setup
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Stripe account (for subscriptions)
- Docker & Docker Compose (optional)

### Environment Variables

Create `.env` files:

**Server (.env):**
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=lead_management
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=1d
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PORT=3000
CLIENT_URL=http://localhost:3001
```

**Client (.env):**
```env
REACT_APP_API_URL=http://localhost:3000/api
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd lead-management-saas
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Setup PostgreSQL**
   ```bash
   createdb lead_management
   ```

5. **Start the development servers**

   Terminal 1 (server):
   ```bash
   cd server
   npm run start:dev
   ```

   Terminal 2 (client):
   ```bash
   cd client
   npm start
   ```

### Docker Deployment

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- NestJS server on port 3000
- React client on port 3001

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password

### Leads (Protected)
- `GET /api/leads` - Get all leads (tenant-scoped)
- `GET /api/leads/:id` - Get lead by ID
- `POST /api/leads` - Create new lead
- `PATCH /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead (admin only)

### Users (Protected)
- `GET /api/users/profile` - Get current user profile
- `GET /api/users` - Get all users (admin only)
- `POST /api/users` - Create user (admin only)

### Tenants (Protected)
- `GET /api/tenants/profile` - Get tenant profile
- `POST /api/tenants` - Create tenant (admin only)
- `GET /api/tenants` - List all tenants (admin only)

### Stripe (Protected)
- `POST /api/stripe/create-checkout` - Create subscription checkout (admin only)
- `POST /api/stripe/webhook` - Stripe webhook endpoint

## Database Schema

### Tenant
- id (UUID, PK)
- name (unique)
- companyName
- isActive
- createdAt

### User
- id (UUID, PK)
- name
- email (unique)
- password (hashed)
- role (admin/user)
- tenantId (FK -> Tenant)
- createdAt

### Lead
- id (UUID, PK)
- firstName, lastName, email, phone, company
- status (new/contacted/qualified/lost/converted)
- notes
- tenantId (FK -> Tenant)
- assignedToId (FK -> User, nullable)
- createdAt, updatedAt

### Subscription
- id (UUID, PK)
- tenantId (FK -> Tenant)
- stripeCustomerId
- stripeSubscriptionId
- plan (free/basic/premium)
- status (active/canceled/past_due)
- currentPeriodEnd
- createdAt

## User Roles

### Admin
- Create and manage users
- Create and manage leads
- View tenant profile
- Manage subscriptions
- Access all tenant data

### User
- Create and manage leads
- View assigned leads
- Update own profile
- Cannot manage other users

## Multi-Tenancy

All data is scoped to the user's tenant:
- Each request is authenticated with JWT containing `tenantId`
- All queries automatically filter by `tenantId`
- Tenants cannot access other tenants' data
- Users belong to a single tenant

## Stripe Integration

1. Create products and prices in Stripe dashboard
2. Configure webhook endpoint: `https://your-domain/api/stripe/webhook`
3. Set environment variables with Stripe keys
4. Subscription plans: free, basic, premium

## Deployment

### Production Build

**Server:**
```bash
cd server
npm run build
npm run start:prod
```

**Client:**
```bash
cd client
npm run build
# Serve build/ folder with any static server
```

### Environment Considerations

- Use strong JWT secret in production
- Enable HTTPS
- Set secure CORS origins
- Use managed PostgreSQL (AWS RDS, Heroku Postgres, etc.)
- Configure Stripe webhook for production
- Set NODE_ENV=production

## License

MIT
