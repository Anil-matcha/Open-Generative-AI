'use client';

import { useState } from 'react';
import {
  Bot,
  Boxes,
  Clapperboard,
  FolderOpen,
  LayoutGrid,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Share2,
  WandSparkles,
} from 'lucide-react';

const PROJECT_ACTIONS = [
  { label: 'Ask Selena', description: 'Plan the next creative step with this Project in context.', path: '/studio/selena', icon: Bot },
  { label: 'Create Media', description: 'Generate an image or video and save the result here.', path: '/studio/apps/generator', icon: WandSparkles },
  { label: 'Build Storyboard', description: 'Create connected scenes using this Project and its Assets.', path: '/studio/apps/scene-builder', icon: Clapperboard },
  { label: 'Graphic Studio', description: 'Design or edit graphics using Project Assets.', path: '/studio/apps/graphic-studio', icon: LayoutGrid },
  { label: 'View Assets', description: 'Upload, review, and reuse everything saved to this Project.', path: '/studio/assets', icon: Boxes },
  { label: 'Prepare Publish', description: 'Prepare an approved Project Asset for social publishing.', path: '/studio/publish', icon: Share2 },
];

export default function ProjectsStudio({
  projects = [],
  currentProject = null,
  loading = false,
  error = '',
  onCreate,
  onOpen,
  onRename,
  onRefresh,
  onNavigate,
}) {
  const [editor, setEditor] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [openingId, setOpeningId] = useState('');
  const busy = loading || submitting || Boolean(openingId);

  const openCreateProject = () => {
    setEditor({ mode: 'create', name: 'Untitled Project' });
  };
  const openRenameProject = (project) => {
    setEditor({ mode: 'rename', id: project.id, name: project.name, originalName: project.name });
  };
  const submitEditor = async (event) => {
    event.preventDefault();
    const name = editor?.name?.trim();
    if (!name || busy) return;
    if (editor.mode === 'rename' && name === editor.originalName) {
      setEditor(null);
      return;
    }
    setSubmitting(true);
    try {
      const result = editor.mode === 'create'
        ? await onCreate?.(name)
        : await onRename?.(editor.id, name);
      if (result) setEditor(null);
    } finally {
      setSubmitting(false);
    }
  };
  const continueProject = async (project) => {
    if (!project?.id || busy) return;
    let selected = currentProject?.id === project.id ? currentProject : null;
    if (!selected) {
      setOpeningId(project.id);
      try {
        selected = await onOpen?.(project.id);
      } finally {
        setOpeningId('');
      }
    }
    if (selected) onNavigate?.('/studio/selena');
  };

  return (
    <div className="h-full overflow-y-auto bg-[#050506] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">Projects</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Your durable creative work.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/35">Project manifests, Storyboards, Selena conversation context, Assets, and timeline metadata are owner-scoped in private Vercel Blob storage.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onRefresh} disabled={busy} aria-label="Refresh Projects" className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.09] text-white/40 hover:text-white disabled:opacity-30"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /></button>
            <button type="button" onClick={openCreateProject} disabled={busy} className="flex h-11 items-center gap-2 rounded-xl bg-cyan-300 px-4 text-xs font-black text-black disabled:opacity-30"><Plus size={15} /> New Project</button>
          </div>
        </header>

        {editor && (
          <form onSubmit={submitEditor} aria-label={editor.mode === 'create' ? 'Create Project' : 'Rename Project'} className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.05] p-4 sm:flex sm:items-end sm:gap-3">
            <div className="min-w-0 flex-1">
              <label htmlFor="project-editor-name" className="block text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100/60">{editor.mode === 'create' ? 'Project name' : `Rename ${editor.originalName}`}</label>
              <input
                id="project-editor-name"
                type="text"
                value={editor.name}
                onChange={(event) => setEditor((current) => ({ ...current, name: event.target.value }))}
                maxLength={100}
                autoFocus
                disabled={busy}
                className="mt-2 h-11 w-full rounded-xl border border-white/[0.1] bg-black/35 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50 disabled:opacity-40"
              />
            </div>
            <div className="mt-3 flex gap-2 sm:mt-0">
              <button type="button" onClick={() => setEditor(null)} disabled={busy} className="h-11 rounded-xl border border-white/[0.1] px-4 text-xs font-bold text-white/55 hover:text-white disabled:opacity-30">Cancel</button>
              <button type="submit" disabled={busy || !editor.name.trim()} className="flex h-11 min-w-32 items-center justify-center rounded-xl bg-cyan-300 px-4 text-xs font-black text-black disabled:opacity-30">
                {submitting ? <LoaderCircle size={15} className="animate-spin" /> : editor.mode === 'create' ? 'Create Project' : 'Save Name'}
              </button>
            </div>
          </form>
        )}

        {error && <div role="alert" className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] px-4 py-3 text-sm text-amber-100">{error}</div>}
        {currentProject && (
          <section aria-label="Project Workspace" className="mt-6 rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/[0.08] via-white/[0.025] to-transparent p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/60">Current Project</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{currentProject.name}</h2>
                <p className="mt-2 text-xs text-white/35">{currentProject.assets?.length || 0} Assets · {currentProject.storyboard?.scenes?.length || 0} Scenes · Your work is saved to this Project.</p>
              </div>
              <button type="button" onClick={() => onNavigate?.('/studio/selena')} className="rounded-xl bg-cyan-300 px-4 py-3 text-xs font-black text-black">Continue with Selena</button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PROJECT_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button key={action.path} type="button" onClick={() => onNavigate?.(action.path)} className="group rounded-2xl border border-white/[0.08] bg-black/20 p-4 text-left transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.05]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-cyan-200"><Icon size={16} /></div>
                    <h3 className="mt-4 text-sm font-bold text-white/80 group-hover:text-white">{action.label}</h3>
                    <p className="mt-2 text-xs leading-5 text-white/30">{action.description}</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {loading && projects.length === 0 ? (
          <div className="mt-10 flex items-center justify-center rounded-3xl border border-white/[0.07] py-24 text-cyan-200"><LoaderCircle size={24} className="animate-spin" /></div>
        ) : projects.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-white/[0.1] bg-white/[0.02] px-8 py-20 text-center">
            <FolderOpen size={30} className="mx-auto text-white/20" />
            <h2 className="mt-4 text-sm font-semibold text-white/65">Create your first Project</h2>
            <p className="mt-2 text-xs text-white/25">A Project keeps Assets, Storyboard scenes, Selena context, and timeline metadata together across browser sessions.</p>
            <button type="button" onClick={openCreateProject} disabled={busy} className="mt-6 rounded-xl bg-white px-4 py-3 text-xs font-black text-black disabled:opacity-30">New Project</button>
          </div>
        ) : (
          <section className="mt-8">
            <h2 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-white/35">Recent Projects</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => {
              const active = currentProject?.id === project.id;
              return (
                <article key={project.id} className={`rounded-2xl border p-5 transition ${active ? 'border-cyan-300/30 bg-cyan-300/[0.06]' : 'border-white/[0.08] bg-white/[0.025]'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <button type="button" onClick={() => continueProject(project)} disabled={busy} className="min-w-0 flex-1 text-left disabled:opacity-40">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-black/25 text-cyan-200"><FolderOpen size={17} /></div>
                      <h2 className="mt-4 truncate text-sm font-bold">{project.name}</h2>
                      <p className="mt-2 text-[10px] uppercase tracking-wider text-white/25">{project.assetCount} Assets · {project.sceneCount} Scenes</p>
                      <p className="mt-3 text-[10px] text-white/20">Updated {new Date(project.updatedAt).toLocaleString()}</p>
                    </button>
                    <button type="button" onClick={() => openRenameProject(project)} aria-label={`Rename ${project.name}`} className="text-white/25 hover:text-white"><Pencil size={14} /></button>
                  </div>
                  <button type="button" onClick={() => continueProject(project)} disabled={busy} className={`mt-5 flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-[10px] font-black disabled:opacity-35 ${active ? 'bg-cyan-300 text-black' : 'border border-white/[0.09] text-white/55 hover:text-white'}`}>{openingId === project.id ? <LoaderCircle size={14} className="animate-spin" /> : active ? 'Continue Project' : 'Open Project'}</button>
                </article>
              );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
