import React, { useState } from 'react'
import { Image, Video, Workflow, Bot, Settings, Library, Share2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import './App.css'

const modules = [
  { id: 'image', name: 'Image Studio', icon: Image, color: '#6366f1' },
  { id: 'video', name: 'Video Studio', icon: Video, color: '#10b981' },
  { id: 'workflow', name: 'Workflow Studio', icon: Workflow, color: '#f59e0b' },
  { id: 'agents', name: 'Agents Studio', icon: Bot, color: '#ec4899' },
]

function StudioApp() {
  const [activeModule, setActiveModule] = useState(null)

  return (
    <div className="studio-app">
      <Toaster />
      <div className="sidebar">
        <div className="logo">
          <Settings className="logo-icon" />
        </div>
        <div className="modules">
          {modules.map(module => (
            <button
              key={module.id}
              className={`module-btn ${activeModule === module.id ? 'active' : ''}`}
              onClick={() => setActiveModule(module.id)}
              style={{ '--color': module.color }}
            >
              <module.icon className="module-icon" />
              <span className="module-name">{module.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="main">
        <div className="topbar">
          <h1>
            {activeModule 
              ? modules.find(m => m.id === activeModule)?.name 
              : 'Studio Dashboard'
            }
          </h1>
          <button className="share-btn">
            <Share2 /> Share
          </button>
        </div>

        <div className="content">
          {activeModule ? (
            <div className="module-view">
              <h2>{modules.find(m => m.id === activeModule)?.name}</h2>
              <p>
                {activeModule === 'image' && 'Create stunning images with AI'}
                {activeModule === 'video' && 'Produce professional videos with AI'}
                {activeModule === 'workflow' && 'Build powerful workflows'}
                {activeModule === 'agents' && 'Manage your AI agents'}
              </p>
              <div className="placeholder">
                <Settings className="placeholder-icon" />
                <p>Module content coming soon</p>
              </div>
            </div>
          ) : (
            <div className="dashboard">
              <div className="welcome">
                <h2>Welcome to Studio</h2>
                <p>Select a module to get started</p>
              </div>
              <div className="module-cards">
                {modules.map(module => (
                  <button
                    key={module.id}
                    className="module-card"
                    onClick={() => setActiveModule(module.id)}
                    style={{ '--color': module.color }}
                  >
                    <module.icon className="card-icon" />
                    <span>{module.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudioApp