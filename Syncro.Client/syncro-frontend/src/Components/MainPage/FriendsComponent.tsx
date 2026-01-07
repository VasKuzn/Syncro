import { Friend, FriendFilterTypes, FriendProps } from "../../Types/FriendType";
import { useState, useRef, useEffect, useCallback } from "react";
import { getUserByNickname, fetchCurrentUser, sendFriendRequest, updateFriendStatus, deleteFriendship } from "../../Services/MainFormService";
import { FriendDetails } from "./FriendDetails";
import { emptyFilterMessages } from "../../Constants/FriendFilterMessages";
import { AnimatePresence, motion } from 'framer-motion';
import loadingIcon from '../../assets/usersicon.svg';

const FriendsComponent = ({ friends, onFriendAdded }: FriendProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<{ message: string, isError: boolean } | null>(null);
    const [filter, setFilter] = useState<FriendFilterTypes>('all');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

    const addFriendInputRef = useRef<HTMLInputElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadCurrentUser = async () => {
            const id = await fetchCurrentUser();
            setCurrentUserId(id);
        };
        loadCurrentUser();
    }, []);

    const handleClickOutside = useCallback((event: MouseEvent) => {
        const target = event.target as Element;

        // Проверяем, что клик был не на попапе и не на friend-item
        const isClickOnPopover = popoverRef.current?.contains(target);
        const isClickOnFriendItem = target.closest('.friend-item');
        const isClickOnCloseButton = target.closest('.close-popover');

        if (selectedFriend && !isClickOnPopover && !isClickOnFriendItem && !isClickOnCloseButton) {
            setSelectedFriend(null);
            setSelectedRequestId(null);
        }
    }, [selectedFriend]);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    const addFriend = async () => {
        const nickname = addFriendInputRef.current?.value.trim();
        if (!nickname) {
            setNotification({ message: "Введите никнейм", isError: true });
            return;
        }

        try {
            setIsLoading(true);
            setNotification(null);

            const timestamp = new Date(Date.now());
            const user = await getUserByNickname(nickname);
            if (!user || !user.id) {
                throw new Error("Пользователь не найден");
            }

            const currentUserId = await fetchCurrentUser();
            if (!currentUserId) throw new Error("Не удалось получить ID текущего пользователя");

            const request = {
                userWhoSent: currentUserId,
                userWhoRecieved: user.id,
                status: 0,
                friendsSince: timestamp.toISOString()
            };

            await sendFriendRequest(request);

            if (addFriendInputRef.current) {
                addFriendInputRef.current.value = '';
            }

            setNotification({
                message: `Запрос дружбы для ${nickname} отправлен!`,
                isError: false
            });

            onFriendAdded?.();
        }
        catch (error) {
            setNotification({
                message: `Запрос дружбы для ${nickname} отправить не удалось`,
                isError: true
            });
        } finally {
            setIsLoading(false);
            setTimeout(() => setNotification(null), 3500);
        }
    };
    const handleFriendClick = (friend: Friend) => {
        if (selectedFriend?.id === friend.id) {
            setSelectedFriend(null);
            setSelectedRequestId(null);
        } else {
            setSelectedFriend(friend);
            setSelectedRequestId(friend.id);
        }
    };
    const handleAccept = async (friend: any) => {
        try {
            setIsLoading(true);
            await updateFriendStatus(friend.friendShipId, 1); // 1 = accepted
            setSelectedRequestId(null);
            onFriendAdded?.();
        } catch (error) {
            console.error("Ошибка при принятии заявки:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDecline = async (friend: Friend) => {
        try {
            setIsLoading(true);
            await updateFriendStatus(friend.friendShipId, 2); // 2 = declined
            setSelectedRequestId(null);
            onFriendAdded?.();
        } catch (error) {
            console.error("Ошибка при отклонении заявки:", error);
        } finally {
            setIsLoading(false);
        }
    };
    const handleCancel = async (friend: Friend) => {
        try {
            setIsLoading(true);
            await deleteFriendship(friend.friendShipId);
            onFriendAdded?.();
            setSelectedFriend(null);
        } catch (error) {
            console.error("Ошибка при отмене заявки:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredFriends = (() => {
        let result = friends.filter(friend => {
            if (filter === 'online') {
                return friend.isOnline && friend.status === 1;
            }
            if (filter === 'myrequests') return friend.status === 0 && friend.userWhoReceived === friend.id;
            if (filter === 'requestsfromme') return friend.status === 0 && friend.userWhoSent === friend.id;
            if (filter === 'all') return friend.status === 1;
            if (filter === 'banned') return friend.status === 2;
            return true;
        });

        if (filter === 'all') {
            result = result.sort((a, b) => {
                return (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0);
            });
        }

        return result;
    })();

    const currentEmptyFilterMessage = emptyFilterMessages[filter]

    useEffect(() => {
        setSelectedFriend(null);
        setSelectedRequestId(null);
    }, [filter]);

    return (
        <div className="friends">
            {notification && (
                <div className={`notification ${notification.isError ? 'error' : ''}`}>
                    <div className="notification-content">
                        <span className="notification-icon">
                            {notification.isError ? '⚠️' : '✓'}
                        </span>
                        {notification.message}
                    </div>
                    <div className="notification-progress" />
                </div>
            )}

            <div className="friends-nav">
                <label>Друзья</label>
                <button className={`button-friends-status ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Все</button>
                <button className={`button-friends-status ${filter === 'online' ? 'active' : ''}`} onClick={() => setFilter('online')}>В сети</button>
                <button className={`button-friends-status ${filter === 'banned' ? 'active' : ''}`} onClick={() => setFilter('banned')}>Отклоненные</button>
                <button className={`button-friends-status ${filter === 'myrequests' ? 'active' : ''}`} onClick={() => setFilter('myrequests')}>Мои заявки</button>
                <button className={`button-friends-status ${filter === 'requestsfromme' ? 'active' : ''}`} onClick={() => setFilter('requestsfromme')}>Заявки мне</button>

                <div className="input-container">
                    <div className="input-box with-icon">
                        <img className="search-icon-friend" src={loadingIcon} alt="Поиск" />
                        <input
                            ref={addFriendInputRef}
                            id="add-friend"
                            className="friends-search"
                            placeholder="Введите ник друга"
                            onKeyDown={(e) => e.key === 'Enter' && addFriend()}
                        />
                    </div>
                </div>

                <button
                    className={`button-friends-status add ${isLoading ? 'loading' : ''}`}
                    onClick={addFriend}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span className="button-loader" />
                            Отправка...
                        </>
                    ) : 'Добавить в друзья'}
                </button>
            </div>

            <div className="friends-list">
                <div className="input-container">
                    <div className="input-box">
                        <input className="friends-search" placeholder="Поиск" />
                        <img className="search-icon" src="/search.png" alt="Поиск" />
                    </div>
                </div>

                <div className="friends-container">
                    {filteredFriends.length === 0 ? (
                        <div className="empty-state">
                            <img src="/no-friends.png" alt="Нет друзей" />
                            <p>{currentEmptyFilterMessage}</p>
                        </div>
                    ) : (
                        filteredFriends.map(friend => {
                            const isIncomingRequest = friend.status === 0 && friend.userWhoReceived === currentUserId;
                            const isMyRequest = friend.status === 0 && friend.userWhoSent === currentUserId;
                            const isSelected = selectedRequestId === friend.id;
                            const isFriendSelected = selectedFriend?.id === friend.id;

                            return (
                                <div key={friend.id} className="friend-item" style={{ position: 'relative', zIndex: isFriendSelected ? 100 : 1 }}
                                    onClick={() => handleFriendClick(friend)}
                                >
                                    <div className="friend-avatar-container">
                                        <img
                                            className="friend-avatar"
                                            src={friend.avatar || '/logo.png'}
                                            alt={`Аватар ${friend.nickname}`}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/logo.png';
                                            }}
                                        />
                                    </div>
                                    <div className="friend-info-container">
                                        <div className="friend-text-info">
                                            <span className="nickname">{friend.nickname}</span>
                                            <span className={`online-status ${friend.isOnline ? '' : 'offline'}`}>{friend.isOnline ? "В сети" : "Не в сети"}</span>
                                        </div>

                                        {isIncomingRequest && isSelected && (
                                            <div className="friend-request-modal">
                                                <p>{friend.nickname} хочет добавить вас в друзья</p>
                                                <div className="friend-request-actions">
                                                    <button
                                                        className="accept-button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAccept(friend);
                                                        }}
                                                        disabled={isLoading}
                                                    >
                                                        ✅ Принять
                                                    </button>
                                                    <button
                                                        className="decline-button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDecline(friend);
                                                        }}
                                                        disabled={isLoading}
                                                    >
                                                        ❌ Отклонить
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <AnimatePresence>
                                            {isFriendSelected && (
                                                <motion.div
                                                    ref={popoverRef}
                                                    className="friend-details-popover"
                                                    style={{ zIndex: 200 }}
                                                    onClick={e => e.stopPropagation()}
                                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 300,
                                                        damping: 25,
                                                        duration: 0.2
                                                    }}
                                                >
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.1 }}
                                                    >
                                                        <FriendDetails
                                                            friend={friend}
                                                            friends={friends}
                                                            onAccept={handleAccept}
                                                            onCancel={handleCancel}
                                                        />
                                                    </motion.div>

                                                    <AnimatePresence>
                                                        {filter === 'myrequests' && isMyRequest && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: "auto" }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                            >
                                                                <p style={{ marginTop: 12, marginBottom: 0 }}>Вы отправили заявку {friend.nickname}</p>
                                                                <div className="friend-request-actions">
                                                                    <motion.button
                                                                        className="decline-button"
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            setIsLoading(true);
                                                                            try {
                                                                                await deleteFriendship(friend.friendShipId);
                                                                                setSelectedFriend(null);
                                                                                setSelectedRequestId(null);
                                                                                onFriendAdded?.();
                                                                            } catch (err) {
                                                                                // handle error
                                                                            } finally {
                                                                                setIsLoading(false);
                                                                            }
                                                                        }}
                                                                        disabled={isLoading}
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                    >
                                                                        ❌ Отклонить
                                                                    </motion.button>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    <motion.button
                                                        className="close-popover"
                                                        onClick={e => { e.stopPropagation(); setSelectedFriend(null); }}
                                                        whileHover={{ scale: 1.2, rotate: 90 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        initial={{ opacity: 0, rotate: -45 }}
                                                        animate={{ opacity: 1, rotate: 0 }}
                                                        transition={{ delay: 0.3 }}
                                                    >
                                                        ×
                                                    </motion.button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default FriendsComponent;