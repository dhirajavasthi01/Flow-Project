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

-- Create Flow_diagrams table
CREATE TABLE IF NOT EXISTS Flow_diagrams (
    "diagramId" SERIAL PRIMARY KEY,
    "caseID" INTEGER NOT NULL,
    "nodeJson" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "edgeJson" JSONB NOT NULL DEFAULT '[]'::jsonb,
    saved BOOLEAN DEFAULT false,
    active INTEGER DEFAULT 0,
    "createdOn" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdBy" VARCHAR(255),
    "modifiedOn" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on caseID for faster queries
CREATE INDEX IF NOT EXISTS idx_flow_caseID ON Flow_diagrams("caseID");

-- Create index on saved for filtering
CREATE INDEX IF NOT EXISTS idx_flow_saved ON Flow_diagrams(saved);



