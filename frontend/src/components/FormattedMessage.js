import React from 'react';

const FormattedMessage = ({ content }) => {
  // Function to format the message content as a single chat message with inline highlighting
  const formatContent = (text) => {
    // Replace formatting markers with bold black text (no colors to avoid confusion)
    let formattedText = text
      .replace(/<green>/g, '<span class="font-semibold text-gray-800">')
      .replace(/<\/green>/g, '</span>')
      .replace(/<red>/g, '<span class="font-semibold text-gray-800">')
      .replace(/<\/red>/g, '</span>');

    // Convert line breaks to proper spacing
    formattedText = formattedText.replace(/\n/g, '<br />');

    return (
      <div 
        className="text-sm leading-relaxed text-gray-700"
        dangerouslySetInnerHTML={{ __html: formattedText }}
      />
    );
  };

  return (
    <div className="w-full">
      {formatContent(content)}
    </div>
  );
};

export default FormattedMessage;
