import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Search, Upload, Play, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useProjectStore } from '../../stores/StoreProvider';

const VideoSelectionWorkspace = observer(({ onVideoSelected }) => {
  const projectStore = useProjectStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isUploading, setIsUploading] = useState(false);

  // Mock video data - in real implementation this would come from API
  const [videos] = useState([
    {
      id: '1',
      title: 'Product Demo Video',
      thumbnail: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Product+Demo',
      duration: '2:30',
      category: 'product',
      tags: ['demo', 'product', 'sales'],
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' // Sample video
    },
    {
      id: '2',
      title: 'Customer Testimonial',
      thumbnail: 'https://via.placeholder.com/300x200/059669/ffffff?text=Testimonial',
      duration: '1:45',
      category: 'testimonial',
      tags: ['customer', 'testimonial', 'review'],
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' // Sample video
    },
    {
      id: '3',
      title: 'Company Overview',
      thumbnail: 'https://via.placeholder.com/300x200/dc2626/ffffff?text=Overview',
      duration: '3:15',
      category: 'corporate',
      tags: ['company', 'overview', 'corporate'],
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' // Sample video
    },
    {
      id: '4',
      title: 'Tutorial Video',
      thumbnail: 'https://via.placeholder.com/300x200/7c3aed/ffffff?text=Tutorial',
      duration: '5:20',
      category: 'education',
      tags: ['tutorial', 'how-to', 'education'],
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' // Sample video
    }
  ]);

  const categories = [
    { id: 'all', label: 'All Videos' },
    { id: 'product', label: 'Product Demos' },
    { id: 'testimonial', label: 'Testimonials' },
    { id: 'corporate', label: 'Corporate' },
    { id: 'education', label: 'Educational' },
    { id: 'marketing', label: 'Marketing' }
  ];

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    try {
      // In real implementation, upload to API
      const file = acceptedFiles[0];
      const mockVideoData = {
        id: Date.now().toString(),
        title: file.name,
        url: URL.createObjectURL(file),
        duration: '0:00', // Would be calculated from file
        thumbnail: 'https://via.placeholder.com/300x200/6b7280/ffffff?text=Uploaded'
      };

      onVideoSelected && onVideoSelected(mockVideoData);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.webm']
    },
    multiple: false
  });

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="video-selection-workspace">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-foreground mb-6">Select a Video</h2>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field w-48"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`glass-card p-8 mb-6 cursor-pointer transition-all duration-200 ${
            isDragActive ? 'ring-2 ring-primary ring-opacity-50' : ''
          }`}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <Upload className="w-12 h-12 text-muted mx-auto mb-4" />
            {isUploading ? (
              <div>
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-muted">Uploading video...</p>
              </div>
            ) : (
              <>
                <p className="text-lg text-foreground mb-2">
                  {isDragActive ? 'Drop your video here' : 'Drag & drop a video file here'}
                </p>
                <p className="text-muted text-sm">
                  or click to browse (MP4, MOV, AVI, WebM)
                </p>
              </>
            )}
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => onVideoSelected && onVideoSelected(video)}
              className="glass-card cursor-pointer hover:shadow-glass-sm transition-all duration-200 group"
            >
              <div className="relative aspect-video mb-3 overflow-hidden rounded-lg">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {video.duration}
                </div>
              </div>

              <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {video.title}
              </h3>

              <div className="flex flex-wrap gap-1">
                {video.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-secondary text-muted px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <X className="w-16 h-16 text-muted opacity-50 mx-auto mb-4" />
            <p className="text-muted">No videos found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default VideoSelectionWorkspace;