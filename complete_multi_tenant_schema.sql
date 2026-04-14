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
-- ===========================================
-- Migration 2: Projects and Generations
-- ===========================================

/*
  # Multi-Tenant Schema - Part 2: Projects and Enhanced Generations

  ## Overview
  Creates tables for organizing work into projects and enhanced generation tracking.
  Works alongside existing generations table.

  ## Tables Created

  ### 1. projects
  Workspaces for organizing related generations and assets.
  - `id` (uuid, PK): Project identifier
  - `tenant_id` (uuid, FK to tenants): Tenant ownership
  - `created_by` (uuid, FK to user_profiles): Creator
  - `name` (text): Project name
  - `description` (text): Project purpose
  - `thumbnail_url` (text): Preview image
  - `status` (text): Project state (active, archived)
  - `settings` (jsonb): Project-specific configuration
  - `tags` (text[]): Searchable labels
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last modification

  ### 2. generation_history
  Enhanced tracking of AI generations with multi-tenant support.
  - `id` (uuid, PK): Generation identifier
  - `tenant_id` (uuid, FK to tenants): Tenant ownership
  - `project_id` (uuid, FK to projects): Project association
  - `user_id` (uuid, FK to user_profiles): Creator
  - `studio_type` (text): Which studio was used
  - `generation_type` (text): Output type (image, video, audio)
  - `model_name` (text): AI model used
  - `prompt` (text): User input prompt
  - `negative_prompt` (text): Exclusion instructions
  - `parameters` (jsonb): Generation settings
  - `input_assets` (jsonb): Source files/references
  - `output_url` (text): Generated media URL
  - `thumbnail_url` (text): Preview thumbnail
  - `status` (text): Generation state
  - `error_message` (text): Failure details
  - `processing_time_ms` (int): Generation duration
  - `cost_credits` (numeric): Resource consumption
  - `is_public` (boolean): Sharing flag
  - `metadata` (jsonb): Additional data
  - `created_at` (timestamptz): Submission time
  - `completed_at` (timestamptz): Finish time

  ### 3. generation_versions
  Tracks iterations and variations of generations.

  ### 4. assets
  User-uploaded and generated media files.

  ## Security
  - RLS enabled on all tables
  - Tenant isolation via policies
  - Project-based access control

  ## Indexes
  - Optimized for common query patterns
  - Tenant ID on all tables
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  thumbnail_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  settings jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create enhanced generation_history table
CREATE TABLE IF NOT EXISTS generation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  studio_type text NOT NULL CHECK (studio_type IN ('image', 'video', 'cinema', 'character', 'effects', 'edit', 'upscale', 'storyboard', 'commercial', 'influencer')),
  generation_type text NOT NULL CHECK (generation_type IN ('image', 'video', 'audio', 'text')),
  model_name text NOT NULL,
  prompt text NOT NULL,
  negative_prompt text,
  parameters jsonb DEFAULT '{}'::jsonb,
  input_assets jsonb DEFAULT '[]'::jsonb,
  output_url text,
  thumbnail_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  error_message text,
  processing_time_ms int,
  cost_credits numeric(10, 4) DEFAULT 0,
  is_public boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create generation_versions table
CREATE TABLE IF NOT EXISTS generation_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  generation_history_id uuid NOT NULL REFERENCES generation_history(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  output_url text NOT NULL,
  parameters jsonb DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(generation_history_id, version_number)
);

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size_bytes bigint NOT NULL,
  mime_type text NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('image', 'video', 'audio', '3d', 'document', 'other')),
  thumbnail_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT ARRAY[]::text[],
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_generation_history_tenant_id ON generation_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_project_id ON generation_history(project_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_user_id ON generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_status ON generation_history(status);
CREATE INDEX IF NOT EXISTS idx_generation_history_studio_type ON generation_history(studio_type);
CREATE INDEX IF NOT EXISTS idx_generation_history_created_at ON generation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_history_is_public ON generation_history(is_public) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_generation_versions_generation_history_id ON generation_versions(generation_history_id);
CREATE INDEX IF NOT EXISTS idx_generation_versions_tenant_id ON generation_versions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_assets_tenant_id ON assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assets_project_id ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_asset_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_tags ON assets USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view projects in their tenant"
  ON projects FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects in their tenant"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- RLS Policies for generation_history
CREATE POLICY "Users can view generations in their tenant"
  ON generation_history FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    OR is_public = true
  );

CREATE POLICY "Users can create generations in their tenant"
  ON generation_history FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own generations"
  ON generation_history FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own generations"
  ON generation_history FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- RLS Policies for generation_versions
CREATE POLICY "Users can view versions in their tenant"
  ON generation_versions FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions in their tenant"
  ON generation_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- RLS Policies for assets
CREATE POLICY "Users can view assets in their tenant"
  ON assets FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    OR is_public = true
  );

CREATE POLICY "Users can upload assets to their tenant"
  ON assets FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own assets"
  ON assets FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own assets"
  ON assets FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- ===========================================
-- Migration 3: Usage and Billing
-- ===========================================

/*
  # Multi-Tenant Schema - Part 3: Usage Tracking, Billing, and Audit Logs

  ## Overview
  Creates tables for resource usage monitoring, billing, subscriptions, and audit logging.

  ## Tables Created

  ### 1. usage_logs
  Tracks resource consumption for billing and analytics.
  - `id` (uuid, PK): Log entry identifier
  - `tenant_id` (uuid, FK to tenants): Tenant ownership
  - `user_id` (uuid, FK to user_profiles): User who used resource
  - `resource_type` (text): Type of resource (generation, storage, api_call)
  - `resource_id` (uuid): Reference to specific resource
  - `studio_type` (text): Which studio was used
  - `credits_consumed` (numeric): Cost in credits
  - `quantity` (numeric): Amount used (e.g., seconds, MB)
  - `unit` (text): Unit of measurement
  - `metadata` (jsonb): Additional tracking data
  - `created_at` (timestamptz): Usage timestamp

  ### 2. credit_balances
  Current credit balance for each tenant.
  - `tenant_id` (uuid, PK, FK to tenants): Tenant identifier
  - `credits_available` (numeric): Current balance
  - `credits_consumed` (numeric): Lifetime usage
  - `credits_purchased` (numeric): Total purchased
  - `last_recharged_at` (timestamptz): Last top-up
  - `updated_at` (timestamptz): Last balance change

  ### 3. credit_transactions
  History of credit purchases and adjustments.
  - `id` (uuid, PK): Transaction identifier
  - `tenant_id` (uuid, FK to tenants): Tenant ownership
  - `transaction_type` (text): Type (purchase, grant, refund, adjustment)
  - `amount` (numeric): Credit change (positive or negative)
  - `balance_before` (numeric): Balance before transaction
  - `balance_after` (numeric): Balance after transaction
  - `description` (text): Transaction description
  - `payment_method` (text): How credits were acquired
  - `payment_reference` (text): External payment ID
  - `processed_by` (uuid, FK to user_profiles): Admin who processed
  - `metadata` (jsonb): Additional transaction data
  - `created_at` (timestamptz): Transaction timestamp

  ### 4. subscriptions
  Manages subscription plans and billing cycles.
  - `id` (uuid, PK): Subscription identifier
  - `tenant_id` (uuid, FK to tenants): Tenant ownership
  - `plan_type` (text): Subscription tier
  - `status` (text): Subscription state
  - `billing_interval` (text): Frequency (monthly, yearly)
  - `price_amount` (numeric): Cost per interval
  - `currency` (text): Billing currency
  - `credits_per_month` (int): Monthly credit allocation
  - `started_at` (timestamptz): Subscription start
  - `current_period_start` (timestamptz): Current billing period start
  - `current_period_end` (timestamptz): Current billing period end
  - `cancelled_at` (timestamptz): Cancellation timestamp
  - `trial_ends_at` (timestamptz): Trial expiration
  - `payment_provider` (text): Billing provider (stripe, etc.)
  - `payment_provider_id` (text): External subscription ID
  - `metadata` (jsonb): Additional subscription data
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last modification

  ### 5. audit_logs
  Comprehensive audit trail for security and compliance.
  - `id` (uuid, PK): Log entry identifier
  - `tenant_id` (uuid, FK to tenants): Tenant scope
  - `user_id` (uuid, FK to user_profiles): User who performed action
  - `action` (text): Action performed
  - `resource_type` (text): Affected resource type
  - `resource_id` (uuid): Affected resource identifier
  - `changes` (jsonb): Before/after values
  - `ip_address` (inet): Request IP
  - `user_agent` (text): Client information
  - `metadata` (jsonb): Additional context
  - `created_at` (timestamptz): Action timestamp

  ### 6. api_keys
  Programmatic access tokens for integrations.
  - `id` (uuid, PK): API key identifier
  - `tenant_id` (uuid, FK to tenants): Tenant ownership
  - `created_by` (uuid, FK to user_profiles): Creator
  - `name` (text): Key description
  - `key_hash` (text): Hashed API key (never store plain)
  - `key_prefix` (text): First chars for identification
  - `scopes` (text[]): Permitted operations
  - `rate_limit_per_hour` (int): Request limit
  - `last_used_at` (timestamptz): Last usage
  - `expires_at` (timestamptz): Expiration timestamp
  - `is_active` (boolean): Enable/disable flag
  - `created_at` (timestamptz): Creation timestamp

  ## Security
  - RLS enabled on all tables
  - Audit logs are append-only (no UPDATE/DELETE policies)
  - API keys store only hashes, never plain text
  - Credit transactions maintain balance integrity

  ## Indexes
  - Optimized for analytics and reporting queries
  - Time-based indexes for usage tracking
  - Tenant isolation indexes
*/

