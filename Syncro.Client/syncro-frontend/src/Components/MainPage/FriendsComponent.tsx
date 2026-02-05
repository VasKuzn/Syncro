import { ShortFriend, FriendFilterTypes, FriendProps, Friend } from "../../Types/FriendType";
import { useState, useRef, useEffect } from "react";
import { getUserByNickname, fetchCurrentUser, sendFriendRequest, updateFriendStatus, deleteFriendship } from "../../Services/MainFormService";
import { FriendDetails } from "./FriendDetails";
import { emptyFilterMessages } from "../../Constants/FriendFilterMessages";
import { motion } from 'framer-motion';
import loadingIcon from '../../assets/usersicon.svg';
import FriendItem from "./FriendItem";

const FriendsComponent = ({ friends, onFriendAdded, setFriends }: FriendProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<{ message: string, isError: boolean } | null>(null);
    const [filter, setFilter] = useState<FriendFilterTypes>('all');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFriendForModal, setSelectedFriendForModal] = useState<Friend | null>(null);

    const addFriendInputRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setSearchQuery('');
        if (searchInputRef.current) {
            searchInputRef.current.value = '';
        }
    }, [filter]);

    useEffect(() => {
        const loadCurrentUser = async () => {
            const id = await fetchCurrentUser();
            setCurrentUserId(id);
        };
        loadCurrentUser();
    }, []);

    const addFriend = async () => {
        const nickname = addFriendInputRef.current?.value.trim();
        if (!nickname) {
            setNotification({ message: "Введите никнейм", isError: true });
            return;
        }

        try {
            setIsLoading(true);
            setNotification(null);

            const user = await getUserByNickname(nickname);
            if (!user || !user.id) {
                throw new Error("Пользователь не найден");
            }

            const currentUserId = await fetchCurrentUser();
            if (!currentUserId) throw new Error("Не удалось получить ID текущего пользователя");

            const existingFriend = friends.find(f => 
                (f.id === user.id) 
            );

            // Заявка была отклонена или получена
            if (existingFriend && existingFriend.userWhoReceived === currentUserId && (existingFriend.status === 2 || existingFriend.status === 0)) {
                await updateFriendStatus(existingFriend.friendShipId, 1);
            
                setFriends(prev => prev.map(f => 
                    f.id === existingFriend.id 
                        ? { ...f, status: 1 }
                        : f
                ));

                setNotification({
                    message: `Заявка ${nickname} принята!`,
                    isError: false
                });
            }
            // Заявка уже одобрена или отправлена 
            else if (existingFriend) {
                const statusMessage = existingFriend.status === 0 
                    ? "Заявка уже отправлена и ожидает ответа" 
                    : "Этот пользователь уже у вас в друзьях";
            
                setNotification({
                    message: statusMessage,
                    isError: true
                });
            }
            // Создание новой заявки
            else {
                const timestamp = new Date(Date.now());
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

    const handleFriendClick = (friend: ShortFriend) => {
        const fullFriend = friends.find(f => f.id === friend.id);
        if (fullFriend) {
            setSelectedFriendForModal(fullFriend);
            setIsModalOpen(true);
        }
    };

    const handleAccept = async (friend: Friend) => {
        try {
            setIsLoading(true);
            await updateFriendStatus(friend.friendShipId, 1);
            
            setFriends(prevFriends =>
                prevFriends.map(f =>
                    f.friendShipId === friend.friendShipId 
                        ? { ...f, status: 1 } 
                        : f
                )
            );
            
            onFriendAdded?.();
        } catch (error) {
            console.error("Ошибка при принятии заявки:", error);
            setNotification({
                message: "Не удалось принять заявку",
                isError: true
            });
            setTimeout(() => setNotification(null), 3500);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDecline = async (friend: Friend) => {
        try {
            setIsLoading(true);
            await updateFriendStatus(friend.friendShipId, 2);
            
            setFriends(prevFriends =>
                prevFriends.map(f =>
                    f.friendShipId === friend.friendShipId 
                        ? { ...f, status: 2 } 
                        : f
                )
            );
            
            onFriendAdded?.();
        } catch (error) {
            console.error("Ошибка при отклонении заявки:", error);
            setNotification({
                message: "Не удалось отклонить заявку",
                isError: true
            });
            setTimeout(() => setNotification(null), 3500);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelRequest = async (friend: Friend) => {
        try {
            setIsLoading(true);
            await deleteFriendship(friend.friendShipId);

            setFriends(prevFriends => 
                prevFriends.filter(f => f.friendShipId !== friend.friendShipId)
            );

            onFriendAdded?.();

        } catch (error) {
            console.error("Ошибка при отмене заявки:", error);
            setNotification({
                message: "Не удалось отменить заявку",
                isError: true
            });
            setTimeout(() => setNotification(null), 3500);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteFriend = async (friend: Friend) => {
        try {
            setIsLoading(true);
            await deleteFriendship(friend.friendShipId);

            setFriends(prevFriends => 
                prevFriends.filter(f => f.friendShipId !== friend.friendShipId)
            );

            onFriendAdded?.();

        } catch (error) {
            console.error("Ошибка при удалении друга:", error);
            setNotification({
                message: "Не удалось удалить друга",
                isError: true
            });
            setTimeout(() => setNotification(null), 3500);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = (friend: Friend) => {
        if (filter === 'all' || filter === 'online') {
            handleDeleteFriend(friend);
        } else if (filter === 'myrequests') {
            handleCancelRequest(friend);
        } else if (filter === 'requestsfromme') {
            handleDecline(friend);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        if (searchInputRef.current) {
            searchInputRef.current.value = '';
            searchInputRef.current.focus();
        }
    };

    const filterFriends = (friends: Friend[], filter: FriendFilterTypes, searchQuery: string, currentUserId: string | null) => {
        let result = friends.filter(friend => {
            if (filter === 'online') {
                return friend.isOnline && friend.status === 1;
            }
            if (filter === 'myrequests') return friend.status === 0 && friend.userWhoSent === currentUserId;
            if (filter === 'requestsfromme') return friend.userWhoReceived === currentUserId && (friend.status === 0 || friend.status === 2);
            if (filter === 'all') return friend.status === 1;
            return true;
        });

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(friend =>
                friend.nickname.toLowerCase().includes(query)
            );
        }

        if (filter === 'all') {
            result = result.sort((a, b) => {
                return (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0);
            });
        }

        return result;
    };

    const filteredFriends = filterFriends(friends, filter, searchQuery, currentUserId);
    let requestsFromme: Friend[] = [];
    let rejectedRequests: Friend[] = [];

    if (filter === 'requestsfromme') {
        requestsFromme = filteredFriends.filter(friend => 
            friend.status === 0
        );

        rejectedRequests = filteredFriends.filter(friend => 
            friend.status === 2
        );
    }

    const currentEmptyFilterMessage = emptyFilterMessages[filter];

    useEffect(() => {
        if (selectedFriendForModal) {
            const updatedFriend = friends.find(f => f.id === selectedFriendForModal.id);
            if (updatedFriend) {
                setSelectedFriendForModal(updatedFriend);
            }
        }
    }, [friends, selectedFriendForModal]);

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
                        <input
                            ref={searchInputRef}
                            className="friends-search"
                            placeholder="Поиск"
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                        <img className="search-icon" src="/search.png" alt="Поиск" />
                        {searchQuery && (
                            <button
                                className="clear-search-btn"
                                onClick={handleClearSearch}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    color: '#666',
                                    padding: '0',
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                <div className="friends-container" key={`friends-${filter}-${filteredFriends.length}-${searchQuery}`}>
                    {(friends.length === 0 || filteredFriends.length === 0) ? (
                        <div className="empty-state">
                            <img src="/no-friends.png" alt="Нет друзей" style={{ width: '60px', height: '60px' }}/>
                            <p>
                                {searchQuery.trim()
                                    ? `По запросу «${searchQuery}» друзей не найдено`
                                    : currentEmptyFilterMessage
                                }
                            </p>
                        </div>
                    ) : filter === "requestsfromme" ? (
                        <>
                        {requestsFromme.length === 0 ? (
                            <div className="empty-state">
                                {!searchQuery.trim() && (
                                    <>
                                        <h3 className="section-title">Ожидающие</h3>
                                        <img 
                                            src="/no-friends.png" 
                                            alt="Нет друзей" 
                                            style={{ width: '60px', height: '60px' }}
                                    />
                                    <p>{currentEmptyFilterMessage}</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <>
                                <h3 className="section-title">Ожидающие</h3>
                                {requestsFromme.map(friend =>
                                    <FriendItem 
                                        key={friend.id} 
                                        friend={friend} 
                                        onClick={() => handleFriendClick(friend)}
                                    />
                                )}
                            </>
                        )}
                        {rejectedRequests.length > 0 && (
                            <>
                                {!searchQuery.trim() && <div className="section-divider" />}
                                <h3 className="section-title">Отклоненные заявки</h3>
                                <div className="requests-section rejected-section">
                                    {rejectedRequests.map(friend => (
                                        <FriendItem 
                                            key={friend.id} 
                                            friend={friend} 
                                            onClick={() => handleFriendClick(friend)}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ): (filteredFriends.map(friend =>
                       <FriendItem 
                            key={friend.id} 
                            friend={friend} 
                            onClick={() => handleFriendClick(friend)}
                        />
                        )
                    )}
                    </div>
                </div>

            {selectedFriendForModal && (
                <FriendDetails
                    friend={selectedFriendForModal}
                    friends={friends}
                    setFriends={setFriends}
                    onAccept={handleAccept}
                    onCancel={handleCancel}
                    filter={filter}
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setTimeout(() => setSelectedFriendForModal(null), 300);
                    }}
                />
            )}
        </div>
    );
};

export default FriendsComponent;