# 🍽️ Dineos - Restaurant QR Ordering SaaS Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3.6-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8)](https://tailwindcss.com/)

A complete, production-ready restaurant ordering system with QR code integration, real-time order tracking, and kitchen display management.

## ✨ Features

### 🔐 Authentication & Authorization
- Secure email/password authentication via Supabase Auth
- Role-based access control (Owner, Manager, Staff, Kitchen)
- Row-Level Security (RLS) for data isolation
- Password reset functionality

### 🏪 Multi-Tenant Restaurant Management
- Complete restaurant onboarding flow
- Custom URL slugs for each restaurant
- Business hours configuration
- Restaurant profile management
- Multi-location support ready

### 🍽️ Complete Menu Management
- Category CRUD operations
- Product CRUD with full details
- **Image upload** for products (PNG/JPG/WebP, 5MB limit)
- Veg/Non-veg indicators
- Price management
- Product availability toggle
- Sort order customization
- Category visibility control

### 📱 QR Code System
- Generate unique QR codes for each table
- Download QR codes as PNG
- Print-ready QR codes
- Table capacity management
- Table status tracking

### 🛒 Customer Ordering Experience
- Scan QR code to access menu
- Browse products by category
- Add items to cart with quantities
- Special instructions per item
- Order summary with pricing
- Real-time order status updates
- Mobile-responsive design

### 📋 Order Management Dashboard
- Real-time order queue
- Order status workflow (Pending → Preparing → Ready → Completed)
- Item-level breakdown
- Customer information display
- Table number tracking
- Manual status updates
- Order history

### 👨‍🍳 Kitchen Display System
- Dedicated full-screen kitchen view
- Real-time order notifications
- Separate views for NEW and IN PROGRESS orders
- Item quantities and special instructions
- One-click status updates
- Auto-refresh every 30 seconds
- Veg/Non-veg indicators

### 👥 Staff Management
- User profile management
- Staff list display
- Role indicators
- Invitation system ready

### 📊 Dashboard Analytics
- Today's orders count
- Revenue tracking
- Active orders monitoring
- Order completion stats

### 🔄 Real-Time Updates
- Supabase Realtime subscriptions
- Live order updates across devices
- Auto-refresh fallbacks
- Instant kitchen notifications

### 🎨 UI/UX
- Modern, clean design
- Fully responsive (mobile, tablet, desktop)
- Shadcn/ui components
- Tailwind CSS styling
- Loading states
- Error handling
- Toast notifications

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Styling**: Tailwind CSS 4
- **Components**: Shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **State**: Zustand
- **Testing**: Vitest + Testing Library
- **Deployment**: Vercel-ready

## 📦 Installation

### Prerequisites
- Node.js 18.17.0 or higher
- npm 9.0.0 or higher
- Supabase account (free tier works)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/KAPIL9411/Dineos.git
cd Dineos
```

2. **Install dependencies**
```bash
npm install --legacy-peer-deps
```

3. **Environment variables**
Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. **Setup Supabase database**
```bash
# Option 1: Use the setup script
.\scripts\setup-supabase.ps1

# Option 2: Manual setup
# Copy SQL from db/migrations/ and run in Supabase SQL Editor
```

5. **Run development server**
```bash
npm run dev
```

Visit `http://localhost:3000`

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run typecheck
```

**Current Status**: 33/33 tests passing ✅

## 🏗️ Build

```bash
# Production build
npm run build

# Start production server
npm run start
```

## 📖 Documentation

- **[Setup Guide](SETUP.md)** - Complete setup instructions
- **[Supabase Setup](SUPABASE_SETUP.md)** - Database configuration
- **[Deployment Guide](VERCEL_DEPLOYMENT.md)** - Deploy to Vercel
- **[API Specification](docs/06-API-SPEC.md)** - API endpoints
- **[Database Schema](docs/05-DATABASE.md)** - Database structure
- **[Architecture](docs/03-ARCHITECTURE.md)** - System design

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

The `vercel.json` configuration is already included.

### Manual Deployment

```bash
npm run build
npm run start
```

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed instructions.

## 📁 Project Structure

```
restaurant-ordering-saas/
├── app/                      # Next.js app directory
│   ├── (auth)/              # Authentication pages
│   ├── actions/             # Server actions
│   ├── api/                 # API routes
│   ├── dashboard/           # Restaurant dashboard
│   │   ├── kitchen/         # Kitchen display
│   │   ├── menu/            # Menu management
│   │   ├── orders/          # Order management
│   │   ├── qr/              # QR code generator
│   │   ├── settings/        # Settings
│   │   ├── staff/           # Staff management
│   │   └── tables/          # Table management
│   └── restaurant/          # Customer-facing pages
├── components/              # React components
│   ├── customer/            # Customer UI components
│   ├── dashboard/           # Dashboard components
│   ├── shared/              # Shared components
│   └── ui/                  # Shadcn/ui components
├── db/                      # Database migrations
├── hooks/                   # Custom React hooks
├── lib/                     # Utility functions
│   ├── orders/              # Order business logic
│   ├── stores/              # Zustand stores
│   └── supabase/            # Supabase clients
├── types/                   # TypeScript types
├── docs/                    # Documentation (33 files)
└── scripts/                 # Setup scripts
```

## 🔐 Security

- ✅ Row-Level Security (RLS) on all tables
- ✅ Tenant isolation (restaurant_id)
- ✅ Role-based access control
- ✅ API route protection
- ✅ Input validation (Zod schemas)
- ✅ SQL injection prevention
- ✅ XSS prevention
- ✅ Secure password hashing
- ✅ Environment variable protection

## 🎯 Use Cases

- **Single Restaurant**: Perfect for independent restaurants
- **Small Chains**: 2-5 locations with centralized management
- **QR Ordering**: Contactless dine-in ordering
- **Kitchen Management**: Streamline kitchen operations
- **Table Service**: Replace traditional ordering systems

## 🔮 Roadmap

### Planned Features
- [ ] Staff invitation system
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Payment integration (Razorpay/Stripe)
- [ ] Delivery partner integration
- [ ] Customer loyalty program
- [ ] Promo codes and discounts
- [ ] Advanced analytics dashboard
- [ ] Table booking system
- [ ] Multi-location support
- [ ] Native mobile apps

## 🐛 Known Issues

- Supabase rate limiting on free tier (development only)
- Minor vite/vitest version type conflicts (suppressed with @ts-ignore)

## 🤝 Contributing

This is a private project, but suggestions and feedback are welcome!

## 📄 License

Proprietary - All rights reserved

## 👤 Author

**KAPIL9411**
- GitHub: [@KAPIL9411](https://github.com/KAPIL9411)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- UI components from [Shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

## 📞 Support

For issues or questions:
1. Check the documentation in `/docs`
2. Review troubleshooting guides
3. Check browser console for errors
4. Review Supabase logs

---

**Built with ❤️ for the restaurant industry**

🚀 **Production Ready** • ✅ **Fully Tested** • 📱 **Mobile First** • ⚡ **Real-time Updates**
