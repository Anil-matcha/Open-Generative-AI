import React from 'react';

const HelpIconComponent = ({ placement, noPadding, message }) => {
  return (
    <div className={`help-icon ${noPadding ? 'no-padding' : ''}`}>
      <span title={message}>?</span>
    </div>
  );
};

export default HelpIconComponent;