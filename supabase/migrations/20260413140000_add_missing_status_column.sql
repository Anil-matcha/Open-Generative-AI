-- Add missing status column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'trial'));

-- Create the index that was failing
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);