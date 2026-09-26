# Production Deployment Checklist

Complete checklist for deploying the Restaurant Ordering System to production.

## Pre-deployment

### Code Quality

- [ ] All tests pass (`npm run test`)
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code is formatted (`npm run format:check`)
- [ ] Build succeeds (`npm run build`)

### Security

- [ ] All `.env` files are gitignored
- [ ] Supabase service role key is kept secret
- [ ] RLS policies are enabled on all tables
- [ ] Auth callback URLs are configured
- [ ] CORS is configured correctly
- [ ] Security headers are set (CSP, X-Frame-Options, etc.)
- [ ] HTTPS is enforced in production

### Database

- [ ] All migrations have been run
- [ ] RLS policies tested with different roles
- [ ] Indexes created for frequently queried columns
- [ ] Backup strategy is in place
- [ ] Database connection pooling configured

### Environment Variables

Required for production:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

## Deployment Steps

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Push to GitHub
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository
   - Configure project:
     - Framework: Next.js
     - Root Directory: ./
     - Build Command: `npm run build`
     - Output Directory: .next

3. **Add Environment Variables**
   - Go to Project Settings > Environment Variables
   - Add all variables from `.env.local`
   - Make sure to add them for Production, Preview, and Development

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Verify deployment at the provided URL

5. **Custom Domain** (Optional)
   - Go to Project Settings > Domains
   - Add your custom domain
   - Configure DNS records as instructed

### Option 2: Self-hosted (Docker)

1. **Build Docker Image**
   ```bash
   # Create Dockerfile if not exists
   docker build -t restaurant-ordering .
   ```

2. **Run Container**
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
     -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
     -e SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
     -e NEXT_PUBLIC_APP_URL=https://yourdomain.com \
     --name restaurant-app \
     restaurant-ordering
   ```

3. **Setup Reverse Proxy** (Nginx example)
   ```nginx
   server {
     listen 80;
     server_name yourdomain.com;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

4. **Setup SSL**
   ```bash
   # Using Let's Encrypt
   sudo certbot --nginx -d yourdomain.com
   ```

### Option 3: Other Platforms

**Netlify:**
- Similar to Vercel
- Go to [netlify.com](https://netlify.com)
- Import from Git
- Add environment variables
- Deploy

**Railway:**
- Go to [railway.app](https://railway.app)
- New Project > Deploy from GitHub
- Add environment variables
- Deploy

**DigitalOcean App Platform:**
- Go to [digitalocean.com/products/app-platform](https://www.digitalocean.com/products/app-platform)
- Create App > GitHub
- Configure build settings
- Add environment variables
- Deploy

## Post-deployment

### Verification

- [ ] Homepage loads correctly
- [ ] Auth flow works (signup, login, password reset)
- [ ] Dashboard is accessible
- [ ] Menu CRUD operations work
- [ ] QR codes generate and scan correctly
- [ ] Customer can place orders
- [ ] Real-time updates work in kitchen display
- [ ] Order status updates propagate
- [ ] Images upload and display correctly
- [ ] PWA manifest and icons load
- [ ] Offline indicator works

### Performance

- [ ] Run Lighthouse audit (target: 90+ on all metrics)
- [ ] Check Core Web Vitals
- [ ] Test on mobile devices
- [ ] Test on slow 3G network
- [ ] Check bundle size

### Monitoring

- [ ] Setup error tracking (Sentry, LogRocket, etc.)
- [ ] Configure analytics (Google Analytics, Plausible, etc.)
- [ ] Setup uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Configure performance monitoring
- [ ] Setup database query monitoring

### SEO (for public pages)

- [ ] Meta tags are present
- [ ] OpenGraph tags configured
- [ ] Sitemap generated
- [ ] robots.txt configured
- [ ] Dashboard/admin pages have noindex

### Backups

- [ ] Database backup schedule configured
- [ ] Uploaded images backed up
- [ ] Backup restoration tested

## Maintenance

### Regular Tasks

**Daily:**
- Check error logs
- Monitor uptime
- Review new orders

**Weekly:**
- Review performance metrics
- Check disk space usage
- Review security alerts

**Monthly:**
- Update dependencies (`npm update`)
- Review and rotate API keys
- Test backup restoration
- Review access logs

### Updating

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run migrations (if any)
supabase db push

# Build
npm run build

# Deploy
# (Vercel auto-deploys on git push)
# (Self-hosted: restart container/server)
```

## Rollback Plan

If deployment fails:

1. **Vercel**: Go to Deployments > Previous deployment > Promote to Production
2. **Self-hosted**: 
   ```bash
   git checkout <previous-commit>
   docker build -t restaurant-ordering .
   docker stop restaurant-app
   docker rm restaurant-app
   docker run -d ... restaurant-ordering
   ```

## Scaling

### Database

- Enable connection pooling
- Add read replicas
- Optimize slow queries
- Partition large tables

### Application

- Enable CDN (Vercel has this built-in)
- Use edge functions for API routes
- Implement Redis caching
- Add rate limiting

### Assets

- Use Supabase Storage or S3 for images
- Enable CDN for static assets
- Optimize images (WebP, lazy loading)
- Implement caching headers

## Support

### Monitoring Dashboard

Setup a status page showing:
- API health
- Database status
- Recent deployments
- Error rates
- Response times

### On-call Procedures

1. Check monitoring dashboard
2. Review error logs
3. Check Supabase status page
4. Review recent deployments
5. Rollback if necessary

## Costs (Free Tier Estimate)

- **Vercel**: Free for hobby projects
- **Supabase**: Free tier (500MB database, 2GB file storage)
- **Domain**: $10-15/year
- **Total**: ~$10-15/year for small restaurants

### Scaling Costs

When you outgrow free tier:
- **Vercel Pro**: $20/month
- **Supabase Pro**: $25/month
- **Total**: ~$45/month + domain

## Compliance

### GDPR (if serving EU customers)

- [ ] Privacy policy in place
- [ ] Cookie consent banner
- [ ] Data export functionality
- [ ] Data deletion on request
- [ ] Terms of service

### PCI DSS (if handling payments)

- [ ] Use payment processor (Stripe, Razorpay)
- [ ] Never store card details
- [ ] Use HTTPS everywhere
- [ ] Implement secure checkout flow

## Final Checklist

Before going live:

- [ ] All items in this checklist completed
- [ ] Stakeholders notified
- [ ] Support team briefed
- [ ] Rollback plan tested
- [ ] Monitoring confirmed working
- [ ] Backups verified
- [ ] Performance acceptable
- [ ] Security audit passed
- [ ] Legal requirements met

🎉 **Ready to launch!**
