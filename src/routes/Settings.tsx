import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiKeyManager } from '../lib/apiKeyManager';
import { supabase, updateUserPassword } from '../lib/supabase-client';

interface Workspace {
  id: string;
  name: string;
  brand_name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  cta_button_color: string | null;
  custom_footer_text: string | null;
}

interface MuapiWorkflow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  workflow_id: string;
  is_active: boolean;
}

export function Settings() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workflows, setWorkflows] = useState<MuapiWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'brand' | 'integrations' | 'billing' | 'team' | 'account' | 'api-keys'>('brand');

  // Brand form
  const [brandName, setBrandName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#d9ff00');
  const [ctaColor, setCtaColor] = useState('#22c55e');
  const [footerText, setFooterText] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (campaignId) loadData();
    loadApiKeys();
  }, [campaignId]);

  async function loadApiKeys() {
    const openaiKey = await apiKeyManager.getKey('openai');
    const muapiKey = await apiKeyManager.getKey('muapi');
    const videodbKey = await apiKeyManager.getKey('videodb');
    const openaiEl = document.getElementById('openai-key') as HTMLInputElement;
    const muapiEl = document.getElementById('muapi-key') as HTMLInputElement;
    const videodbEl = document.getElementById('videodb-key') as HTMLInputElement;
    if (openaiEl && openaiKey) openaiEl.value = openaiKey;
    if (muapiEl && muapiKey) muapiEl.value = muapiKey;
    if (videodbEl && videodbKey) videodbEl.value = videodbKey;
  }

  async function loadData() {
    try {
      // Get workspace
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (workspaces) {
        setWorkspace(workspaces);
        setBrandName(workspaces.brand_name || '');
        setLogoUrl(workspaces.logo_url || '');
        setPrimaryColor(workspaces.primary_color || '#d9ff00');
        setCtaColor(workspaces.cta_button_color || '#22c55e');
        setFooterText(workspaces.custom_footer_text || '');
      }

      // Load MuAPI workflows
      const { data: workflowData } = await supabase
        .from('muapi_workflows')
        .select('*')
        .eq('is_active', true);

      setWorkflows(workflowData || []);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleBrandSave(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          brand_name: brandName,
          logo_url: logoUrl || null,
          primary_color: primaryColor,
          cta_button_color: ctaColor,
          custom_footer_text: footerText || null
        })
        .eq('id', workspace.id);

      if (error) throw error;
      alert('Brand settings saved!');
      loadData();
    } catch (error: any) {
      alert('Error saving: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/campaigns')}
          className="text-sm text-cyan-400 hover:text-cyan-300 mb-4"
        >
          ← Back to Campaigns
        </button>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="mt-2 text-slate-400">Manage your workspace settings</p>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-4 border-b border-white/10">
        {(['brand', 'integrations', 'billing', 'team', 'account', 'api-keys'] as const[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 text-sm font-medium capitalize transition ${
              activeTab === tab
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Brand Kit */}
      {activeTab === 'brand' && (
        <form onSubmit={handleBrandSave} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
          <h2 className="text-xl font-semibold text-white mb-4">Brand Kit</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Brand Name</label>
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                placeholder="Your brand name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Logo URL</label>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-10 rounded-lg border border-white/10 cursor-pointer"
                />
                <input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">CTA Button Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={ctaColor}
                  onChange={(e) => setCtaColor(e.target.value)}
                  className="w-12 h-10 rounded-lg border border-white/10 cursor-pointer"
                />
                <input
                  value={ctaColor}
                  onChange={(e) => setCtaColor(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Custom Footer Text</label>
            <input
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
              placeholder="© 2024 Your Brand. All rights reserved."
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-cyan-400 text-slate-900 rounded-lg font-medium hover:bg-cyan-300 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Brand Settings'}
            </button>
          </div>

          {/* Preview */}
          {brandName && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
              <div
                className="rounded-xl p-6"
                style={{
                  backgroundColor: '#0a0b0f',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {logoUrl && (
                  <img src={logoUrl} alt="Logo" className="h-8 mb-4" />
                )}
                <div
                  className="text-2xl font-bold mb-2"
                  style={{ color: primaryColor }}
                >
                  {brandName}
                </div>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: ctaColor,
                    color: '#0a0b0f'
                  }}
                >
                  Book a Call
                </button>
                {footerText && (
                  <div className="mt-4 text-xs text-slate-500">{footerText}</div>
                )}
              </div>
            </div>
          )}
        </form>
      )}

      {/* Integrations */}
      {activeTab === 'integrations' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Integrations</h2>
            <p className="text-sm text-slate-400 mb-6">Connect your favorite tools and services</p>

            {[
              { name: 'Zapier', description: 'Automate workflows with 5000+ apps', connected: false },
              { name: 'GoHighLevel', description: 'All-in-one marketing platform', connected: false },
              { name: 'HubSpot', description: 'CRM and marketing automation', connected: false },
              { name: 'Calendly', description: 'Scheduling and appointment booking', connected: false },
              { name: 'Gmail', description: 'Email sending and tracking', connected: false },
              { name: 'Webhooks', description: 'Receive real-time event notifications', connected: true },
              { name: 'CSV Export', description: 'Export data to CSV files', connected: true },
              { name: 'Apollo', description: 'Sales intelligence and engagement', connected: false },
              { name: 'Lemlist', description: 'Cold email automation', connected: false },
              { name: 'Mailchimp', description: 'Email marketing platform', connected: false },
              { name: 'ActiveCampaign', description: 'Customer experience automation', connected: false },
            ].map((integration) => (
              <div
                key={integration.name}
                className="flex items-center justify-between p-4 rounded-xl border border-white/10 hover:bg-white/5 transition"
              >
                <div>
                  <div className="font-medium text-white">{integration.name}</div>
                  <div className="text-sm text-slate-400">{integration.description}</div>
                </div>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    integration.connected
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-cyan-400 text-slate-900 hover:bg-cyan-300'
                  }`}
                >
                  {integration.connected ? 'Connected' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Billing */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Billing & Plan</h2>
            <p className="text-sm text-slate-400 mb-6">Manage your subscription</p>

            {/* Current Plan */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-lg font-semibold text-white">Free Plan</div>
                  <div className="text-sm text-slate-400">$0/month</div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-400/20 text-slate-200">
                  Current Plan
                </span>
              </div>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  5 campaigns
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  100 contacts/month
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Basic analytics
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Community support
                </li>
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-lg font-semibold text-white">Pro Plan</div>
                  <div className="text-sm text-slate-400">$49/month</div>
                </div>
                <button
                  className="px-6 py-2 bg-cyan-400 text-slate-900 rounded-lg font-medium hover:bg-cyan-300 transition"
                >
                  Upgrade to Pro
                </button>
              </div>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Unlimited campaigns
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Unlimited contacts
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Advanced analytics & conversion tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  White-label ready
                </li>
              </ul>
            </div>

            {/* Agency Plan */}
            <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-lg font-semibold text-white">Agency Plan</div>
                  <div className="text-sm text-slate-400">$149/month</div>
                </div>
                <button
                  className="px-6 py-2 bg-yellow-400 text-slate-900 rounded-lg font-medium hover:bg-yellow-300 transition"
                >
                  Contact Sales
                </button>
              </div>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Everything in Pro
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Team collaboration (up to 10 members)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Custom domains
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  API access
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Dedicated account manager
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Team/Workspace */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Team Members</h2>
                <p className="text-sm text-slate-400 mt-1">Manage your workspace team</p>
              </div>
              <button
                className="px-4 py-2 bg-cyan-400 text-slate-900 rounded-lg font-medium hover:bg-cyan-300 transition"
              >
                + Invite Member
              </button>
            </div>

            {workspace && (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-200 font-medium">
                      {workspace.name?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="font-medium text-white">{workspace.name || 'Unnamed Workspace'}</div>
                      <div className="text-sm text-slate-400">{workspace.owner_id ? 'Owner' : 'Member'}</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-400/20 text-emerald-200">
                    Owner
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account */}
      {activeTab === 'account' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Account Settings</h2>
            <p className="text-sm text-slate-400 mb-6">Manage your account and password</p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (newPassword !== confirmPassword) {
                alert('Passwords do not match');
                return;
              }
              if (newPassword.length < 6) {
                alert('Password must be at least 6 characters');
                return;
              }

              setPasswordSaving(true);
              try {
                const { error } = await updateUserPassword(newPassword);
                if (error) throw error;
                alert('Password updated successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              } catch (error: any) {
                alert('Error updating password: ' + error.message);
              } finally {
                setPasswordSaving(false);
              }
            }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                  placeholder="Confirm new password"
                />
              </div>

              <button
                type="submit"
                disabled={passwordSaving}
                className="px-6 py-2 bg-cyan-400 text-slate-900 rounded-lg font-medium hover:bg-cyan-300 transition disabled:opacity-50"
              >
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* API Keys */}
      {activeTab === 'api-keys' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">API Keys</h2>
            <p className="text-sm text-slate-400 mb-6">Manage your API keys for external services</p>

            <div className="space-y-6">
              {/* OpenAI API Key */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  OpenAI API Key
                  <span className="text-xs text-slate-400 ml-2">(for LLM writing models)</span>
                </label>
                <input
                  type="password"
                  id="openai-key"
                  placeholder="sk-..."
                  className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                />
                <p className="text-xs text-slate-400 mt-1">Get your key at <a href="https://platform.openai.com/api-keys" target="_blank" className="text-cyan-400">platform.openai.com/api-keys</a></p>
              </div>

              {/* MUAPI Key */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  MUAPI Key
                  <span className="text-xs text-slate-400 ml-2">(for video and image models)</span>
                </label>
                <input
                  type="password"
                  id="muapi-key"
                  placeholder="muapi_..."
                  className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                />
                <p className="text-xs text-slate-400 mt-1">Get your key at <a href="https://muapi.ai" target="_blank" className="text-cyan-400">muapi.ai</a></p>
              </div>

              {/* VideoDB Key */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  VideoDB Key
                  <span className="text-xs text-slate-400 ml-2">(for video director application)</span>
                </label>
                <input
                  type="password"
                  id="videodb-key"
                  placeholder="videodb_..."
                  className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                />
                <p className="text-xs text-slate-400 mt-1">Get your key at <a href="https://console.videodb.io" target="_blank" className="text-cyan-400">console.videodb.io</a></p>
              </div>

              <button
                onClick={async () => {
                  const openaiKey = (document.getElementById('openai-key') as HTMLInputElement)?.value;
                  const muapiKey = (document.getElementById('muapi-key') as HTMLInputElement)?.value;
                  const videodbKey = (document.getElementById('videodb-key') as HTMLInputElement)?.value;

                  if (openaiKey) await apiKeyManager.setKey(openaiKey, 'openai');
                  if (muapiKey) await apiKeyManager.setKey(muapiKey, 'muapi');
                  if (videodbKey) await apiKeyManager.setKey(videodbKey, 'videodb');

                  alert('API keys saved successfully!');
                }}
                className="px-6 py-2 bg-cyan-400 text-slate-900 rounded-lg font-medium hover:bg-cyan-300 transition"
              >
                Save API Keys
              </button>
            </div>
          </div>

          {/* Sign Out Section */}
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-4">Account Actions</h2>
            <p className="text-sm text-slate-400 mb-4">These actions cannot be undone</p>
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to sign out?')) {
                  await supabase.auth.signOut();
                  window.location.href = '/';
                }
              }}
              className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-400 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
