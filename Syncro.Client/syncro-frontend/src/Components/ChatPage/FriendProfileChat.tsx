import React, { useEffect, useRef, useState } from 'react';
import { ShortFriend } from '../../Types/FriendType';
import { motion, AnimatePresence } from 'framer-motion';

interface FriendProfileChatProps {
  friend: ShortFriend | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FriendProfileChat: React.FC<FriendProfileChatProps> = ({
  friend,
  isOpen,
  onClose
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  // Получаем полное имя если есть
  const getFullName = () => {
    if (!friend) return null;
    if (!friend.firstname && !friend.lastname) return null;
    return `${friend.firstname || ''} ${friend.lastname || ''}`.trim();
  };

  // Проверяем, есть ли какая-либо информация для отображения
  const hasAdditionalInfo = () => {
    if (!friend) return false;
    return friend.email || friend.phonenumber || getFullName();
  };

  if (!friend) return null;

  return (
    <AnimatePresence>
      {isOpen && !isClosing && (
        <>
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <motion.div
              ref={modalRef}
              className="friend-details-modal-chat"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 25,
                duration: 0.2 
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header-chat">
                <h3>Профиль друга</h3>
                <button className="modal-close-btn-chat" onClick={handleClose}>
                  ×
                </button>
              </div>

              <div className="friend-header-chat">
                <img 
                  src={friend.avatar || "./logo.png"} 
                  alt={friend.nickname}
                  className="friend-avatar-chat"
                />
                <div className="friend-main-info-chat">
                  <div className="nickname-chat">{friend.nickname || "Пользователь"}</div>
                  {getFullName() && (
                    <div className="full-name-chat">{getFullName()}</div>
                  )}
                  <div className="online-status-chat">
                    Заглушка для статуса
                  </div>
                </div>
              </div>

              {hasAdditionalInfo() && (
                <div className="friend-info-chat">
                  {friend.email && (
                    <div className="info-row-chat">
                      <span className="info-label-chat">Email:</span>
                      <span>{friend.email}</span>
                    </div>
                  )}
                  
                  {friend.phonenumber && (
                    <div className="info-row-chat">
                      <span className="info-label-chat">Телефон:</span>
                      <span>{friend.phonenumber}</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};