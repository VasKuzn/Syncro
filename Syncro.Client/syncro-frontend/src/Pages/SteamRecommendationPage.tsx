// SteamRecommendationsPage.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '../Styles/SteamRecommendationsPage.css';

interface SteamGame {
    appid: number;
    name: string;
    playtime_forever: number;
    img_icon_url: string;
    playtime_2weeks?: number;
}
interface AccountNoPasswordWithIdModel {
    id: string;
    nickname: string;
    email: string;
    firstname?: string;
    lastname?: string;
    phonenumber?: string;
    avatar?: string;
    isOnline: boolean;
}

interface SteamRecommendationsPageProps {
    // Пропсы, если нужны
}

const SteamRecommendationsPage: React.FC<SteamRecommendationsPageProps> = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { games = [], baseUrl } = location.state || {};
    const [matches, setMatches] = useState<AccountNoPasswordWithIdModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                setLoading(true);
                const currentUserRes = await fetch(`${baseUrl}/api/accounts/current`, {
                    credentials: 'include'
                });
                if (!currentUserRes.ok) throw new Error('Не удалось получить текущего пользователя');
                const { userId } = await currentUserRes.json();

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

        fetchMatches();
    }, [baseUrl]);

    const handleBack = () => {
        navigate(-1);
    };

    const getGameIconUrl = (appid: number, hash: string) => {
        return `http://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${hash}.jpg`;
    };

    const handleUserClick = (user: AccountNoPasswordWithIdModel) => {
        // Переход на профиль или чат – зависит от вашей логики
        // Например, открыть модалку с деталями (как FriendDetails)
        console.log('User clicked:', user);
        // Можно реализовать позже
    };

    return (
        <motion.div
            className="steam-recommendations-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="steam-header">
                <button className="back-button" onClick={handleBack}>
                    ← Назад
                </button>
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
                            {games.map((game: SteamGame) => (
                                <div key={game.appid} className="game-card">
                                    <img
                                        src={getGameIconUrl(game.appid, game.img_icon_url)}
                                        alt={game.name}
                                        className="game-icon"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/logo.png';
                                        }}
                                    />
                                    <div className="game-info">
                                        <div className="game-name" title={game.name}>{game.name}</div>
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
                                {matches.map((user) => (
                                    <motion.div
                                        key={user.id}
                                        className="match-card"
                                        onClick={() => handleUserClick(user)}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="match-avatar-container">
                                            <img
                                                src={user.avatar || '/logo.png'}
                                                alt={user.nickname}
                                                className="match-avatar"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/logo.png';
                                                }}
                                            />
                                        </div>
                                        <div className="match-info">
                                            <div className="match-nickname">{user.nickname}</div>
                                            <div className="match-name">
                                                {user.firstname} {user.lastname}
                                            </div>
                                            <div className={`match-status ${user.isOnline ? 'online' : 'offline'}`}>
                                                {user.isOnline ? 'В сети' : 'Не в сети'}
                                            </div>
                                        </div>
                                        <div className="match-actions">
                                            <button className="match-chat-btn">💬</button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </section>
            </div>
        </motion.div>
    );
};

export default SteamRecommendationsPage;