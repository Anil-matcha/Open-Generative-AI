import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, getScripts } from '../lib/supabase-client';

interface Script {
  id: string;
  hook: string | null;
  script: string | null;
  subject_line: string | null;
  email_body: string | null;
  cta: string | null;
  status: string;
  contacts: { first_name: string; last_name: string; email: string };
}

export function ScriptGenerator() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (campaignId) loadData();
  }, [campaignId]);

  async function loadData() {
    try {
      // Load scripts
      const scriptData = await getScripts(campaignId!);
      setScripts(scriptData);

      // Load contacts for this campaign
      const { data: contactData } = await supabase
        .from('contacts')
        .select('*')
        .eq('campaign_id', campaignId!);
      
      setContacts(contactData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateAll() {
    if (!confirm(`Generate personalized scripts for all ${contacts.length} contacts?`)) return;
    
    setGenerating(true);
    try {
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('generate-personalized-scripts', {
        body: { campaignId: campaignId, contactIds: contacts.map(c => c.id) }
      });
      
      if (error) throw error;
      alert('Scripts generation started! Check back in a few minutes.');
      loadData();
    } catch (error: any) {
      alert('Error generating scripts: ' + error.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateForContact(contactId: string) {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-personalized-scripts', {
        body: { campaignId: campaignId, contactIds: [contactId] }
      });
      
      if (error) throw error;
      alert('Script generated successfully!');
      loadData();
    } catch (error: any) {
      alert('Error generating script: ' + error.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/campaigns/${campaignId}/contacts`)}
          className="text-sm text-cyan-400 hover:text-cyan-300 mb-4"
        >
          ← Back to Contacts
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Script Generator</h1>
            <p className="mt-2 text-slate-400">
              {scripts.length} of {contacts.length} scripts generated
            </p>
          </div>
          <button
            onClick={handleGenerateAll}
            disabled={generating || contacts.length === 0}
            className="px-4 py-2 bg-cyan-400 text-slate-900 rounded-lg font-medium hover:bg-cyan-300 transition disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate All Scripts'}
          </button>
        </div>
      </div>

      {/* Scripts List */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : scripts.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p className="mb-4">No scripts generated yet.</p>
            <button
              onClick={handleGenerateAll}
              disabled={generating || contacts.length === 0}
              className="px-6 py-3 bg-cyan-400 text-slate-900 rounded-lg font-medium hover:bg-cyan-300 transition disabled:opacity-50"
            >
              Generate Scripts for All Contacts
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {scripts.map((script) => (
              <div
                key={script.id}
                className="p-4 hover:bg-white/5 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-white">
                      {script.contacts?.first_name} {script.contacts?.last_name}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {script.contacts?.email}
                    </div>
                    {script.hook && (
                      <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-sm text-white mb-1"><strong>Hook:</strong> {script.hook}</p>
                        {script.script && <p className="text-sm text-slate-300 mt-2">{script.script}</p>}
                      </div>
                    )}
                    <div className="flex gap-4 mt-2">
                      {script.subject_line && (
                        <span className="text-xs text-slate-400">Subject: {script.subject_line}</span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        script.status === 'generated' ? 'bg-emerald-400/20 text-emerald-200' :
                        script.status === 'draft' ? 'bg-slate-400/20 text-slate-200' :
                        'bg-yellow-400/20 text-yellow-200'
                      }`}>
                        {script.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerateForContact(script.contact_id)}
                    disabled={generating}
                    className="text-sm text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
