import React from 'react';

const FormattedMessage = ({ content }) => {
  // Function to format the message content
  const formatContent = (text) => {
    // Split by double newlines to create paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      // Check for formatting markers
      if (paragraph.includes('**POSITIVE**')) {
        const cleanText = paragraph.replace('**POSITIVE**', '').trim();
        return (
          <div key={index} className="mb-3 p-3 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
            <span className="text-green-700 font-semibold text-sm uppercase tracking-wide">✓ Positive</span>
            <p className="text-green-800 mt-1 text-sm leading-relaxed">{cleanText}</p>
          </div>
        );
      }
      
      if (paragraph.includes('**NEGATIVE**')) {
        const cleanText = paragraph.replace('**NEGATIVE**', '').trim();
        return (
          <div key={index} className="mb-3 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <span className="text-red-700 font-semibold text-sm uppercase tracking-wide">⚠ Challenges</span>
            <p className="text-red-800 mt-1 text-sm leading-relaxed">{cleanText}</p>
          </div>
        );
      }
      
      if (paragraph.includes('**REMEDY**')) {
        const cleanText = paragraph.replace('**REMEDY**', '').trim();
        return (
          <div key={index} className="mb-3 p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
            <span className="text-amber-700 font-semibold text-sm uppercase tracking-wide">🕉 Remedy</span>
            <p className="text-amber-800 mt-1 text-sm leading-relaxed">{cleanText}</p>
          </div>
        );
      }
      
      if (paragraph.includes('**NEUTRAL**')) {
        const cleanText = paragraph.replace('**NEUTRAL**', '').trim();
        return (
          <div key={index} className="mb-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
            <span className="text-blue-700 font-semibold text-sm uppercase tracking-wide">ℹ Guidance</span>
            <p className="text-blue-800 mt-1 text-sm leading-relaxed">{cleanText}</p>
          </div>
        );
      }
      
      // Default paragraph without specific formatting
      return (
        <div key={index} className="mb-3 p-3 bg-gray-50 border-l-4 border-gray-300 rounded-r-lg">
          <p className="text-gray-700 text-sm leading-relaxed">{paragraph.trim()}</p>
        </div>
      );
    });
  };

  return (
    <div className="space-y-2">
      {formatContent(content)}
    </div>
  );
};

export default FormattedMessage;
