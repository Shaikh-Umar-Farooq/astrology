import React from 'react';
import FormattedMessage from './FormattedMessage';

const Message = ({ content, isUser, timestamp }) => {
  return (
    <div className={`mb-5 max-w-600 mx-auto ${isUser ? 'text-right' : 'text-left'}`}>
      {isUser ? (
        // User message - simple styling
        <div className="inline-block px-4 py-3 rounded-xl text-sm leading-relaxed max-w-full break-words bg-primary text-white rounded-br-sm">
          {content}
        </div>
      ) : (
        // Bot message - formatted with colors and structure
        <div className="w-full">
          <FormattedMessage content={content} />
        </div>
      )}
      {timestamp && (
        <div className="text-xs text-gray-text mt-1">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
};

export default Message;
