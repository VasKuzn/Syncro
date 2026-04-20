import React, { useRef, useEffect, useState, useCallback } from 'react';
import { HubConnection } from '@microsoft/signalr';
import { extractYouTubeVideoId } from '../../Utils/youtubeHelpers';

interface YouTubeCinemaProps {
    videoUrl: string;
    roomId: string;
    connection: HubConnection | null;
    isInitiator: boolean;
}

const YouTubeCinema: React.FC<YouTubeCinemaProps> = ({
    videoUrl,
    roomId,
    connection,
    isInitiator,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const [playerReady, setPlayerReady] = useState(false);
    const isSyncingFromRemote = useRef(false);
    const pendingActionRef = useRef<{ action: string; data: number } | null>(null);
    const lastLocalTimeRef = useRef<number>(0);
    const lastRemoteSyncTimeRef = useRef<number>(0);
    const apiLoadingRef = useRef(false);
    const playerInitTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

    const videoId = extractYouTubeVideoId(videoUrl);

    // Функция проверки готовности плеера к работе
    const isPlayerFunctional = useCallback(() => {
        return playerRef.current &&
            typeof playerRef.current.playVideo === 'function' &&
            typeof playerRef.current.getPlayerState === 'function';
    }, []);

    // Применение удалённой команды
    const applyRemoteAction = useCallback((action: string, data: number) => {
        if (!isPlayerFunctional()) {
            console.warn('YouTubeCinema: Player not functional, caching action', action);
            pendingActionRef.current = { action, data };
            return;
        }
        isSyncingFromRemote.current = true;
        try {
            switch (action) {
                case 'play':
                    playerRef.current.playVideo();
                    console.log('YouTubeCinema: Remote play');
                    break;
                case 'pause':
                    playerRef.current.pauseVideo();
                    console.log('YouTubeCinema: Remote pause');
                    break;
                case 'seek':
                    const seekTime = Math.max(0, data);
                    playerRef.current.seekTo(seekTime, true);
                    lastRemoteSyncTimeRef.current = seekTime;
                    lastLocalTimeRef.current = seekTime;
                    console.log('YouTubeCinema: Remote seek to', seekTime);
                    break;
                default:
                    console.warn('YouTubeCinema: Unknown action', action);
            }
        } catch (err) {
            console.error('YouTubeCinema: Error applying remote action', err);
        } finally {
            setTimeout(() => { isSyncingFromRemote.current = false; }, 300);
        }
    }, [isPlayerFunctional]);

    // Загрузка YouTube API
    useEffect(() => {
        if (!(window as any).YT && !apiLoadingRef.current) {
            apiLoadingRef.current = true;
            console.log('YouTubeCinema: Loading YouTube API script');
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            tag.async = true;
            document.head.appendChild(tag);
            (window as any).onYouTubeIframeAPIReady = () => {
                console.log('YouTubeCinema: YouTube API ready');
                window.dispatchEvent(new Event('youtube-api-ready'));
            };
        }
    }, []);

    // Создание плеера при изменении videoId
    useEffect(() => {
        if (!videoId || !containerRef.current) return;

        // Очищаем старый плеер
        if (playerRef.current) {
            try {
                playerRef.current.destroy();
            } catch (err) {
                console.error('Error destroying old player', err);
            }
            playerRef.current = null;
        }
        setPlayerReady(false);
        pendingActionRef.current = null;
        if (playerInitTimerRef.current) clearTimeout(playerInitTimerRef.current);

        const initPlayer = () => {
            if (!containerRef.current) return;
            // Очищаем контейнер перед вставкой нового плеера
            containerRef.current.innerHTML = '';
            try {
                playerRef.current = new (window as any).YT.Player(containerRef.current, {
                    videoId,
                    playerVars: {
                        autoplay: 0,
                        controls: 1,
                        modestbranding: 1,
                        rel: 0,
                        fs: 1,
                        enablejsapi: 1,
                    },
                    events: {
                        onReady: () => {
                            console.log('YouTubeCinema: Player ready');
                            setPlayerReady(true);
                            // Применяем отложенное действие, если есть
                            if (pendingActionRef.current) {
                                const { action, data } = pendingActionRef.current;
                                applyRemoteAction(action, data);
                                pendingActionRef.current = null;
                            }
                        },
                        onStateChange: (event: any) => {
                            if (!isPlayerFunctional() || !connection || isSyncingFromRemote.current) return;
                            const state = event.data;
                            let action = '';
                            if (state === 1) action = 'play';
                            else if (state === 2) action = 'pause';
                            else if (state === 0) action = 'ended';
                            if (action) {
                                console.log('YouTubeCinema: Sending action', action);
                                connection.invoke('SyncPlayerAction', roomId, action, 0)
                                    .catch((err: any) => console.error('Error sending action', err));
                            }
                        },
                        onError: (error: any) => console.error('YouTube player error', error),
                    },
                });
                console.log('YouTubeCinema: Player created for', videoId);
            } catch (err) {
                console.error('YouTubeCinema: Failed to create player', err);
                // Повторная попытка через 500 мс
                playerInitTimerRef.current = setTimeout(initPlayer, 500);
            }
        };

        const createPlayerWhenApiReady = () => {
            if ((window as any).YT && (window as any).YT.Player) {
                initPlayer();
            } else {
                window.addEventListener('youtube-api-ready', initPlayer, { once: true });
            }
        };

        createPlayerWhenApiReady();

        return () => {
            window.removeEventListener('youtube-api-ready', initPlayer);
            if (playerInitTimerRef.current) clearTimeout(playerInitTimerRef.current);
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (err) {
                    console.error('Error destroying player in cleanup', err);
                }
                playerRef.current = null;
            }
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [videoId, applyRemoteAction, connection, roomId, isPlayerFunctional]);

    // Подписка на события SignalR
    useEffect(() => {
        if (!connection) return;

        const handler = (action: string, data: number, senderId?: string) => {
            console.log('YouTubeCinema: Received', action, data, 'from', senderId);
            applyRemoteAction(action, data);
        };

        connection.on('PlayerActionReceived', handler);
        console.log('YouTubeCinema: Subscribed to PlayerActionReceived');

        return () => {
            connection.off('PlayerActionReceived', handler);
            console.log('YouTubeCinema: Unsubscribed from PlayerActionReceived');
        };
    }, [connection, applyRemoteAction]);

    // Отслеживание локальной перемотки
    useEffect(() => {
        if (!playerReady || !connection || !isPlayerFunctional()) return;

        const interval = setInterval(() => {
            if (!isPlayerFunctional() || isSyncingFromRemote.current) return;
            try {
                const state = playerRef.current.getPlayerState();
                if (state === 1) { // PLAYING
                    const currentTime = playerRef.current.getCurrentTime();
                    const diff = Math.abs(currentTime - lastLocalTimeRef.current);
                    if (diff > 1.0 && Math.abs(currentTime - lastRemoteSyncTimeRef.current) > 0.5) {
                        console.log('YouTubeCinema: Sending seek', currentTime);
                        connection.invoke('SyncPlayerAction', roomId, 'seek', currentTime)
                            .catch(console.error);
                        lastLocalTimeRef.current = currentTime;
                    } else {
                        lastLocalTimeRef.current = currentTime;
                    }
                }
            } catch (err) {
                console.error('YouTubeCinema: Error in seek detection', err);
            }
        }, 500);

        return () => clearInterval(interval);
    }, [playerReady, connection, roomId, isPlayerFunctional]);

    if (!videoId) return <div className="youtube-error">Неверная ссылка на YouTube видео</div>;

    return (
        <div
            ref={containerRef}
            className="youtube-player"
            style={{ width: '100%', height: '100%', minHeight: '300px' }}
        />
    );
};

export default YouTubeCinema;