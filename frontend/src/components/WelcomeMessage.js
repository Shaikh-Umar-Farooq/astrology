import React from 'react';

const WelcomeMessage = ({ onQuestionClick }) => {
  const presetQuestions = [
    "When will I get married?",
    "What career is best for me?",
    "Will I settle abroad?",
    "How will my health be?",
    "What is my lucky number?"
  ];

  return (
    <div className="text-left py-5 text-gray-text max-w-600 mx-auto">
      <div className="text-primary text-base font-semibold mb-4 ">
        🙏 Welcome to AstroPandit – Your Trusted Vedic Astrology Guide
      </div>
      <p className="text-sm leading-relaxed mb-6">
        🌟 <strong>Ask about your past, present, or future through the wisdom of Vedic astrology.</strong> 
      </p>
      <p className="text-sm leading-relaxed mb-2" >Here are some popular questions to get you started:</p>
      
      <div className="space-y-3 mb-6">
        {presetQuestions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className="w-full text-left p-3 bg-white border border-border-gray rounded-lg hover:border-primary hover:bg-gray-50 transition-all duration-200 shadow-sm"
          >
            <div className="text-sm text-gray-darker font-medium">
              {question}
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-text text-center">
        Click on any question above or type your own question in the chat box below
      </p>
    </div>
  );
};

export default WelcomeMessage;
