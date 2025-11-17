# React Flow Backend Server

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
   - Update the database credentials in `.env`:
     - `DB_HOST`: PostgreSQL host (default: localhost)
     - `DB_PORT`: PostgreSQL port (default: 5432)
     - `DB_NAME`: Database name (default: react_flow_db)
     - `DB_USER`: PostgreSQL username (default: postgres)
     - `DB_PASSWORD`: PostgreSQL password

3. **Create Database**
   ```sql
   CREATE DATABASE react_flow_db;
   ```

4. **Run Migration**
   The migration will run automatically when you start the server, or you can run it manually:
   ```bash
   node database/migrate.js
   ```

5. **Start Server**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

## API Endpoints

### Templates

- `GET /api/templates/names` - Get all template names (templateId and templateName only)
  - Query params: `caseId` (optional)
  
- `GET /api/templates` - Get all templates with full data
  - Query params: `caseId` (optional)
  
- `GET /api/templates/:templateId` - Get template by ID

- `POST /api/templates` - Create new template
  - Body: `{ caseId, templateName, nodeJson, edgeJson, createdBy }`

- `DELETE /api/templates/:templateId` - Delete template (soft delete)

## Database Schema

The `Template_diagram` table has the following structure:
- `templateId` (SERIAL PRIMARY KEY)
- `caseId` (INTEGER)
- `templateName` (VARCHAR(255))
- `nodeJson` (JSONB)
- `edgeJson` (JSONB)
- `createdBy` (VARCHAR(255))
- `flag` (VARCHAR(20)) - 'active' or 'inactive'
- `createdAt` (TIMESTAMP)
- `modifiedOn` (TIMESTAMP)



