import express from 'express';
import pool from '../database/connection.js';

const router = express.Router();

// GET all templates (returns only templateId and templateName)
router.get('/names', async (req, res) => {
  try {
    const { caseId } = req.query;
    let query = 'SELECT templateid as "templateId", templatename as "templateName" FROM template_diagram WHERE flag = $1';
    let params = ['active'];
    
    if (caseId) {
      query += ' AND caseid = $2';
      params.push(caseId);
    }
    
    query += ' ORDER BY modifiedon DESC, createdat DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching template names:', error);
    res.status(500).json({ error: 'Failed to fetch template names' });
  }
});

// GET all templates with full data
router.get('/', async (req, res) => {
  try {
    const { caseId } = req.query;
    let query = `SELECT 
      templateid as "templateId",
      caseid as "caseId",
      templatename as "templateName",
      nodejson as "nodeJson",
      edgejson as "edgeJson",
      createdby as "createdBy",
      flag,
      createdat as "createdAt",
      modifiedon as "modifiedOn"
    FROM template_diagram WHERE flag = $1`;
    let params = ['active'];
    
    if (caseId) {
      query += ' AND caseid = $2';
      params.push(caseId);
    }
    
    query += ' ORDER BY modifiedon DESC, createdat DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET template by name
router.get('/name/:templateName', async (req, res) => {
  try {
    const { templateName } = req.params;
    const { caseId } = req.query;
    
    let query = `SELECT 
      templateid as "templateId",
      caseid as "caseId",
      templatename as "templateName",
      nodejson as "nodeJson",
      edgejson as "edgeJson",
      createdby as "createdBy",
      flag,
      createdat as "createdAt",
      modifiedon as "modifiedOn"
    FROM template_diagram WHERE templatename = $1 AND flag = $2`;
    let params = [decodeURIComponent(templateName), 'active'];
    
    if (caseId) {
      query += ' AND caseid = $3';
      params.push(caseId);
    }
    
    query += ' ORDER BY modifiedon DESC, createdat DESC LIMIT 1';
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching template by name:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// GET template by ID
router.get('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const result = await pool.query(
      `SELECT 
        templateid as "templateId",
        caseid as "caseId",
        templatename as "templateName",
        nodejson as "nodeJson",
        edgejson as "edgeJson",
        createdby as "createdBy",
        flag,
        createdat as "createdAt",
        modifiedon as "modifiedOn"
      FROM template_diagram WHERE templateid = $1 AND flag = $2`,
      [templateId, 'active']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// POST create new template
router.post('/', async (req, res) => {
  try {
    const { caseId, templateName, nodeJson, edgeJson, createdBy } = req.body;
    
    console.log('Received template data:', {
      caseId,
      templateName,
      nodeJsonType: typeof nodeJson,
      nodeJsonIsArray: Array.isArray(nodeJson),
      nodeJsonLength: typeof nodeJson === 'string' ? nodeJson.length : 'N/A',
      edgeJsonType: typeof edgeJson,
      edgeJsonIsArray: Array.isArray(edgeJson),
      edgeJsonLength: typeof edgeJson === 'string' ? edgeJson.length : 'N/A',
      createdBy
    });
    
    if (!templateName) {
      return res.status(400).json({ error: 'templateName is required' });
    }
    
    if (!nodeJson) {
      return res.status(400).json({ error: 'nodeJson is required' });
    }
    
    // Handle nodeJson - frontend sends as string, we need to parse and store as JSONB
    let nodeJsonForDB;
    if (typeof nodeJson === 'string') {
      try {
        // Parse the string to validate it's valid JSON
        const parsed = JSON.parse(nodeJson);
        // Store as JSON string for PostgreSQL JSONB (it will convert automatically)
        nodeJsonForDB = nodeJson; // Keep as string, PostgreSQL will convert to JSONB
      } catch (e) {
        console.error('Error parsing nodeJson:', e);
        return res.status(400).json({ error: 'Invalid nodeJson format: ' + e.message });
      }
    } else if (Array.isArray(nodeJson) || typeof nodeJson === 'object') {
      // If it's already an object/array, stringify it
      nodeJsonForDB = JSON.stringify(nodeJson);
    } else {
      return res.status(400).json({ error: 'nodeJson must be a string, array, or object' });
    }
    
    // Handle edgeJson - frontend sends as string, we need to parse and store as JSONB
    let edgeJsonForDB;
    if (edgeJson) {
      if (typeof edgeJson === 'string') {
        try {
          // Parse the string to validate it's valid JSON
          const parsed = JSON.parse(edgeJson);
          // Store as JSON string for PostgreSQL JSONB
          edgeJsonForDB = edgeJson; // Keep as string, PostgreSQL will convert to JSONB
        } catch (e) {
          console.error('Error parsing edgeJson:', e);
          return res.status(400).json({ error: 'Invalid edgeJson format: ' + e.message });
        }
      } else if (Array.isArray(edgeJson) || typeof edgeJson === 'object') {
        // If it's already an object/array, stringify it
        edgeJsonForDB = JSON.stringify(edgeJson);
      } else {
        return res.status(400).json({ error: 'edgeJson must be a string, array, or object' });
      }
    } else {
      edgeJsonForDB = JSON.stringify([]); // Default to empty array as JSON string
    }
    
    console.log('Prepared data for DB:', {
      nodeJsonForDBType: typeof nodeJsonForDB,
      nodeJsonForDBLength: nodeJsonForDB.length,
      edgeJsonForDBType: typeof edgeJsonForDB,
      edgeJsonForDBLength: edgeJsonForDB.length
    });
    
    // Insert into database
    // PostgreSQL JSONB accepts JSON strings and converts them automatically
    const result = await pool.query(
      `INSERT INTO template_diagram (caseid, templatename, nodejson, edgejson, createdby, flag, createdat, modifiedon)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING 
         templateid as "templateId",
         caseid as "caseId",
         templatename as "templateName",
         nodejson as "nodeJson",
         edgejson as "edgeJson",
         createdby as "createdBy",
         flag,
         createdat as "createdAt",
         modifiedon as "modifiedOn"`,
      [
        caseId || 1,
        templateName,
        nodeJsonForDB, // JSON string - PostgreSQL will convert to JSONB
        edgeJsonForDB, // JSON string - PostgreSQL will convert to JSONB
        createdBy || null,
        'active'
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating template:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    res.status(500).json({ 
      error: 'Failed to create template',
      details: error.message,
      code: error.code
    });
  }
});

// DELETE template (soft delete by setting flag to inactive)
router.delete('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    const result = await pool.query(
      `UPDATE template_diagram 
       SET flag = $1, modifiedon = CURRENT_TIMESTAMP 
       WHERE templateid = $2 
       RETURNING templateid as "templateId", templatename as "templateName"`,
      ['inactive', templateId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json({ message: 'Template deleted successfully', template: result.rows[0] });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;

