import pool from './database/connection.js';

async function testInsert() {
  try {
    const testData = {
      caseId: 1,
      templateName: 'Test Template',
      nodeJson: [{ id: 'test', type: 'test' }],
      edgeJson: [],
      createdBy: null
    };
    
    console.log('Testing template insert...');
    console.log('Data:', {
      nodeJsonType: typeof testData.nodeJson,
      nodeJsonIsArray: Array.isArray(testData.nodeJson),
      nodeJsonString: JSON.stringify(testData.nodeJson)
    });
    
    const result = await pool.query(
      `INSERT INTO template_diagram (caseid, templatename, nodejson, edgejson, createdby, flag, createdat, modifiedon)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        testData.caseId,
        testData.templateName,
        JSON.stringify(testData.nodeJson),
        JSON.stringify(testData.edgeJson),
        testData.createdBy,
        'active'
      ]
    );
    
    console.log('✅ Insert successful!');
    console.log('Inserted template:', result.rows[0]);
    
    // Clean up test data
    await pool.query('DELETE FROM template_diagram WHERE templatename = $1', [testData.templateName]);
    console.log('✅ Test data cleaned up');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Insert failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    process.exit(1);
  }
}

testInsert();

