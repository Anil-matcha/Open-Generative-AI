import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, getLeads } from '../lib/supabase-client';

interface Lead {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  message: string | null;
  campaigns: { name: string };
  created_at: string;
}

export function Leads() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignId) loadLeads();
  }, [campaignId]);

  async function loadLeads() {
    try {
      const data = await getLeads(campaignId!);
      setLeads(data);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(leadId: string) {
    if (!confirm('Delete this lead?')) return;
    
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);
      
      if (error) throw error;
      loadLeads();
    } catch (error: any) {
      alert('Error deleting lead: ' + error.message);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/campaigns/${campaignId}`)}
          className="text-sm text-cyan-400 hover:text-cyan-300 mb-4"
        >
          ← Back to Campaign
        </button>
        <h1 className="text-3xl font-bold text-white">Leads</h1>
        <p className="mt-2 text-slate-400">{leads.length} leads captured</p>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-8">Loading...</div>
      ) : leads.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
          No leads captured yet. Leads are generated when prospects submit forms on your video pages.
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          {leads.map((lead, idx) => (
            <div
              key={lead.id}
              className={`p-4 hover:bg-white/5 transition ${idx < leads.length - 1 ? 'border-b border-white/5' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">
                    {lead.name || 'Anonymous'}
                  </div>
                  <div className="text-sm text-slate-400">
                    {lead.email}
                  </div>
                  {lead.phone && (
                    <div className="text-xs text-slate-500 mt-1">{lead.phone}</div>
                  )}
                  <div className="text-xs text-slate-500 mt-1">
                    From: {lead.campaigns?.name || 'Unknown'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => handleDelete(lead.id)}
                    className="text-xs text-red-400 hover:text-red-300 mt-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {lead.message && (
                <div className="mt-3 p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300">
                  "{lead.message}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
