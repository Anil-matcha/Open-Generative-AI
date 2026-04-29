import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import MainCanvas from './components/layout/MainCanvas'
import HomePage from './pages/HomePage'
import ProjectPage from './pages/ProjectPage'
import useProjectStore from './stores/useProjectStore'
import useUIStore from './stores/useUIStore'

function ProjectShell() {
  const { id } = useParams()
  const fetchProject = useProjectStore((s) => s.fetchProject)
  const setActiveTab = useUIStore((s) => s.setActiveTab)

  // Reset to script tab and load project when navigating to a new project
  useEffect(() => {
    setActiveTab('script')
    fetchProject(id)
  }, [id])

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainCanvas>
          <ProjectPage />
        </MainCanvas>
      </div>
    </div>
  )
}

function HomeShell() {
  const clearCurrentProject = useProjectStore((s) => s.clearCurrentProject)

  useEffect(() => {
    clearCurrentProject()
  }, [])

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainCanvas>
          <HomePage />
        </MainCanvas>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeShell />} />
        <Route path="/project/:id" element={<ProjectShell />} />
      </Routes>
    </BrowserRouter>
  )
}