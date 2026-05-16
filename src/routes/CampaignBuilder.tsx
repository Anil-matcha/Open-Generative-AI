import { useState } from 'react';
import PersonalizerDialog from '../components/personalizer/PersonalizerDialog';

export function CampaignBuilder() {
  const [showPersonalizer, setShowPersonalizer] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Campaign Builder</h1>
          <p className="mt-2 text-slate-400">Create and configure outreach campaigns</p>
        </div>
        <button
          onClick={() => setShowPersonalizer(true)}
          className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition border border-white/10"
        >
          🤖 AI Personalizer
        </button>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Campaign Name</label>
            <input type="text" className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-white/30 focus:outline-none" placeholder="Enter campaign name..." />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Target Market</label>
            <input type="text" className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-white/30 focus:outline-none" placeholder="e.g. SaaS founders, Real estate agents" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Offer</label>
            <textarea className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-white/30 focus:outline-none h-20 resize-none" placeholder="Describe your offer..." />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Call to Action</label>
            <input type="text" className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-white/30 focus:outline-none" placeholder="e.g. Book a call, Sign up now" />
          </div>
          <div className="flex gap-3 pt-4">
            <button className="px-6 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition">
              Create Campaign
            </button>
            <button
              onClick={() => setShowPersonalizer(true)}
              className="px-6 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition border border-white/10"
            >
              🤖 Personalize First
            </button>
          </div>
        </div>
      </div>
      {showPersonalizer && (
        <PersonalizerDialog
          open={showPersonalizer}
          onClose={() => setShowPersonalizer(false)}
          appId="video-outreach"
          mode="cold-email"
        />
      )}
    </div>
  );
}
