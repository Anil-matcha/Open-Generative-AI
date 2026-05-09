import { useState, useCallback, useEffect } from 'react';
import { getVideoDBInstance } from '../../lib/videodb/VideoDBService.js';

export function VideoSearchModal({ isOpen, onClose, onImport }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoDetails, setVideoDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchType, setSearchType] = useState('all');
  const [filters, setFilters] = useState({
    duration: null,
    hasTranscript: false,
    sortBy: 'relevance'
  });

  const videoDB = getVideoDBInstance();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSelectedVideo(null);

    try {
      let searchResults;
      if (searchType === 'all') {
        searchResults = await videoDB.searchVideos(query, {
          limit: 20,
          params: { sort: filters.sortBy }
        });
      } else if (searchType === 'collection') {
        searchResults = await videoDB.getCollections();
      } else {
        searchResults = await videoDB.searchVideos(query, {
          limit: 20,
          params: { type: searchType }
        });
      }
      setResults(searchResults.videos || searchResults || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, searchType, filters.sortBy]);

  const handleVideoSelect = useCallback(async (video) => {
    setSelectedVideo(video);
    setLoadingDetails(true);

    try {
      const details = await videoDB.getVideo(video.id || video.video_id);
      setVideoDetails(details);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  const handleImport = useCallback((video) => {
    if (onImport) {
      onImport({
        videoId: video.id || video.video_id,
        url: video.url || video.video_url,
        title: video.title,
        duration: video.duration,
        thumbnail: video.thumbnail_url
      });
    }
    onClose();
  }, [onImport, onClose]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl border border-white/10 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Search VideoDB</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 border-b border-white/10 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search videos..."
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-cyan-400 text-slate-900 rounded-xl font-medium hover:bg-cyan-300 transition disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {['all', 'collection', 'trending'].map(type => (
              <button
                key={type}
                onClick={() => setSearchType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  searchType === type
                    ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map(video => (
                <div
                  key={video.id || video.video_id}
                  onClick={() => handleVideoSelect(video)}
                  className={`group cursor-pointer rounded-xl overflow-hidden border transition ${
                    selectedVideo?.id === video.id || selectedVideo?.video_id === video.video_id
                      ? 'border-cyan-400 ring-2 ring-cyan-400/20'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="aspect-video bg-slate-800 relative">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
                        {formatDuration(video.duration)}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-white truncate">
                      {video.title || 'Untitled'}
                    </h3>
                    {video.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {video.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p>Search for videos or browse collections</p>
            </div>
          )}
        </div>

        {selectedVideo && (
          <div className="p-6 border-t border-white/10 bg-slate-800/50">
            {loadingDetails ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : videoDetails ? (
              <div className="flex gap-4">
                <div className="w-32 h-24 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                  {videoDetails.thumbnail_url ? (
                    <img
                      src={videoDetails.thumbnail_url}
                      alt={videoDetails.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {videoDetails.title || 'Untitled'}
                  </h3>
                  <div className="flex gap-4 mt-2 text-sm text-slate-400">
                    {videoDetails.duration && (
                      <span>Duration: {formatDuration(videoDetails.duration)}</span>
                    )}
                    {videoDetails.view_count && (
                      <span>{videoDetails.view_count.toLocaleString()} views</span>
                    )}
                  </div>
                  {videoDetails.description && (
                    <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                      {videoDetails.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleImport(selectedVideo)}
                  className="px-6 py-3 bg-cyan-400 text-slate-900 rounded-xl font-medium hover:bg-cyan-300 transition self-center"
                >
                  Import to Timeline
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export function VideoSearchPanel({ onImport, apiKey }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [error, setError] = useState(null);

  const videoDB = getVideoDBInstance();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const searchResults = await videoDB.searchVideos(query, { limit: 12 });
      setResults(searchResults.videos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const toggleVideoSelection = useCallback((video) => {
    setSelectedVideos(prev => {
      const exists = prev.some(v => (v.id || v.video_id) === (video.id || video.video_id));
      if (exists) {
        return prev.filter(v => (v.id || v.video_id) !== (video.id || video.video_id));
      }
      return [...prev, video];
    });
  }, []);

  const handleImportSelected = useCallback(() => {
    if (onImport && selectedVideos.length > 0) {
      selectedVideos.forEach(video => {
        onImport({
          videoId: video.id || video.video_id,
          url: video.url || video.video_url,
          title: video.title,
          duration: video.duration,
          thumbnail: video.thumbnail_url
        });
      });
      setSelectedVideos([]);
    }
  }, [onImport, selectedVideos]);

  return (
    <div className={`fixed right-0 top-16 bottom-0 w-80 bg-slate-900 border-l border-white/10 transition-transform transform ${isExpanded ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">VideoDB Search</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-white/10 rounded transition"
        >
          <svg className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search videos..."
            className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400/50"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="w-full px-4 py-2 bg-cyan-400 text-slate-900 rounded-lg text-sm font-medium hover:bg-cyan-300 transition disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{results.length} results</span>
              {selectedVideos.length > 0 && (
                <button
                  onClick={handleImportSelected}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  Import {selectedVideos.length} selected
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {results.map(video => {
                const isSelected = selectedVideos.some(v => (v.id || v.video_id) === (video.id || video.video_id));
                return (
                  <div
                    key={video.id || video.video_id}
                    onClick={() => toggleVideoSelection(video)}
                    className={`p-2 rounded-lg border cursor-pointer transition ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-400/10'
                        : 'border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex gap-2">
                      <div className="w-16 h-12 rounded bg-slate-800 overflow-hidden flex-shrink-0">
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm text-white truncate">{video.title || 'Untitled'}</h4>
                        {video.duration && (
                          <span className="text-xs text-slate-500">{formatDuration(video.duration)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDuration(seconds) {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default VideoSearchModal;
