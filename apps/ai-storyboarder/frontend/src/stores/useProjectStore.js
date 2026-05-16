import { create } from 'zustand'
import api from '../services/api'
import { saveGeneratedAsset } from '../../../../../src/lib/assets/assetActions.js'

const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,

  fetchProjects: async () => {
    set({ loading: true })
    try {
      const { data } = await api.getProjects()
      set({ projects: data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchProject: async (id) => {
    try {
      const { data } = await api.getProject(id)
      set({ currentProject: data })
      return data
    } catch {
      return null
    }
  },

  createProject: async (title, genre) => {
    const { data } = await api.createProject({
      title,
      genre: genre || null,
    })
    set((s) => ({ projects: [data, ...s.projects] }))
    return data
  },

  deleteProject: async (id) => {
    await api.deleteProject(id)
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      currentProject: s.currentProject?.id === id ? null : s.currentProject,
    }))
  },

  duplicateProject: async (id) => {
    const { data } = await api.duplicateProject(id)
    set((s) => ({ projects: [data, ...s.projects] }))
    return data
  },

  saveProjectAsAsset: async (project) => {
    const asset = await saveGeneratedAsset('image', {
      title: project.title || 'Storyboard',
      media: {
        url: project.thumbnail || '',
        thumbnail: project.thumbnail || '',
        type: 'image/jpeg'
      },
      metadata: {
        sceneCount: project.scenes?.length || 0,
        genre: project.genre,
        projectId: project.id
      },
      sourceApp: 'ai-storyboarder'
    });
    return asset;
  },

  clearCurrentProject: () => set({ currentProject: null }),
}))

export default useProjectStore