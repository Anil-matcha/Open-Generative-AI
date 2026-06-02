import { useState, useEffect } from 'react';
import axios from 'axios';

export default function GalleryStudio({ apiKey }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState('all');

  useEffect(() => {
    fetchGallery();
  }, [apiKey]);

  const fetchGallery = async (type = 'all') => {
    setLoading(true);
    try {
      const url = type === 'all' ? '/api/gallery' : `/api/gallery?type=${type}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      setEntries(response.data.entries || []);
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type) => {
    setActiveType(type);
    fetchGallery(type);
  };

  const handleDelete = async (entryId) => {
    try {
      await axios.delete(`/api/gallery/${entryId}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      setEntries(entries.filter(e => e.id !== entryId));
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  const getIcon = (type) => {
    const icons = {
      image: '🖼️',
      video: '🎥',
      audio: '🎵',
      text: '📝'
    };
    return icons[type] || '📦';
  };

  return (
    <div className="w-full h-full bg-[#050505] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 h-16 border-b border-white/10 flex items-center px-6 gap-4">
        <h1 className="text-lg font-bold text-white">Галерея</h1>
        <div className="flex gap-2 ml-auto">
          {['all', 'image', 'video', 'audio', 'text'].map(type => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeType === type
                  ? 'bg-[#22d3ee] text-black'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {type === 'all' ? 'Все' : type === 'image' ? 'Фото' : type === 'video' ? 'Видео' : type === 'audio' ? 'Звук' : 'Текст'}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/40">Загрузка...</div>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/40">
            Галерея пуста
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {entries.map(entry => (
              <div
                key={entry.id}
                className="group relative bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-[#22d3ee]/50 transition-all aspect-square"
              >
                {/* Thumbnail */}
                {entry.type === 'image' && (
                  <img
                    src={entry.url}
                    alt={entry.model}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                )}
                {entry.type === 'video' && (
                  <video
                    src={entry.url}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                )}
                {(entry.type === 'audio' || entry.type === 'text') && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                    <div className="text-4xl mb-2">{getIcon(entry.type)}</div>
                    <div className="text-xs text-white/60 truncate">{entry.model}</div>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3">
                  <div className="text-xs text-white/80 font-medium mb-2 truncate w-full text-center">
                    {entry.model}
                  </div>
                  {entry.prompt && (
                    <div className="text-[10px] text-white/50 mb-3 line-clamp-3 text-center">
                      {entry.prompt}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-[#22d3ee] text-black text-[10px] font-bold rounded hover:bg-white transition-colors"
                    >
                      Открыть
                    </a>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="px-3 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold rounded hover:bg-red-500/40 transition-colors"
                    >
                      Удалить
                    </button>
                  </div>
                </div>

                {/* Type Badge */}
                <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white/80">
                  {getIcon(entry.type)}
                </div>

                {/* Date */}
                <div className="absolute bottom-2 left-2 text-[9px] text-white/50">
                  {new Date(entry.created_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
