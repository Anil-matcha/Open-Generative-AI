import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Edit3, 
  Send, 
  Settings, 
  Video, 
  Image, 
  Type, 
  Mic, 
  User,
  Zap,
  FileText,
  Camera,
  Music,
  Upload
} from 'lucide-react'

const navigation = [
  { name: 'Editor', href: '/editor', icon: Edit3, current: true },
  { name: 'Publisher', href: '/publisher', icon: Send, current: false },
  { name: 'Settings', href: '/settings', icon: Settings, current: false },
]

const tools = [
  { name: 'Video Upload', icon: Upload, action: 'videoUpload' },
  { name: 'Text Overlay', icon: Type, action: 'textOverlay' },
  { name: 'Image Editor', icon: Image, action: 'imageEditor' },
  { name: 'Voice Clone', icon: Mic, action: 'voiceClone' },
  { name: 'Avatar Gen', icon: User, action: 'avatarGenerator' },
  { name: 'Script Writer', icon: FileText, action: 'scriptWriter' },
  { name: 'Dynamic BG', icon: Camera, action: 'dynamicBackground' },
  { name: 'AI Generate', icon: Zap, action: 'aiGenerate' },
  { name: 'Teleprompter', icon: Video, action: 'teleprompter' },
  { name: 'Audio Mixer', icon: Music, action: 'audioMixer' },
]

function Sidebar({ isOpen, onClose }) {
  const location = useLocation()

  const handleToolClick = (action) => {
    // Dispatch custom event for tool actions
    window.dispatchEvent(new CustomEvent('remixGoTool', { detail: { action } }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={onClose}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Tools */}
      <div className="border-t border-gray-200 px-4 py-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Tools
        </h3>
        <div className="space-y-1">
          {tools.map((tool) => (
            <button
              key={tool.name}
              onClick={() => handleToolClick(tool.action)}
              className="w-full group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <tool.icon className="mr-3 h-4 w-4" />
              {tool.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Sidebar
