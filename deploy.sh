#!/bin/bash

# BOM Full Stack Deployment Script
# This script helps deploy the entire BOM application stack

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

check_requirements() {
    print_info "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

check_env_file() {
    if [ ! -f .env ]; then
        print_info "Creating .env file from .env.example..."
        cp .env.example .env
        print_info "⚠️  Please edit .env file with your configuration before deploying!"
        print_info "   Required: SMTP settings for email verification"
        read -p "Press Enter to continue after editing .env file..."
    else
        print_success ".env file exists"
    fi
}

deploy_dev() {
    print_info "Deploying BOM in DEVELOPMENT mode..."
    
    check_requirements
    check_env_file
    
    print_info "Building and starting services..."
    docker-compose up -d --build
    
    print_success "Services started successfully!"
    print_info "Waiting for services to be healthy..."
    sleep 10
    
    docker-compose ps
    
    echo ""
    print_success "🚀 BOM Application is running!"
    echo ""
    echo "Access the application at:"
    echo "  Frontend: http://localhost:3000"
    echo ""
    echo "View logs with: docker-compose logs -f"
    echo "Stop services with: docker-compose down"
}

deploy_prod() {
    print_info "Deploying BOM in PRODUCTION mode..."
    
    check_requirements
    check_env_file
    
    print_info "Building and starting services with production settings..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
    
    print_success "Services started successfully!"
    print_info "Waiting for services to be healthy..."
    sleep 15
    
    docker-compose ps
    
    echo ""
    print_success "🚀 BOM Application is running in PRODUCTION mode!"
    echo ""
    echo "⚠️  Remember to:"
    echo "  1. Configure reverse proxy (nginx/traefik) for HTTPS"
    echo "  2. Update firewall rules"
    echo "  3. Set up monitoring and backups"
    echo ""
    echo "View logs with: docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
    echo "Stop services with: docker-compose -f docker-compose.yml -f docker-compose.prod.yml down"
}

stop_services() {
    print_info "Stopping all BOM services..."
    docker-compose down
    print_success "Services stopped"
}

restart_services() {
    print_info "Restarting all BOM services..."
    docker-compose restart
    print_success "Services restarted"
}

view_logs() {
    docker-compose logs -f
}

check_health() {
    print_info "Checking service health..."
    docker-compose ps
    
    echo ""
    print_info "Testing connectivity..."
    
    # Test frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend is accessible"
    else
        print_error "Frontend is not accessible"
    fi
    
    # Check internal services from frontend container
    print_info "Checking internal services..."
    docker exec bom-frontend curl -f http://bom-be:8001/ > /dev/null 2>&1 && print_success "Auth service is healthy" || print_error "Auth service is unreachable"
    docker exec bom-frontend curl -f http://integration-service:3000/api/health > /dev/null 2>&1 && print_success "Integration service is healthy" || print_error "Integration service is unreachable"
    docker exec bom-frontend curl -f http://playground-service:8000/health > /dev/null 2>&1 && print_success "Playground service is healthy" || print_error "Playground service is unreachable"
}

backup_databases() {
    print_info "Backing up databases..."
    
    BACKUP_DIR="./backups"
    mkdir -p $BACKUP_DIR
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    # Backup auth database
    docker exec bom-postgres-auth pg_dump -U bom_user bom_auth_db > "$BACKUP_DIR/auth_db_$TIMESTAMP.sql"
    print_success "Auth database backed up to $BACKUP_DIR/auth_db_$TIMESTAMP.sql"
    
    # Backup integration database
    docker exec bom-postgres-integration pg_dump -U postgres integration_service > "$BACKUP_DIR/integration_db_$TIMESTAMP.sql"
    print_success "Integration database backed up to $BACKUP_DIR/integration_db_$TIMESTAMP.sql"
}

clean_all() {
    print_info "⚠️  This will remove all containers, volumes, and data!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        print_info "Stopping and removing all services..."
        docker-compose down -v
        
        print_info "Removing BOM containers..."
        docker rm -f $(docker ps -a --filter "label=com.bom.namespace=bom" -q) 2>/dev/null || true
        
        print_info "Removing BOM network..."
        docker network rm bom 2>/dev/null || true
        
        print_success "Cleanup complete"
    else
        print_info "Cleanup cancelled"
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "=========================================="
    echo "   BOM Full Stack Deployment Script"
    echo "=========================================="
    echo ""
    echo "1. Deploy (Development)"
    echo "2. Deploy (Production)"
    echo "3. Stop Services"
    echo "4. Restart Services"
    echo "5. View Logs"
    echo "6. Check Health"
    echo "7. Backup Databases"
    echo "8. Clean All (Remove Everything)"
    echo "9. Exit"
    echo ""
}

# Main script
if [ $# -eq 0 ]; then
    while true; do
        show_menu
        read -p "Select option: " choice
        
        case $choice in
            1) deploy_dev ;;
            2) deploy_prod ;;
            3) stop_services ;;
            4) restart_services ;;
            5) view_logs ;;
            6) check_health ;;
            7) backup_databases ;;
            8) clean_all ;;
            9) exit 0 ;;
            *) print_error "Invalid option" ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
else
    case $1 in
        deploy) deploy_dev ;;
        deploy-prod) deploy_prod ;;
        stop) stop_services ;;
        restart) restart_services ;;
        logs) view_logs ;;
        health) check_health ;;
        backup) backup_databases ;;
        clean) clean_all ;;
        *)
            echo "Usage: $0 [deploy|deploy-prod|stop|restart|logs|health|backup|clean]"
            exit 1
            ;;
    esac
fi
