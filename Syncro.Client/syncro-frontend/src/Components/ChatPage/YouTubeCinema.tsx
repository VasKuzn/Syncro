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
    const isMountedRef = useRef(true);

    const videoId = extractYouTubeVideoId(videoUrl);

    const isPlayerFunctional = useCallback(() => {
        return playerRef.current &&
            typeof playerRef.current.playVideo === 'function' &&
            typeof playerRef.current.getPlayerState === 'function';
    }, []);

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
                    break;
                case 'pause':
                    playerRef.current.pauseVideo();
                    break;
                case 'seek':
                    const seekTime = Math.max(0, data);
                    playerRef.current.seekTo(seekTime, true);
                    lastRemoteSyncTimeRef.current = seekTime;
                    lastLocalTimeRef.current = seekTime;
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

    useEffect(() => {
        if (!(window as any).YT && !apiLoadingRef.current) {
            apiLoadingRef.current = true;
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            tag.async = true;
            document.head.appendChild(tag);
            (window as any).onYouTubeIframeAPIReady = () => {
                window.dispatchEvent(new Event('youtube-api-ready'));
            };
        }
    }, []);

    useEffect(() => {
        if (!videoId || !containerRef.current) return;

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
            if (!containerRef.current || !isMountedRef.current) return;
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
                            if (!isMountedRef.current) return;
                            setPlayerReady(true);
                            if (pendingActionRef.current) {
                                const { action, data } = pendingActionRef.current;
                                applyRemoteAction(action, data);
                                pendingActionRef.current = null;
                            }
                        },
                        onStateChange: (event: any) => {
                            if (!isMountedRef.current || !isPlayerFunctional() || !connection || isSyncingFromRemote.current) return;
                            const state = event.data;
                            let action = '';
                            if (state === 1) action = 'play';
                            else if (state === 2) action = 'pause';
                            else if (state === 0) action = 'ended';
                            if (action) {
                                connection.invoke('SyncPlayerAction', roomId, action, 0)
                                    .catch((err: any) => console.error('Error sending action', err));
                            }
                        },
                        onError: (error: any) => console.error('YouTube player error', error),
                    },
                });
            } catch (err) {
                console.error('YouTubeCinema: Failed to create player', err);
                if (isMountedRef.current) {
                    playerInitTimerRef.current = setTimeout(initPlayer, 500);
                }
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
        };
    }, [videoId, applyRemoteAction, connection, roomId, isPlayerFunctional]);

    useEffect(() => {
        if (!connection) return;

        const handler = (action: string, data: number, senderId?: string) => {
            applyRemoteAction(action, data);
        };

        connection.on('PlayerActionReceived', handler);

        return () => {
            connection.off('PlayerActionReceived', handler);
        };
    }, [connection, applyRemoteAction]);

    useEffect(() => {
        if (!playerReady || !connection || !isPlayerFunctional()) return;

        const interval = setInterval(() => {
            if (!isMountedRef.current || !isPlayerFunctional() || isSyncingFromRemote.current) return;
            try {
                const state = playerRef.current.getPlayerState();
                if (state === 1) {
                    const currentTime = playerRef.current.getCurrentTime();
                    const diff = Math.abs(currentTime - lastLocalTimeRef.current);
                    if (diff > 1.0 && Math.abs(currentTime - lastRemoteSyncTimeRef.current) > 0.5) {
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

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

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