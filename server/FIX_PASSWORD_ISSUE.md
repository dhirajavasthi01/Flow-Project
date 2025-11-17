# Fix Password Authentication Error

## Error: "password authentication failed for user postgres"

This means PostgreSQL is rejecting the password. Here's how to fix it:

## Solution 1: Verify Your PostgreSQL Password

### Step 1: Test if password "admin" works

Open **pgAdmin** or **psql** and try to connect:
- Username: `postgres`
- Password: `admin`

If this fails, your PostgreSQL password is NOT "admin".

### Step 2: Find Your Actual Password

**Option A: Check pgAdmin**
1. Open pgAdmin
2. Look at your server connection settings
3. Check what password you use to connect

**Option B: Check if you set a different password during installation**
- During PostgreSQL installation, you might have set a different password
- Check your installation notes or password manager

### Step 3: Update .env File

Once you know your actual password, update `server/.env`:

```env
DB_PASSWORD=your_actual_password_here
```

## Solution 2: Reset PostgreSQL Password

If you forgot your password, you can reset it:

### Using pgAdmin:
1. Open pgAdmin
2. Connect to your PostgreSQL server (you might need to use Windows authentication)
3. Right-click on "Login/Group Roles" → "postgres" → "Properties"
4. Go to "Definition" tab
5. Enter new password: `admin`
6. Click "Save"

### Using psql (Command Line):
```sql
-- Connect as postgres user (might need to use Windows auth)
ALTER USER postgres WITH PASSWORD 'admin';
```

## Solution 3: Test Connection Script

I've created a test script. Run it to diagnose the issue:

```powershell
cd server
node test-connection.js
```

This will show you:
- What environment variables are being read
- The exact error message
- Specific troubleshooting steps

## Solution 4: Check .env File Format

Make sure your `server/.env` file:
- Has NO quotes around values
- Has NO spaces around the `=` sign
- Uses correct line endings

**Correct format:**
```env
DB_PASSWORD=admin
```

**Wrong formats:**
```env
DB_PASSWORD="admin"     ❌ No quotes
DB_PASSWORD = admin     ❌ No spaces
DB_PASSWORD= admin      ❌ No space after =
```

## Solution 5: Verify .env File Location

The `.env` file MUST be in the `server/` folder, not in the root folder.

**Correct location:**
```
React-flow/
└── server/
    └── .env          ✅ Here
```

**Wrong location:**
```
React-flow/
└── .env              ❌ Not here
```

## Quick Test

Run this to test your connection:

```powershell
cd server
node test-connection.js
```

This will tell you exactly what's wrong!



