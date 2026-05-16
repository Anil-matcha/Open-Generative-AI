import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase-client';
import { validateTargetName } from '../../hooks/usePersonalizerStore';
import { visualGenerationService } from '../../lib/personalizer/visualGenerationService';

const TAGS = [
  { id: 'gaming', label: 'Gaming' }, { id: 'coding', label: 'Coding' },
  { id: 'photo', label: 'Photo' }, { id: 'music', label: 'Music' },
  { id: 'blog', label: 'Blog' }, { id: 'finance', label: 'Finance' },
  { id: 'freelance', label: 'Freelance' }, { id: 'dating', label: 'Dating' },
  { id: 'tech', label: 'Tech' }, { id: 'forum', label: 'Forum' },
  { id: 'business', label: 'Business' }, { id: 'shopping', label: 'Shopping' },
  { id: 'sport', label: 'Sport' }, { id: 'hacking', label: 'Hacking' },
  { id: 'art', label: 'Art' }, { id: 'travel', label: 'Travel' },
  { id: 'education', label: 'Education' }, { id: 'science', label: 'Science' },
  { id: 'news', label: 'News' }, { id: 'books', label: 'Books' },
  { id: 'career', label: 'Career' }, { id: 'fashion', label: 'Fashion' }, { id: 'ai', label: 'AI' }
];

const STEPS = [
  { id: 1, name: 'Select App & Mode' }, { id: 2, name: 'Target Info' },
  { id: 3, name: 'Public Scan (Optional)' }, { id: 4, name: 'Manual Notes' },
  { id: 5, name: 'Generate' }, { id: 6, name: 'Output' },
  { id: 7, name: 'Save' }, { id: 8, name: 'Send to App' }
];

const MODES = [
  { id: 'cold-email', label: 'Cold Email' }, { id: 'video-email', label: 'Video Email' },
  { id: 'proposal', label: 'Proposal' }, { id: 'sales-page', label: 'Sales Page' },
  { id: 'thumbnail', label: 'Thumbnail' }, { id: 'content-campaign', label: 'Content Campaign' },
  { id: 'agency-pitch', label: 'Agency Pitch' }, { id: 'lead-summary', label: 'Lead Summary' },
  { id: 'video-script', label: 'Video Script' },
  // Visual personalization modes
  { id: 'personalized-image', label: 'Personalized Image' },
  { id: 'personalized-video', label: 'Personalized Video' }
];

const APPS = [
  { id: 'ai-video-agency', label: 'AI Video Agency' }, { id: 'image-studio', label: 'Image Studio' },
  { id: 'video-studio', label: 'Video Studio' }, { id: 'cinema-studio', label: 'Cinema Studio' },
  { id: 'effects-studio', label: 'Effects Studio' }, { id: 'character-studio', label: 'Character Studio' },
  { id: 'influencer-studio', label: 'Influencer Studio' }, { id: 'audio-studio', label: 'Audio Studio' },
  { id: 'timeline-editor', label: 'Timeline Editor' }, { id: 'video-outreach', label: 'Video Outreach' }
];

const REPORT_FORMATS = [
  { id: 'html', label: 'HTML' }, { id: 'json', label: 'JSON' },
  { id: 'markdown', label: 'Markdown' }, { id: 'csv', label: 'CSV' }
];

const ERROR_MESSAGES = {
  'Rate limit exceeded': 'Too many requests. Please wait a minute and try again.',
  'Unauthorized': 'Please sign in to continue.',
  'Invalid or expired token': 'Your session has expired. Please sign in again.',
  'targetName required': 'Please enter a target name.',
  'Scan failed': 'Unable to scan profiles. Please try again.',
  'Generation failed': 'Unable to generate content. Please try again.',
  'Save failed': 'Unable to save. Please try again.',
  'default': 'Something went wrong. Please try again.'
};

function getErrorMessage(error) {
  const msg = error?.message || error || '';
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    if (msg.includes(key)) return message;
  }
  return ERROR_MESSAGES['default'];
}

