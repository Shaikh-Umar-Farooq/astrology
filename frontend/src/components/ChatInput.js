import React, { useState, useRef, useEffect } from 'react';

const ChatInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      resetTextareaHeight();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 100);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    <div className="px-4 md:px-7 py-1 pb-4 bg-white border-l border-r border-gray">
      <form onSubmit={handleSubmit} className="flex gap-2.5 items-end max-w-600 mx-auto">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about astrology..."
          className="flex-1 px-4 py-3 border border-border-gray rounded-3xl outline-none text-sm auto-resize bg-gray-light focus:border-primary transition-colors"
          disabled={disabled}
          rows={1}
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="bg-primary border-none rounded-full w-10 h-10 flex items-center justify-center cursor-pointer text-white transition-colors hover:bg-primary-hover disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </form>
      
      {/* Privacy Disclaimer */}
      <div className="mt-3 text-center">
        <p className="text-xs sm:text-xs text-gray-400 leading-tight max-w-600 mx-auto px-1" style={{ fontSize: '10px' }}>
          🔒 Your chats are never stored—everything will be lost when you refresh or close this window.
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
