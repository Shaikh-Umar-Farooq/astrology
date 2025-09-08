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
        
        const botMessage = {
          content: result.data.response,
          isUser: false,
          timestamp: result.data.timestamp
        };

        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        console.error('Failed to send message:', error);
        
        // Fallback message if everything fails
        const fallbackMessage = {
          content: "I'm having trouble connecting to the cosmic network right now. Please ensure your birth details are complete and try again in a moment for accurate Vedic astrological guidance!",
          isUser: false,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, fallbackMessage]);
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
    // Refresh the header to show updated user initials
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
    <div className="font-sans bg-gray-100 text-gray-darker h-screen overflow-hidden">
      <div className="grid lg:grid-cols-desktop md:grid-cols-tablet grid-cols-1 h-screen max-w-1400 mx-auto bg-white">
        {/* Left Sidebar - Hidden on mobile */}
        <div className="hidden md:block">
          <AdSection side="left" />
        </div>

        {/* Main Chat Section */}
        <div className="flex flex-col h-screen">
          <Header onUserIconClick={handleUserIconClick} />
          <ChatMessages 
            messages={messages}
            isTyping={isTyping}
            showWelcome={showWelcome}
            onQuestionClick={handleSendMessage}
          />
          <ChatInput 
            onSendMessage={handleSendMessage}
            disabled={isTyping}
          />
        </div>

        {/* Right Sidebar - Hidden on mobile */}
        <div className="hidden md:block">
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
