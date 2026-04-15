import React from 'react'
import { Menu, Settings, User } from 'lucide-react'

function Header({ onMenuClick, sidebarOpen }) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">RG</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Remix Go</h1>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <User className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}

export default Header
