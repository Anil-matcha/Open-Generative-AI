import React, { useRef, useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import classnames from 'classnames';

const useStyles = makeStyles((theme) => ({
  dropZone: {
    position: 'relative',
    transition: 'all 0.2s ease-in-out',
    border: '2px dashed transparent',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: 'transparent',
  },
  dropZoneActive: {
    borderColor: theme.palette.primary.main,
    backgroundColor: 'rgba(25, 118, 210, 0.08)',
    boxShadow: '0 0 0 1px rgba(25, 118, 210, 0.5)',
  },
  dropZoneValid: {
    borderColor: theme.palette.success.main,
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    boxShadow: '0 0 0 1px rgba(76, 175, 80, 0.5)',
  },
  dropZoneInvalid: {
    borderColor: theme.palette.error.main,
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
    boxShadow: '0 0 0 1px rgba(244, 67, 54, 0.5)',
  },
  dropZoneHighlight: {
    animation: '$pulse 1.5s ease-in-out infinite',
  },
  '@keyframes pulse': {
    '0%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.7,
    },
    '100%': {
      opacity: 1,
    },
  },
}));

/**
 * DragZone component - Reusable drop zone with visual feedback
 * @param {Object} props - Component props
 * @param {string} props.id - Unique zone identifier
 * @param {ReactNode} props.children - Child components
 * @param {boolean} props.isActive - Whether this zone is currently active
 * @param {boolean} props.isValid - Whether current drop is valid for this zone
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onDragEnter - Callback when drag enters zone
 * @param {Function} props.onDragLeave - Callback when drag leaves zone
 * @param {Function} props.onDrop - Callback when files are dropped
 * @param {Object} props.style - Inline styles
 * @param {string} props.zoneType - Zone type ('track', 'empty-space', 'canvas')
 * @param {Object} props.metadata - Additional zone metadata
 */
const DragZone = ({
  id,
  children,
  isActive = false,
  isValid = false,
  className,
  onDragEnter,
  onDragLeave,
  onDrop,
  style = {},
  zoneType = 'canvas',
  metadata = {},
  ...props
}) => {
  const classes = useStyles();
  const zoneRef = useRef(null);
  const [bounds, setBounds] = useState(null);

  // Update zone bounds when component mounts or resizes
  useEffect(() => {
    const updateBounds = () => {
      if (zoneRef.current) {
        const rect = zoneRef.current.getBoundingClientRect();
        setBounds({
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateBounds();

    // Update bounds on window resize
    const handleResize = () => updateBounds();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle drag enter
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDragEnter?.(id, zoneType, metadata);
  };

  // Handle drag leave
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDragLeave?.(id, zoneType, metadata);
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    onDrop?.(files, id, zoneType, metadata);
  };

  // Determine zone class based on state
  const getZoneClass = () => {
    if (isActive) {
      if (isValid) {
        return classnames(classes.dropZone, classes.dropZoneActive, classes.dropZoneValid, classes.dropZoneHighlight, className);
      } else {
        return classnames(classes.dropZone, classes.dropZoneActive, classes.dropZoneInvalid, classes.dropZoneHighlight, className);
      }
    }
    return classnames(classes.dropZone, className);
  };

  return (
    <div
      ref={zoneRef}
      className={getZoneClass()}
      style={style}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      data-zone-id={id}
      data-zone-type={zoneType}
      role="region"
      aria-label={`Drop zone ${id} for ${zoneType}`}
      {...props}
    >
      {children}

      {/* Visual indicator overlay */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isValid ? '#4CAF50' : '#F44336',
            fontSize: '14px',
            fontWeight: 'bold',
            textShadow: '0 0 4px rgba(255, 255, 255, 0.8)',
            zIndex: 1,
          }}
        >
          {isValid ? '✓ Drop here' : '✗ Invalid drop'}
        </div>
      )}
    </div>
  );
};

export default DragZone;