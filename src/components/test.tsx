import React from 'react';

interface FeaturedFeedbackButtonProps {
  onClick: () => void;
}

const FeaturedFeedbackButton: React.FC<FeaturedFeedbackButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center rounded-md bg-gray-900 hover:bg-gray-700 transition-colors duration-200 w-24 h-24"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-12 h-12 text-gray-400"
      >
        <path
          fillRule="evenodd"
          d="M4.804 21.644a3.75 3.75 0 01-.964-7.035L12 3 21.16 14.61A3.75 3.75 0 0122.036 21.644H4.804zm7.5-.75a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75V20.9zM6.75 8.25a.75.75 0 00-1.5 0v5.25a.75.75 0 001.5 0V8.25zM12.75 8.25a.75.75 0 00-1.5 0v5.25a.75.75 0 001.5 0V8.25zM18.75 8.25a.75.75 0 00-1.5 0v5.25a.75.75 0 001.5 0V8.25z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
};

export default FeaturedFeedbackButton;
