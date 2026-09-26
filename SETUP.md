# Restaurant Ordering System - Setup Guide

A complete QR code-based restaurant ordering platform built with Next.js 15, Supabase, and PWA support.

## Features

- 🏪 **Multi-tenant**: White-label platform for restaurants
- 📱 **QR Code Ordering**: Customers scan table QR codes to order
- 🔐 **Authentication**: Supabase Auth for staff, anonymous sessions for customers
- 🍽️ **Menu Management**: Full CRUD for categories and products
- 🛒 **Shopping Cart**: Client-side cart with real-time updates
- 📊 **Dashboard**: Restaurant owner/manager dashboard
- 👨‍🍳 **Kitchen Display**: Real-time order tracking for kitchen staff
- 🔄 **Real-time Updates**: Supabase real-time subscriptions for live order updates
- 📴 **Offline Support**: PWA with offline indicator
- 🎨 **Modern UI**: Tailwind CSS + shadcn/ui components
- ✅ **Type-safe**: Full TypeScript with strict mode
- 🧪 **Tested**: Vitest unit and integration tests

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **State Management**: React hooks + Zustand (for cart)
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest + Testing Library
- **PWA**: Manifest + Service Worker

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Git

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd restaurant
npm install
```

### 2. Setup Supabase

**Quick Start (Automated Script):**
```powershell
# Run the setup script (Windows PowerShell)
.\scripts\setup-supabase.ps1
```

**Or Manual Setup:**

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project credentials from Settings → API

**📖 For detailed Supabase setup instructions, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup

**Option A: Using the Script (Easiest)**
```powershell
.\scripts\setup-supabase.ps1
```

**Option B: Using SQL Editor (Recommended for Beginners)**
1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the sidebar
3. Run each file in `db/migrations/` in order:
   - `001_initial_schema.sql` - Creates tables
   - `002_rls_policies.sql` - Adds security policies
   - `003_realtime.sql` - Enables real-time updates
   - `004_storage_buckets.sql` - Creates image storage

**Option C: Using Supabase CLI (For Developers)**
```bash
# Install CLI
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

**📖 For detailed instructions and troubleshooting, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
restaurant/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   ├── auth/               # Auth pages
│   ├── dashboard/          # Restaurant dashboard
│   └── restaurant/         # Customer-facing pages
├── components/             # React components
│   ├── customer/           # Customer UI components
│   ├── dashboard/          # Dashboard components
│   └── ui/                 # Reusable UI components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
│   ├── supabase/           # Supabase client setup
│   ├── result.ts           # Result<T, E> error handling
│   └── qr.ts               # QR code generation
├── types/                  # TypeScript type definitions
│   ├── domain.ts           # Domain models
│   └── database.ts         # Database types
├── db/                     # Database migrations
└── public/                 # Static assets
```

## Key Concepts

### Authentication

- **Staff**: Email/password authentication via Supabase Auth
- **Customers**: Anonymous sessions, optional sign-up
- **Roles**: Platform Admin, Restaurant Owner, Manager, Kitchen Staff, Waiter

### Multi-tenancy

- Each restaurant belongs to a tenant
- Row-level security (RLS) policies enforce tenant isolation
- Staff can only access their assigned restaurant

### Real-time Updates

- Order status changes are broadcast via Supabase Realtime
- Kitchen display and customer tracking pages update automatically
- No polling required

### Error Handling

Uses a `Result<T, E>` pattern for explicit, typed error handling:

```typescript
const result = await createOrder(data)
if (result.isErr()) {
  console.error(result.error)
  return
}
const order = result.value
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run typecheck        # Run TypeScript compiler
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format with Prettier
npm run format:check     # Check Prettier formatting

# Testing
npm run test             # Run tests once
npm run test:watch       # Run tests in watch mode
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Self-hosted

```bash
npm run build
npm run start
```

## Database Schema

Key tables:

- `tenants`: Multi-tenant isolation
- `restaurants`: Restaurant profiles
- `staff`: Staff members and roles
- `categories`: Menu categories
- `products`: Menu items
- `dining_tables`: Tables for dine-in
- `orders`: Customer orders
- `order_items`: Order line items
- `table_sessions`: Active dining sessions

See `db/migrations/` for full schema.

## API Routes

### Public

- `GET /api/v1/restaurants/[slug]` - Get restaurant by slug
- `GET /api/v1/restaurants/[slug]/menu` - Get menu
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/[id]` - Get order
- `PATCH /api/v1/orders/[id]/status` - Update order status

### Protected (Dashboard)

Requires authentication and proper role.

## Security

- **RLS Policies**: All tables have row-level security
- **Tenant Isolation**: Data is scoped by tenant_id
- **Role-based Access**: Staff roles control dashboard access
- **HTTPS Only**: Production requires HTTPS
- **Security Headers**: CSP, X-Frame-Options, etc.

## Testing

```bash
# Run all tests
npm run test

# Run specific test file
npm run test __tests__/orders/calculate-order-total.test.ts

# Run with coverage
npm run test -- --coverage
```

Tests are written with Vitest and Testing Library.

## Troubleshooting

### Build fails with Supabase errors

- Check that all environment variables are set
- Verify Supabase URL and keys are correct
- Ensure database migrations have been run

### Real-time not working

- Check Supabase Realtime is enabled in project settings
- Verify RLS policies allow SELECT on orders table
- Check browser console for connection errors

### Auth redirects not working

- Set the correct `NEXT_PUBLIC_APP_URL`
- Add redirect URLs in Supabase Auth settings
- Check callback route at `/auth/callback`

## Contributing

1. Create a feature branch
2. Make changes
3. Run tests and linting
4. Submit pull request

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
