import React, { useEffect, useRef } from 'react';
import Message from './Message';
import WelcomeMessage from './WelcomeMessage';
import TypingIndicator from './TypingIndicator';

const ChatMessages = ({ messages, isTyping, showWelcome, onQuestionClick }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="h-full px-4 md:px-7 py-4 md:py-7 overflow-y-auto bg-white scrollbar-thin border-l border-r border-gray">
      {showWelcome && <WelcomeMessage onQuestionClick={onQuestionClick} />}
      
      {messages.map((message, index) => (
        <Message
          key={index}
          content={message.content}
          isUser={message.isUser}
          timestamp={message.timestamp}
        />
      ))}
      
      <TypingIndicator isVisible={isTyping} />
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
