import express from 'express';
import pool from '../database/connection.js';

const router = express.Router();

// GET flow diagram by caseId
router.get('/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    
    const result = await pool.query(
      `SELECT 
        "diagramId",
        "caseID",
        "nodeJson",
        "edgeJson",
        saved,
        active,
        "createdOn",
        "createdBy",
        "modifiedOn"
      FROM Flow_diagrams 
      WHERE "caseID" = $1 
      ORDER BY "modifiedOn" DESC 
      LIMIT 1`,
      [caseId]
    );

    // If no diagram exists, return empty diagram structure (don't return 404)
    // This allows the UI to be visible so users can create a new diagram
    if (result.rows.length === 0) {
      return res.json({
        diagramId: null,
        caseID: parseInt(caseId),
        nodeJson: JSON.stringify([]),
        edgeJson: JSON.stringify([]),
        saved: false,
        active: 0,
        createdOn: null,
        createdBy: null,
        modifiedOn: null
      });
    }

    const diagram = result.rows[0];
    
    // Return nodeJson and edgeJson as strings (they're stored as JSONB in DB)
    res.json({
      diagramId: diagram.diagramId,
      caseID: diagram.caseID,
      nodeJson: JSON.stringify(diagram.nodeJson),
      edgeJson: JSON.stringify(diagram.edgeJson),
      saved: diagram.saved,
      active: diagram.active,
      createdOn: diagram.createdOn,
      createdBy: diagram.createdBy,
      modifiedOn: diagram.modifiedOn
    });
  } catch (error) {
    console.error('Error fetching flow diagram:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create new flow diagram
router.post('/', async (req, res) => {
  try {
    const { nodeJson, edgeJson, saved, caseID, active, createdOn, createdBy } = req.body;

    // Parse JSON strings to objects for storage
    let nodeJsonObj, edgeJsonObj;
    try {
      nodeJsonObj = typeof nodeJson === 'string' ? JSON.parse(nodeJson) : nodeJson;
      edgeJsonObj = typeof edgeJson === 'string' ? JSON.parse(edgeJson) : edgeJson;
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON in nodeJson or edgeJson' });
    }

    const result = await pool.query(
      `INSERT INTO Flow_diagrams 
        ("caseID", "nodeJson", "edgeJson", saved, active, "createdOn", "createdBy", "modifiedOn")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING "diagramId", "caseID", "nodeJson", "edgeJson", saved, active, "createdOn", "createdBy", "modifiedOn"`,
      [
        caseID,
        JSON.stringify(nodeJsonObj), // Store as JSONB
        JSON.stringify(edgeJsonObj), // Store as JSONB
        saved || false,
        active || 0,
        createdOn || new Date().toISOString(),
        createdBy || 'test',
        new Date().toISOString()
      ]
    );

    const diagram = result.rows[0];
    
    res.status(201).json({
      diagramId: diagram.diagramId,
      caseID: diagram.caseID,
      nodeJson: JSON.stringify(diagram.nodeJson),
      edgeJson: JSON.stringify(diagram.edgeJson),
      saved: diagram.saved,
      active: diagram.active,
      createdOn: diagram.createdOn,
      createdBy: diagram.createdBy,
      modifiedOn: diagram.modifiedOn
    });
  } catch (error) {
    console.error('Error creating flow diagram:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update flow diagram by caseId
router.put('/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { nodeJson, edgeJson, saved, createdAt, modifiedOn } = req.body;

    // Parse JSON strings to objects for storage
    let nodeJsonObj, edgeJsonObj;
    try {
      nodeJsonObj = typeof nodeJson === 'string' ? JSON.parse(nodeJson) : nodeJson;
      edgeJsonObj = typeof edgeJson === 'string' ? JSON.parse(edgeJson) : edgeJson;
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON in nodeJson or edgeJson' });
    }

    const result = await pool.query(
      `UPDATE Flow_diagrams 
      SET 
        "nodeJson" = $1,
        "edgeJson" = $2,
        saved = $3,
        "modifiedOn" = $4
      WHERE "caseID" = $5
      RETURNING "diagramId", "caseID", "nodeJson", "edgeJson", saved, active, "createdOn", "createdBy", "modifiedOn"`,
      [
        JSON.stringify(nodeJsonObj), // Store as JSONB
        JSON.stringify(edgeJsonObj), // Store as JSONB
        saved !== undefined ? saved : true,
        modifiedOn || new Date().toISOString(),
        caseId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flow diagram not found' });
    }

    const diagram = result.rows[0];
    
    res.json({
      diagramId: diagram.diagramId,
      caseID: diagram.caseID,
      nodeJson: JSON.stringify(diagram.nodeJson),
      edgeJson: JSON.stringify(diagram.edgeJson),
      saved: diagram.saved,
      active: diagram.active,
      createdOn: diagram.createdOn,
      createdBy: diagram.createdBy,
      modifiedOn: diagram.modifiedOn
    });
  } catch (error) {
    console.error('Error updating flow diagram:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE flow diagram by diagramId
router.delete('/:diagramId', async (req, res) => {
  try {
    const { diagramId } = req.params;

    const result = await pool.query(
      'DELETE FROM Flow_diagrams WHERE "diagramId" = $1 RETURNING "diagramId"',
      [diagramId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flow diagram not found' });
    }

    res.json({ message: 'Flow diagram deleted successfully', diagramId: result.rows[0].diagramId });
  } catch (error) {
    console.error('Error deleting flow diagram:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