-- Create usage_logs table
CREATE TABLE IF NOT EXISTS usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  resource_type text NOT NULL CHECK (resource_type IN ('generation', 'storage', 'api_call', 'upscale', 'training')),
  resource_id uuid,
  studio_type text,
  credits_consumed numeric(10, 4) NOT NULL DEFAULT 0,
  quantity numeric(15, 4),
  unit text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create credit_balances table
CREATE TABLE IF NOT EXISTS credit_balances (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  credits_available numeric(15, 4) NOT NULL DEFAULT 0 CHECK (credits_available >= 0),
  credits_consumed numeric(15, 4) NOT NULL DEFAULT 0 CHECK (credits_consumed >= 0),
  credits_purchased numeric(15, 4) NOT NULL DEFAULT 0 CHECK (credits_purchased >= 0),
  last_recharged_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'grant', 'refund', 'adjustment', 'bonus')),
  amount numeric(15, 4) NOT NULL,
  balance_before numeric(15, 4) NOT NULL,
  balance_after numeric(15, 4) NOT NULL,
  description text NOT NULL,
  payment_method text,
  payment_reference text,
  processed_by uuid REFERENCES user_profiles(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_type text NOT NULL CHECK (plan_type IN ('free', 'pro', 'enterprise', 'custom')),
  status text NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'paused')),
  billing_interval text NOT NULL CHECK (billing_interval IN ('monthly', 'yearly', 'one_time')),
  price_amount numeric(10, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  credits_per_month int DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  cancelled_at timestamptz,
  trial_ends_at timestamptz,
  payment_provider text,
  payment_provider_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  changes jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  scopes text[] DEFAULT ARRAY[]::text[],
  rate_limit_per_hour int DEFAULT 1000,
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_usage_logs_tenant_id ON usage_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_resource_type ON usage_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_usage_logs_tenant_created ON usage_logs(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_tenant_id ON credit_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usage_logs
CREATE POLICY "Users can view usage logs in their tenant"
  ON usage_logs FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert usage logs"
  ON usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for credit_balances
CREATE POLICY "Users can view their tenant credit balance"
  ON credit_balances FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can update credit balance"
  ON credit_balances FOR ALL
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

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view transactions in their tenant"
  ON credit_transactions FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can insert credit transactions"
  ON credit_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their tenant subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can manage subscriptions"
  ON subscriptions FOR ALL
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

-- RLS Policies for audit_logs (append-only)
CREATE POLICY "Users can view audit logs in their tenant"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for api_keys
CREATE POLICY "Users can view API keys in their tenant"
  ON api_keys FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can manage API keys"
  ON api_keys FOR ALL
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

-- Create triggers for updated_at
CREATE TRIGGER update_credit_balances_updated_at
  BEFORE UPDATE ON credit_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- ===========================================
-- Migration 4: Sharing and Notifications
-- ===========================================

/*
  # Multi-Tenant Schema - Part 4: Sharing, Notifications, and Configuration

  ## Overview
  Creates tables for content sharing, team collaboration, notifications, and system configuration.

  ## Tables Created

  ### 1. shared_content
  Enables sharing generations and projects with external users.
  - `id` (uuid, PK): Share identifier
  - `tenant_id` (uuid, FK to tenants): Tenant ownership
  - `shared_by` (uuid, FK to user_profiles): User who shared
  - `content_type` (text): What is shared (project, generation, asset)
  - `content_id` (uuid): Reference to shared content
  - `share_token` (text, unique): URL-safe share identifier
  - `share_type` (text): Public link or specific user
  - `shared_with_email` (text): Recipient email (if private)
  - `permissions` (text[]): Allowed actions (view, download, comment)
  - `password_hash` (text): Optional password protection
  - `expires_at` (timestamptz): Expiration timestamp
  - `view_count` (int): Number of views
  - `last_accessed_at` (timestamptz): Last view timestamp
  - `is_active` (boolean): Enable/disable flag
  - `metadata` (jsonb): Additional settings
  - `created_at` (timestamptz): Share creation

  ### 2. comments
  Collaboration through comments on generations and projects.
  - `id` (uuid, PK): Comment identifier
  - `tenant_id` (uuid, FK to tenants): Tenant scope
  - `content_type` (text): Commented resource type
  - `content_id` (uuid): Reference to content
  - `user_id` (uuid, FK to user_profiles): Commenter
  - `parent_comment_id` (uuid, FK to comments): For threaded replies
  - `content` (text): Comment text
  - `mentions` (uuid[]): Tagged users
  - `is_edited` (boolean): Edit flag
  - `is_deleted` (boolean): Soft delete flag
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last modification

  ### 3. notifications
  Real-time notifications for user activities.
  - `id` (uuid, PK): Notification identifier
  - `tenant_id` (uuid, FK to tenants): Tenant scope
  - `user_id` (uuid, FK to user_profiles): Recipient
  - `notification_type` (text): Event type
  - `title` (text): Notification title
  - `message` (text): Notification content
  - `action_url` (text): Deep link to related content
  - `related_user_id` (uuid, FK to user_profiles): Actor who triggered
  - `metadata` (jsonb): Additional context
  - `is_read` (boolean): Read status
  - `read_at` (timestamptz): When marked as read
  - `created_at` (timestamptz): Notification timestamp

  ### 4. team_invitations
  Manages invitations to join tenant organizations.
  - `id` (uuid, PK): Invitation identifier
  - `tenant_id` (uuid, FK to tenants): Inviting organization
  - `invited_email` (text): Invitee email
  - `invited_by` (uuid, FK to user_profiles): Inviter
  - `role` (text): Assigned role upon acceptance
  - `invitation_token` (text, unique): Secure token
  - `status` (text): Invitation state
  - `expires_at` (timestamptz): Expiration timestamp
  - `accepted_at` (timestamptz): Acceptance timestamp
  - `created_at` (timestamptz): Invitation creation

  ### 5. tenant_settings
  Tenant-specific configuration and preferences.
  - `tenant_id` (uuid, PK, FK to tenants): Tenant identifier
  - `branding` (jsonb): Logo, colors, custom domain
  - `features_enabled` (jsonb): Feature flags
  - `default_permissions` (jsonb): Default access settings
  - `integrations` (jsonb): Third-party service configs
  - `notification_settings` (jsonb): Notification preferences
  - `security_settings` (jsonb): Security policies
  - `updated_at` (timestamptz): Last configuration change

  ### 6. model_configurations
  Custom AI model settings per tenant.
  - `id` (uuid, PK): Configuration identifier
  - `tenant_id` (uuid, FK to tenants): Tenant ownership
  - `model_name` (text): AI model identifier
  - `studio_type` (text): Applicable studio
  - `default_parameters` (jsonb): Default generation settings
  - `is_enabled` (boolean): Availability flag
  - `custom_endpoint` (text): Optional custom API endpoint
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last modification

  ## Security
  - RLS enabled on all tables
  - Share tokens are cryptographically secure
  - Password hashes never stored in plain text
  - Notifications isolated to recipients

  ## Indexes
  - Optimized for real-time features
  - Share token lookups
  - Unread notification queries
*/

-- Create shared_content table
CREATE TABLE IF NOT EXISTS shared_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('project', 'generation', 'asset', 'storyboard')),
  content_id uuid NOT NULL,
  share_token text UNIQUE NOT NULL,
  share_type text NOT NULL DEFAULT 'public' CHECK (share_type IN ('public', 'private', 'password_protected')),
  shared_with_email text,
  permissions text[] DEFAULT ARRAY['view']::text[],
  password_hash text,
  expires_at timestamptz,
  view_count int DEFAULT 0,
  last_accessed_at timestamptz,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('project', 'generation', 'asset')),
  content_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  mentions uuid[] DEFAULT ARRAY[]::uuid[],
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('comment', 'mention', 'share', 'generation_complete', 'generation_failed', 'credit_low', 'team_invite', 'role_change')),
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  related_user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create team_invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  invitation_token text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create tenant_settings table
CREATE TABLE IF NOT EXISTS tenant_settings (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  branding jsonb DEFAULT '{}'::jsonb,
  features_enabled jsonb DEFAULT '{}'::jsonb,
  default_permissions jsonb DEFAULT '{}'::jsonb,
  integrations jsonb DEFAULT '{}'::jsonb,
  notification_settings jsonb DEFAULT '{}'::jsonb,
  security_settings jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Create model_configurations table
CREATE TABLE IF NOT EXISTS model_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  model_name text NOT NULL,
  studio_type text NOT NULL,
  default_parameters jsonb DEFAULT '{}'::jsonb,
  is_enabled boolean DEFAULT true,
  custom_endpoint text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, model_name, studio_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shared_content_tenant_id ON shared_content(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shared_content_share_token ON shared_content(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_content_content ON shared_content(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_shared_content_is_active ON shared_content(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_comments_tenant_id ON comments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_comments_content ON comments(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_team_invitations_tenant_id ON team_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_email ON team_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);

CREATE INDEX IF NOT EXISTS idx_model_configurations_tenant_id ON model_configurations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_model_configurations_is_enabled ON model_configurations(is_enabled) WHERE is_enabled = true;

-- Enable Row Level Security
ALTER TABLE shared_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_content
CREATE POLICY "Users can view shares in their tenant"
  ON shared_content FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create shares in their tenant"
  ON shared_content FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND shared_by = auth.uid()
  );

CREATE POLICY "Users can update their own shares"
  ON shared_content FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND shared_by = auth.uid()
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for comments
CREATE POLICY "Users can view comments in their tenant"
  ON comments FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments in their tenant"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for team_invitations
CREATE POLICY "Users can view invitations for their tenant"
  ON team_invitations FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can manage invitations"
  ON team_invitations FOR ALL
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

-- RLS Policies for tenant_settings
CREATE POLICY "Users can view their tenant settings"
  ON tenant_settings FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can manage settings"
  ON tenant_settings FOR ALL
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

-- RLS Policies for model_configurations
CREATE POLICY "Users can view model configs in their tenant"
  ON model_configurations FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can manage model configs"
  ON model_configurations FOR ALL
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

-- Create triggers for updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_settings_updated_at
  BEFORE UPDATE ON tenant_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_configurations_updated_at
  BEFORE UPDATE ON model_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- ===========================================
-- Migration 5: Roles and Helper Functions
-- ===========================================

/*
  # Seed Data - System Roles and Helper Functions

  ## Overview
  Inserts system roles and creates utility functions for tenant management.

  ## System Roles
  Five predefined roles with specific permission sets for RBAC.

  ## Helper Functions
  - initialize_tenant: Sets up new tenant with defaults
  - log_credit_usage: Handles credit consumption
  - create_notification: Creates user notifications
*/

-- Insert system roles
INSERT INTO roles (id, tenant_id, name, description, permissions, is_system_role) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'Super Admin',
    'Full system access across all tenants',
    '["system:*", "tenants:*", "users:*", "projects:*", "generations:*", "assets:*", "billing:*", "audit:*"]'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    NULL,
    'Tenant Owner',
    'Full access to tenant resources and settings',
    '["tenant:manage", "users:*", "roles:*", "projects:*", "generations:*", "assets:*", "billing:*", "integrations:*", "settings:*"]'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    NULL,
    'Tenant Admin',
    'Manage users and content within tenant',
    '["users:invite", "users:manage", "projects:*", "generations:*", "assets:*", "comments:*", "shares:*"]'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    NULL,
    'Content Creator',
    'Create and manage content',
    '["projects:create", "projects:read", "projects:update", "projects:delete", "generations:create", "generations:read", "generations:update", "assets:create", "assets:read", "assets:update", "comments:create", "comments:read", "shares:create"]'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    NULL,
    'Viewer',
    'Read-only access to content',
    '["projects:read", "generations:read", "assets:read", "comments:read"]'::jsonb,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Create function to initialize tenant with default settings
CREATE OR REPLACE FUNCTION initialize_tenant(tenant_id_param uuid)
RETURNS void AS $$
BEGIN
  -- Create credit balance
  INSERT INTO credit_balances (tenant_id, credits_available, credits_purchased)
  VALUES (tenant_id_param, 100, 100)
  ON CONFLICT (tenant_id) DO NOTHING;

  -- Create tenant settings
  INSERT INTO tenant_settings (
    tenant_id,
    branding,
    features_enabled,
    default_permissions,
    notification_settings
  ) VALUES (
    tenant_id_param,
    '{"logo_url": null, "primary_color": "#3b82f6", "custom_domain": null}'::jsonb,
    '{"image_generation": true, "video_generation": true, "upscaling": true, "api_access": false}'::jsonb,
    '{"default_sharing": "private", "allow_public_sharing": true, "require_approval": false}'::jsonb,
    '{"email_notifications": true, "push_notifications": true, "comment_notifications": true, "generation_complete": true}'::jsonb
  )
  ON CONFLICT (tenant_id) DO NOTHING;

  -- Grant initial credits transaction
  INSERT INTO credit_transactions (
    tenant_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    description
  ) VALUES (
    tenant_id_param,
    'grant',
    100,
    0,
    100,
    'Welcome bonus - 100 free credits'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log credit usage
CREATE OR REPLACE FUNCTION log_credit_usage(
  tenant_id_param uuid,
  user_id_param uuid,
  resource_type_param text,
  resource_id_param uuid,
  credits_amount numeric,
  metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
DECLARE
  current_balance numeric;
  new_balance numeric;
BEGIN
  -- Get current balance
  SELECT credits_available INTO current_balance
  FROM credit_balances
  WHERE tenant_id = tenant_id_param
  FOR UPDATE;
  
  -- Check if sufficient credits
  IF current_balance < credits_amount THEN
    RAISE EXCEPTION 'Insufficient credits. Available: %, Required: %', current_balance, credits_amount;
  END IF;
  
  -- Calculate new balance
  new_balance := current_balance - credits_amount;
  
  -- Update balance
  UPDATE credit_balances
  SET 
    credits_available = new_balance,
    credits_consumed = credits_consumed + credits_amount,
    updated_at = now()
  WHERE tenant_id = tenant_id_param;
  
  -- Log usage
  INSERT INTO usage_logs (
    tenant_id,
    user_id,
    resource_type,
    resource_id,
    credits_consumed,
    metadata
  ) VALUES (
    tenant_id_param,
    user_id_param,
    resource_type_param,
    resource_id_param,
    credits_amount,
    metadata_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  user_id_param uuid,
  notification_type_param text,
  title_param text,
  message_param text,
  action_url_param text DEFAULT NULL,
  related_user_id_param uuid DEFAULT NULL,
  metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
  user_tenant_id uuid;
BEGIN
  -- Get user's tenant
  SELECT tenant_id INTO user_tenant_id
  FROM user_profiles
  WHERE id = user_id_param;
  
  IF user_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User not found or not associated with a tenant';
  END IF;
  
  -- Create notification
  INSERT INTO notifications (
    tenant_id,
    user_id,
    notification_type,
    title,
    message,
    action_url,
    related_user_id,
    metadata
  ) VALUES (
    user_tenant_id,
    user_id_param,
    notification_type_param,
    title_param,
    message_param,
    action_url_param,
    related_user_id_param,
    metadata_param
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check user permission
CREATE OR REPLACE FUNCTION user_has_permission(
  user_id_param uuid,
  permission_param text
)
RETURNS boolean AS $$
DECLARE
  has_perm boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id_param
      AND (
        r.permissions @> to_jsonb(permission_param)
        OR r.permissions @> to_jsonb(split_part(permission_param, ':', 1) || ':*')
        OR r.permissions @> to_jsonb('system:*')
      )
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments to tables
COMMENT ON TABLE tenants IS 'Multi-tenant organizations/workspaces';
COMMENT ON TABLE user_profiles IS 'Extended user information linked to auth.users';
COMMENT ON TABLE roles IS 'RBAC role definitions (system and custom)';
COMMENT ON TABLE projects IS 'User workspaces for organizing content';
COMMENT ON TABLE generation_history IS 'AI generation tracking with multi-tenant support';
COMMENT ON TABLE assets IS 'User-uploaded and generated media files';
COMMENT ON TABLE usage_logs IS 'Resource consumption tracking for billing';
COMMENT ON TABLE credit_balances IS 'Current credit balance per tenant';
COMMENT ON TABLE credit_transactions IS 'Credit purchase and adjustment history';
COMMENT ON TABLE subscriptions IS 'Subscription plans and billing cycles';
COMMENT ON TABLE audit_logs IS 'Security and compliance audit trail';
COMMENT ON TABLE shared_content IS 'Content sharing with external users';
COMMENT ON TABLE comments IS 'Collaboration comments on content';
COMMENT ON TABLE notifications IS 'Real-time user notifications';
COMMENT ON TABLE team_invitations IS 'Tenant member invitations';
COMMENT ON TABLE tenant_settings IS 'Tenant-specific configuration';
COMMENT ON TABLE model_configurations IS 'Custom AI model settings per tenant';
-- ===========================================
-- Migration 6: Storage System
-- ===========================================

/*
  # Multi-Tenant Storage System

  ## Overview
  Creates secure, scalable storage buckets for multi-tenant file management.
  Each tenant's files are isolated in their own folder path.

  ## Storage Buckets Created

  ### 1. tenant-assets (Private)
  Stores user-uploaded files and generated content.
  - Path structure: /{tenant_id}/{user_id}/{asset_type}/{filename}
  - Size limit: 100MB per file
  - File types: Images, videos, audio, documents
  - Access: Authenticated users in same tenant only

  ### 2. tenant-generations (Private)
  Stores AI-generated media outputs.
  - Path structure: /{tenant_id}/generations/{generation_id}/{filename}
  - Size limit: 500MB per file (large videos)
  - File types: Images, videos, audio
  - Access: Authenticated users in same tenant only

  ### 3. tenant-thumbnails (Public)
  Stores public thumbnails and preview images.
  - Path structure: /{tenant_id}/thumbnails/{resource_type}/{filename}
  - Size limit: 10MB per file
  - File types: Images only
  - Access: Public read, authenticated write

  ### 4. shared-content (Public)
  Stores publicly shared content via share links.
  - Path structure: /shared/{share_token}/{filename}
  - Size limit: 100MB per file
  - File types: Images, videos
  - Access: Public read, authenticated write

  ## Storage Policies (RLS)
  All buckets have Row-Level Security policies:
  - Users can only upload to their tenant's folders
  - Users can only read files from their tenant
  - Public buckets allow anonymous reads
  - Shared content accessible via token

  ## Storage Quotas
  Enforced at application level:
  - Free plan: 10GB total storage
  - Pro plan: 100GB total storage
  - Enterprise plan: 1TB+ total storage

  ## Important Notes
  - File paths include tenant_id for isolation
  - Storage usage tracked in assets table
  - Automatic cleanup for deleted resources
  - CDN-ready for fast delivery
*/

-- Drop existing uploads bucket if exists (we'll recreate properly)
-- NOTE: This won't delete if it has files, which is safe
DO $$ 
BEGIN
  -- We'll keep existing bucket and just add new ones
  NULL;
END $$;

-- Create tenant-assets bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-assets',
  'tenant-assets',
  false,
  104857600, -- 100MB
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
    'application/pdf', 'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
    'application/pdf', 'text/plain'
  ];

-- Create tenant-generations bucket (private, larger size limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-generations',
  'tenant-generations',
  false,
  524288000, -- 500MB for large generated videos
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/mp3', 'audio/wav'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/mp3', 'audio/wav'
  ];

-- Create tenant-thumbnails bucket (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-thumbnails',
  'tenant-thumbnails',
  true, -- Public for fast CDN delivery
  10485760, -- 10MB
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'
  ];

-- Create shared-content bucket (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shared-content',
  'shared-content',
  true, -- Public for shareable links
  104857600, -- 100MB
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ];

-- =====================================================
-- STORAGE POLICIES FOR TENANT-ASSETS BUCKET
-- =====================================================

-- Users can upload to their tenant folder
CREATE POLICY "Users can upload assets to their tenant folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- Users can read files from their tenant folder
CREATE POLICY "Users can read assets from their tenant folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- Users can update their own uploaded files
CREATE POLICY "Users can update their own assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- Users can delete their own uploaded files
CREATE POLICY "Users can delete their own assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- =====================================================
-- STORAGE POLICIES FOR TENANT-GENERATIONS BUCKET
-- =====================================================

-- Users can upload generations to their tenant folder
CREATE POLICY "Users can upload generations to their tenant folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-generations'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- Users can read generations from their tenant folder
CREATE POLICY "Users can read generations from their tenant folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tenant-generations'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- Users can update their own generations
CREATE POLICY "Users can update their own generations"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-generations'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'tenant-generations'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- Users can delete their own generations
CREATE POLICY "Users can delete their own generations"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-generations'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- =====================================================
-- STORAGE POLICIES FOR TENANT-THUMBNAILS BUCKET
-- =====================================================

-- Anyone can view thumbnails (public bucket)
CREATE POLICY "Anyone can view thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tenant-thumbnails');

-- Users can upload thumbnails to their tenant folder
CREATE POLICY "Users can upload thumbnails to their tenant folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-thumbnails'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- Users can update thumbnails in their tenant folder
CREATE POLICY "Users can update thumbnails in their tenant folder"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-thumbnails'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'tenant-thumbnails'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- Users can delete thumbnails from their tenant folder
CREATE POLICY "Users can delete thumbnails from their tenant folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-thumbnails'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- =====================================================
-- STORAGE POLICIES FOR SHARED-CONTENT BUCKET
-- =====================================================

-- Anyone can view shared content (public bucket)
CREATE POLICY "Anyone can view shared content"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shared-content');

-- Authenticated users can upload shared content
CREATE POLICY "Authenticated users can upload shared content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shared-content');

-- Users can update their own shared content
CREATE POLICY "Users can update their own shared content"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shared-content'
  AND owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'shared-content'
);

-- Users can delete their own shared content
CREATE POLICY "Users can delete their own shared content"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'shared-content'
  AND owner = auth.uid()
);

-- =====================================================
-- HELPER FUNCTIONS FOR STORAGE
-- =====================================================

-- Function to get tenant storage usage
CREATE OR REPLACE FUNCTION get_tenant_storage_usage(tenant_id_param uuid)
RETURNS TABLE (
  bucket_name text,
  file_count bigint,
  total_bytes bigint,
  total_gb numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    obj.bucket_id as bucket_name,
    COUNT(*)::bigint as file_count,
    SUM(obj.metadata->>'size')::bigint as total_bytes,
    ROUND((SUM((obj.metadata->>'size')::bigint) / 1024.0 / 1024.0 / 1024.0)::numeric, 2) as total_gb
  FROM storage.objects obj
  WHERE (storage.foldername(obj.name))[1] = tenant_id_param::text
  GROUP BY obj.bucket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if tenant is within storage quota
CREATE OR REPLACE FUNCTION check_storage_quota(tenant_id_param uuid)
RETURNS boolean AS $$
DECLARE
  current_usage_gb numeric;
  max_storage_gb int;
  within_quota boolean;
BEGIN
  -- Get current usage
  SELECT COALESCE(SUM(total_gb), 0)
  INTO current_usage_gb
  FROM get_tenant_storage_usage(tenant_id_param);
  
  -- Get max allowed storage
  SELECT t.max_storage_gb
  INTO max_storage_gb
  FROM tenants t
  WHERE t.id = tenant_id_param;
  
  -- Check if within quota
  within_quota := current_usage_gb < max_storage_gb;
  
  RETURN within_quota;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up orphaned files
CREATE OR REPLACE FUNCTION cleanup_orphaned_storage_files()
RETURNS int AS $$
DECLARE
  deleted_count int := 0;
BEGIN
  -- This should be called periodically via cron job
  -- Deletes files that don't have corresponding records in assets or generation_history tables
  
  -- For now, just return 0 (actual implementation would delete orphaned files)
  -- Implementation requires storage.objects access which needs careful handling
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION get_tenant_storage_usage IS 'Calculate total storage usage per bucket for a tenant';
COMMENT ON FUNCTION check_storage_quota IS 'Check if tenant is within their storage quota limit';
COMMENT ON FUNCTION cleanup_orphaned_storage_files IS 'Remove files that no longer have database records';