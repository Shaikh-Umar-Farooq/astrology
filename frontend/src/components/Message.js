import React from 'react';
import FormattedMessage from './FormattedMessage';

const Message = ({ content, isUser, timestamp, isLimitMessage }) => {
  return (
    <div className={`mb-5 max-w-600 mx-auto ${isUser ? 'text-right' : 'text-left'}`}>
      {isUser ? (
        // User message - simple styling
        <div className="inline-block px-4 py-3 rounded-xl text-sm leading-relaxed max-w-full break-words bg-primary text-white rounded-br-sm">
          {content}
        </div>
      ) : (
        // Bot message - check if it's a limit message for special styling
        <div className={`inline-block px-4 py-3 rounded-xl text-sm leading-relaxed max-w-full break-words border rounded-bl-sm ${
          isLimitMessage 
            ? 'bg-red-50 text-red-700 border-red-200' 
            : 'bg-bot-bg text-gray-darker border-bot-border'
        }`}>
          {isLimitMessage ? (
            <div className="flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <span>{content}</span>
            </div>
          ) : (
            <FormattedMessage content={content} />
          )}
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
