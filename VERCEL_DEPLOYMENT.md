# Vercel Deployment Guide for Dineos

## ✅ Fixed Issues

- ✅ Updated `@types/node` to `^22` (resolves peer dependency conflict)
- ✅ Added `.npmrc` with `legacy-peer-deps=true`
- ✅ Build tested and passing locally

## 🚀 Deploy to Vercel

### Step 1: Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click "Import Project"
3. Select "Import Git Repository"
4. Choose `KAPIL9411/Dineos`
5. Click "Import"

### Step 2: Configure Environment Variables

Add these environment variables in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Important Notes:**
- `NEXT_PUBLIC_APP_URL` should be your production URL (e.g., `https://dineos.vercel.app`)
- This is used for generating QR codes with the correct domain
- Don't include trailing slash

**Where to find these:**
- Go to your Supabase project dashboard
- Settings → API
- Copy the values

### Step 3: Build Settings (Auto-configured)

Vercel should auto-detect:
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 18.x (or 20.x)

### Step 4: Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. Your app will be live at `https://your-project.vercel.app`

### Step 5: Configure Supabase URLs

After deployment, update Supabase settings:

1. Go to Supabase Dashboard
2. Authentication → URL Configuration
3. **Site URL**: `https://your-project.vercel.app`
4. **Redirect URLs**: Add:
   - `https://your-project.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for local dev)

### Step 6: Add Custom Domain (Optional)

1. In Vercel: Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update Supabase redirect URLs with new domain

## 🔍 Common Issues & Solutions

### Build Fails with npm error

**Solution**: Already fixed with `.npmrc` and updated `@types/node`

### Environment variables not working

**Solution**: 
- Check spelling (case-sensitive)
- Make sure they start with `NEXT_PUBLIC_` for client-side
- Redeploy after adding variables

### Supabase auth not working

**Solution**:
- Verify redirect URLs in Supabase match your Vercel domain
- Check environment variables are set correctly
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (for server actions)

### Database RLS errors

**Solution**:
- Run migrations in Supabase (copy from `db/migrations/`)
- Check RLS policies are enabled
- Verify tenant_id is set correctly

## 📊 Post-Deployment Checklist

- [ ] App loads successfully
- [ ] Can sign up new account
- [ ] Email verification works
- [ ] Can login
- [ ] Onboarding flow works
- [ ] Can create restaurant
- [ ] Can add menu items
- [ ] Can upload images
- [ ] Can create tables
- [ ] Can generate QR codes
- [ ] Customer ordering flow works
- [ ] Kitchen display works
- [ ] Real-time updates work

## 🎯 Production Optimizations

### Already Configured:
- ✅ Next.js 15 with Turbopack
- ✅ Server Components
- ✅ Image optimization
- ✅ Code splitting
- ✅ PWA support

### Recommended:
1. **Enable Vercel Analytics**
   - Dashboard → Analytics → Enable
   
2. **Set up monitoring**
   - Vercel Monitoring (built-in)
   - Or integrate Sentry

3. **Configure caching**
   - Already optimized with Next.js defaults

4. **Rate Limiting**
   - Implemented in code (`lib/rate-limit.ts`)
   - Upgrade Supabase plan for higher limits

## 🔐 Security Checklist

- [ ] `.env.local` is in `.gitignore` (already done)
- [ ] Environment variables set in Vercel (not in code)
- [ ] Service role key kept secret
- [ ] RLS policies enabled on all tables
- [ ] HTTPS enforced (automatic on Vercel)
- [ ] CORS configured properly

## 📈 Scaling

### Free Tier Limits:
- Vercel: 100GB bandwidth/month
- Supabase: 500MB database, 2GB file storage
- Good for: Development, small restaurants (1-5 locations)

### When to Upgrade:
- More than 10,000 orders/month → Supabase Pro ($25/mo)
- Heavy traffic → Vercel Pro ($20/mo)
- Multiple restaurants → Consider both upgrades

## 🆘 Need Help?

1. Check Vercel deployment logs
2. Check browser console for errors
3. Check Supabase logs (Logs → API/Database)
4. Review documentation: 
   - Next.js: https://nextjs.org/docs
   - Supabase: https://supabase.com/docs
   - Vercel: https://vercel.com/docs

## 🎉 Success!

Once deployed, your restaurant ordering system will be live at:
- **Production URL**: `https://your-project.vercel.app`
- **Dashboard**: `https://your-project.vercel.app/dashboard`
- **Kitchen Display**: `https://your-project.vercel.app/dashboard/kitchen`

Share the QR codes with customers and start taking orders! 🚀
