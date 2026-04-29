import { Sparkles, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import useProjectStore from '../../stores/useProjectStore'

export default function Header() {
  const currentProject = useProjectStore((s) => s.currentProject)
  const projectTitle = currentProject?.title || null

  return (
    <header className="h-12 bg-surface-850 border-b border-surface-700 flex items-center px-4 shrink-0 z-50 relative">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-7 h-7 rounded bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-500/20 group-hover:shadow-accent-500/40 transition-shadow">
          <Sparkles className="w-4 h-4 text-surface-900" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-bold tracking-tight text-zinc-100 group-hover:text-accent-400 transition-colors">
          AI Storyboarder
        </span>
      </Link>

      {/* Breadcrumb — project name */}
      {projectTitle && (
        <div className="flex items-center ml-4 gap-2">
          <ChevronRight className="w-3.5 h-3.5 text-surface-500" />
          <span className="text-sm text-zinc-400 font-medium truncate max-w-[300px]">
            {projectTitle}
          </span>
        </div>
      )}

      {/* Right side — subtle version badge */}
      <div className="ml-auto flex items-center gap-3">
        <span className="text-[10px] font-mono text-surface-500 uppercase tracking-widest">
          v0.1
        </span>
        <div className="w-2 h-2 rounded-full bg-film-green animate-pulse" title="Backend connected" />
      </div>
    </header>
  )
}