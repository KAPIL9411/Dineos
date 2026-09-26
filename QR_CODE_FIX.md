# QR Code Fix - Using Production URL

## Problem
QR codes were showing `localhost:3000` URLs instead of your production domain.

## Solution Applied ✅
Updated the QR generation to automatically use Vercel's production URL.

## What to Do Now

### Option 1: Automatic (Recommended)
After redeployment, QR codes will automatically use your Vercel URL. No additional setup needed!

The code now uses `VERCEL_URL` environment variable which Vercel provides automatically.

### Option 2: Custom Domain (If you have one)
If you want to use a custom domain, add this environment variable in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   - **Name**: `NEXT_PUBLIC_APP_URL`
   - **Value**: `https://yourdomain.com` (your custom domain)
   - **Environment**: Production, Preview, Development (select all)
3. Click "Save"
4. Redeploy your app

## Testing the Fix

After the new deployment goes live:

1. **Go to your Dashboard** → QR Codes
2. **Regenerate all QR codes** - The new ones will use production URL
3. **Download the new QR codes**
4. **Scan with phone** - Should open your Vercel URL, not localhost!

## How It Works

The code now checks in this order:
1. `NEXT_PUBLIC_APP_URL` (if you set it manually)
2. `VERCEL_URL` (automatically provided by Vercel)
3. `localhost:3000` (for local development)

## Important: Re-download QR Codes!

⚠️ **Old QR codes still have localhost URLs embedded in them.**

You need to:
1. Wait for new deployment to complete
2. Visit `/dashboard/qr` page
3. Download all QR codes again
4. Print and replace the old ones

## Verify It's Working

After downloading new QR codes:
1. Scan with your phone camera
2. URL should be: `https://your-app.vercel.app/restaurant/...`
3. NOT: `http://localhost:3000/restaurant/...`

## If Still Showing Localhost

1. **Hard refresh** the QR page: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Check Vercel deployment** logs to ensure latest commit deployed
3. **Clear browser cache** and reload
4. **Try incognito/private** browsing mode

## Production URL Format

Your QR codes will generate URLs like:
```
https://your-app.vercel.app/restaurant/your-restaurant-slug?restaurantId=xxx&tableId=yyy
```

Customers scan → Opens menu → Can order immediately!

---

**Status**: ✅ Fixed and deployed  
**Commit**: `bb70806` - "Fix QR codes to use production URL"  
**Action Required**: Re-download all QR codes after deployment completes
