/*
  # Monitoring Dashboards - Database Schema

  Creates tables for comprehensive system monitoring, performance metrics,
  AI agent status, error analytics, user experience tracking, and infrastructure metrics.

  ## Tables Created

  ### 1. system_health_metrics
  Real-time system health indicators
  - service_name, status, response_time, uptime_percentage, last_check

  ### 2. performance_metrics
  Application performance data
  - metric_type (load_time, api_response, memory_usage, etc.)
  - value, timestamp, metadata

  ### 3. ai_agent_metrics
  AI service monitoring
  - agent_name, request_count, error_count, avg_response_time, status

  ### 4. error_analytics
  Error tracking and analysis
  - error_type, message, stack_trace, user_impact, frequency

  ### 5. user_experience_metrics
  UX performance data
  - page_load_times, interaction_latencies, satisfaction_scores

  ### 6. infrastructure_metrics
  Server and infrastructure monitoring
  - server_name, cpu_usage, memory_usage, disk_usage, network_io

  ### 7. alert_configs
  Alert threshold configurations
  - metric_type, threshold_value, alert_type, enabled

  ### 8. monitoring_alerts
  Active and historical alerts
  - alert_type, severity, message, resolved_at
*/

-- Create system_health_metrics table
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('healthy', 'warning', 'critical', 'unknown')),
  response_time_ms numeric(10, 2),
  uptime_percentage numeric(5, 2) CHECK (uptime_percentage >= 0 AND uptime_percentage <= 100),
  error_rate numeric(5, 2) CHECK (error_rate >= 0 AND error_rate <= 100),
  last_check timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  metric_type text NOT NULL CHECK (metric_type IN (
    'page_load_time', 'api_response_time', 'memory_usage', 'cpu_usage',
    'network_latency', 'render_time', 'bundle_size', 'cache_hit_rate'
  )),
  value numeric(15, 4) NOT NULL,
  unit text NOT NULL,
  tags jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  recorded_at timestamptz DEFAULT now()
);

-- Create ai_agent_metrics table
CREATE TABLE IF NOT EXISTS ai_agent_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  model_version text,
  request_count bigint DEFAULT 0,
  success_count bigint DEFAULT 0,
  error_count bigint DEFAULT 0,
  avg_response_time_ms numeric(10, 2),
  tokens_used bigint DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'maintenance')),
  last_request_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Create error_analytics table
CREATE TABLE IF NOT EXISTS error_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  error_type text NOT NULL,
  error_message text NOT NULL,
  stack_trace text,
  user_id uuid REFERENCES user_profiles(id),
  user_impact text CHECK (user_impact IN ('low', 'medium', 'high', 'critical')),
  browser_info jsonb DEFAULT '{}'::jsonb,
  url text,
  frequency int DEFAULT 1,
  first_occurrence timestamptz DEFAULT now(),
  last_occurrence timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolution_notes text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create user_experience_metrics table
CREATE TABLE IF NOT EXISTS user_experience_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id),
  session_id text,
  page_name text NOT NULL,
  load_time_ms numeric(10, 2),
  interaction_type text,
  interaction_time_ms numeric(10, 2),
  satisfaction_score int CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  device_type text,
  browser_name text,
  viewport_size jsonb DEFAULT '{}'::jsonb,
  geo_location jsonb DEFAULT '{}'::jsonb,
  recorded_at timestamptz DEFAULT now()
);

-- Create infrastructure_metrics table
CREATE TABLE IF NOT EXISTS infrastructure_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_name text NOT NULL,
  region text,
  cpu_usage_percent numeric(5, 2) CHECK (cpu_usage_percent >= 0 AND cpu_usage_percent <= 100),
  memory_usage_percent numeric(5, 2) CHECK (memory_usage_percent >= 0 AND memory_usage_percent <= 100),
  disk_usage_percent numeric(5, 2) CHECK (disk_usage_percent >= 0 AND disk_usage_percent <= 100),
  network_in_mbps numeric(10, 2),
  network_out_mbps numeric(10, 2),
  active_connections int,
  response_time_ms numeric(10, 2),
  status text NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance', 'error')),
  recorded_at timestamptz DEFAULT now()
);

