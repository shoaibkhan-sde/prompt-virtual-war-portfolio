import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const dbPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'outage_iq',
});

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(64) PRIMARY KEY,
    service_name VARCHAR(128) NOT NULL,
    error_type VARCHAR(128) NOT NULL,
    stack_trace TEXT NOT NULL,
    root_cause TEXT,
    root_cause_reasoning TEXT,
    misconfiguration_check TEXT,
    recommended_action TEXT,
    code_fix TEXT,
    severity VARCHAR(32) DEFAULT 'MEDIUM',
    severity_note TEXT,
    confidence_justification TEXT,
    confidence_score INT,
    is_grounded BOOLEAN DEFAULT false,
    source VARCHAR(32) DEFAULT 'simulated',
    fix_status VARCHAR(32) DEFAULT 'unresolved',
    error_signature VARCHAR(255),
    status VARCHAR(32) DEFAULT 'DETECTED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    analyzed_at TIMESTAMP WITH TIME ZONE
  );

  ALTER TABLE incidents ADD COLUMN IF NOT EXISTS root_cause_reasoning TEXT;
  ALTER TABLE incidents ADD COLUMN IF NOT EXISTS misconfiguration_check TEXT;
  ALTER TABLE incidents ADD COLUMN IF NOT EXISTS code_fix TEXT;
  ALTER TABLE incidents ADD COLUMN IF NOT EXISTS severity_note TEXT;
  ALTER TABLE incidents ADD COLUMN IF NOT EXISTS confidence_justification TEXT;
  ALTER TABLE incidents ADD COLUMN IF NOT EXISTS confidence_score INT;
  ALTER TABLE incidents ADD COLUMN IF NOT EXISTS is_grounded BOOLEAN DEFAULT false;
  ALTER TABLE incidents ADD COLUMN IF NOT EXISTS source VARCHAR(32) DEFAULT 'simulated';
  ALTER TABLE incidents ADD COLUMN IF NOT EXISTS fix_status VARCHAR(32) DEFAULT 'unresolved';
  ALTER TABLE incidents ADD COLUMN IF NOT EXISTS error_signature VARCHAR(255);

  -- B-Tree Composite Index for O(log N) incident dashboard filtering
  CREATE INDEX IF NOT EXISTS idx_incidents_status_created 
  ON incidents (status, created_at DESC);
`;

async function runMigration() {
    const client = await dbPool.connect();
    try {
        console.log('[OutageIQ Migration] Starting PostgreSQL schema migration...');
        await client.query('BEGIN');
        await client.query(SCHEMA_SQL);
        await client.query('COMMIT');
        console.log('[OutageIQ Migration] Table "incidents" and B-Tree indexes created successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[OutageIQ Migration] Fatal Migration Error:', err);
        process.exit(1);
    } finally {
        client.release();
        await dbPool.end();
    }
}

runMigration();