import { useState, useEffect } from 'react'
import { FileText, Wand2, Loader } from 'lucide-react'
import useProjectStore from '../../stores/useProjectStore'
import api from '../../services/api'

export default function ScriptTab() {
  const { currentProject } = useProjectStore()
  const [scripts, setScripts] = useState([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [newScriptText, setNewScriptText] = useState('')
  const [selectedGenre, setSelectedGenre] = useState(currentProject?.genre || '')

  useEffect(() => {
    if (currentProject?.id) {
      loadScripts()
    }
  }, [currentProject?.id])

  const loadScripts = async () => {
    try {
      const data = await api.getScripts(currentProject.id)
      setScripts(data)
    } catch (error) {
      console.error('Failed to load scripts:', error)
    }
  }

  const handleAnalyzeScript = async () => {
    if (!newScriptText.trim()) return

    setAnalyzing(true)
    try {
      const result = await api.analyzeScript(newScriptText, selectedGenre)
      // The backend will create scenes automatically after analysis
      await loadScripts() // Reload to see new script
      setNewScriptText('')
    } catch (error) {
      console.error('Failed to analyze script:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleCreateScript = async () => {
    if (!newScriptText.trim()) return

    setLoading(true)
    try {
      await api.createScript({
        project_id: currentProject.id,
        title: `Script ${scripts.length + 1}`,
        raw_text: newScriptText,
        genre: selectedGenre || null
      })
      await loadScripts()
      setNewScriptText('')
    } catch (error) {
      console.error('Failed to create script:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Script Analysis</h2>
          <p className="text-surface-400">Upload or paste your script to automatically generate storyboard scenes</p>
        </div>

        {/* Script Input */}
        <div className="bg-surface-800 rounded-lg border border-surface-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-accent-400" />
            <h3 className="text-lg font-semibold text-white">Script Input</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Genre (Optional)
              </label>
              <input
                type="text"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full px-3 py-2 bg-surface-900 border border-surface-600 rounded-lg text-white placeholder-surface-500 focus:border-accent-500 focus:outline-none"
                placeholder="e.g., Action, Drama, Comedy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Script Text
              </label>
              <textarea
                value={newScriptText}
                onChange={(e) => setNewScriptText(e.target.value)}
                className="w-full h-64 px-3 py-2 bg-surface-900 border border-surface-600 rounded-lg text-white placeholder-surface-500 focus:border-accent-500 focus:outline-none resize-none"
                placeholder="Paste your script here..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateScript}
                disabled={loading || !newScriptText.trim()}
                className="px-4 py-2 bg-surface-600 text-white rounded-lg hover:bg-surface-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                Save Script
              </button>

              <button
                onClick={handleAnalyzeScript}
                disabled={analyzing || !newScriptText.trim()}
                className="px-4 py-2 bg-accent-500 text-surface-900 rounded-lg font-medium hover:bg-accent-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {analyzing && <Loader className="w-4 h-4 animate-spin" />}
                <Wand2 className="w-4 h-4" />
                Analyze & Generate Scenes
              </button>
            </div>
          </div>
        </div>

        {/* Existing Scripts */}
        {scripts.length > 0 && (
          <div className="bg-surface-800 rounded-lg border border-surface-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Existing Scripts</h3>
            <div className="space-y-3">
              {scripts.map((script) => (
                <div key={script.id} className="bg-surface-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{script.title}</h4>
                    <span className="text-sm text-surface-400">
                      {new Date(script.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-surface-400 text-sm line-clamp-2">
                    {script.raw_text.substring(0, 200)}...
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}