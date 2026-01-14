import pool from './database/connection.js';
import dotenv from 'dotenv';

dotenv.config();

async function deleteFlowDiagrams() {
  try {
    console.log('🗑️  Deleting data from Flow_diagrams table...\n');

    // Option 1: Delete all records
    const result = await pool.query('DELETE FROM Flow_diagrams RETURNING "diagramId"');
    
    console.log(`✅ Successfully deleted ${result.rows.length} record(s) from Flow_diagrams table`);
    
    if (result.rows.length > 0) {
      console.log('Deleted diagram IDs:', result.rows.map(row => row.diagramId).join(', '));
    }

    // Option 2: Delete by caseID (uncomment and modify as needed)
    // const caseId = 1; // Change this to your desired caseId
    // const result = await pool.query(
    //   'DELETE FROM Flow_diagrams WHERE "caseID" = $1 RETURNING "diagramId"',
    //   [caseId]
    // );
    // console.log(`✅ Successfully deleted ${result.rows.length} record(s) for caseID ${caseId}`);

    // Option 3: Delete by diagramId (uncomment and modify as needed)
    // const diagramId = 1; // Change this to your desired diagramId
    // const result = await pool.query(
    //   'DELETE FROM Flow_diagrams WHERE "diagramId" = $1 RETURNING "diagramId"',
    //   [diagramId]
    // );
    // console.log(`✅ Successfully deleted diagram with ID ${diagramId}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting data:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  }
}

deleteFlowDiagrams();