-- Create alert_configs table
CREATE TABLE IF NOT EXISTS alert_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  metric_type text NOT NULL,
  threshold_value numeric(15, 4) NOT NULL,
  threshold_operator text NOT NULL CHECK (threshold_operator IN ('>', '<', '>=', '<=', '=', '!=')),
  alert_type text NOT NULL CHECK (alert_type IN ('email', 'slack', 'webhook', 'dashboard')),
  alert_message text NOT NULL,
  cooldown_minutes int DEFAULT 5,
  enabled boolean DEFAULT true,
  last_triggered_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create monitoring_alerts table
CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  alert_config_id uuid REFERENCES alert_configs(id) ON DELETE CASCADE,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  message text NOT NULL,
  triggered_value numeric(15, 4),
  threshold_value numeric(15, 4),
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES user_profiles(id),
  acknowledged_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_tenant_service ON system_health_metrics(tenant_id, service_name);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_last_check ON system_health_metrics(last_check DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_tenant_type ON performance_metrics(tenant_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at ON performance_metrics(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_agent_metrics_tenant_name ON ai_agent_metrics(tenant_id, agent_name);
CREATE INDEX IF NOT EXISTS idx_ai_agent_metrics_updated_at ON ai_agent_metrics(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_analytics_tenant_type ON error_analytics(tenant_id, error_type);
CREATE INDEX IF NOT EXISTS idx_error_analytics_last_occurrence ON error_analytics(last_occurrence DESC);

CREATE INDEX IF NOT EXISTS idx_user_experience_metrics_tenant_page ON user_experience_metrics(tenant_id, page_name);
CREATE INDEX IF NOT EXISTS idx_user_experience_metrics_recorded_at ON user_experience_metrics(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_infrastructure_metrics_server ON infrastructure_metrics(server_name);
CREATE INDEX IF NOT EXISTS idx_infrastructure_metrics_recorded_at ON infrastructure_metrics(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_configs_tenant_type ON alert_configs(tenant_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_tenant_config ON monitoring_alerts(tenant_id, alert_config_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_created_at ON monitoring_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_resolved ON monitoring_alerts(resolved) WHERE resolved = false;

-- Enable Row Level Security
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_experience_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE infrastructure_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (tenant admins can manage, all tenant users can view)
CREATE POLICY "Users can view system health metrics in their tenant"
  ON system_health_metrics FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant admins can manage system health metrics"
  ON system_health_metrics FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid() AND is_tenant_admin = true))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid() AND is_tenant_admin = true));

-- Similar policies for other tables
CREATE POLICY "Users can view performance metrics in their tenant"
  ON performance_metrics FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant admins can manage performance metrics"
  ON performance_metrics FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid() AND is_tenant_admin = true))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid() AND is_tenant_admin = true));

CREATE POLICY "Users can view AI agent metrics in their tenant"
  ON ai_agent_metrics FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant admins can manage AI agent metrics"
  ON ai_agent_metrics FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid() AND is_tenant_admin = true))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid() AND is_tenant_admin = true));

CREATE POLICY "Users can view error analytics in their tenant"
  ON error_analytics FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant admins can manage error analytics"
  ON error_analytics FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid() AND is_tenant_admin = true))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid() AND is_tenant_admin = true));

CREATE POLICY "Users can view UX metrics in their tenant"
  ON user_experience_metrics FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "System can insert UX metrics"
  ON user_experience_metrics FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view infrastructure metrics"
  ON infrastructure_metrics FOR SELECT TO authenticated
  USING (true); -- Infrastructure metrics might be shared across tenants

CREATE POLICY "Tenant admins can manage alert configs"
  ON alert_configs FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid() AND is_tenant_admin = true))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid() AND is_tenant_admin = true));

CREATE POLICY "Users can view alerts in their tenant"
  ON monitoring_alerts FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "System can create alerts"
  ON monitoring_alerts FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_ai_agent_metrics_updated_at
  BEFORE UPDATE ON ai_agent_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_configs_updated_at
  BEFORE UPDATE ON alert_configs
  FOR EACH ROW
