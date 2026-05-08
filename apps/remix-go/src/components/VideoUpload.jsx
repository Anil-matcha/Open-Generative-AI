import React, { useState, useCallback } from 'react';
import { observer } from 'mobx-react';
import { Upload, X, FileVideo, FileImage, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { uploadMedia } from '../lib/supabase';

const VideoUpload = observer(({ onVideoUploaded, onClose, className = '' }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    // Validate file type
    const validVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime'];
    if (!validVideoTypes.includes(file.type)) {
      setError('Please select a valid video file (MP4, MOV, AVI, WebM)');
      return;
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      setError('File size must be less than 500MB');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadMedia(file, 'video');

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Create video object
      const videoData = {
        id: Date.now().toString(),
        title: file.name,
        url: result.url,
        path: result.path,
        duration: '0:00', // Would be calculated from actual video
        thumbnail: result.url.replace(/\.[^/.]+$/, '.jpg'), // Placeholder thumbnail
        size: file.size,
        type: file.type,
        uploadedAt: result.uploadedAt
      };

      // Delay to show completion
      setTimeout(() => {
        onVideoUploaded && onVideoUploaded(videoData, null);
        onClose && onClose();
      }, 500);

    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onVideoUploaded, onClose]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv']
    },
    multiple: false,
    disabled: isUploading
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`video-upload ${className}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Upload Video</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-secondary/10'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        >
          <input {...getInputProps()} />

          {isUploading ? (
            <div className="space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <div>
                <p className="text-lg text-foreground mb-2">Uploading video...</p>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted mt-2">{uploadProgress}% complete</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <FileVideo className="w-8 h-8 text-primary" />
              </div>

              <div>
                <p className="text-xl text-foreground mb-2">
                  {isDragActive ? 'Drop your video here' : 'Upload a video file'}
                </p>
                <p className="text-muted mb-4">
                  Drag and drop or click to browse
                </p>
                <div className="text-sm text-muted space-y-1">
                  <p>Supported formats: MP4, MOV, AVI, WebM, MKV</p>
                  <p>Maximum file size: 500MB</p>
                </div>
              </div>

              <button
                type="button"
                className="btn-primary inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Choose File
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Upload Tips
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Videos are stored securely in Supabase Storage</li>
            <li>• Files are processed automatically for optimal playback</li>
            <li>• You can reuse uploaded videos in multiple projects</li>
            <li>• Large files may take longer to upload</li>
          </ul>
        </div>
      </div>
    </div>
  );
});

export default VideoUpload;