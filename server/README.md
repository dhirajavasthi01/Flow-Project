# Flow Project - Server Setup Guide

This guide will help you set up the backend server for the Flow Project, including database creation, migrations, and environment configuration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Environment Variables](#environment-variables)
4. [Installation](#installation)
5. [Running Migrations](#running-migrations)
6. [Starting the Server](#starting-the-server)
7. [Verification](#verification)
8. [API Endpoints](#api-endpoints)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before setting up the server, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn** package manager

### Verify PostgreSQL Installation

```bash
# Check PostgreSQL version
psql --version

# Check if PostgreSQL service is running
# Windows:
sc query postgresql-x64-14

# Linux/Mac:
sudo systemctl status postgresql
```

---

## Database Setup

### Step 1: Create PostgreSQL Database

Connect to PostgreSQL and create the database:

```bash
# Connect to PostgreSQL (default user: postgres)
psql -U postgres

# Or on Windows, you might need:
psql -U postgres -h localhost
```

Once connected, run:

```sql
-- Create the database
CREATE DATABASE react_flow_db;

-- Verify database was created
\l

-- Connect to the new database
\c react_flow_db

-- Exit psql
\q
```

### Alternative: Create Database via Command Line

```bash
# Create database directly from command line
createdb -U postgres react_flow_db

# Or with password prompt
PGPASSWORD=your_password createdb -U postgres react_flow_db
```

---

## Environment Variables

### Step 1: Create `.env` File

Create a `.env` file in the `server` folder:

```bash
cd server
touch .env
```

### Step 2: Configure Environment Variables

Copy the following template into your `.env` file and update the values:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=react_flow_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration (optional)
CORS_ORIGIN=http://localhost:5173
```

### Environment Variables Explained

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | PostgreSQL server hostname | `localhost` | No |
| `DB_PORT` | PostgreSQL server port | `5432` | No |
| `DB_NAME` | Database name | `react_flow_db` | No |
| `DB_USER` | PostgreSQL username | `postgres` | No |
| `DB_PASSWORD` | PostgreSQL password | - | **Yes** |
| `PORT` | Express server port | `3000` | No |
| `NODE_ENV` | Environment mode (`development`/`production`) | - | No |
| `CORS_ORIGIN` | Allowed CORS origin | - | No |

### Example `.env` File

```env
# Development Environment
DB_HOST=localhost
DB_PORT=5432
DB_NAME=react_flow_db
DB_USER=postgres
DB_PASSWORD=mypassword123
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

---

## Installation

### Step 1: Install Dependencies

Navigate to the server directory and install npm packages:

```bash
cd server
npm install
```

This will install the following dependencies:
- `express` - Web framework
- `pg` - PostgreSQL client
- `cors` - CORS middleware
- `dotenv` - Environment variable management
- `axios` - HTTP client

### Step 2: Verify Installation

Check that `node_modules` folder was created:

```bash
ls node_modules
```

---

## Running Migrations

The server automatically runs migrations on startup, but you can also run them manually.

### Automatic Migration (Recommended)

Migrations run automatically when you start the server:

```bash
npm start
```

The server will:
1. Connect to the database
2. Run `database/migrate.js`
3. Execute `database/schema.sql`
4. Create all required tables and indexes

### Manual Migration

To run migrations manually:

```bash
# Run migration script directly
node database/migrate.js
```

### What Migrations Create

The migration script (`database/migrate.js`) reads `database/schema.sql` and creates:

#### 1. `Template_diagram` Table
- Stores template diagrams with nodes and edges
- Includes indexes for performance

#### 2. `Flow_diagrams` Table
- Stores flow diagrams with nodes and edges
- Includes indexes for faster queries

#### Tables Structure

**Template_diagram:**
```sql
- templateId (SERIAL PRIMARY KEY)
- caseId (INTEGER)
- templateName (VARCHAR(255))
- nodeJson (JSONB)
- edgeJson (JSONB)
- createdBy (VARCHAR(255))
- flag (VARCHAR(20)) - 'active' or 'inactive'
- createdAt (TIMESTAMP)
- modifiedOn (TIMESTAMP)
```

**Flow_diagrams:**
```sql
- diagramId (SERIAL PRIMARY KEY)
- caseID (INTEGER)
- nodeJson (JSONB)
- edgeJson (JSONB)
- saved (BOOLEAN)
- active (INTEGER)
- createdOn (TIMESTAMP)
- createdBy (VARCHAR(255))
- modifiedOn (TIMESTAMP)
```

---

## Starting the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

This uses Node.js `--watch` flag to automatically restart the server when files change.

### Production Mode

```bash
npm start
```

### Expected Output

When the server starts successfully, you should see:

```
🚀 Starting server...

📦 Running database migration...
Database Configuration:
  Host: localhost
  Port: 5432
  Database: react_flow_db
  User: postgres
  Password: ***
✅ Connected to PostgreSQL database
✅ Database connection test successful
Running database migration...
✅ Database migration completed successfully

✅ Server started successfully!

📍 Server is running on port 3000
🔗 Health check: http://localhost:3000/health
🔗 Templates API: http://localhost:3000/api/templates
🔗 Template Names: http://localhost:3000/api/templates/names
🔗 Flow Diagrams API: http://localhost:3000/flow-diagrams
```

---

## Verification

### 1. Test Database Connection

```bash
node test-connection.js
```

Expected output:
```
✅ Database connection test successful
```

### 2. Verify Tables Were Created

```bash
node verify-tables.js
```

Expected output:
```
🔍 Verifying database tables...

✅ Template_diagram table exists!

Table structure:
────────────────────────────────────────────────────────────
1. templateid          integer          NOT NULL
2. caseid              integer          NOT NULL
3. templatename        varchar          NOT NULL
...
```

### 3. Test Server Health

```bash
# Using curl
curl http://localhost:3000/health

# Or open in browser
# http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### 4. Verify API Endpoints

```bash
# Test templates endpoint
curl http://localhost:3000/api/templates/names

# Test flow diagrams endpoint
curl http://localhost:3000/flow-diagrams/1
```

---

## API Endpoints

### Health Check

- **GET** `/health`
  - Returns server status
  - Response: `{ "status": "ok", "message": "Server is running" }`

### Templates API

Base URL: `/api/templates`

- **GET** `/api/templates/names`
  - Get all template names (templateId and templateName only)
  - Query params: `caseId` (optional)
  - Example: `GET /api/templates/names?caseId=1`

- **GET** `/api/templates`
  - Get all templates with full data
  - Query params: `caseId` (optional)
  - Example: `GET /api/templates?caseId=1`

- **GET** `/api/templates/:templateId`
  - Get template by ID
  - Example: `GET /api/templates/1`

- **POST** `/api/templates`
  - Create new template
  - Body:
    ```json
    {
      "caseId": 1,
      "templateName": "My Template",
      "nodeJson": [],
      "edgeJson": [],
      "createdBy": "user123"
    }
    ```

- **DELETE** `/api/templates/:templateId`
  - Delete template (soft delete - sets flag to 'inactive')
  - Example: `DELETE /api/templates/1`

### Flow Diagrams API

Base URL: `/flow-diagrams`

- **GET** `/flow-diagrams/:caseId`
  - Get flow diagram by caseId
  - Returns the most recent diagram for the case
  - Example: `GET /flow-diagrams/1`

- **POST** `/flow-diagrams`
  - Create new flow diagram
  - Body:
    ```json
    {
      "caseID": 1,
      "nodeJson": "[]",
      "edgeJson": "[]",
      "saved": false,
      "active": 0,
      "createdOn": "2024-01-01T00:00:00.000Z",
      "createdBy": "user123"
    }
    ```

- **PUT** `/flow-diagrams/:caseId`
  - Update flow diagram by caseId
  - Body:
    ```json
    {
      "nodeJson": "[]",
      "edgeJson": "[]",
      "saved": true,
      "modifiedOn": "2024-01-01T00:00:00.000Z"
    }
    ```

- **DELETE** `/flow-diagrams/:diagramId`
  - Delete flow diagram by diagramId
  - Example: `DELETE /flow-diagrams/1`

---

## Troubleshooting

### Database Connection Issues

#### Error: `ECONNREFUSED`

**Problem:** Cannot connect to PostgreSQL server

**Solutions:**
1. Check if PostgreSQL service is running:
   ```bash
   # Windows
   sc query postgresql-x64-14
   
   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. Start PostgreSQL service:
   ```bash
   # Windows
   net start postgresql-x64-14
   
   # Linux/Mac
   sudo systemctl start postgresql
   ```

3. Verify port 5432 is not blocked by firewall

#### Error: `28P01` - Authentication Failed

**Problem:** Invalid username or password

**Solutions:**
1. Check `.env` file exists in `server` folder
2. Verify `DB_USER` and `DB_PASSWORD` are correct
3. Test connection manually:
   ```bash
   psql -U postgres -h localhost -d react_flow_db
   ```

#### Error: `3D000` - Database Does Not Exist

**Problem:** Database `react_flow_db` not found

**Solutions:**
1. Create the database:
   ```sql
   CREATE DATABASE react_flow_db;
   ```

2. Verify database exists:
   ```bash
   psql -U postgres -l
   ```

### Migration Issues

#### Error: Schema File Not Found

**Problem:** `database/schema.sql` is missing

**Solutions:**
1. Verify file exists: `ls database/schema.sql`
2. Check file path in `database/migrate.js`
3. Ensure you're running from the `server` directory

#### Error: Tables Already Exist

**Problem:** Migration tries to create existing tables

**Solutions:**
- This is normal - the migration uses `CREATE TABLE IF NOT EXISTS`
- Tables won't be recreated if they already exist
- To reset tables, drop and recreate:
  ```sql
  DROP TABLE IF EXISTS Flow_diagrams CASCADE;
  DROP TABLE IF EXISTS Template_diagram CASCADE;
  ```
  Then run migration again: `node database/migrate.js`

### Port Already in Use

#### Error: `EADDRINUSE` - Port 3000 already in use

**Solutions:**
1. Change port in `.env` file:
   ```env
   PORT=3001
   ```

2. Or kill the process using port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -ti:3000 | xargs kill
   ```

### Environment Variables Not Loading

**Problem:** Environment variables are undefined

**Solutions:**
1. Ensure `.env` file exists in `server` folder
2. Check `.env` file syntax (no spaces around `=`)
3. Verify `dotenv` package is installed: `npm list dotenv`
4. Restart the server after changing `.env`

---

## Quick Start Checklist

- [ ] PostgreSQL is installed and running
- [ ] Database `react_flow_db` is created
- [ ] `.env` file is created in `server` folder
- [ ] Environment variables are configured
- [ ] Dependencies are installed (`npm install`)
- [ ] Migration runs successfully (`node database/migrate.js`)
- [ ] Server starts without errors (`npm start`)
- [ ] Health check endpoint responds (`curl http://localhost:3000/health`)

---

## Additional Scripts

### Test Database Connection

```bash
node test-connection.js
```

### Verify Tables Structure

```bash
node verify-tables.js
```

### Create Tables Directly (Alternative)

```bash
node create-table-direct.js
```

### Test Template Insert

```bash
node test-template-insert.js
```

---

## Project Structure

```
server/
├── database/
│   ├── connection.js      # PostgreSQL connection pool
│   ├── migrate.js         # Migration script
│   └── schema.sql         # Database schema
├── routes/
│   ├── flowDiagramRoutes.js   # Flow diagram endpoints
│   └── templateRoutes.js      # Template endpoints
├── .env                   # Environment variables (create this)
├── server.js             # Express server entry point
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

---

## Support

For additional help, check:
- `TROUBLESHOOTING.md` - Detailed troubleshooting guide
- `FIX_PASSWORD_ISSUE.md` - Password-related issues
- Server logs for detailed error messages

---

## Summary

1. **Create Database**: `CREATE DATABASE react_flow_db;`
2. **Configure `.env`**: Set database credentials
3. **Install Dependencies**: `npm install`
4. **Run Migrations**: Automatic on server start, or `node database/migrate.js`
5. **Start Server**: `npm start` or `npm run dev`

The server will automatically:
- Connect to PostgreSQL
- Run migrations to create tables
- Start listening on port 3000 (or configured PORT)

Your API endpoints will be available at:
- `http://localhost:3000/api/templates`
- `http://localhost:3000/flow-diagrams`
