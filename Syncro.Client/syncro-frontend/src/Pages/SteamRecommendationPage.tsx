import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    fetchCurrentUser,
    getFriends,
    loadFriendInfo,
    sendFriendRequest,
    updateFriendStatus,
    getPersonalConference,
    markMessagesAsRead
} from '../Services/MainFormService';
import { FriendDetails } from '../Components/MainPage/FriendDetails';
import { Friend, FriendRequest } from '../Types/FriendType';
import '../Styles/SteamRecommendationsPage.css';

interface SteamGame {
    appid: number;
    name: string;
    playtime_forever: number;
    img_icon_url: string;
    playtime_2weeks?: number;
}

interface SteamMatchAccount {
    id: string;
    nickname: string;
    email: string;
    firstname?: string;
    lastname?: string;
    phonenumber?: string;
    avatar?: string;
    isOnline: boolean;
    commonGameAppIds: number[];
}

const SteamRecommendationsPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { games: rawGames = [], baseUrl, csrfToken } = location.state || {};

    const [games, setGames] = useState<SteamGame[]>([]);
    const [matches, setMatches] = useState<SteamMatchAccount[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<SteamMatchAccount | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState<{ message: string; isError: boolean } | null>(null);

    // Сортировка игр по убыванию часов
    useEffect(() => {
        if (rawGames && rawGames.length > 0) {
            const sorted = [...rawGames].sort((a, b) => b.playtime_forever - a.playtime_forever);
            setGames(sorted);
        }
    }, [rawGames]);

    // Загрузка текущего пользователя, друзей и матчей
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const userId = await fetchCurrentUser(baseUrl);
                setCurrentUserId(userId);

                // Загружаем список друзей
                const friendsList = await getFriends(userId, baseUrl);
                const loadedFriends = await loadFriendInfo(friendsList, userId, baseUrl);
                setFriends(loadedFriends);

                // Загружаем матчи
                const matchesRes = await fetch(`${baseUrl}/api/steamrecommendations/${userId}/matches`, {
                    credentials: 'include'
                });
                if (!matchesRes.ok) {
                    const err = await matchesRes.json();
                    throw new Error(err.message || 'Ошибка загрузки рекомендаций');
                }
                const data = await matchesRes.json();
                setMatches(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [baseUrl]);

    const showNotification = (message: string, isError = false) => {
        setNotification({ message, isError });
        setTimeout(() => setNotification(null), 3500);
    };

    const getGameIconUrl = (appid: number, hash: string) => {
        return `http://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${hash}.jpg`;
    };

    // Определяем статус дружбы для пользователя
    const getFriendshipStatus = (userId: string): 'none' | 'pending_sent' | 'pending_received' | 'accepted' => {
        const friend = friends.find(f => f.id === userId);
        if (!friend) return 'none';
        if (friend.status === 1) return 'accepted';
        if (friend.status === 0) {
            return friend.userWhoSent === currentUserId ? 'pending_sent' : 'pending_received';
        }
        return 'none';
    };

    const handleAddFriend = async (user: SteamMatchAccount) => {
        try {
            const status = getFriendshipStatus(user.id);
            if (status !== 'none') {
                showNotification('Пользователь уже в друзьях или заявка отправлена', true);
                return;
            }

            if (!currentUserId) {
                showNotification('Ошибка: пользователь не авторизован', true);
                return;
            }

            const request: FriendRequest = {
                userWhoSent: currentUserId,
                userWhoRecieved: user.id,
                status: 0,
                friendsSince: new Date().toISOString()
            };
            await sendFriendRequest(request, baseUrl, csrfToken);
            showNotification(`Заявка дружбы для ${user.nickname} отправлена`, false);

            const tempFriend: Friend = {
                id: user.id,
                nickname: user.nickname,
                avatar: user.avatar || '',
                isOnline: user.isOnline,
                status: 0,
                email: user.email,
                phonenumber: user.phonenumber || '',
                firstname: user.firstname || '',
                lastname: user.lastname || '',
                friendsSince: new Date(),
                userWhoReceived: user.id,
                userWhoSent: currentUserId,
                friendShipId: `temp-${Date.now()}`,
                unreadCount: 0
            };
            setFriends(prev => [...prev, tempFriend]);
        } catch (error) {
            showNotification('Ошибка при отправке заявки', true);
        }
    };

    const handleOpenChat = async (user: SteamMatchAccount) => {
        const status = getFriendshipStatus(user.id);
        if (status !== 'accepted' && status !== 'pending_sent') {
            showNotification('Чат доступен только для друзей или отправленных заявок', true);
            return;
        }

        try {
            const personalConferenceId = await getPersonalConference(currentUserId, user.id, baseUrl, csrfToken);
            navigate("/chat", {
                state: {
                    friends,
                    friendId: user.id,
                    personalConferenceId
                }
            });

            setTimeout(async () => {
                try {
                    const { messageHub } = await import("../Hubs/MessageHub");
                    await messageHub.init();
                    await messageHub.subscribeToConference(personalConferenceId);
                    await markMessagesAsRead(personalConferenceId, baseUrl, csrfToken);
                } catch (error) {
                    console.error("Ошибка инициализации чата:", error);
                }
            }, 0);
        } catch (error) {
            console.error("Ошибка перехода в чат:", error);
            showNotification('Не удалось открыть чат', true);
        }
    };

    const handleUserClick = (user: SteamMatchAccount) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleBack = () => navigate(-1);

    return (
        <motion.div
            className="steam-recommendations-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {notification && (
                <div className={`notification ${notification.isError ? 'error' : ''}`}>
                    {notification.message}
                </div>
            )}

            <div className="steam-header">
                <button className="back-button" onClick={handleBack}>Назад</button>
                <h2>Рекомендации Steam</h2>
                <div className="header-spacer" />
            </div>

            <div className="steam-content">
                <section className="games-section">
                    <h3>Ваши недавние игры</h3>
                    {games.length === 0 ? (
                        <p className="no-games">Нет данных о недавних играх</p>
                    ) : (
                        <div className="games-grid">
                            {games.map((game) => (
                                <div key={game.appid} className="game-card">
                                    <img
                                        src={getGameIconUrl(game.appid, game.img_icon_url)}
                                        alt={game.name}
                                        className="game-icon"
                                        onError={(e) => (e.target as HTMLImageElement).src = '/logo.png'}
                                    />
                                    <div className="game-info">
                                        <div className="game-name">{game.name}</div>
                                        <div className="game-playtime">
                                            {Math.round(game.playtime_forever / 60)} ч
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="matches-section">
                    <h3>Пользователи с похожими играми</h3>
                    {loading ? (
                        <div className="loading-spinner">Загрузка...</div>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : matches.length === 0 ? (
                        <p className="no-matches">Пока нет подходящих пользователей</p>
                    ) : (
                        <div className="matches-list">
                            <AnimatePresence>
                                {matches.map((user) => {
                                    const status = getFriendshipStatus(user.id);
                                    const isFriend = status === 'accepted';
                                    const isPending = status === 'pending_sent';

                                    return (
                                        <motion.div
                                            key={user.id}
                                            className="match-card"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            whileHover={{ scale: 1.01 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="match-avatar-container" onClick={() => handleUserClick(user)}>
                                                <img
                                                    src={user.avatar || '/logo.png'}
                                                    alt={user.nickname}
                                                    className="match-avatar"
                                                    onError={(e) => (e.target as HTMLImageElement).src = '/logo.png'}
                                                />
                                            </div>
                                            <div className="match-info" onClick={() => handleUserClick(user)}>
                                                <div className="match-nickname">{user.nickname}</div>
                                                <div className="match-name">
                                                    {user.firstname} {user.lastname}
                                                </div>
                                                <div className={`match-status ${user.isOnline ? 'online' : 'offline'}`}>
                                                    {user.isOnline ? 'В сети' : 'Не в сети'}
                                                </div>
                                                {/* Иконки общих игр */}
                                                {user.commonGameAppIds.length > 0 && (
                                                    <div className="common-games">
                                                        {user.commonGameAppIds.map(appid => {
                                                            const game = games.find(g => g.appid === appid);
                                                            return game ? (
                                                                <img
                                                                    key={appid}
                                                                    src={getGameIconUrl(appid, game.img_icon_url)}
                                                                    alt={game.name}
                                                                    className="common-game-icon"
                                                                    title={game.name}
                                                                />
                                                            ) : null;
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="match-actions">
                                                {!isFriend && !isPending && (
                                                    <button
                                                        className="match-add-btn"
                                                        onClick={() => handleAddFriend(user)}
                                                        title="Добавить в друзья"
                                                    >
                                                        👤
                                                    </button>
                                                )}
                                                {isPending && (
                                                    <span className="pending-label">Заявка отправлена</span>
                                                )}
                                                <button
                                                    className="match-chat-btn"
                                                    onClick={() => handleOpenChat(user)}
                                                    disabled={!isFriend && !isPending}
                                                    title={isFriend || isPending ? 'Открыть чат' : 'Чат доступен только для друзей'}
                                                >
                                                    💬
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </section>
            </div>

            {selectedUser && (
                <FriendDetails
                    friend={{
                        id: selectedUser.id,
                        nickname: selectedUser.nickname,
                        avatar: selectedUser.avatar || '',
                        isOnline: selectedUser.isOnline,
                        status: getFriendshipStatus(selectedUser.id) === 'accepted' ? 1 : 0,
                        email: selectedUser.email,
                        phonenumber: selectedUser.phonenumber || '',
                        firstname: selectedUser.firstname || '',
                        lastname: selectedUser.lastname || '',
                        friendsSince: new Date(),
                        userWhoReceived: selectedUser.id,
                        userWhoSent: currentUserId!,
                        friendShipId: friends.find(f => f.id === selectedUser.id)?.friendShipId || '',
                        unreadCount: 0
                    }}
                    friends={friends}
                    setFriends={setFriends}
                    onAccept={async (friend) => {
                        await updateFriendStatus(friend.friendShipId, 1, baseUrl, csrfToken);
                        showNotification('Заявка принята');
                    }}
                    onCancel={async (friend) => {
                        // Логика отмены/удаления
                    }}
                    filter="all"
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setTimeout(() => setSelectedUser(null), 300);
                    }}
                    baseUrl={baseUrl}
                    csrfToken={csrfToken}
                />
            )}
        </motion.div>
    );
};

export default SteamRecommendationsPage;