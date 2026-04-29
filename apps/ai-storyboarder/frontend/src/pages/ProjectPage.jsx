import { useState } from 'react'
import useUIStore from '../stores/useUIStore'
import useProjectStore from '../stores/useProjectStore'
import ScriptTab from '../components/tabs/ScriptTab'
import ScenesTab from '../components/tabs/ScenesTab'
import ImagesTab from '../components/tabs/ImagesTab'
import AnalysisTab from '../components/tabs/AnalysisTab'
import SettingsTab from '../components/tabs/SettingsTab'

export default function ProjectPage() {
  const { activeTab } = useUIStore()
  const { currentProject } = useProjectStore()

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-surface-400">Loading project...</div>
      </div>
    )
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'script':
        return <ScriptTab />
      case 'scenes':
        return <ScenesTab />
      case 'images':
        return <ImagesTab />
      case 'analysis':
        return <AnalysisTab />
      case 'settings':
        return <SettingsTab />
      default:
        return <ScriptTab />
    }
  }

  return (
    <div className="h-full">
      {renderTab()}
    </div>
  )
}