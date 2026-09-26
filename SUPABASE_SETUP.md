# Supabase Database Setup Guide

Complete step-by-step guide to set up your Supabase database for the Restaurant Ordering System.

## Prerequisites

- Node.js 18+ installed
- Supabase account (sign up at [supabase.com](https://supabase.com))
- This project cloned and dependencies installed

## Option 1: Quick Setup (SQL Editor - Recommended for Beginners)

This is the easiest method if you're new to Supabase.

### Step 1: Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name**: Restaurant Ordering (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier works fine
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to initialize

### Step 2: Get Your API Keys

1. In your project dashboard, click **"Settings"** (gear icon in sidebar)
2. Click **"API"** in the settings menu
3. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Long JWT token starting with `eyJ...`
   - **service_role key**: Another JWT token (click "Reveal" to see it)

### Step 3: Configure Environment Variables

1. In your project folder, copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and replace the values:
   ```env
   # Replace these with YOUR values from Step 2
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
   
   # Keep this for local development
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### Step 4: Run Database Migrations

1. Go to your Supabase project dashboard
2. Click **"SQL Editor"** in the sidebar
3. Click **"New query"**
4. Open each migration file and run them in order:

**Migration 1: Initial Schema**
```bash
# Copy content from: db/migrations/001_initial_schema.sql
```
- Paste into SQL Editor
- Click **"Run"** (or press Ctrl+Enter)
- Wait for "Success" message

**Migration 2: RLS Policies**
```bash
# Copy content from: db/migrations/002_rls_policies.sql
```
- Create new query
- Paste content
- Click **"Run"**

**Migration 3: Realtime**
```bash
# Copy content from: db/migrations/003_realtime.sql
```
- Create new query
- Paste content
- Click **"Run"**

**Migration 4: Storage Buckets**
```bash
# Copy content from: db/migrations/004_storage_buckets.sql
```
- Create new query
- Paste content
- Click **"Run"**

### Step 5: Verify Setup

1. Click **"Table Editor"** in sidebar
2. You should see tables:
   - tenants
   - restaurants
   - staff
   - categories
   - products
   - dining_tables
   - orders
   - order_items
   - customers
   - delivery_addresses
   - audit_logs

3. Click **"Authentication"** > **"Policies"**
   - Verify RLS is enabled on tables

4. Click **"Database"** > **"Replication"**
   - Verify "orders" table has replication enabled

✅ **You're done!** Skip to "Test Your Setup" section below.

---

## Option 2: CLI Setup (For Developers)

This method is better if you're comfortable with command line tools.

### Step 1: Install Supabase CLI

**Windows (PowerShell):**
```powershell
# Using npm (recommended)
npm install -g supabase

# Or using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**macOS:**
```bash
# Using Homebrew
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase
```

**Linux:**
```bash
# Using npm
npm install -g supabase
```

**Verify installation:**
```bash
supabase --version
```

### Step 2: Login to Supabase

```bash
# This will open your browser for authentication
supabase login
```

Follow the browser prompts to authorize the CLI.

### Step 3: Link Your Project

First, create your Supabase project (see Option 1, Step 1 if not done).

Then get your project reference:
1. Go to your project dashboard
2. Look at the URL: `https://supabase.com/dashboard/project/xxxxx`
3. The `xxxxx` part is your project-ref

Now link it:
```bash
cd e:\Restaurant
supabase link --project-ref your-project-ref
```

You'll be prompted for your database password (the one you created when setting up the project).

### Step 4: Push Migrations

```bash
supabase db push
```

This will:
- ✅ Read all migration files from `db/migrations/`
- ✅ Apply them to your Supabase database in order
- ✅ Show you the changes
- ✅ Ask for confirmation

Type `yes` to confirm.

### Step 5: Verify

```bash
# Check database status
supabase db status

# List tables
supabase db list-tables
```

✅ **Done!** Proceed to "Test Your Setup" below.

---

## Test Your Setup

### 1. Start Development Server

```bash
npm run dev
```

### 2. Check Homepage

Open [http://localhost:3000](http://localhost:3000)

You should see the homepage. If you get Supabase errors, check your `.env.local`.

### 3. Create First Restaurant (via Onboarding)

1. Go to [http://localhost:3000/signup](http://localhost:3000/signup)
2. Sign up with:
   - Email: `owner@restaurant.com`
   - Password: At least 8 characters
3. You'll be redirected to onboarding
4. Fill in restaurant details:
   - Name: Test Restaurant
   - Slug: test-restaurant
   - Description: A test restaurant
   - Choose a color
5. Click "Continue" through the wizard

### 4. Check Database

Go back to Supabase dashboard:
1. Click **"Table Editor"**
2. Click **"tenants"** - Should have 1 row
3. Click **"restaurants"** - Should have 1 row
4. Click **"staff"** - Should have 1 row (you)

### 5. Test Real-time

1. Keep your dashboard open
2. In another browser tab, place a test order
3. Watch the dashboard update in real-time

✅ **Everything working!**

---

## Troubleshooting

### Error: "Connection refused"

**Problem**: Can't connect to Supabase  
**Solution**: 
- Check your `.env.local` has correct values
- Verify `NEXT_PUBLIC_SUPABASE_URL` doesn't have trailing slash
- Restart dev server: `npm run dev`

### Error: "Row level security policy violated"

**Problem**: RLS policies not applied  
**Solution**:
```bash
# Re-run RLS migration
# In SQL Editor, paste and run: db/migrations/002_rls_policies.sql
```

### Error: "JWT expired" or "Invalid JWT"

**Problem**: Wrong API keys  
**Solution**:
1. Go to Supabase dashboard → Settings → API
2. Copy fresh keys
3. Update `.env.local`
4. Restart server

### Error: "relation does not exist"

**Problem**: Migrations not run  
**Solution**:
- Run all migrations in SQL Editor (Option 1, Step 4)
- Or run `supabase db push` (Option 2, Step 4)

### Error: "supabase: command not found"

**Problem**: CLI not installed or not in PATH  
**Solution**:
```bash
# Install globally
npm install -g supabase

# Or on Windows, use full path
C:\Users\YourName\AppData\Roaming\npm\supabase.cmd --version
```

### Real-time not working

**Problem**: Replication not enabled  
**Solution**:
1. Go to Database → Replication
2. Enable replication for `orders` table
3. Or re-run migration 003_realtime.sql

### Can't upload images

**Problem**: Storage bucket not created  
**Solution**:
1. Re-run migration 004_storage_buckets.sql
2. Or manually create:
   - Go to Storage
   - Create bucket "restaurant-images"
   - Make it public
   - Set file size limit to 5MB

---

## Manual Database Setup (Alternative)

If you prefer to manually create tables:

### 1. Enable Extensions

```sql
-- In SQL Editor
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
```

### 2. Run Each Migration File

Copy the entire content of each file in `db/migrations/` and run in SQL Editor.

### 3. Verify

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should return 11 tables
```

---

## Security Checklist

Before going to production:

- [ ] Changed default passwords
- [ ] `.env.local` is in `.gitignore`
- [ ] Service role key is secret
- [ ] RLS policies enabled on all tables
- [ ] Auth email templates customized
- [ ] Auth redirects configured
- [ ] Storage buckets have size limits
- [ ] Database backups enabled

---

## Database Maintenance

### Backups

Supabase automatically backs up your database daily (on paid plans).

To manually backup:
1. Dashboard → Database → Backups
2. Click "Create backup"

### Viewing Logs

```bash
# Database logs
supabase db logs

# Or in dashboard: Database → Logs
```

### Reset Database (Development Only)

⚠️ **This deletes all data!**

```bash
supabase db reset
```

---

## Next Steps

After successful setup:

1. ✅ Database running
2. ✅ Environment variables configured
3. ✅ Migrations applied
4. ✅ First restaurant created

Now you can:
- Add menu items
- Create tables
- Generate QR codes
- Accept orders
- Build your restaurant!

---

## Get Help

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **CLI Reference**: [supabase.com/docs/reference/cli](https://supabase.com/docs/reference/cli)
- **Community**: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)

---

## Quick Reference

### Common Commands

```bash
# Check CLI version
supabase --version

# Login
supabase login

# Link project
supabase link --project-ref your-ref

# Push migrations
supabase db push

# Check status
supabase db status

# View logs
supabase db logs

# Reset (dev only)
supabase db reset
```

### Project Info

- **Tables**: 11 main tables
- **Migrations**: 4 files
- **RLS**: Enabled on all tables
- **Realtime**: Enabled on orders
- **Storage**: 1 bucket (restaurant-images)

---

Ready to build! 🚀
