import React from 'react'

function Settings() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
        
        <div className="space-y-6">
          {/* Account Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input type="text" className="input-field" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input type="email" className="input-field" placeholder="your@email.com" />
              </div>
            </div>
          </div>

          {/* App Preferences */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">App Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Auto-save</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Dark mode</span>
                <input type="checkbox" className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Keyboard shortcuts</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
            </div>
          </div>

          {/* Supabase Configuration */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Storage Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supabase URL
                </label>
                <input type="text" className="input-field" placeholder="https://your-project.supabase.co" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supabase Anon Key
                </label>
                <input type="password" className="input-field" placeholder="Your anon key" />
              </div>
              <button className="btn-primary">Save Configuration</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
