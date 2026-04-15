import React from 'react'

function TestApp() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Remix Go - Video Editor
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <ul className="space-y-2">
            <li>✅ Text Overlay Editor</li>
            <li>✅ AI Script Writer</li>
            <li>✅ Voice Clone & Generation</li>
            <li>✅ Video Upload & Management</li>
            <li>✅ Supabase Integration</li>
            <li>🚧 Advanced Video Editing (Coming Soon)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default TestApp
