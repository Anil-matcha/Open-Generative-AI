import React from 'react';

const PlusButton = ({ onClick, alt, className }) => {
  return (
    <button
      className={`plus-button ${className || ''}`}
      onClick={onClick}
      title={alt}
    >
      +
    </button>
  );
};

export default PlusButton;