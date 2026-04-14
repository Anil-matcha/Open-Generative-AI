/*
  # Multi-Tenant Core Schema - Part 1: Foundation Tables

  ## Overview
  This migration establishes the foundational multi-tenant architecture for an AI media generation platform.
  Uses shared database with Row-Level Security (RLS) for automatic tenant isolation.

  ## Tables Created

  ### 1. tenants
  Stores organization/workspace information for multi-tenant isolation.
  - `id` (uuid, PK): Unique tenant identifier
  - `name` (text): Organization name
  - `slug` (text, unique): URL-friendly identifier
  - `plan_type` (text): Subscription tier (free, pro, enterprise)
  - `status` (text): Account status (active, suspended, cancelled)
  - `settings` (jsonb): Flexible tenant-specific configuration
  - `max_users` (int): User limit based on plan
  - `max_storage_gb` (int): Storage quota
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last update timestamp

  ### 2. user_profiles
  Extended user information linked to Supabase auth.users.
  - `id` (uuid, PK, FK to auth.users): User identifier
  - `tenant_id` (uuid, FK to tenants): Organization membership
  - `email` (text): User email
  - `full_name` (text): Display name
  - `avatar_url` (text): Profile picture
  - `role` (text): User role within tenant
  - `is_tenant_admin` (boolean): Admin privileges flag
  - `preferences` (jsonb): User-specific settings
  - `last_login_at` (timestamptz): Last activity timestamp
  - `created_at` (timestamptz): Account creation
  - `updated_at` (timestamptz): Last profile update

  ### 3. roles
  Defines role-based access control (RBAC) system.
  - `id` (uuid, PK): Role identifier
  - `tenant_id` (uuid, FK to tenants): Tenant scope (NULL = system role)
  - `name` (text): Role name
  - `description` (text): Role purpose
  - `permissions` (jsonb): Array of permission strings
  - `is_system_role` (boolean): Built-in vs custom role
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last modification

  ### 4. user_roles
  Junction table for user-role assignments.
  - `id` (uuid, PK): Assignment identifier
  - `user_id` (uuid, FK to user_profiles): User reference
  - `role_id` (uuid, FK to roles): Role reference
  - `tenant_id` (uuid, FK to tenants): Tenant scope
  - `granted_by` (uuid, FK to user_profiles): Who assigned role
  - `granted_at` (timestamptz): Assignment timestamp

  ## Security
  - RLS enabled on all tables
  - Policies ensure users only access data within their tenant
  - Tenant admins have elevated permissions
  - System roles are read-only for non-admins

  ## Indexes
  - Tenant ID indexes on all multi-tenant tables
  - Unique constraints on slug, email combinations
  - Composite indexes for common query patterns

  ## Important Notes
  - All timestamps use timestamptz for timezone awareness
  - JSONB used for flexible schema evolution
  - Soft deletes can be added via status/deleted_at columns if needed
  - Foreign keys enforce referential integrity
*/

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  plan_type text NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'trial')),
  settings jsonb DEFAULT '{}'::jsonb,
  max_users int DEFAULT 5,
  max_storage_gb int DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  is_tenant_admin boolean DEFAULT false,
  preferences jsonb DEFAULT '{}'::jsonb,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, email)
);

-- Create roles table for RBAC
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  permissions jsonb DEFAULT '[]'::jsonb,
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, name)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES user_profiles(id),
  granted_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id, tenant_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_id ON user_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- Add status column if it doesn't exist (for existing tables)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'trial'));
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- Enable Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenants table
CREATE POLICY "Users can view their own tenant"
  ON tenants FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can update their tenant"
  ON tenants FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  )
  WITH CHECK (
    id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

-- RLS Policies for user_profiles table
CREATE POLICY "Users can view profiles in their tenant"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Tenant admins can insert user profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

CREATE POLICY "Tenant admins can delete user profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

-- RLS Policies for roles table
CREATE POLICY "Users can view roles in their tenant"
  ON roles FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    OR is_system_role = true
  );

CREATE POLICY "Tenant admins can manage custom roles"
  ON roles FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
    AND is_system_role = false
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
    AND is_system_role = false
  );

-- RLS Policies for user_roles table
CREATE POLICY "Users can view role assignments in their tenant"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can manage role assignments"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();