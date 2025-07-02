import { FriendProps } from "../../Types/FriendType";
import { useState, useRef } from "react";
import { getUserByNickname, fetchCurrentUser, sendFriendRequest } from "../../Services/MainFormService";

const FriendsComponent = ({ friends, onFriendAdded }: FriendProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<{ message: string, isError: boolean } | null>(null);
    const [filter, setFilter] = useState<'all' | 'online' | 'requests'>('all');

    const addFriendInputRef = useRef<HTMLInputElement>(null);

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

            setNotification({
                message: `Запрос дружбы для ${nickname} отправлен!`,
                isError: false
            });

            onFriendAdded?.();
        } catch (error) {
            setNotification({
                message: (error as Error).message || "Не удалось отправить запрос",
                isError: true
            });
        } finally {
            setIsLoading(false);
            setTimeout(() => setNotification(null), 3500);
        }
    };

    const filteredFriends = friends.filter(friend => {
        if (filter === 'online') return friend.isOnline;
        if (filter === 'requests') return friend.status === 0;
        return true;
    });

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
                <button
                    className={`button-friends-status ${filter === 'online' ? 'active' : ''}`}
                    onClick={() => setFilter('online')}
                >
                    В сети
                </button>
                <button
                    className={`button-friends-status ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Все
                </button>
                <button
                    className={`button-friends-status ${filter === 'requests' ? 'active' : ''}`}
                    onClick={() => setFilter('requests')}
                >
                    Заявки в друзья
                </button>

                <div className="input-container">
                    <div className="input-box with-icon">
                        <img className="search-icon" src="/search3.png" alt="Поиск" />
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
                        <img className="search-icon" src="/search3.png" alt="Поиск" />
                    </div>
                </div>

                <div className="friends-container">
                    {filteredFriends.length === 0 ? (
                        <div className="empty-state">
                            <img src="/no-friends.png" alt="Нет друзей" />
                            <p>У вас пока нет друзей. Добавьте кого-нибудь!</p>
                        </div>
                    ) : (
                        filteredFriends.map(friend => (
                            <div key={friend.id} className="friend-item">
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
                                        <span className={`online-status ${friend.isOnline ? '' : 'offline'}`}>
                                            {friend.isOnline ? "В сети" : "Не в сети"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default FriendsComponent;