import { useState } from 'react'
import { Script, Camera, Image, BarChart3, Settings } from 'lucide-react'
import useUIStore from '../../../stores/useUIStore'

const tabs = [
  { id: 'script', label: 'Script', icon: Script },
  { id: 'scenes', label: 'Scenes', icon: Camera },
  { id: 'images', label: 'Images', icon: Image },
  { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const { activeTab, setActiveTab } = useUIStore()

  return (
    <div className="w-16 bg-surface-900 border-r border-surface-700 flex flex-col items-center py-4 gap-2">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200
              ${isActive
                ? 'bg-accent-500 text-surface-900 shadow-lg shadow-accent-500/25'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
              }
            `}
            title={tab.label}
          >
            <Icon className="w-5 h-5" />
          </button>
        )
      })}
    </div>
  )
}