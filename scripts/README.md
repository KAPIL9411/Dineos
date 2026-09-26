# Setup Scripts

Helpful scripts to set up and maintain your Restaurant Ordering System.

## Available Scripts

### `setup-supabase.ps1` (Windows PowerShell)

Interactive script to help you set up your Supabase database.

**Features:**
- Checks if .env.local exists, creates it if not
- Installs Supabase CLI if needed
- Guides you through database setup
- Offers two setup methods (SQL Editor or CLI)
- Provides helpful instructions at each step

**Usage:**
```powershell
.\scripts\setup-supabase.ps1
```

**What it does:**
1. Verifies environment variables are configured
2. Checks for Supabase CLI installation
3. Lets you choose setup method:
   - **Quick Setup**: Instructions for SQL Editor (no CLI)
   - **CLI Setup**: Automated migration push

**Requirements:**
- Windows PowerShell 5.1+
- Node.js and npm installed
- Supabase project created

### `generate-icons.js` (Node.js)

Generates simple SVG icons for the PWA.

**Usage:**
```bash
node scripts/generate-icons.js
```

**What it creates:**
- `public/icon-192x192.svg` - Small app icon
- `public/icon-512x512.svg` - Large app icon
- `public/SCREENSHOTS.md` - Reminder about screenshots

**Note:** These are placeholder icons. For production, replace with professionally designed icons.

## Creating New Scripts

Feel free to add more scripts here for common tasks:

**Ideas:**
- `seed-database.js` - Add sample menu items
- `backup-database.ps1` - Create database backups
- `deploy.ps1` - Automated deployment script
- `test-realtime.js` - Test real-time connections
- `check-health.ps1` - Health check for all services

## Script Conventions

When creating new scripts:

1. **Use descriptive names**: `setup-xxx.ps1`, `generate-xxx.js`
2. **Add comments**: Explain what the script does
3. **Handle errors**: Provide helpful error messages
4. **Be interactive**: Ask for confirmation on destructive actions
5. **Document in README**: Add entry to this file

## Platform-Specific Scripts

### Windows (PowerShell .ps1)
- `setup-supabase.ps1` - Database setup

### Cross-platform (Node.js .js)
- `generate-icons.js` - Icon generation

### Mac/Linux (Bash .sh)
- Add bash scripts here if needed

## Troubleshooting

### PowerShell Execution Policy

If you get "cannot be loaded because running scripts is disabled":

```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy for current user (safe)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or run script directly
PowerShell -ExecutionPolicy Bypass -File .\scripts\setup-supabase.ps1
```

### Node.js Scripts

If Node.js script fails:

```bash
# Check Node version (should be 18+)
node --version

# Install dependencies first
npm install

# Run with full path
node scripts/generate-icons.js
```

## Contributing

When adding new scripts:

1. Test thoroughly on your platform
2. Add documentation above
3. Handle errors gracefully
4. Provide clear output messages
5. Ask for confirmation on destructive actions

## License

Same as main project (MIT)
