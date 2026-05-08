import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  LinearProgress,
  Typography,
  Paper,
  IconButton,
  Box,
  Chip
} from '@material-ui/core';
import {
  CheckCircle,
  Error,
  Cancel,
  Close
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(2),
    minWidth: 300,
    maxWidth: 400,
  },
  progressItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  fileName: {
    flex: 1,
    fontSize: '14px',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  statusIcon: {
    width: 20,
    height: 20,
  },
  progressText: {
    fontSize: '12px',
    color: theme.palette.text.secondary,
    minWidth: '40px',
    textAlign: 'right',
  },
  cancelButton: {
    width: 24,
    height: 24,
  },
  summary: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(1),
    paddingTop: theme.spacing(1),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  summaryText: {
    fontSize: '13px',
    color: theme.palette.text.secondary,
  },
  clearButton: {
    padding: theme.spacing(0.5),
  },
}));

/**
 * UploadProgress component - Shows progress for file uploads
 * @param {Object} props - Component props
 * @param {Array} props.uploadProgress - Array of upload progress items
 * @param {Function} props.onCancel - Callback to cancel specific upload
 * @param {Function} props.onClearCompleted - Callback to clear completed uploads
 * @param {boolean} props.showSummary - Whether to show summary stats
 */
const UploadProgress = ({
  uploadProgress = [],
  onCancel,
  onClearCompleted,
  showSummary = true
}) => {
  const classes = useStyles();

  if (uploadProgress.length === 0) {
    return null;
  }

  // Calculate summary stats
  const stats = uploadProgress.reduce((acc, item) => {
    acc.total++;
    switch (item.status) {
      case 'complete':
        acc.completed++;
        break;
      case 'error':
        acc.errors++;
        break;
      case 'uploading':
        acc.uploading++;
        break;
      case 'cancelled':
        acc.cancelled++;
        break;
      default:
        acc.pending++;
    }
    return acc;
  }, { total: 0, completed: 0, errors: 0, uploading: 0, pending: 0, cancelled: 0 });

  /**
   * Get status icon based on upload status
   * @param {string} status - Upload status
   * @returns {React.Component} Status icon component
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className={classes.statusIcon} style={{ color: '#4CAF50' }} />;
      case 'error':
        return <Error className={classes.statusIcon} style={{ color: '#F44336' }} />;
      case 'cancelled':
        return <Cancel className={classes.statusIcon} style={{ color: '#9E9E9E' }} />;
      case 'uploading':
        return null; // Progress bar shows activity
      default:
        return null;
    }
  };

  /**
   * Get progress bar color based on status
   * @param {string} status - Upload status
   * @returns {string} Color name
   */
  const getProgressColor = (status) => {
    switch (status) {
      case 'complete':
        return 'primary';
      case 'error':
        return 'secondary';
      case 'cancelled':
        return 'inherit';
      default:
        return 'primary';
    }
  };

  /**
   * Get progress text
   * @param {Object} item - Upload progress item
   * @returns {string} Progress text
   */
  const getProgressText = (item) => {
    switch (item.status) {
      case 'complete':
        return 'Done';
      case 'error':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      case 'uploading':
        return `${item.progress}%`;
      default:
        return 'Pending';
    }
  };

  const hasCompletedItems = uploadProgress.some(item =>
    ['complete', 'error', 'cancelled'].includes(item.status)
  );

  return (
    <Paper className={classes.progressContainer} elevation={3}>
      <Typography variant="h6" component="h2">
        File Upload Progress
      </Typography>

      {uploadProgress.map((item) => (
        <div key={item.fileId} className={classes.progressItem}>
          {getStatusIcon(item.status)}

          <Typography className={classes.fileName} title={item.fileName}>
            {item.fileName}
          </Typography>

          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress
              variant={item.status === 'uploading' ? 'determinate' : 'determinate'}
              value={item.progress}
              color={getProgressColor(item.status)}
              className={classes.progressBar}
            />
          </Box>

          <Typography className={classes.progressText}>
            {getProgressText(item)}
          </Typography>

          {item.status === 'uploading' && onCancel && (
            <IconButton
              size="small"
              onClick={() => onCancel(item.fileId)}
              className={classes.cancelButton}
              title="Cancel upload"
            >
              <Cancel fontSize="small" />
            </IconButton>
          )}
        </div>
      ))}

      {showSummary && (
        <div className={classes.summary}>
          <div className={classes.summaryText}>
            {stats.completed}/{stats.total} completed
            {stats.errors > 0 && (
              <Chip
                size="small"
                label={`${stats.errors} failed`}
                color="error"
                style={{ marginLeft: 8 }}
              />
            )}
          </div>

          {hasCompletedItems && onClearCompleted && (
            <IconButton
              size="small"
              onClick={onClearCompleted}
              className={classes.clearButton}
              title="Clear completed"
            >
              <Close fontSize="small" />
            </IconButton>
          )}
        </div>
      )}
    </Paper>
  );
};

export default UploadProgress;