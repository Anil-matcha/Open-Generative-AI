import React, { useState, useEffect } from 'react';
import TextToSpeechItem from './TextToSpeechItem';
import TextToSpeechContent from './TextToSpeechContent';
import { useVoiceStore } from '../../hooks/useVoiceStore';

const TextToSpeechLibrary = () => {
  const [view, setView] = useState('library'); // 'library' or 'generator'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('all');
  const { generatedItems, deleteItem, voices } = useVoiceStore();

  const filteredItems = generatedItems.filter(item => {
    const matchesSearch = item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVoice = selectedVoice === 'all' || item.voice?.id === selectedVoice;
    return matchesSearch && matchesVoice;
  });

  const handleVoiceGenerated = (audioUrl, text) => {
    // The voice store will handle adding the new item
    setView('library');
  };

  const handleDelete = (itemId) => {
    if (window.confirm('Are you sure you want to delete this speech item?')) {
      deleteItem(itemId);
    }
  };

  const handleEdit = (item) => {
    // Open edit modal or navigate to editor
    console.log('Edit item:', item);
  };

  return (
    <div className="text-to-speech-library">
      <div className="tts-library-header">
        <div className="tts-nav">
          <button
            className={`nav-btn ${view === 'library' ? 'active' : ''}`}
            onClick={() => setView('library')}
          >
            Voice Library
          </button>
          <button
            className={`nav-btn ${view === 'generator' ? 'active' : ''}`}
            onClick={() => setView('generator')}
          >
            Generate Voice
          </button>
        </div>
      </div>

      {view === 'generator' ? (
        <TextToSpeechContent
          onVoiceGenerated={handleVoiceGenerated}
          onClose={() => setView('library')}
        />
      ) : (
        <div className="tts-library-content">
          <div className="tts-filters">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search speeches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="voice-filter">
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
              >
                <option value="all">All Voices</option>
                {voices.map(voice => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="tts-items-grid">
            {filteredItems.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎤</div>
                <h3>No voice content yet</h3>
                <p>Create your first AI voice by clicking "Generate Voice"</p>
                <button
                  onClick={() => setView('generator')}
                  className="create-first-btn"
                >
                  Generate Your First Voice
                </button>
              </div>
            ) : (
              filteredItems.map(item => (
                <TextToSpeechItem
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))
            )}
          </div>

          {filteredItems.length > 0 && (
            <div className="tts-stats">
              <span>{filteredItems.length} voice items</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TextToSpeechLibrary;