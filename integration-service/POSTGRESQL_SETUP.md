# PostgreSQL Setup Guide

## Option 1: Docker Setup (Recommended - Easiest)

### Prerequisites:
- Install Docker Desktop from: https://www.docker.com/products/docker-desktop/

### Steps:
1. **Start PostgreSQL with Docker:**
   ```bash
   docker run --name telegram-postgres -e POSTGRES_PASSWORD=mypassword -e POSTGRES_DB=telegram_service -p 5432:5432 -d postgres:15
   ```

2. **Update your .env file:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=telegram_service
   DB_USER=postgres
   DB_PASSWORD=mypassword
   ```

3. **Initialize database:**
   ```bash
   npm run init-db
   ```

## Option 2: Native PostgreSQL Installation

### Download and Install:
1. Go to: https://www.postgresql.org/download/windows/
2. Download PostgreSQL installer
3. Run installer with these settings:
   - Password: `mypassword` (or your choice)
   - Port: `5432`
   - Locale: Default

### After Installation:
1. **Test connection:**
   ```bash
   psql -U postgres -h localhost
   ```

2. **Create database:**
   ```sql
   CREATE DATABASE telegram_service;
   \q
   ```

3. **Update .env file:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=telegram_service
   DB_USER=postgres
   DB_PASSWORD=mypassword
   ```

## Option 3: Online PostgreSQL (For Testing)

### Free PostgreSQL services:
- **ElephantSQL**: https://www.elephantsql.com/ (Free tier available)
- **Supabase**: https://supabase.com/ (Free tier available)
- **Railway**: https://railway.app/ (Free tier available)

### After creating online database:
Update .env with provided connection details:
```env
DB_HOST=your-host.com
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password
```

## Next Steps:
1. Choose one option above
2. Update your .env file
3. Run: `npm run init-db`
4. Restart the service: `npm start`
