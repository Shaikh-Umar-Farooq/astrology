import React from 'react';
import { getUserInitials, getUserData } from '../utils/userStorage';

const Header = ({ onUserIconClick }) => {
  const userInitials = getUserInitials();
  const userData = getUserData();
  const userName = userData.firstName ? `${userData.firstName} ${userData.lastName}`.trim() : 'User';

  return (
    <div className="px-5 py-2 border-b border-border-gray bg-white flex justify-between items-center flex-shrink-0 border-l border-r border-gray">
      <div className="text-lg font-semibold text-gray-darker">
        AstroPandit
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-sm text-gray-darker font-medium">{userName}</div>
        </div>
        <button
          onClick={onUserIconClick}
          className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm hover:bg-primary-hover transition-colors cursor-pointer"
          title="Edit your details"
        >
          {userInitials}
        </button>
      </div>
    </div>
  );
};

export default Header;
