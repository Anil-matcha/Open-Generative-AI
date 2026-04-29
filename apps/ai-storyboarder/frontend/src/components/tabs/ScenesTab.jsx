import { useState, useEffect } from 'react'
import { Camera, Wand2, Eye } from 'lucide-react'
import useProjectStore from '../../stores/useProjectStore'
import api from '../../services/api'

export default function ScenesTab() {
  const { currentProject } = useProjectStore()
  const [scenes, setScenes] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentProject?.id) {
      loadScenes()
    }
  }, [currentProject?.id])

  const loadScenes = async () => {
    try {
      const data = await api.getScenes(currentProject.id)
      setScenes(data)
    } catch (error) {
      console.error('Failed to load scenes:', error)
    }
  }

  const handleGenerateImage = async (sceneId) => {
    setLoading(true)
    try {
      await api.generateSceneImage(sceneId)
      await loadScenes() // Reload to see updated image
    } catch (error) {
      console.error('Failed to generate image:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Storyboard Scenes</h2>
          <p className="text-surface-400">Review and generate images for your script scenes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenes.map((scene) => (
            <div key={scene.id} className="bg-surface-800 rounded-lg border border-surface-700 p-4">
              <div className="mb-3">
                <h3 className="font-semibold text-white mb-1">
                  Scene {scene.scene_number}: {scene.title}
                </h3>
                <p className="text-sm text-surface-400 mb-2">{scene.location} - {scene.time_of_day}</p>
                <p className="text-sm text-surface-300 line-clamp-3">{scene.description}</p>
              </div>

              {scene.frame_image_path ? (
                <div className="mb-3">
                  <img
                    src={scene.frame_image_path}
                    alt={`Scene ${scene.scene_number}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              ) : (
                <div className="mb-3 h-32 bg-surface-900 rounded-lg flex items-center justify-center">
                  <Camera className="w-8 h-8 text-surface-500" />
                </div>
              )}

              <button
                onClick={() => handleGenerateImage(scene.id)}
                disabled={loading}
                className="w-full px-3 py-2 bg-accent-500 text-surface-900 rounded-lg font-medium hover:bg-accent-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Wand2 className="w-4 h-4" />
                Generate Image
              </button>
            </div>
          ))}
        </div>

        {scenes.length === 0 && (
          <div className="text-center py-16">
            <Camera className="w-16 h-16 text-surface-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No scenes yet</h3>
            <p className="text-surface-400">Upload a script in the Script tab to generate scenes</p>
          </div>
        )}
      </div>
    </div>
  )
}