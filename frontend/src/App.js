import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatMessages from './components/ChatMessages';
import ChatInput from './components/ChatInput';
import AdSection from './components/AdSection';
import UserDetailsModal from './components/UserDetailsModal';
import { chatAPI } from './services/api';
import { getUserData, isUserDataComplete } from './utils/userStorage';

function App() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userData, setUserData] = useState(getUserData());
  const [refreshCounter, setRefreshCounter] = useState(0);

  const handleSendMessage = async (messageText) => {
    // Check if user data is complete before sending message
    if (!isUserDataComplete()) {
      setIsModalOpen(true);
      return;
    }

    // Add user message immediately
    const userMessage = {
      content: messageText,
      isUser: true,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setShowWelcome(false);
    setIsTyping(true);

    // Simulate typing delay like original
    const typingDelay = 1000 + Math.random() * 1000;
    
    setTimeout(async () => {
      try {
        // Get current user data for the API call
        const currentUserData = getUserData();
        const result = await chatAPI.sendMessage(messageText, currentUserData);
        
        // Check if limit was exceeded
        if (result.status === 429) {
          const limitMessage = {
            content: result.data.resetMessage || 'Your daily limit of questions has been reached. Your limit will reset tomorrow.',
            isUser: false,
            timestamp: new Date().toISOString(),
            isLimitMessage: true
          };
          setMessages(prev => [...prev, limitMessage]);
        } else {
          const botMessage = {
            content: result.data.response,
            isUser: false,
            timestamp: result.data.timestamp
          };
          setMessages(prev => [...prev, botMessage]);
          
          // ALWAYS update counter after successful question to refresh the display
          setRefreshCounter(prev => prev + 1);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        
        // Check if it's a 429 (limit exceeded) error
        if (error.response && error.response.status === 429) {
          const limitData = error.response.data;
          const limitMessage = {
            content: limitData.resetMessage || 'Your daily limit of questions has been reached. Your limit will reset tomorrow.',
            isUser: false,
            timestamp: new Date().toISOString(),
            isLimitMessage: true
          };
          setMessages(prev => [...prev, limitMessage]);
        } else {
          // Fallback message if everything fails
          const fallbackMessage = {
            content: "I'm having trouble connecting to the cosmic network right now. Please ensure your birth details are complete and try again in a moment for accurate Vedic astrological guidance!",
            isUser: false,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, fallbackMessage]);
        }
      } finally {
        setIsTyping(false);
      }
    }, typingDelay);
  };

  // Handle user icon click
  const handleUserIconClick = () => {
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  // Handle modal save
  const handleModalSave = (newUserData) => {
    setUserData(newUserData);
    // Refresh the header to show updated user initials and counter
    setRefreshCounter(prev => prev + 1);
    window.dispatchEvent(new Event('userDataUpdated'));
  };

  // Check for user data on app load
  useEffect(() => {
    const currentUserData = getUserData();
    setUserData(currentUserData);
    
    // Open modal if user data is incomplete
    if (!isUserDataComplete(currentUserData)) {
      setIsModalOpen(true);
    }
  }, []);

  // Update header when userData changes
  useEffect(() => {
    if (userData && userData.firstName) {
      document.title = `AstroPandit - ${userData.firstName}'s Reading`;
    }
  }, [userData]);

  // Add demo messages like in original (for testing)
  useEffect(() => {
    const addDemoMessages = () => {
      const demoMessages = [

      ];

      demoMessages.forEach((content, index) => {
        setTimeout(() => {
          const message = {
            content,
            isUser: index % 2 === 0,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, message]);
        }, (index + 1) * 500);
      });
    };

    // Add demo messages after 2 seconds like original
    const timer = setTimeout(addDemoMessages, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="font-sans bg-gray-100 text-gray-darker mobile-height overflow-hidden">
      <div className="grid lg:grid-cols-desktop md:grid-cols-tablet grid-cols-1 max-w-1400 mx-auto bg-white mobile-height">
        {/* Left Sidebar - Hidden on mobile */}
        <div className="hidden md:block overflow-y-auto mobile-height">
          <AdSection side="left" />
        </div>

        {/* Main Chat Section - Fixed Layout */}
        <div className="flex flex-col relative mobile-height">
          {/* Fixed Header */}
          <div className="sticky top-0 z-10 bg-white">
            <Header 
              onUserIconClick={handleUserIconClick} 
              refreshCounter={refreshCounter}
            />
          </div>
          
          {/* Scrollable Chat Messages */}
          <div className="flex-1 overflow-hidden">
            <ChatMessages 
              messages={messages}
              isTyping={isTyping}
              showWelcome={showWelcome}
              onQuestionClick={handleSendMessage}
            />
          </div>
          
          {/* Fixed Input at Bottom */}
          <div className="sticky bottom-0 z-10 bg-white ">
            <ChatInput 
              onSendMessage={handleSendMessage}
              disabled={isTyping}
            />
          </div>
        </div>

        {/* Right Sidebar - Hidden on mobile */}
        <div className="hidden md:block overflow-y-auto mobile-height">
          <AdSection side="right" />
        </div>
      </div>

      {/* User Details Modal */}
      <UserDetailsModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
      />
    </div>
  );
}

export default App;
