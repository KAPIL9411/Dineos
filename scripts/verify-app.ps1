# Application Verification Script
# Run this to verify your app is production-ready

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Restaurant Ordering System - Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# Check 1: TypeScript
Write-Host "1. TypeScript Check..." -ForegroundColor Yellow
npm run typecheck 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ TypeScript: PASS" -ForegroundColor Green
} else {
    Write-Host "   ✗ TypeScript: FAIL" -ForegroundColor Red
    $allPassed = $false
}

# Check 2: Tests
Write-Host "2. Running Tests..." -ForegroundColor Yellow
npm run test 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Tests: PASS" -ForegroundColor Green
} else {
    Write-Host "   ✗ Tests: FAIL" -ForegroundColor Red
    $allPassed = $false
}

# Check 3: Build
Write-Host "3. Production Build..." -ForegroundColor Yellow
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Build: PASS" -ForegroundColor Green
} else {
    Write-Host "   ✗ Build: FAIL" -ForegroundColor Red
    $allPassed = $false
}

# Check 4: Environment
Write-Host "4. Environment Check..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "NEXT_PUBLIC_SUPABASE_URL=https://" -and 
        $envContent -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ" -and
        $envContent -match "SUPABASE_SERVICE_ROLE_KEY=eyJ") {
        Write-Host "   ✓ Environment: PASS" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Environment: INCOMPLETE" -ForegroundColor Red
        $allPassed = $false
    }
} else {
    Write-Host "   ✗ Environment: .env.local missing" -ForegroundColor Red
    $allPassed = $false
}

# Check 5: Dependencies
Write-Host "5. Dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✓ Dependencies: PASS" -ForegroundColor Green
} else {
    Write-Host "   ✗ Dependencies: Run npm install" -ForegroundColor Red
    $allPassed = $false
}

# Check 6: Database Migrations
Write-Host "6. Database Files..." -ForegroundColor Yellow
$migrations = @(
    "db\migrations\001_initial_schema.sql",
    "db\migrations\002_rls_policies.sql",
    "db\migrations\003_realtime.sql",
    "db\migrations\004_storage_buckets.sql"
)
$migrationsExist = $true
foreach ($migration in $migrations) {
    if (-not (Test-Path $migration)) {
        $migrationsExist = $false
        break
    }
}
if ($migrationsExist) {
    Write-Host "   ✓ Migrations: PASS" -ForegroundColor Green
} else {
    Write-Host "   ✗ Migrations: Files missing" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host "  ✓ ALL CHECKS PASSED" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your app is PRODUCTION READY! 🎉" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Start dev server: npm run dev" -ForegroundColor White
    Write-Host "  2. Test locally: http://localhost:3000" -ForegroundColor White
    Write-Host "  3. Deploy to Vercel or your platform" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "  ✗ SOME CHECKS FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please fix the failed checks above." -ForegroundColor Yellow
    Write-Host ""
}
