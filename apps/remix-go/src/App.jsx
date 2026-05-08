import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { observer } from 'mobx-react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import GettingStarted from './pages/GettingStarted'
import Editor from './pages/Editor'
import Publisher from './pages/Publisher'
import Settings from './pages/Settings'
import { ModalProvider } from './components/ModalProvider'
import { StoreProvider, useStore } from './stores/StoreProvider'
import './App.css'

const AppContent = observer(() => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const store = useStore()

  useEffect(() => {
    // Initialize the app when it loads
    store.initialize()
  }, [store])

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <Routes>
            <Route path="/" element={<GettingStarted />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/publisher" element={<Publisher />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  )
})

function App() {
  return (
    <StoreProvider>
      <ModalProvider>
        <Router>
          <AppContent />
        </Router>
      </ModalProvider>
    </StoreProvider>
  )
}

export default App
