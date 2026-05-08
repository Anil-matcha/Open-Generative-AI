import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Paper, Avatar } from '@material-ui/core';
import { Image, Videocam, Audiotrack, Description } from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  preview: {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    maxWidth: 300,
    boxShadow: theme.shadows[8],
    border: '2px solid #fff',
  },
  previewContent: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: theme.shape.borderRadius,
    objectFit: 'cover',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  fileIcon: {
    width: 60,
    height: 60,
    backgroundColor: theme.palette.primary.main,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.shape.borderRadius,
  },
  fileInfo: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: theme.spacing(0.5),
  },
  fileDetails: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  fileSize: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  multipleFiles: {
    backgroundColor: theme.palette.secondary.main,
    color: '#fff',
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 500,
  },
}));

/**
 * Get appropriate icon for file type
 * @param {string} category - File category ('image', 'video', 'audio')
 * @returns {React.Component} Material-UI icon component
 */
const getFileIcon = (category) => {
  switch (category) {
    case 'image':
      return Image;
    case 'video':
      return Videocam;
    case 'audio':
      return Audiotrack;
    default:
      return Description;
  }
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * AssetPreview component - Shows preview of dragged files
 * @param {Object} props - Component props
 * @param {Object} props.preview - Preview data from drag state
 * @param {Array} props.files - Array of dragged files
 * @param {Object} props.position - Current mouse position {x, y}
 * @param {boolean} props.isVisible - Whether preview should be shown
 */
const AssetPreview = ({
  preview,
  files = [],
  position = { x: 0, y: 0 },
  isVisible = false
}) => {
  const classes = useStyles();

  if (!isVisible || !preview) {
    return null;
  }

  const isMultiple = files.length > 1;
  const IconComponent = getFileIcon(preview.category);

  // Position preview slightly offset from cursor
  const previewStyle = {
    left: position.x + 20,
    top: position.y - 10,
    transform: position.x > window.innerWidth - 320 ? 'translateX(-100%)' : 'none',
  };

  return (
    <Paper
      className={classes.preview}
      style={previewStyle}
      elevation={8}
      role="tooltip"
      aria-label={`Preview of ${isMultiple ? `${files.length} files` : preview.name}`}
    >
      {isMultiple ? (
        <div className={classes.multipleFiles}>
          {files.length} files selected
          <div style={{ fontSize: '10px', marginTop: '4px' }}>
            {files.slice(0, 3).map(f => f.name).join(', ')}
            {files.length > 3 && ` and ${files.length - 3} more`}
          </div>
        </div>
      ) : (
        <div className={classes.previewContent}>
          {preview.thumbnail ? (
            <img
              src={preview.thumbnail}
              alt={`Thumbnail for ${preview.name}`}
              className={classes.thumbnail}
            />
          ) : (
            <Avatar className={classes.fileIcon}>
              <IconComponent />
            </Avatar>
          )}

          <div className={classes.fileInfo}>
            <Typography className={classes.fileName} title={preview.name}>
              {preview.name}
            </Typography>

            <div className={classes.fileDetails}>
              <div className={classes.fileSize}>
                <span>{formatFileSize(preview.size)}</span>
              </div>

              {preview.duration && (
                <div>
                  Duration: {Math.round(preview.duration)}s
                </div>
              )}

              <div style={{ textTransform: 'capitalize' }}>
                {preview.category || 'File'}
              </div>
            </div>
          </div>
        </div>
      )}
    </Paper>
  );
};

export default AssetPreview;