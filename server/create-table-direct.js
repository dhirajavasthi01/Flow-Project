import pool from './database/connection.js';

async function createTable() {
  try {
    console.log('\n🔨 Creating Template_diagram table directly...\n');
    
    const createTableSQL = `
-- Create Template_diagram table
CREATE TABLE IF NOT EXISTS Template_diagram (
    templateId SERIAL PRIMARY KEY,
    caseId INTEGER NOT NULL DEFAULT 1,
    templateName VARCHAR(255) NOT NULL,
    nodeJson JSONB NOT NULL DEFAULT '[]'::jsonb,
    edgeJson JSONB NOT NULL DEFAULT '[]'::jsonb,
    createdBy VARCHAR(255),
    flag VARCHAR(20) DEFAULT 'active' CHECK (flag IN ('active', 'inactive')),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifiedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on caseId for faster queries
CREATE INDEX IF NOT EXISTS idx_template_caseId ON Template_diagram(caseId);

-- Create index on flag for filtering active templates
CREATE INDEX IF NOT EXISTS idx_template_flag ON Template_diagram(flag);

-- Create index on templateName for searching
CREATE INDEX IF NOT EXISTS idx_template_name ON Template_diagram(templateName);
    `;
    
    await pool.query(createTableSQL);
    console.log('✅ Table created successfully!\n');
    
    // Verify
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'Template_diagram';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Verification: Template_diagram table exists!\n');
    } else {
      console.log('❌ Verification failed: Table not found\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  }
}

createTable();



