import React, { useEffect, useRef, useState } from 'react';
import { Friend, ShortFriend } from '../../Types/FriendType';
import { motion, AnimatePresence } from 'framer-motion';

interface FriendProfileChatProps {
  friend: Friend | ShortFriend | null;
  isOpen: boolean;
  onClose: () => void;
  showActions?: boolean;
}

export const FriendProfileChat: React.FC<FriendProfileChatProps> = ({
  friend,
  isOpen,
  onClose,
  showActions = false
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

  // Проверяем, есть ли у друга полная информация
  const isFullFriend = (friend: Friend | ShortFriend | null): friend is Friend => {
    return friend !== null && 'email' in friend && 'friendsSince' in friend;
  };

  // Форматирование даты
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Получаем статус онлайн
  const getOnlineStatus = () => {
    if (!friend) return 'Неизвестно';
    if ('isOnline' in friend) {
      return friend.isOnline ? 'В сети' : 'Не в сети';
    }
    return 'Статус недоступен';
  };

  // Получаем имя и фамилию если есть
  const getFullName = () => {
    if (!isFullFriend(friend)) return null;
    if (!friend.firstname && !friend.lastname) return null;
    return `${friend.firstname || ''} ${friend.lastname || ''}`.trim();
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
                  <div className={`online-status-chat ${isFullFriend(friend) && friend.isOnline ? '' : 'offline'}`}>
                    {getOnlineStatus()}
                  </div>
                </div>
              </div>

              <div className="friend-info-chat">
                {isFullFriend(friend) ? (
                  <>
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
                    <div className="info-row-chat">
                      <span className="info-label-chat">Дата добавления:</span>
                      <span>{formatDate(friend.friendsSince)}</span>
                    </div>
                    <div className="info-row-chat">
                      <span className="info-label-chat">Статус:</span>
                      <span>{friend.status === 1 ? 'Подтвержден' : 'Ожидает подтверждения'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="info-row-chat">
                      <span className="info-label-chat">ID:</span>
                      <span>{friend.id}</span>
                    </div>
                    <div className="info-row-chat">
                      <span className="info-label-chat">Friendship ID:</span>
                      <span>{friend.friendShipId}</span>
                    </div>
                  </>
                )}
              </div>

              {showActions && (
                <div className="modal-actions-chat">
                  <button className="action-btn-chat primary">
                    💬 Написать сообщение
                  </button>
                  <button className="action-btn-chat secondary">
                    👤 Полный профиль
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};