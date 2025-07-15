import React, { memo } from 'react';
import * as Icons from 'lucide-react';

// Notification Component
const NotificationContainer = memo(({ notifications }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2" role="region" aria-live="polite" aria-label="Notifications">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            px-4 py-3 rounded-lg shadow-lg text-white flex items-center space-x-2
            animate-in slide-in-from-right duration-300
            ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'}
          `}
          role="alert"
        >
          {notification.type === 'error' ? (
            <Icons.AlertCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <Icons.CheckCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span className="text-sm">{notification.message}</span>
        </div>
      ))}
    </div>
  );
});

export default NotificationContainer; 