import React, { useRef, useEffect, useState, useCallback } from 'react';
import { HubConnection } from '@microsoft/signalr';
import { extractYouTubeVideoId } from '../../Utils/youtubeHelpers'; // вынесем в отдельный файл

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
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const [playerReady, setPlayerReady] = useState(false);
    const [videoId, setVideoId] = useState<string | null>(null);
    const isSyncingFromRemote = useRef(false);
    const isDestroyingRef = useRef(false);

    // Для отслеживания локальной перемотки
    const lastLocalTimeRef = useRef<number>(0);
    const lastRemoteSyncTimeRef = useRef<number>(0);

    useEffect(() => {
        const id = extractYouTubeVideoId(videoUrl);
        console.log('YouTubeCinema: Video URL changed, extracted ID:', id);
        setVideoId(id);
        setPlayerReady(false);
    }, [videoUrl]);

    useEffect(() => {
        if (!videoId) return;

        const initPlayer = () => {
            if (!playerContainerRef.current || isDestroyingRef.current) return;

            try {
                if (playerContainerRef.current.firstChild) {
                    playerContainerRef.current.removeChild(playerContainerRef.current.firstChild);
                }

                playerRef.current = new (window as any).YT.Player(playerContainerRef.current, {
                    videoId: videoId,
                    playerVars: {
                        autoplay: 0,
                        controls: 1,
                        modestbranding: 1,
                        rel: 0,
                        fs: 1,
                    },
                    events: {
                        onReady: () => {
                            console.log('YouTubeCinema: Player ready');
                            setPlayerReady(true);
                            lastLocalTimeRef.current = 0;
                        },
                        onStateChange: handlePlayerStateChange,
                        onError: (error: any) => console.error('YouTube player error:', error),
                    },
                });
                console.log('YouTubeCinema: Player created for video:', videoId);
            } catch (err) {
                console.error('YouTubeCinema: Error initializing player:', err);
            }
        };

        if ((window as any).YT && (window as any).YT.Player) {
            initPlayer();
        } else {
            console.log('YouTubeCinema: Loading YouTube API');
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            tag.async = true;
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

            (window as any).onYouTubeIframeAPIReady = () => {
                console.log('YouTubeCinema: YouTube API ready');
                initPlayer();
            };
        }

        return () => {
            isDestroyingRef.current = true;
            if (playerRef.current?.destroy) {
                try {
                    playerRef.current.destroy();
                    console.log('YouTubeCinema: Player destroyed');
                } catch (err) {
                    console.error('YouTubeCinema: Error destroying player:', err);
                }
            }
            playerRef.current = null;
            setPlayerReady(false);
            isDestroyingRef.current = false;
        };
    }, [videoId]);

    const handlePlayerStateChange = useCallback((event: any) => {
        if (!playerReady || !connection || isSyncingFromRemote.current) return;

        const playerState = event.data;
        let action = '';
        if (playerState === 1) action = 'play';
        else if (playerState === 2) action = 'pause';
        else if (playerState === 0) action = 'ended';

        if (action) {
            console.log('YouTubeCinema: Sending player action:', action);
            connection.invoke('SyncPlayerAction', roomId, action, 0).catch((err: any) => {
                console.error('YouTubeCinema: Error sending player action:', err);
            });
        }
    }, [playerReady, connection, roomId]);

    // Отслеживание локальной перемотки (только при воспроизведении)
    useEffect(() => {
        if (!playerReady || !connection) return;

        let interval: ReturnType<typeof setInterval> | null = null;

        const checkLocalSeek = () => {
            if (!playerRef.current || !connection || isSyncingFromRemote.current) return;

            try {
                const state = playerRef.current.getPlayerState();
                if (state === 1) { // PLAYING
                    const currentTime = playerRef.current.getCurrentTime();
                    const diff = Math.abs(currentTime - lastLocalTimeRef.current);

                    // Если разница больше 1 секунды и это не результат удалённой синхронизации
                    if (diff > 1.0 && Math.abs(currentTime - lastRemoteSyncTimeRef.current) > 0.5) {
                        console.log('YouTubeCinema: Local seek detected, sending seek to:', currentTime);
                        connection.invoke('SyncPlayerAction', roomId, 'seek', currentTime)
                            .catch((err: any) => console.error('YouTubeCinema: Error sending seek:', err));
                        lastLocalTimeRef.current = currentTime;
                    } else {
                        // Обновляем lastLocalTime только если разница небольшая (нормальное воспроизведение)
                        lastLocalTimeRef.current = currentTime;
                    }
                }
            } catch (err) {
                console.error('YouTubeCinema: Error in checkLocalSeek:', err);
            }
        };

        interval = setInterval(checkLocalSeek, 500); // проверяем каждые 500 мс

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [playerReady, connection, roomId]);

    // Применение входящих команд синхронизации
    useEffect(() => {
        if (!connection) {
            console.warn('YouTubeCinema: SignalR connection is not available');
            return;
        }

        const handler = (action: string, data: number, senderId?: string) => {
            if (!playerRef.current || !playerReady) {
                console.warn('YouTubeCinema: Player not ready for action:', action);
                return;
            }

            console.log('YouTubeCinema: Received action from server:', action, 'data:', data, 'sender:', senderId);

            isSyncingFromRemote.current = true;
            try {
                switch (action) {
                    case 'play':
                        playerRef.current.playVideo();
                        console.log('YouTubeCinema: Playing video');
                        break;
                    case 'pause':
                        playerRef.current.pauseVideo();
                        console.log('YouTubeCinema: Pausing video');
                        break;
                    case 'ended':
                        playerRef.current.stopVideo();
                        console.log('YouTubeCinema: Stopping video');
                        break;
                    case 'seek':
                        const seekTime = Math.max(0, data);
                        playerRef.current.seekTo(seekTime, true);
                        lastRemoteSyncTimeRef.current = seekTime;
                        lastLocalTimeRef.current = seekTime;
                        console.log('YouTubeCinema: Seeking to:', seekTime);
                        break;
                    default:
                        console.warn('YouTubeCinema: Unknown action:', action);
                }
            } catch (err) {
                console.error('YouTubeCinema: Error applying action:', err);
            } finally {
                // Увеличиваем таймаут, чтобы точно не сработала локальная реакция
                setTimeout(() => {
                    isSyncingFromRemote.current = false;
                }, 300);
            }
        };

        console.log('YouTubeCinema: Registering PlayerActionReceived listener');
        connection.on('PlayerActionReceived', handler);

        return () => {
            console.log('YouTubeCinema: Unregistering PlayerActionReceived listener');
            connection.off('PlayerActionReceived', handler);
        };
    }, [connection, playerReady]);

    if (!videoId) return <div className="youtube-error">Неверная ссылка на YouTube видео</div>;

    return <div
        ref={playerContainerRef}
        className="youtube-player"
        style={{ width: '100%', height: '100%', minHeight: '300px' }}
    />;
};

export default YouTubeCinema;