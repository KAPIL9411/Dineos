# Supabase Setup Script for Windows PowerShell
# This script helps you set up the Supabase database

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Restaurant Ordering System - Supabase Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "✓ Found .env.local" -ForegroundColor Green
} else {
    Write-Host "✗ .env.local not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Creating .env.local from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env.local"
    Write-Host "✓ Created .env.local" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: You need to update .env.local with your Supabase credentials!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Get your credentials from:" -ForegroundColor Cyan
    Write-Host "  https://supabase.com/dashboard/project/_/settings/api" -ForegroundColor White
    Write-Host ""
    Write-Host "Then update these values in .env.local:" -ForegroundColor Cyan
    Write-Host "  - NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor White
    Write-Host "  - NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor White
    Write-Host "  - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor White
    Write-Host ""
    
    # Ask if they want to open the file
    $openFile = Read-Host "Open .env.local now? (y/n)"
    if (($openFile -eq "y") -or ($openFile -eq "Y")) {
        notepad ".env.local"
    }
    
    Write-Host ""
    Write-Host "After updating .env.local, run this script again." -ForegroundColor Yellow
    Write-Host ""
    exit
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Choose Setup Method" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Quick Setup (SQL Editor - Recommended for beginners)" -ForegroundColor White
Write-Host "   - Copy/paste SQL in Supabase dashboard" -ForegroundColor Gray
Write-Host "   - No CLI commands needed" -ForegroundColor Gray
Write-Host ""
Write-Host "2. CLI Setup (For developers)" -ForegroundColor White
Write-Host "   - Use supabase CLI to push migrations" -ForegroundColor Gray
Write-Host "   - Automated and faster" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter choice (1 or 2)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "  Quick Setup Instructions" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Follow these steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Open your Supabase project: https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "2. Click 'SQL Editor' in the sidebar" -ForegroundColor White
    Write-Host "3. Run each migration file in order:" -ForegroundColor White
    Write-Host ""
    
    $migrations = @(
        "db\migrations\001_initial_schema.sql",
        "db\migrations\002_rls_policies.sql",
        "db\migrations\003_realtime.sql",
        "db\migrations\004_storage_buckets.sql"
    )
    
    foreach ($migration in $migrations) {
        if (Test-Path $migration) {
            $filename = Split-Path $migration -Leaf
            Write-Host "   ✓ $filename" -ForegroundColor Green
        } else {
            Write-Host "   ✗ $filename (NOT FOUND)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "For each file:" -ForegroundColor Yellow
    Write-Host "  a. Click 'New query' in SQL Editor" -ForegroundColor White
    Write-Host "  b. Copy the file content" -ForegroundColor White
    Write-Host "  c. Paste into the editor" -ForegroundColor White
    Write-Host "  d. Click 'Run' (or Ctrl+Enter)" -ForegroundColor White
    Write-Host "  e. Wait for 'Success' message" -ForegroundColor White
    Write-Host ""
    Write-Host "After running all migrations, your database is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Open migration folder now? (y/n)" -ForegroundColor Cyan
    $open = Read-Host
    if (($open -eq "y") -or ($open -eq "Y")) {
        explorer "db\migrations"
    }
} elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "  CLI Setup" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Check if already linked
    if (Test-Path ".supabase\config.toml") {
        Write-Host "✓ Project already linked" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "Linking Supabase project..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "You need your project-ref from the Supabase URL:" -ForegroundColor Cyan
        Write-Host "  https://supabase.com/dashboard/project/xxxxx" -ForegroundColor White
        Write-Host "  The 'xxxxx' part is your project-ref" -ForegroundColor White
        Write-Host ""
        
        $projectRef = Read-Host "Enter your project-ref"
        
        if ($projectRef) {
            Write-Host ""
            Write-Host "Linking to project: $projectRef" -ForegroundColor Cyan
            supabase link --project-ref $projectRef
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Project linked successfully" -ForegroundColor Green
            } else {
                Write-Host "✗ Failed to link project" -ForegroundColor Red
                Write-Host ""
                Write-Host "Make sure:" -ForegroundColor Yellow
                Write-Host "  - You are logged in (run: supabase login)" -ForegroundColor White
                Write-Host "  - Project-ref is correct" -ForegroundColor White
                Write-Host "  - You have database password ready" -ForegroundColor White
                exit 1
            }
        } else {
            Write-Host "✗ Project-ref is required" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host ""
    Write-Host "Pushing migrations to database..." -ForegroundColor Yellow
    Write-Host ""
    
    supabase db push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Migrations applied successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Verifying setup..." -ForegroundColor Cyan
        supabase db status
    } else {
        Write-Host ""
        Write-Host "✗ Failed to push migrations" -ForegroundColor Red
        Write-Host ""
        Write-Host "Try running manually:" -ForegroundColor Yellow
        Write-Host "  supabase db push" -ForegroundColor White
        exit 1
    }
} else {
    Write-Host "Invalid choice. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Start dev server: npm run dev" -ForegroundColor White
Write-Host "  2. Open: http://localhost:3000" -ForegroundColor White
Write-Host "  3. Sign up and create your first restaurant" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see: SUPABASE_SETUP.md" -ForegroundColor Cyan
Write-Host ""
