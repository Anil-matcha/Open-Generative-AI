import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, getContacts, createContacts } from '../lib/supabase-client';

interface Contact {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  company: string | null;
  industry: string | null;
  city: string | null;
}

export function ContactImport() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualContact, setManualContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company: '',
    website: '',
    industry: '',
    city: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (campaignId) loadContacts();
  }, [campaignId]);

  async function loadContacts() {
    try {
      const data = await getContacts(campaignId!);
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length > 0) {
        const mappedContacts = rows.map(row => ({
          campaign_id: campaignId!,
          first_name: row['First Name'] || row['first_name'] || '',
          last_name: row['Last Name'] || row['last_name'] || '',
          email: row['Email'] || row['email'] || '',
          company: row['Company'] || row['company'] || '',
          website: row['Website'] || row['website'] || '',
          industry: row['Industry'] || row['industry'] || '',
          city: row['City'] || row['city'] || '',
          custom_fields: {}
        }));

        await createContacts(mappedContacts);
        alert(`Imported ${mappedContacts.length} contacts!`);
        loadContacts();
      }
    } catch (error: any) {
      alert('Error importing contacts: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  function parseCSV(text: string) {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || '';
      });
      return row;
    });
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      await createContacts([{
        campaign_id: campaignId!,
        ...manualContact,
        custom_fields: {}
      }]);
      
      setManualContact({
        first_name: '', last_name: '', email: '', company: '', website: '', industry: '', city: ''
      });
      setShowManualForm(false);
      loadContacts();
    } catch (error: any) {
      alert('Error adding contact: ' + error.message);
    } finally {
      setSaving(false);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Import Contacts</h1>
            <p className="mt-2 text-slate-400">Add contacts to your campaign</p>
          </div>
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="px-4 py-2 bg-cyan-400 text-slate-900 rounded-lg font-medium hover:bg-cyan-300 transition"
          >
            + Manual Entry
          </button>
        </div>
      </div>

      {/* Upload CSV */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">CSV Upload</h2>
        <p className="text-sm text-slate-400 mb-4">
          Upload a CSV file with columns: First Name, Last Name, Email, Company, Website, Industry, City
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={handleCsvUpload}
          disabled={saving}
          className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-400 file:text-slate-900 hover:file:bg-cyan-300"
        />
        {saving && <p className="mt-2 text-sm text-slate-400">Importing contacts...</p>}
      </div>

      {/* Manual Entry Form */}
      {showManualForm && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Manual Entry</h2>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">First Name *</label>
                <input
                  required
                  value={manualContact.first_name}
                  onChange={(e) => setManualContact({...manualContact, first_name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Last Name</label>
                <input
                  value={manualContact.last_name}
                  onChange={(e) => setManualContact({...manualContact, last_name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Email *</label>
              <input
                type="email"
                required
                value={manualContact.email}
                onChange={(e) => setManualContact({...manualContact, email: e.target.value})}
                className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Company</label>
                <input
                  value={manualContact.company}
                  onChange={(e) => setManualContact({...manualContact, company: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Industry</label>
                <input
                  value={manualContact.industry}
                  onChange={(e) => setManualContact({...manualContact, industry: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-cyan-400 text-slate-900 rounded-lg font-medium hover:bg-cyan-300 transition disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Contact'}
              </button>
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="px-6 py-2 border border-white/10 rounded-lg text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contacts List */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-semibold text-white">
            Contacts ({contacts.length})
          </h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : contacts.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No contacts yet. Upload a CSV or add manually.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-4 hover:bg-white/5 transition cursor-pointer"
                onClick={() => navigate(`/campaigns/${campaignId}/scripts`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">
                      {contact.first_name} {contact.last_name}
                    </div>
                    <div className="text-sm text-slate-400">{contact.email}</div>
                    {contact.company && (
                      <div className="text-xs text-slate-500 mt-1">
                        {contact.company} • {contact.industry}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/campaigns/${campaignId}/scripts`);
                    }}
                    className="text-sm text-cyan-400 hover:text-cyan-300"
                  >
                    Generate Scripts →
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
