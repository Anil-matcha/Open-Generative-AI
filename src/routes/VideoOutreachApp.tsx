import { Link, Route, Routes } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { Campaigns } from './Campaigns';
import { CampaignBuilder } from './CampaignBuilder';
import { ContactImport } from './ContactImport';
import { ScriptGenerator } from './ScriptGenerator';
import { VideoGenerator } from './VideoGenerator';
import { VideoLibrary } from './VideoLibrary';
import { Analytics } from './Analytics';
import { Leads } from './Leads';
import { Settings } from './Settings';
import { PublicVideoPage } from './PublicVideoPage';

export function VideoOutreachApp() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed left-0 top-0 h-screen w-60 border-r border-white/10 bg-slate-900/80 p-5">
        <h1 className="mb-6 text-lg font-semibold">Video Outreach</h1>
        <nav className="space-y-2 text-sm">
          {['dashboard','campaigns','videos','analytics','leads','settings'].map((i)=><Link key={i} to={`/${i}`} className="block rounded-lg px-3 py-2 hover:bg-white/10">{i}</Link>)}
        </nav>
      </aside>
      <main className="ml-60 p-6">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/new" element={<CampaignBuilder />} />
          <Route path="/campaigns/:id/contacts" element={<ContactImport />} />
          <Route path="/campaigns/:id/scripts" element={<ScriptGenerator />} />
          <Route path="/campaigns/:id/generate" element={<VideoGenerator />} />
          <Route path="/videos" element={<VideoLibrary />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/v/:slug" element={<PublicVideoPage />} />
        </Routes>
      </main>
    </div>
  );
}
