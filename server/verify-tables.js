import pool from './database/connection.js';

async function verifyTables() {
  try {
    console.log('\n🔍 Verifying database tables...\n');
    
    // Check if Template_diagram table exists (PostgreSQL converts to lowercase)
    const result = await pool.query(`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'template_diagram'
      ORDER BY ordinal_position;
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Template_diagram table not found!');
      process.exit(1);
    }
    
    console.log('✅ Template_diagram table exists!\n');
    console.log('Table structure:');
    console.log('─'.repeat(60));
    
    result.rows.forEach((row, index) => {
      const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`${index + 1}. ${row.column_name.padEnd(20)} ${row.data_type.padEnd(15)} ${nullable}`);
    });
    
    // Check indexes
    const indexes = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'template_diagram';
    `);
    
    console.log('\n📊 Indexes:');
    console.log('─'.repeat(60));
    indexes.rows.forEach((idx, index) => {
      console.log(`${index + 1}. ${idx.indexname}`);
    });
    
    // Count records
    const count = await pool.query('SELECT COUNT(*) as count FROM template_diagram');
    console.log(`\n📦 Records in table: ${count.rows[0].count}`);
    
    console.log('\n✅ All tables verified successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying tables:', error.message);
    process.exit(1);
  }
}

verifyTables();

