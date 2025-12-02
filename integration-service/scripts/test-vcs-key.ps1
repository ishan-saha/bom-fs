# VCS Key Setup Test Script (PowerShell)
# 
# This script tests the complete VCS SSH key setup flow
# Usage: .\scripts\test-vcs-key.ps1

$INTEGRATION_BASE = if ($env:INTEGRATION_BASE_URL) { $env:INTEGRATION_BASE_URL } else { "http://localhost:3001" }

Write-Host "`n🚀 VCS SSH Key Setup Test`n" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

Write-Host "`n📡 Testing Integration Service: $INTEGRATION_BASE`n" -ForegroundColor Yellow

try {
    # Test 1: Complete Setup Flow
    Write-Host "▶️  Test 1: Complete Setup Flow (Generate + Activate + Distribute + Test)`n" -ForegroundColor Cyan
    
    $response = Invoke-RestMethod -Uri "$INTEGRATION_BASE/vcs/setup-complete" `
        -Method Post `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    if ($response.success) {
        Write-Host "✅ Complete setup successful!`n" -ForegroundColor Green
        
        Write-Host "📋 Summary:" -ForegroundColor White
        Write-Host "   Fingerprint: $($response.summary.fingerprint)" -ForegroundColor Gray
        Write-Host "   Status: $($response.summary.status)" -ForegroundColor Gray
        Write-Host "   Tested: $($response.summary.tested)`n" -ForegroundColor Gray
        
        Write-Host "📝 Setup Steps:" -ForegroundColor White
        foreach ($step in $response.steps) {
            $icon = if ($step.status -eq "success") { "✅" } else { "❌" }
            Write-Host "   $icon Step $($step.step): $($step.action.ToUpper())" -ForegroundColor Gray
        }
        
        Write-Host "`n🔑 Public Key (Add to GitHub Deploy Keys):" -ForegroundColor White
        Write-Host ("-" * 60) -ForegroundColor Gray
        Write-Host $response.summary.public_key -ForegroundColor Yellow
        Write-Host ("-" * 60) -ForegroundColor Gray
        
    } else {
        Write-Host "❌ Setup failed: $($response.error)" -ForegroundColor Red
        exit 1
    }
    
    # Test 2: Get Active Key
    Write-Host "`n▶️  Test 2: Retrieve Active Key`n" -ForegroundColor Cyan
    
    $activeKey = Invoke-RestMethod -Uri "$INTEGRATION_BASE/vcs/active" `
        -Method Get `
        -ErrorAction Stop
    
    if ($activeKey.success) {
        Write-Host "✅ Retrieved active key" -ForegroundColor Green
        Write-Host "   Fingerprint: $($activeKey.data.fingerprint)" -ForegroundColor Gray
        Write-Host "   Status: $($activeKey.data.status)" -ForegroundColor Gray
        Write-Host "   Active: $($activeKey.data.active)`n" -ForegroundColor Gray
    }
    
    # Test 3: Test Connection
    Write-Host "▶️  Test 3: Test Playground Connection`n" -ForegroundColor Cyan
    
    $testResult = Invoke-RestMethod -Uri "$INTEGRATION_BASE/vcs/test-connection" `
        -Method Post `
        -ErrorAction Stop
    
    if ($testResult.success) {
        Write-Host "✅ Connection test passed" -ForegroundColor Green
        Write-Host "   Result: $($testResult.data | ConvertTo-Json -Compress)`n" -ForegroundColor Gray
    }
    
    # Test 4: Get Metrics
    Write-Host "▶️  Test 4: Retrieve Metrics`n" -ForegroundColor Cyan
    
    $metrics = Invoke-RestMethod -Uri "$INTEGRATION_BASE/vcs/metrics" `
        -Method Get `
        -ErrorAction Stop
    
    Write-Host "✅ Metrics retrieved:" -ForegroundColor Green
    Write-Host $metrics -ForegroundColor Gray
    
    Write-Host "`n🎉 All Tests Passed!`n" -ForegroundColor Green
    Write-Host ("=" * 60) -ForegroundColor Gray
    
    Write-Host "`n📖 Next Steps:" -ForegroundColor White
    Write-Host "   1. Copy the public key above" -ForegroundColor Gray
    Write-Host "   2. Add to GitHub repository Deploy Keys" -ForegroundColor Gray
    Write-Host "   3. Enable read access" -ForegroundColor Gray
    Write-Host "   4. Test cloning via Playground service`n" -ForegroundColor Gray
    
    exit 0
    
} catch {
    Write-Host "`n❌ Test Failed!`n" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host "`n🔍 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Ensure Integration Service is running on $INTEGRATION_BASE" -ForegroundColor Gray
    Write-Host "   2. Check database connection (PostgreSQL)" -ForegroundColor Gray
    Write-Host "   3. Verify environment variables:" -ForegroundColor Gray
    Write-Host "      - INTEGRATION_VCS_KEY_ENC_KEY" -ForegroundColor Gray
    Write-Host "      - INTEGRATION_SHARED_SECRET" -ForegroundColor Gray
    Write-Host "      - PLAYGROUND_BASE_URL" -ForegroundColor Gray
    Write-Host "   4. Check service logs for details`n" -ForegroundColor Gray
    
    exit 1
}
