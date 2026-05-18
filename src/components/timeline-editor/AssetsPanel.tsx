import React, { useState } from 'react'
import { Plus, Upload, Search, Video, Image, Music, FileText } from 'lucide-react'
import { TooltipWrapper } from './TooltipWrapper'
import type { Asset } from '../lib/timeline-editor/types'

interface AssetsPanelProps {
  assets: Asset[]
  onAddAsset: (asset: Asset) => void
  onImportMedia: () => void
  onGenerateMedia: () => void
}

export function AssetsPanel({ assets, onAddAsset, onImportMedia, onGenerateMedia }: AssetsPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'image' | 'audio' | 'text'>('all')

  const filteredAssets = assets.filter(_asset => {
    const matchesSearch = _asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          _asset.prompt?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === 'all' || _asset.type === activeTab
    return matchesSearch && matchesTab
  })

  const getAssetIcon = (type: Asset['type']) => {
    switch (type) {
      case 'video': return Video
      case 'image': return Image
      case 'audio': return Music
      case 'text': return FileText
      default: return Video
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white border-l border-slate-700">
      <div className="p-3 border-b border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm">Media Library</h2>
          <div className="flex items-center gap-1">
            <TooltipWrapper content="Import media from files">
              <button
                onClick={onImportMedia}
                className="p-1.5 rounded hover:bg-slate-800"
              >
                <Upload className="h-4 w-4" />
              </button>
            </TooltipWrapper>
            <TooltipWrapper content="Generate new media with AI">
              <button
                onClick={onGenerateMedia}
                className="p-1.5 rounded hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
              </button>
            </TooltipWrapper>
          </div>
        </div>

        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-slate-600"
          />
        </div>

        <div className="flex items-center gap-1 text-xs">
          {(['all', 'video', 'image', 'audio', 'text'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-1 rounded ${
                activeTab === tab
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {filteredAssets.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No assets found</p>
            <p className="text-xs mt-1">Import or generate media to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredAssets.map(asset => {
              const Icon = getAssetIcon(asset.type)
              return (
                <TooltipWrapper key={asset.id} content={asset.name} position="bottom">
                  <div
                    className="aspect-video bg-slate-700 rounded overflow-hidden cursor-pointer hover:bg-slate-600 transition-colors"
                    onClick={() => onAddAsset(asset)}
                  >
                    {asset.thumbnail ? (
                      <img
                        src={asset.thumbnail}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon className="h-6 w-6 text-slate-400" />
                      </div>
                    )}
                  </div>
                </TooltipWrapper>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}