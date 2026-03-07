import React from 'react';
import { NotificationData } from '../../Types/NotificationTypes';

interface NotificationPopupProps {
  notification: NotificationData;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ notification }) => {
  const truncatedMessage = notification.message.length > 100 
    ? notification.message.substring(0, 97) + '...' 
    : notification.message;

  return (
    <div className="notification-popup">
      <div className="notification-popup--header">
        <span className="notification-popup--chat-name">
          {notification.chatName}
        </span>
        <span className="notification-popup--badge">Новое сообщение</span>
      </div>

      <div className="notification-popup--content">
        <div className="friend-avatar">
          {notification.senderAvatar ? (
            <img 
              src={notification.senderAvatar} 
              alt={notification.senderName}
              className="notification-popup--avatar-image"
            />
          ) : (
            <div className="notification-popup--avatar-placeholder">
              {notification.senderName[0].toUpperCase()}
            </div>
          )}
        </div>

        <div className="notification-popup--message">
          <span className="notification-popup--sender-name">
            {notification.senderName}
          </span>
          <span className="notification-popup--message-text">
            {truncatedMessage}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;