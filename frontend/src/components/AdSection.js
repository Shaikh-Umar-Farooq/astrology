import React from 'react';

const AdSection = ({ side = 'left' }) => {
  const adPlaceholders = [1, 2, 3]; // Three ad slots per sidebar

  return (
    <div className="bg-white border-gray p-2.5 flex flex-col items-center align-ite h-full">
      {adPlaceholders.map((_, index) => (
        <div
          key={index}
          className={`mb-5 ${index === 2 ? 'flex-1 flex flex-col w-full' : ''}`}
          style={index === 2 ? { minHeight: '0', width: '100%' } : {}}
        >
          <div
            className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 font-medium"
            style={
              index === 2
                ? {
                    width: '300px',
                    height: '100%',
                    minHeight: '120px',
                    maxHeight: '100%',
                    flex: 1,
                    alignSelf: 'center',
                  }
                : { width: '300px', height: '250px' }
            }
          >
            <div className="text-center">
              <div className="text-sm">Ad Space</div>
              <div className="text-xs mt-1">
                {index === 2 ? 'Flexible Height' : '300 x 250'}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdSection;
