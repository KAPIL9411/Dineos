# GitHub Setup Instructions

## Step 1: Create Repository on GitHub

1. Go to: https://github.com/new
2. Repository name: **Dineos**
3. Description: "QR Code Restaurant Ordering SaaS Platform"
4. Choose: **Public** or **Private** (your choice)
5. **IMPORTANT**: Do NOT check any of these:
   - ❌ Add a README file
   - ❌ Add .gitignore
   - ❌ Choose a license
6. Click **"Create repository"**

## Step 2: Create Personal Access Token (PRIVATELY)

1. Go to: https://github.com/settings/tokens/new
2. Note: "Dineos Repository Access"
3. Expiration: 90 days (recommended)
4. Select scopes:
   - ✅ **repo** (check the main box - all sub-items will be checked)
5. Scroll down and click **"Generate token"**
6. **IMPORTANT**: Copy the token starting with `ghp_` or `github_pat_`
7. **DO NOT SHARE IT IN CHAT OR ANYWHERE PUBLIC**

## Step 3: Push to GitHub

Open PowerShell and run:

```powershell
cd e:\Restaurant

# Configure git credential manager
git config --global credential.helper manager-core

# Push to GitHub (will prompt for credentials)
git push -u origin main
```

When prompted:
- **Username**: KAPIL9411
- **Password**: Paste your NEW token (Ctrl+V)

The credentials will be saved securely by Windows Credential Manager.

## Security Notes

⚠️ **NEVER share your token**:
- Not in chat
- Not in screenshots
- Not in code
- Not in public repositories

If you accidentally expose a token:
1. Immediately revoke it at: https://github.com/settings/tokens
2. Generate a new one
3. Use the new one

## Alternative: Use GitHub Desktop

If you prefer a GUI:
1. Download GitHub Desktop: https://desktop.github.com/
2. Sign in with your GitHub account
3. Add your local repository
4. Click "Publish repository"

No tokens needed with GitHub Desktop!