export default function PersonalizerDialog({
  open, onClose, appId: initialAppId, mode: initialMode, projectId: initialProjectId,
  defaultOffer, defaultGoal, defaultTone = 'professional', defaultCTA, initialTarget,
  onComplete, onSave
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [appId, setAppId] = useState(initialAppId || 'ai-video-agency');
  const [mode, setMode] = useState(initialMode || 'cold-email');
  const [targetName, setTargetName] = useState(initialTarget || '');
  const [targetCompany, setTargetCompany] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [output, setOutput] = useState(null);
  const [project, setProject] = useState(null);
  const [scanResults, setScanResults] = useState(null);
  const [showResultsView, setShowResultsView] = useState('table');
  const [topSites, setTopSites] = useState(500);
  const [selectedTags, setSelectedTags] = useState([]);
  const [excludedTags, setExcludedTags] = useState([]);
  const [enablePermutations, setEnablePermutations] = useState(false);
  const [disableRecursive, setDisableRecursive] = useState(false);
  const [disableParsing, setDisableParsing] = useState(false);
  const [withDomains, setWithDomains] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Visual personalization state
  const [visualStyle, setVisualStyle] = useState('cinematic');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [storyType, setStoryType] = useState('founder-story');
  const [durationSeconds, setDurationSeconds] = useState(30);
  const [toastMessage, setToastMessage] = useState('');
  const scanAbortRef = useRef(null);
  const generateAbortRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open && initialProjectId) loadProject(initialProjectId);
    return () => {
      scanAbortRef.current?.abort();
      generateAbortRef.current?.abort();
    };
  }, [open, initialProjectId]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const loadProject = async (id) => {
    try {
      const { data, error } = await supabase.from('personalization_projects').select('*').eq('id', id).single();
      if (error) throw error;
      if (data) {
        setProject(data);
        setAppId(data.app_id);
        setMode(data.mode);
        setTargetName(data.target_name);
        setTargetCompany(data.target_company || '');
        setManualNotes(data.manual_notes || '');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const downloadReport = (format) => {
    if (!scanResults) return;
    const platforms = scanResults.platforms || [];
    let content = '';
    let filename = `personalization_report_${targetName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}`;
    let mimeType = 'text/plain';

    switch (format) {
      case 'json':
        content = JSON.stringify(scanResults, null, 2);
        filename += '.json'; mimeType = 'application/json'; break;
      case 'csv': {
        const headers = ['Platform', 'URL', 'Status', 'Rank', 'HTTP Status'];
        const rows = platforms.map(p => [p.platform || '', p.url || '', p.exists ? 'Found' : 'Not Found', p.rank || '', p.http_status || '']);
        content = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        filename += '.csv'; mimeType = 'text/csv'; break;
      }
      case 'html':
        content = `<!DOCTYPE html><html><head><title>Personalization Report - ${targetName}</title><style>body{font-family:system-ui;max-width:1200px;margin:0 auto;padding:20px;background:#0a0a0a;color:#e0e0e0}h1{color:#6366f1}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{padding:12px;text-align:left;border-bottom:1px solid #333}th{background:#1a1a1a;color:#8b5cf6}tr:hover{background:#111}.summary{background:#1a1a1a;padding:20px;border-radius:8px;margin:20px 0}.badge{display:inline-block;padding:4px 8px;border-radius:4px;font-size:12px}.badge-success{background:#10b981;color:white}.badge-warning{background:#f59e0b;color:white}</style></head><body><h1>Personalization Report: ${targetName}</h1><div class="summary"><p>${scanResults.summary || 'No summary'}</p><p>Confidence: ${Math.round((scanResults.confidence || 0) * 100)}% | Platforms: ${platforms.length}</p></div><table><thead><tr><th>Platform</th><th>URL</th><th>Status</th><th>Rank</th><th>HTTP</th></tr></thead><tbody>${platforms.map(p => `<tr><td>${p.platform || 'Unknown'}</td><td>${p.url ? `<a href="${p.url}">${p.url}</a>` : 'N/A'}</td><td><span class="badge ${p.exists ? 'badge-success' : 'badge-warning'}">${p.exists ? 'Found' : 'Not Found'}</span></td><td>${p.rank || 'N/A'}</td><td>${p.http_status || 'N/A'}</td></tr>`).join('')}</tbody></table></body></html>`;
        filename += '.html'; mimeType = 'text/html'; break;
      case 'markdown':
        content = `# Personalization Report: ${targetName}\n\n${scanResults.summary || 'No summary'}\n\n- **Confidence:** ${Math.round((scanResults.confidence || 0) * 100)}%\n- **Platforms Found:** ${platforms.length}\n\n| Platform | URL | Status | Rank | HTTP |\n|----------|-----|--------|------|------|\n${platforms.map(p => `| ${p.platform || 'Unknown'} | ${p.url || 'N/A'} | ${p.exists ? 'Found' : 'Not Found'} | ${p.rank || 'N/A'} | ${p.http_status || 'N/A'} |`).join('\n')}`;
        filename += '.md'; mimeType = 'text/markdown'; break;
    }
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleScan = async () => {
    const validatedName = validateTargetName(targetName);
    if (!validatedName) { setError('Please enter a valid target name'); return; }

    scanAbortRef.current = new AbortController();
    setIsScanning(true); setError(''); setScanProgress(0);
    const interval = setInterval(() => setScanProgress(prev => Math.min(prev + 5, 95)), 200);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Unauthorized');

      const res = await fetch('/api/personalizer/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          targetName: validatedName, targetCompany,
          options: { topSites, tags: selectedTags, excludedTags, enablePermutations, disableRecursive, disableParsing, withDomains }
        }),
        signal: scanAbortRef.current.signal
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      setScanResults(data.scanData);
      setProject(prev => ({ ...prev, scan_id: data.scanId }));
      setScanProgress(100);
    } catch (err) {
      if (err.name !== 'AbortError') setError(getErrorMessage(err));
    } finally {
      clearInterval(interval); setIsScanning(false); scanAbortRef.current = null;
    }
  };

  const handleGenerate = async () => {
    const validatedName = validateTargetName(targetName);
    if (!validatedName) { setError('Please enter a valid target name'); return; }

    generateAbortRef.current = new AbortController();
    setIsGenerating(true); setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Unauthorized');

      // Visual generation: image or video
      if (mode === 'personalized-image' || mode === 'personalized-video') {
        // First, ensure we have a project
        let currentProjectId = project?.id;
        if (!currentProjectId) {
          const { data: newProject, error: projectError } = await supabase
            .from('personalization_projects')
            .insert({
              user_id: session.user.id,
              app_id: appId,
              mode,
              target_name: validatedName,
              target_company: targetCompany || null,
              manual_notes: manualNotes || null,
              visual_style: visualStyle,
              aspect_ratio: aspectRatio,
              duration_seconds: mode === 'personalized-video' ? durationSeconds : null,
              scan_id: scanResults?.id || null,
              status: 'generating'
            })
            .select()
            .single();
          if (projectError) throw projectError;
          setProject(newProject);
          currentProjectId = newProject.id;
        }

        const generationInputs = {
          targetName: validatedName,
          targetCompany,
          visualStyle,
          aspectRatio,
          manualNotes,
          tone: defaultTone,
          offer: defaultOffer,
          goal: defaultGoal,
          cta: defaultCTA,
          applyPersonalization: true
        };

        let result;
        if (mode === 'personalized-image') {
          result = await visualGenerationService.generatePersonalizedImage({
            projectId: currentProjectId,
            scanData: scanResults,
            inputs: generationInputs,
            appId,
            onProgress: (progress) => {
              setScanProgress(progress.progress);
            }
          });
        } else {
          result = await visualGenerationService.generatePersonalizedVideo({
            projectId: currentProjectId,
            scanData: scanResults,
            inputs: {
              ...generationInputs,
              storyType,
              durationSeconds
            },
            appId,
            onProgress: (progress) => {
              setScanProgress(progress.progress);
            }
          });
        }

        setOutput({
          type: mode,
          content: mode === 'personalized-video' ? result.prompt : result.prompt,
          assetId: result.assetId,
          url: result.url,
          metadata: result.metadata,
          scenes: result.scenes || null,
          voiceoverDirection: result.voiceoverDirection || null
        });
        setCurrentStep(6);
        onComplete?.(output);
      } else {
        // Text generation (existing flow)
        const res = await fetch('/api/personalizer/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({
            appId, mode, targetName: validatedName, targetCompany,
            manualNotes, offer: defaultOffer, goal: defaultGoal,
            tone: defaultTone, cta: defaultCTA, scanResults
          }),
          signal: generateAbortRef.current.signal
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Generation failed');
        setOutput(data.output);
        setProject(data.project);
        setCurrentStep(6);
        onComplete?.(data.output);
      }
    } catch (err) {
      if (err.name !== 'AbortError') setError(getErrorMessage(err));
    } finally {
      setIsGenerating(false); generateAbortRef.current = null;
    }
  };

  const handleSave = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Unauthorized');
      const res = await fetch('/api/personalizer/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ projectId: project?.id, output })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      onSave?.(project?.id);
      setCurrentStep(7);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleTagClick = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(t => t !== tagId));
      setExcludedTags([...excludedTags, tagId]);
    } else if (excludedTags.includes(tagId)) {
      setExcludedTags(excludedTags.filter(t => t !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!open) return null;

  const inputCls = "w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-white/30 focus:outline-none placeholder-gray-500";
  const labelCls = "block text-sm text-gray-300 mb-1";
  const btnPrimaryCls = "px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed";
  const btnSecondaryCls = "px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed";
  const btnGhostCls = "px-3 py-1.5 bg-white/5 text-gray-300 rounded-lg text-xs hover:bg-white/10 transition";

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="AI Personalizer"
    >
      <div className="bg-[#0a0a0a] rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">AI Personalizer</h2>
            <p className="text-xs text-gray-500 mt-0.5">Step {currentStep} of 8 — {STEPS[currentStep - 1].name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar steps */}
          <div className="w-52 bg-black/30 border-r border-white/5 p-3 overflow-y-auto shrink-0 hidden md:block">
            <div className="space-y-1">
              {STEPS.map(step => (
                <div key={step.id} className={`px-3 py-2 rounded-lg text-xs transition ${
                  currentStep === step.id ? 'bg-white/10 text-white border border-white/10' :
                  currentStep > step.id ? 'text-green-400/80' : 'text-gray-600'
                }`}>
                  {step.id}. {step.name}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 space-y-1">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Context</p>
              <p className="text-[10px] text-gray-500">App: {APPS.find(a => a.id === appId)?.label || appId}</p>
              <p className="text-[10px] text-gray-500">Mode: {MODES.find(m => m.id === mode)?.label || mode}</p>
              {project?.id && <p className="text-[10px] text-gray-500">Project: Active</p>}
              {scanResults && <p className="text-[10px] text-green-500">Scan: Complete</p>}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-5 overflow-y-auto min-w-0">
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-xs flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {toastMessage && (
              <div className="mb-4 p-3 bg-green-900/30 border border-green-500/30 rounded-lg text-green-300 text-xs flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                {toastMessage}
              </div>
            )}

            {/* Step 1: App & Mode */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <label className={labelCls}>App</label>
                  <select value={appId} onChange={e => setAppId(e.target.value)} className={inputCls}>
                    {APPS.map(app => <option key={app.id} value={app.id}>{app.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Mode</label>
                  <select value={mode} onChange={e => setMode(e.target.value)} className={inputCls}>
                    {MODES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Target Info */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <label className={labelCls}>Target Name(s)</label>
                  <textarea value={targetName} onChange={e => setTargetName(e.target.value)} className={`${inputCls} h-20 resize-none`} placeholder="Enter one or more usernames (separated by spaces or commas)..." />
                  <p className="text-[10px] text-gray-600 mt-1">Multiple usernames will be scanned recursively</p>
                </div>
                <div>
                  <label className={labelCls}>Target Company</label>
                  <input type="text" value={targetCompany} onChange={e => setTargetCompany(e.target.value)} className={inputCls} placeholder="Acme Inc." />
                </div>
              </div>
            )}

            {/* Step 3: Public Scan */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <p className="text-sm text-gray-400">Scan public profiles to gather context for personalization.</p>
                <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={labelCls}>Number of Sites</label>
                      <input type="number" value={topSites} onChange={e => setTopSites(Math.min(parseInt(e.target.value) || 500, 10000))} className={inputCls} min={1} max={10000} />
                    </div>
                    <div>
                      <label className={labelCls}>Timeout (seconds)</label>
                      <input type="number" defaultValue={30} className={inputCls} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Enable username permutations', checked: enablePermutations, set: setEnablePermutations },
                      { label: 'Disable recursive search', checked: disableRecursive, set: setDisableRecursive },
                      { label: 'Disable information extraction', checked: disableParsing, set: setDisableParsing },
                      { label: 'Check domains', checked: withDomains, set: setWithDomains }
                    ].map(opt => (
                      <label key={opt.label} className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                        <input type="checkbox" checked={opt.checked} onChange={e => opt.set(e.target.checked)} className="rounded border-white/20 bg-black/50" />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Tags (click to cycle: include → exclude → neutral)</label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {TAGS.map(tag => {
                      const isIncluded = selectedTags.includes(tag.id);
                      const isExcluded = excludedTags.includes(tag.id);
                      return (
                        <button key={tag.id} onClick={() => handleTagClick(tag.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] transition-all ${
                            isIncluded ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                            isExcluded ? 'bg-gray-700/50 text-gray-500 line-through border border-gray-600/30' :
                            'bg-red-500/10 text-red-300/70 border border-red-500/20 hover:bg-red-500/20'
                          }`}>
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {isScanning && (
                  <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-xs text-gray-400">Scanning public profiles...</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                      <div className="bg-white h-1.5 rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                    </div>
                  </div>
                )}
                {scanResults && scanResults.platforms && (
                  <div className="space-y-3">
                    <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm text-white font-medium">Scan Results</h4>
                        <div className="flex gap-1">
                          <button onClick={() => setShowResultsView('table')} className={`px-2 py-1 rounded text-[10px] ${showResultsView === 'table' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>Table</button>
                          <button onClick={() => setShowResultsView('graph')} className={`px-2 py-1 rounded text-[10px] ${showResultsView === 'graph' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>Graph</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="bg-white/5 p-2.5 rounded-lg">
                          <p className="text-[10px] text-gray-500">Platforms</p>
                          <p className="text-lg font-bold text-white">{scanResults.platforms.length}</p>
                        </div>
                        <div className="bg-white/5 p-2.5 rounded-lg">
                          <p className="text-[10px] text-gray-500">Confidence</p>
                          <p className="text-lg font-bold text-white">{Math.round((scanResults.confidence || 0) * 100)}%</p>
                        </div>
                        <div className="bg-white/5 p-2.5 rounded-lg">
                          <p className="text-[10px] text-gray-500">Summary</p>
                          <p className="text-[10px] text-gray-400 line-clamp-2">{scanResults.summary}</p>
                        </div>
                      </div>
                      {showResultsView === 'table' && (
                        <div className="overflow-x-auto max-h-48 overflow-y-auto">
                          <table className="w-full text-[11px]">
                            <thead><tr className="border-b border-white/5"><th className="text-left p-1.5 text-gray-500">Platform</th><th className="text-left p-1.5 text-gray-500">URL</th><th className="text-left p-1.5 text-gray-500">Status</th></tr></thead>
                            <tbody>{scanResults.platforms.map((p, i) => (
                              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-1.5 text-white">{p.platform || 'Unknown'}</td>
                                <td className="p-1.5 text-blue-400">{p.url ? <a href={p.url} target="_blank" rel="noopener" className="hover:underline truncate block max-w-40">{p.url}</a> : 'N/A'}</td>
                                <td className="p-1.5"><span className={`px-1.5 py-0.5 rounded text-[10px] ${p.exists ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{p.exists ? 'Found' : 'Not Found'}</span></td>
                              </tr>
                            ))}</tbody>
                          </table>
                        </div>
                      )}
                      {showResultsView === 'graph' && (
                        <div className="bg-white/5 p-4 rounded-lg min-h-32 flex flex-wrap gap-3 justify-center items-center">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black font-bold text-[10px]">@{targetName.split(',')[0]?.trim() || '?'}</div>
                            <p className="text-[9px] text-gray-500 mt-1">Target</p>
                          </div>
                          {scanResults.platforms.slice(0, 10).map((p, i) => (
                            <div key={i} className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[9px] ${p.exists ? 'bg-green-500' : 'bg-yellow-500'}`}>{p.platform?.charAt(0) || '?'}</div>
                              <p className="text-[8px] text-gray-500 mt-0.5 truncate max-w-12">{p.platform || '?'}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-[10px] text-gray-500 mb-1.5">Download Reports</p>
                        <div className="flex gap-1.5">
                          {REPORT_FORMATS.map(f => (
                            <button key={f.id} onClick={() => downloadReport(f.id)} className={btnGhostCls}>{f.label}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <button onClick={handleScan} disabled={isScanning || !targetName} className={btnPrimaryCls}>
                  {isScanning ? (
                    <span className="flex items-center gap-2"><span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />Scanning...</span>
                  ) : 'Run Public Scan'}
                </button>
              </div>
            )}

            {/* Step 4: Manual Notes */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <label className={labelCls}>Manual Notes</label>
                <textarea value={manualNotes} onChange={e => setManualNotes(e.target.value)} className={`${inputCls} h-40 resize-none`} placeholder="Add any additional context about the target..." />
              </div>
            )}

            {/* Step 5: Generate */}
            {currentStep === 5 && (
              <div className="space-y-5">
                <h3 className="text-base text-white font-medium">Ready to Generate</h3>
                <div className="bg-black/30 p-4 rounded-lg border border-white/5 space-y-1.5">
                  <p className="text-xs text-gray-400">Target: <span className="text-white">{targetName}</span></p>
                  <p className="text-xs text-gray-400">Mode: <span className="text-white">{MODES.find(m => m.id === mode)?.label}</span></p>
                  <p className="text-xs text-gray-400">Tone: <span className="text-white">{defaultTone}</span></p>
                  <p className="text-xs text-gray-400">Scan: <span className={scanResults ? 'text-green-400' : 'text-gray-500'}>{scanResults ? 'Complete' : 'Not run'}</span></p>
                </div>

                {/* Visual Personalization Options */}
                {(mode === 'personalized-image' || mode === 'personalized-video') && (
                  <div className="bg-black/30 p-4 rounded-lg border border-white/5 space-y-4">
                    <h4 className="text-sm text-white font-medium">Visual Settings</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Visual Style</label>
                        <select value={visualStyle} onChange={(e) => setVisualStyle(e.target.value)} className="w-full bg-gray-900/50 border border-white/10 rounded-lg p-2 text-white text-sm">
                          <option value="cinematic">Cinematic</option>
                          <option value="luxury">Luxury</option>
                          <option value="minimal">Minimal</option>
                          <option value="dramatic">Dramatic</option>
                          <option value="documentary">Documentary</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Aspect Ratio</label>
                        <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full bg-gray-900/50 border border-white/10 rounded-lg p-2 text-white text-sm">
                          <option value="16:9">16:9 (Landscape)</option>
                          <option value="9:16">9:16 (Vertical)</option>
                          <option value="1:1">1:1 (Square)</option>
                          <option value="4:3">4:3</option>
                        </select>
                      </div>
                    </div>

                    {mode === 'personalized-video' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Story Type</label>
                          <select value={storyType} onChange={(e) => setStoryType(e.target.value)} className="w-full bg-gray-900/50 border border-white/10 rounded-lg p-2 text-white text-sm">
                            <option value="founder-story">Founder Story</option>
                            <option value="testimonial">Testimonial</option>
                            <option value="product-demo">Product Demo</option>
                            <option value="brand-film">Brand Film</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Duration (seconds)</label>
                          <input type="number" value={durationSeconds} onChange={(e) => setDurationSeconds(parseInt(e.target.value) || 30)} className="w-full bg-gray-900/50 border border-white/10 rounded-lg p-2 text-white text-sm" min={5} max={120} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button onClick={handleGenerate} disabled={isGenerating || !targetName} className={btnPrimaryCls}>
                  {isGenerating ? (
                    <span className="flex items-center gap-2"><span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />Generating...</span>
                  ) : 'Generate Content'}
                </button>
              </div>
            )}

            {/* Step 6: Output */}
            {currentStep === 6 && output && (
              <div className="space-y-4">
                <h3 className="text-base text-white font-medium">Generated Output</h3>

                {/* Visual preview for image/video modes */}
                {(output.type === 'personalized-image' || output.type === 'personalized-video') ? (
                  <div className="space-y-4">
                    {output.url && (
                      <div className="bg-black/30 rounded-lg border border-white/5 overflow-hidden">
                        {output.type === 'personalized-image' ? (
                          <img src={output.url} alt="Personalized" className="w-full h-auto max-h-64 object-contain" />
                        ) : (
                          <video src={output.url} controls className="w-full h-auto max-h-64" />
                        )}
                      </div>
                    )}
                    <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                      <p className="text-xs text-gray-400 mb-1">Generation Prompt:</p>
                      <p className="text-xs text-gray-300 whitespace-pre-wrap">{output.content}</p>
                    </div>
                    {output.scenes && (
                      <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                        <p className="text-xs text-gray-400 mb-2">Scene Breakdown:</p>
                        {output.scenes.map((scene, i) => (
                          <p key={i} className="text-xs text-gray-300 mb-1">Scene {scene.beat}: {scene.name}</p>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={handleSave} className={`${btnPrimaryCls} bg-green-600 hover:bg-green-700 text-white`}>Save Output</button>
                      <button onClick={() => { navigator.clipboard.writeText(output.content); }} className={btnSecondaryCls}>Copy Prompt</button>
                      {output.url && (
                        <button onClick={() => { window.open(output.url, '_blank'); }} className={btnSecondaryCls}>Open Full Size</button>
                      )}
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('apply-personalized-asset', {
                            detail: { url: output.url, type: output.type, prompt: output.content, assetId: output.assetId }
                          }));
                          setToastMessage('Asset applied to timeline ✓');
                          setTimeout(() => setToastMessage(''), 3000);
                        }}
                        className={`${btnPrimaryCls} bg-purple-600 hover:bg-purple-700 text-white`}
                      >
                        Apply to Timeline
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-black/30 p-4 rounded-lg max-h-80 overflow-y-auto border border-white/5">
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{typeof output === 'string' ? output : JSON.stringify(output, null, 2)}</pre>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSave} className={`${btnPrimaryCls} bg-green-600 hover:bg-green-700 text-white`}>Save Output</button>
                      <button onClick={() => { navigator.clipboard.writeText(typeof output === 'string' ? output : JSON.stringify(output, null, 2)); }} className={btnSecondaryCls}>Copy to Clipboard</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 7: Saved */}
            {currentStep === 7 && (
              <div className="space-y-4 text-center py-8">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 className="text-lg text-white font-medium">Saved Successfully</h3>
                <p className="text-sm text-gray-400">Your personalized content has been saved to your project.</p>
              </div>
            )}

            {/* Step 8: Send to App */}
            {currentStep === 8 && (
              <div className="space-y-4">
                <h3 className="text-base text-white font-medium">Send to App</h3>
                <p className="text-sm text-gray-400">Copy the generated content and paste it into your target app.</p>
                <div className="flex gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(typeof output === 'string' ? output : JSON.stringify(output, null, 2)); }} className={btnPrimaryCls}>Copy to Clipboard</button>
                  <button onClick={onClose} className={btnSecondaryCls}>Done</button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6 pt-4 border-t border-white/5">
              <button onClick={() => setCurrentStep(Math.max(currentStep - 1, 1))} disabled={currentStep === 1} className={btnSecondaryCls}>Back</button>
              {currentStep < 6 && (
                <button onClick={() => setCurrentStep(Math.min(currentStep + 1, 8))} className={btnPrimaryCls}>Next</button>
              )}
            </div>

            {/* Disclaimer */}
            <div className="mt-6 p-3 bg-white/3 rounded-lg border border-white/5">
              <p className="text-[10px] text-gray-600 leading-relaxed">*This tool uses public or user-provided information to help generate business-relevant personalization. Results may include possible matches and should be reviewed before use. Do not use this tool for harassment, surveillance, sensitive profiling, or unlawful purposes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
