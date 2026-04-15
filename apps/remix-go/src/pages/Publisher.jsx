import React from 'react'

function Publisher() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Publisher</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Social Campaigns */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Social Campaigns</h3>
            <p className="text-gray-600 mb-4">Publish to Facebook, LinkedIn, and more</p>
            <button className="btn-primary w-full">Create Campaign</button>
          </div>

          {/* Email Campaigns */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Email Campaigns</h3>
            <p className="text-gray-600 mb-4">Send personalized email campaigns</p>
            <button className="btn-primary w-full">Create Email</button>
          </div>

          {/* Embed Codes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Embed Codes</h3>
            <p className="text-gray-600 mb-4">Generate embed codes for websites</p>
            <button className="btn-primary w-full">Generate Code</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Publisher
