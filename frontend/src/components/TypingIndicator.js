import React from 'react';

const TypingIndicator = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="text-gray-400 italic text-sm py-2.5 px-4 text-center">
      AstroPandit ji is thinking...
    </div>
  );
};

export default TypingIndicator;
