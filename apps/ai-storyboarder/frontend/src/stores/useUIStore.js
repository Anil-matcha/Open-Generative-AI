import { create } from 'zustand'

const useUIStore = create((set) => ({
  activeTab: 'script',
  sidebarOpen: true,
  theme: 'dark',

  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}))

export default useUIStore