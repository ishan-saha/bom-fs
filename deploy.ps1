# BOM Full Stack Deployment Script (PowerShell)
# This script helps deploy the entire BOM application stack on Windows

$ErrorActionPreference = "Stop"

# Functions
function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Yellow
}

function Check-Requirements {
    Write-Info "Checking requirements..."
    
    try {
        docker --version | Out-Null
        Write-Success "Docker is installed"
    } catch {
        Write-Error "Docker is not installed. Please install Docker Desktop first."
        exit 1
    }
    
    try {
        docker-compose --version | Out-Null
        Write-Success "Docker Compose is installed"
    } catch {
        Write-Error "Docker Compose is not installed. Please install Docker Desktop first."
        exit 1
    }
}

function Check-EnvFile {
    if (-not (Test-Path .env)) {
        Write-Info "Creating .env file from .env.example..."
        Copy-Item .env.example .env
        Write-Info "⚠️  Please edit .env file with your configuration before deploying!"
        Write-Info "   Required: SMTP settings for email verification"
        Read-Host "Press Enter to continue after editing .env file"
    } else {
        Write-Success ".env file exists"
    }
}

function Deploy-Dev {
    Write-Info "Deploying BOM in DEVELOPMENT mode..."
    
    Check-Requirements
    Check-EnvFile
    
    Write-Info "Building and starting services..."
    docker-compose up -d --build
    
    Write-Success "Services started successfully!"
    Write-Info "Waiting for services to be healthy..."
    Start-Sleep -Seconds 10
    
    docker-compose ps
    
    Write-Host ""
    Write-Success "🚀 BOM Application is running!"
    Write-Host ""
    Write-Host "Access the application at:"
    Write-Host "  Frontend: http://localhost:3000"
    Write-Host ""
    Write-Host "View logs with: docker-compose logs -f"
    Write-Host "Stop services with: docker-compose down"
}

function Deploy-Prod {
    Write-Info "Deploying BOM in PRODUCTION mode..."
    
    Check-Requirements
    Check-EnvFile
    
    Write-Info "Building and starting services with production settings..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
    
    Write-Success "Services started successfully!"
    Write-Info "Waiting for services to be healthy..."
    Start-Sleep -Seconds 15
    
    docker-compose ps
    
    Write-Host ""
    Write-Success "🚀 BOM Application is running in PRODUCTION mode!"
    Write-Host ""
    Write-Host "⚠️  Remember to:"
    Write-Host "  1. Configure reverse proxy (nginx/traefik) for HTTPS"
    Write-Host "  2. Update firewall rules"
    Write-Host "  3. Set up monitoring and backups"
    Write-Host ""
    Write-Host "View logs with: docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
    Write-Host "Stop services with: docker-compose -f docker-compose.yml -f docker-compose.prod.yml down"
}

function Stop-Services {
    Write-Info "Stopping all BOM services..."
    docker-compose down
    Write-Success "Services stopped"
}

function Restart-Services {
    Write-Info "Restarting all BOM services..."
    docker-compose restart
    Write-Success "Services restarted"
}

function View-Logs {
    docker-compose logs -f
}

function Check-Health {
    Write-Info "Checking service health..."
    docker-compose ps
    
    Write-Host ""
    Write-Info "Testing connectivity..."
    
    # Test frontend
    try {
        $response = Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing -TimeoutSec 5
        Write-Success "Frontend is accessible"
    } catch {
        Write-Error "Frontend is not accessible"
    }
    
    # Check internal services from frontend container
    Write-Info "Checking internal services..."
    
    try {
        docker exec bom-frontend curl -f http://bom-be:8001/ | Out-Null
        Write-Success "Auth service is healthy"
    } catch {
        Write-Error "Auth service is unreachable"
    }
    
    try {
        docker exec bom-frontend curl -f http://integration-service:3000/api/health | Out-Null
        Write-Success "Integration service is healthy"
    } catch {
        Write-Error "Integration service is unreachable"
    }
    
    try {
        docker exec bom-frontend curl -f http://playground-service:8000/health | Out-Null
        Write-Success "Playground service is healthy"
    } catch {
        Write-Error "Playground service is unreachable"
    }
}

function Backup-Databases {
    Write-Info "Backing up databases..."
    
    $backupDir = ".\backups"
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    
    # Backup auth database
    docker exec bom-postgres-auth pg_dump -U bom_user bom_auth_db > "$backupDir\auth_db_$timestamp.sql"
    Write-Success "Auth database backed up to $backupDir\auth_db_$timestamp.sql"
    
    # Backup integration database
    docker exec bom-postgres-integration pg_dump -U postgres integration_service > "$backupDir\integration_db_$timestamp.sql"
    Write-Success "Integration database backed up to $backupDir\integration_db_$timestamp.sql"
}

function Clean-All {
    Write-Info "⚠️  This will remove all containers, volumes, and data!"
    $confirm = Read-Host "Are you sure? (yes/no)"
    
    if ($confirm -eq "yes") {
        Write-Info "Stopping and removing all services..."
        docker-compose down -v
        
        Write-Info "Removing BOM containers..."
        $containers = docker ps -a --filter "label=com.bom.namespace=bom" -q
        if ($containers) {
            docker rm -f $containers
        }
        
        Write-Info "Removing BOM network..."
        try {
            docker network rm bom 2>$null
        } catch {}
        
        Write-Success "Cleanup complete"
    } else {
        Write-Info "Cleanup cancelled"
    }
}

function Show-Menu {
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "   BOM Full Stack Deployment Script"
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "1. Deploy (Development)"
    Write-Host "2. Deploy (Production)"
    Write-Host "3. Stop Services"
    Write-Host "4. Restart Services"
    Write-Host "5. View Logs"
    Write-Host "6. Check Health"
    Write-Host "7. Backup Databases"
    Write-Host "8. Clean All (Remove Everything)"
    Write-Host "9. Exit"
    Write-Host ""
}

# Main script
if ($args.Count -eq 0) {
    while ($true) {
        Show-Menu
        $choice = Read-Host "Select option"
        
        switch ($choice) {
            "1" { Deploy-Dev }
            "2" { Deploy-Prod }
            "3" { Stop-Services }
            "4" { Restart-Services }
            "5" { View-Logs }
            "6" { Check-Health }
            "7" { Backup-Databases }
            "8" { Clean-All }
            "9" { exit 0 }
            default { Write-Error "Invalid option" }
        }
        
        Write-Host ""
        Read-Host "Press Enter to continue"
    }
} else {
    switch ($args[0]) {
        "deploy" { Deploy-Dev }
        "deploy-prod" { Deploy-Prod }
        "stop" { Stop-Services }
        "restart" { Restart-Services }
        "logs" { View-Logs }
        "health" { Check-Health }
        "backup" { Backup-Databases }
        "clean" { Clean-All }
        default {
            Write-Host "Usage: .\deploy.ps1 [deploy|deploy-prod|stop|restart|logs|health|backup|clean]"
            exit 1
        }
    }
}
