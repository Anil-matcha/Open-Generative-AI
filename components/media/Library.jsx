import React, { useState, useEffect } from 'react';
import LibraryContent from '../common/library/LibraryContent';
import ProviderList from '../common/library/ProviderList';
import { useMediaStore } from '../../hooks/useMediaStore';

const Library = ({ onAssetSelect, selectedType = 'all' }) => {
  const [activeProvider, setActiveProvider] = useState('local');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const {
    assets,
    providers,
    isLoading,
    loadAssets,
    searchAssets,
    uploadAsset
  } = useMediaStore();

  useEffect(() => {
    loadAssets(activeProvider);
  }, [activeProvider]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term) {
      searchAssets(term, activeProvider);
    } else {
      loadAssets(activeProvider);
    }
  };

  const handleAssetSelect = (asset) => {
    onAssetSelect?.(asset);
  };

  const handleUpload = async (files) => {
    for (const file of files) {
      await uploadAsset(file, activeProvider);
    }
    loadAssets(activeProvider);
  };

  const categories = [
    { id: 'all', name: 'All Assets', count: assets.length },
    { id: 'images', name: 'Images', count: assets.filter(a => a.type === 'image').length },
    { id: 'videos', name: 'Videos', count: assets.filter(a => a.type === 'video').length },
    { id: 'audio', name: 'Audio', count: assets.filter(a => a.type === 'audio').length },
    { id: 'documents', name: 'Documents', count: assets.filter(a => a.type === 'document').length }
  ];

  const filteredAssets = assets.filter(asset => {
    const matchesCategory = selectedCategory === 'all' || asset.type === selectedCategory;
    const matchesType = selectedType === 'all' || asset.type === selectedType;
    return matchesCategory && matchesType;
  });

  return (
    <div className="media-library">
      <div className="library-header">
        <div className="library-title">
          <h2>Media Library</h2>
          <span className="asset-count">{filteredAssets.length} assets</span>
        </div>

        <div className="library-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <button className="search-btn">🔍</button>
          </div>

          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ⊞
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              ☰
            </button>
          </div>

          <div className="upload-btn">
            <input
              type="file"
              multiple
              onChange={(e) => handleUpload(Array.from(e.target.files))}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload" className="upload-label">
              📤 Upload
            </label>
          </div>
        </div>
      </div>

      <div className="library-body">
        <div className="library-sidebar">
          <ProviderList
            providers={providers}
            activeProvider={activeProvider}
            onProviderChange={setActiveProvider}
          />

          <div className="category-filter">
            <h3>Categories</h3>
            <div className="category-list">
              {categories.map(category => (
                <div
                  key={category.id}
                  className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="category-name">{category.name}</span>
                  <span className="category-count">({category.count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="library-content">
          <LibraryContent
            assets={filteredAssets}
            viewMode={viewMode}
            isLoading={isLoading}
            onAssetSelect={handleAssetSelect}
            onAssetDelete={(assetId) => {
              // Handle asset deletion
              console.log('Delete asset:', assetId);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Library;