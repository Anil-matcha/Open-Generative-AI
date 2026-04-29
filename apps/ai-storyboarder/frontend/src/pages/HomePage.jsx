import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Copy, Trash2, Film } from 'lucide-react'
import useProjectStore from '../stores/useProjectStore'

export default function HomePage() {
  const { projects, loading, fetchProjects, deleteProject, duplicateProject } = useProjectStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [newProjectGenre, setNewProjectGenre] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!newProjectTitle.trim()) return

    await useProjectStore.getState().createProject(newProjectTitle.trim(), newProjectGenre.trim())
    setNewProjectTitle('')
    setNewProjectGenre('')
    setShowCreateModal(false)
  }

  const handleDeleteProject = async (projectId, e) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this project?')) {
      await deleteProject(projectId)
    }
  }

  const handleDuplicateProject = async (projectId, e) => {
    e.preventDefault()
    e.stopPropagation()
    await duplicateProject(projectId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-surface-400">Loading projects...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">AI Storyboarder</h1>
            <p className="text-surface-400">Create professional film storyboards with AI assistance</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-accent-500 text-surface-900 rounded-lg font-medium hover:bg-accent-400 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <Film className="w-16 h-16 text-surface-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No projects yet</h2>
            <p className="text-surface-400 mb-6">Create your first storyboard project to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-accent-500 text-surface-900 rounded-lg font-medium hover:bg-accent-400 transition-colors"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="group bg-surface-800 rounded-lg border border-surface-700 hover:border-accent-500 transition-all duration-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-accent-400 transition-colors mb-1">
                      {project.title}
                    </h3>
                    {project.genre && (
                      <span className="text-sm text-surface-400">{project.genre}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDuplicateProject(project.id, e)}
                      className="p-1 text-surface-400 hover:text-accent-400 transition-colors"
                      title="Duplicate project"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="p-1 text-surface-400 hover:text-red-400 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-surface-400">
                  <span>{project.scene_count || 0} scenes</span>
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-surface-800 rounded-lg border border-surface-700 p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold text-white mb-4">Create New Project</h2>
              <form onSubmit={handleCreateProject}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-1">
                      Project Title
                    </label>
                    <input
                      type="text"
                      value={newProjectTitle}
                      onChange={(e) => setNewProjectTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-900 border border-surface-600 rounded-lg text-white placeholder-surface-500 focus:border-accent-500 focus:outline-none"
                      placeholder="Enter project title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-1">
                      Genre (Optional)
                    </label>
                    <input
                      type="text"
                      value={newProjectGenre}
                      onChange={(e) => setNewProjectGenre(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-900 border border-surface-600 rounded-lg text-white placeholder-surface-500 focus:border-accent-500 focus:outline-none"
                      placeholder="e.g., Action, Drama, Comedy"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-surface-700 text-surface-300 rounded-lg hover:bg-surface-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-accent-500 text-surface-900 rounded-lg font-medium hover:bg-accent-400 transition-colors"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}