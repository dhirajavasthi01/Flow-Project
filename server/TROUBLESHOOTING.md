# Troubleshooting Guide

## Common Errors and Solutions

### 1. Error: "Cannot find module" or "MODULE_NOT_FOUND"

**Solution:** Install dependencies first
```bash
cd server
npm install
```

### 2. Error: "password authentication failed" or "Connection refused"

**Possible causes:**
- PostgreSQL service is not running
- Wrong password in `.env` file
- Database doesn't exist

**Solutions:**

**Check if PostgreSQL is running:**
```powershell
# Windows
Get-Service postgresql*
```

**Verify your .env file exists and has correct values:**
- File location: `server/.env`
- Should contain:
  ```
  DB_PASSWORD=admin
  DB_USER=postgres
  DB_NAME=react_flow_db
  ```

**Test database connection manually:**
```bash
psql -h localhost -U postgres -d react_flow_db
# Enter password: admin
```

### 3. Error: "database 'react_flow_db' does not exist"

**Solution:** Create the database
```sql
CREATE DATABASE react_flow_db;
```

### 4. Error: "Port 3000 is already in use"

**Solution:** Change port in `server/.env`:
```
PORT=3001
```
Then update frontend `.env`:
```
REACT_APP_API_URL=http://localhost:3001
```

### 5. Error: "EACCES" or "Permission denied"

**Solution:** Make sure you have permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE react_flow_db TO postgres;
```

### 6. Error: "Cannot read properties of undefined" or ".env file not found"

**Solution:** Make sure `.env` file exists in `server/` folder with exact name `.env` (not `.env.txt`)

### 7. Error: "syntax error at or near" (SQL errors)

**Solution:** This might be a schema issue. Check `server/database/schema.sql` file exists.

## Step-by-Step Debugging

### Step 1: Verify .env file exists and is correct

```powershell
cd server
Get-Content .env
```

Should show:
```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=react_flow_db
DB_USER=postgres
DB_PASSWORD=admin
CORS_ORIGIN=http://localhost:5173
```

### Step 2: Test database connection

```powershell
# Test if you can connect
psql -h localhost -U postgres -d react_flow_db
# When prompted, enter password: admin
```

If this fails, your PostgreSQL credentials are wrong.

### Step 3: Check if database exists

```sql
-- In psql
\l
-- Should see react_flow_db in the list
```

### Step 4: Verify Node.js and npm

```powershell
node --version
npm --version
```

### Step 5: Check if dependencies are installed

```powershell
cd server
Test-Path node_modules
# Should return True
```

If False, run:
```powershell
npm install
```

## Getting More Detailed Error Information

Run the server with more verbose output:

```powershell
cd server
node server.js
```

Look for the specific error message and share it for more help.



