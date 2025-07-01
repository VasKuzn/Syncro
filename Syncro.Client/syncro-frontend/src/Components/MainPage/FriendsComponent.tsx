import { Friend } from "../../Types/FriendType";
import { NetworkError } from "../../Types/LoginTypes";
import { useState, useRef, useEffect, useCallback } from "react";

interface FriendsComponentProps {
    friends: Friend[];
    onFriendAdded?: () => void;
}

const FriendsComponent: React.FC<FriendsComponentProps> = ({ friends, onFriendAdded }) => {
    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<{ message: string, isError: boolean } | null>(null);
    const addFriendInputRef = useRef<HTMLInputElement>(null);

    const getUserByNickname = async (nickname: string) => {
        try {
            const response = await fetch(`http://localhost:5232/api/accounts/${nickname}/getnick`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка аутентификации');
            }

            return response.json();
        } catch (error) {
            throw new Error((error as NetworkError).message || 'Ошибка сети');
        }
    };

    const fetchCurrentUser = useCallback(async () => {
        const response = await fetch("http://localhost:5232/api/accounts/current", {
            credentials: 'include'
        });
        const data = await response.json();
        setCurrentUserId(data.userId);
        return data.userId;
    }, []);

    const addFriend = async () => {
        const nickname = addFriendInputRef.current?.value.trim();
        if (!nickname) return;

        try {
            setIsLoading(true);
            setNotification(null);
            const timestamp = new Date(Date.now());
            const user = await getUserByNickname(nickname);
            const uws = await fetchCurrentUser();

            const request = {
                userWhoSent: uws,
                userWhoRecieved: user.id,
                status: 0,
                friendsSince: timestamp.toISOString()
            };

            const response = await fetch(`http://localhost:5232/api/Friends`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка при отправке запроса дружбы');
            }

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

            // Автоскрытие уведомления
            const timer = setTimeout(() => setNotification(null), 3500);
            return () => clearTimeout(timer);
        }
    };

    return (
        <div className="friends">
            {/* Уведомление */}
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
                <button className="button-friends-status">В сети</button>
                <button className="button-friends-status">Все</button>
                <button className="button-friends-status">Заявки в друзья</button>

                <div className="input-container">
                    <div className="input-box">
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
                        <img className="search-icon" src="/icons/search.svg" alt="Поиск" />
                    </div>
                </div>

                <div className="friends-container">
                    {friends.map(friend => (
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
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FriendsComponent;