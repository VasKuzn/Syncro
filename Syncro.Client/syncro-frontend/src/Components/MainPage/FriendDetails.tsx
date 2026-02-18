import { useEffect, useRef, useState } from 'react';
import { FriendDetailsProps } from "../../Types/FriendType";
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser, getPersonalConference, markMessagesAsRead } from "../../Services/MainFormService";
import { motion, AnimatePresence } from 'framer-motion';

export const FriendDetails = ({
  friend,
  friends,
  setFriends,
  onAccept,
  onCancel,
  filter = 'all',
  isOpen,
  onClose
}: FriendDetailsProps & {
  filter?: string;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
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

  // Блокировка скролла
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

  const goToChat = async () => {
    if (!friend) return;

    try {
      const currentUserId = await fetchCurrentUser();
      const personalConferenceId = await getPersonalConference(currentUserId, friend.id);

      handleClose();

      navigate("/chat", {
        state: {
          friends: friends,
          friendId: friend.id,
          personalConferenceId: personalConferenceId
        }
      });

      setTimeout(async () => {
        try {
          const { messageHub } = await import("../../Hubs/MessageHub");
          await messageHub.init();
          await messageHub.subscribeToConference(personalConferenceId);
          await markMessagesAsRead(personalConferenceId);

          setFriends(prev =>
            prev.map(f =>
              f.id === friend.id ? { ...f, unreadCount: 0 } : f
            )
          );
        } catch (error) {
          console.error("Ошибка инициализации чата:", error);
        }
      }, 0);

    } catch (error) {
      console.error("Ошибка перехода в чат:", error);
    }
  };

  // Форматирование даты по требованию: DD.MM.YYYY
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Определяем какие кнопки показывать в зависимости от фильтра
  const getActions = () => {
    if (!friend) return null;

    if (friend.status === 2) {
      return (
        <div className="modal-actions">
          <button className="action-btn primary" onClick={() => {
            onAccept?.(friend);
            handleClose();
          }}>
            ✅ Принять
          </button>
        </div>
      );
    }

    switch (filter) {
      case 'all':
      case 'online':
        return (
          <div className="modal-actions">
            <button className="action-btn primary" onClick={goToChat}>
              💬 Перейти к чату
            </button>
            <button className="action-btn danger" onClick={() => {
              onCancel?.(friend);
              handleClose();
            }}>
              ✖️ Удалить
            </button>
          </div>
        );

      case 'myrequests':
        return (
          <div className="modal-actions">
            <button className="action-btn secondary" onClick={() => {
              onCancel?.(friend);
              handleClose();
            }}>
              ↪️ Отменить запрос
            </button>
          </div>
        );

      case 'requestsfromme':
        return (
          <div className="modal-actions">
            <button className="action-btn primary" onClick={() => {
              onAccept?.(friend);
              handleClose();
            }}>
              ✅ Принять
            </button>
            <button className="action-btn danger" onClick={() => {
              onCancel?.(friend);
              handleClose();
            }}>
              ❌ Отклонить
            </button>
          </div>
        );

      default:
        return (
          <div className="modal-actions">
            <button className="action-btn primary" onClick={goToChat}>
              💬 Перейти к чату
            </button>
            <button className="action-btn danger" onClick={() => {
              onCancel?.(friend);
              handleClose();
            }}>
              ✖️ Удалить
            </button>
          </div>
        );
    }
  };

  if (!friend) return null;

  // Проверяем, показывать ли имя/фамилию
  const shouldShowName = friend.firstname || friend.lastname;
  const fullName = shouldShowName
    ? `${friend.firstname || ''} ${friend.lastname || ''}`.trim()
    : null;

  return (
    <AnimatePresence>
      {isOpen && !isClosing && (
        <>
          {/* Затемненный фон */}
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
          >
            {/* Модальное окно */}
            <motion.div
              ref={modalRef}
              className="friend-details-modal"
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
              <div className="modal-header">
                <h3>Профиль друга</h3>
                <button className="modal-close-btn" onClick={handleClose}>
                  ×
                </button>
              </div>

              <div className="friend-header">
                <img src={friend?.avatar || "./logo.png"} alt="Avatar" className="friend-avatar big" />
                <div className="friend-main-info">
                  <div className="nickname">{friend?.nickname || "Пользователь"}</div>
                  {fullName && <div className="full-name">{fullName}</div>}
                  <div className={`online-status ${friend.isOnline ? "" : "offline"}`}>
                    {friend.isOnline ? "В сети" : "Не в сети"}
                  </div>
                </div>
              </div>

              <div className="friend-info">
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  {friend.email || "Не указан"}
                </div>
                <div className="info-row">
                  <span className="info-label">Телефон:</span>
                  {friend.phonenumber || "Не указан"}
                </div>
                <div className="info-row">
                  <span className="info-label">Дата:</span>
                  {formatDate(friend.friendsSince)}
                </div>
              </div>

              {getActions()}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};