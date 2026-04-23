import { useState, useCallback, useEffect, useRef } from 'react';
import { useGroupRtcConnection, VideoQuality } from './UseGroupRtcConnection';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import endCallSound from '../assets/minimizing_call.mp3';

interface AudioFilters {
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
}

interface UseGroupCallManagementProps {
    groupId: string;
    currentUserId: string;
    currentUser: { nickname: string; avatar?: string };
    baseUrl: string;
}

export const useGroupCallManagement = ({
    groupId,
    currentUserId,
    currentUser,
    baseUrl,
}: UseGroupCallManagementProps) => {
    const [inCall, setInCall] = useState(false);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [participants, setParticipants] = useState<Set<string>>(new Set());
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [microphoneVolume, setMicrophoneVolume] = useState(1);
    const [audioFilters, setAudioFilters] = useState<AudioFilters>({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    });
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    const hubConnectionRef = useRef<HubConnection | null>(null);
    const aloneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const connectionPromiseRef = useRef<Promise<HubConnection> | null>(null);
    const isMountedRef = useRef(true);

    const handleRemoteStream = useCallback((userId: string, stream: MediaStream) => {
        setRemoteStreams(prev => new Map(prev).set(userId, stream));
    }, []);

    const handleRemoteStreamRemoved = useCallback((userId: string) => {
        setRemoteStreams(prev => {
            const next = new Map(prev);
            next.delete(userId);
            return next;
        });
    }, []);

    const rtcConnection = useGroupRtcConnection({
        roomId: roomId || '',
        signalRConnection: hubConnectionRef.current,
        onRemoteStream: handleRemoteStream,
        onRemoteStreamRemoved: handleRemoteStreamRemoved,
        onLocalStream: setLocalStream,
        currentUserId,
    });

    // Инициализация SignalR с защитой от множественных подключений
    useEffect(() => {
        isMountedRef.current = true;

        const initConnection = async (): Promise<HubConnection> => {
            if (hubConnectionRef.current?.state === 'Connected') {
                return hubConnectionRef.current;
            }

            const connection = new HubConnectionBuilder()
                .withUrl(`${baseUrl}/videochathub`, {
                    transport: 1, // WebSockets
                    withCredentials: true
                })
                .configureLogging(LogLevel.Warning)
                .withAutomaticReconnect()
                .build();

            connection.on("UserConnected", (userId: string) => {
                console.log("UserConnected:", userId);
            });

            connection.on("UserJoinedGroupCall", (userId: string) => {
                console.log("UserJoinedGroupCall:", userId);
                if (!isMountedRef.current) return;
                setParticipants(prev => new Set(prev).add(userId));
                if (userId !== currentUserId) {
                    rtcConnection.callUser(userId);
                }
            });

            connection.on("UserLeftGroupCall", (userId: string) => {
                console.log("UserLeftGroupCall:", userId);
                if (!isMountedRef.current) return;
                setParticipants(prev => {
                    const next = new Set(prev);
                    next.delete(userId);
                    return next;
                });
                handleRemoteStreamRemoved(userId);
            });

            connection.onclose(() => {
                setIsConnected(false);
                hubConnectionRef.current = null;
                connectionPromiseRef.current = null;
            });

            try {
                await connection.start();
                console.log("Group call SignalR connected");
                hubConnectionRef.current = connection;
                setIsConnected(true);
                return connection;
            } catch (err) {
                console.error("Failed to connect to VideoChatHub:", err);
                throw err;
            }
        };

        // Чтобы избежать множественных вызовов start, используем промис
        if (!connectionPromiseRef.current && !isConnected && !isConnecting) {
            setIsConnecting(true);
            connectionPromiseRef.current = initConnection()
                .finally(() => {
                    setIsConnecting(false);
                });
        }

        return () => {
            isMountedRef.current = false;
            // Не останавливаем соединение при размонтировании,
            // так как оно может использоваться другими компонентами.
            // Вместо этого можно оставить, но если страница группового чата единственная,
            // тогда можно и остановить. Пока оставим.
        };
    }, [baseUrl, currentUserId, rtcConnection, handleRemoteStreamRemoved, isConnected, isConnecting]);

    // Очистка таймера при размонтировании
    useEffect(() => {
        return () => {
            if (aloneTimerRef.current) {
                clearTimeout(aloneTimerRef.current);
            }
        };
    }, []);

    // Таймер для одного участника
    useEffect(() => {
        if (participants.size === 1 && inCall) {
            if (aloneTimerRef.current) clearTimeout(aloneTimerRef.current);
            aloneTimerRef.current = setTimeout(() => {
                if (isMountedRef.current) {
                    handleEndCall();
                }
            }, 5 * 60 * 1000);
        } else {
            if (aloneTimerRef.current) {
                clearTimeout(aloneTimerRef.current);
                aloneTimerRef.current = null;
            }
        }
        return () => {
            if (aloneTimerRef.current) clearTimeout(aloneTimerRef.current);
        };
    }, [participants.size, inCall]);

    const startCall = useCallback(async () => {
        if (!hubConnectionRef.current) {
            // Если соединение ещё не готово, ждём его
            if (connectionPromiseRef.current) {
                await connectionPromiseRef.current;
            } else {
                console.error("No SignalR connection");
                return;
            }
        }
        try {
            const newRoomId = await hubConnectionRef.current!.invoke<string>("CreateGroupCall", groupId);
            if (!newRoomId) throw new Error("Failed to create group call room");
            setRoomId(newRoomId);
            setParticipants(new Set([currentUserId]));

            await hubConnectionRef.current!.invoke("JoinGroupCall", newRoomId);

            await rtcConnection.getLocalStream(
                { video: true, audio: true },
                audioFilters,
                microphoneVolume
            );

            setInCall(true);
        } catch (error) {
            console.error("Failed to start group call:", error);
        }
    }, [groupId, rtcConnection, audioFilters, microphoneVolume, currentUserId]);

    const joinCall = useCallback(async (existingRoomId: string) => {
        if (!hubConnectionRef.current) {
            if (connectionPromiseRef.current) await connectionPromiseRef.current;
            else return;
        }
        try {
            setRoomId(existingRoomId);
            await hubConnectionRef.current!.invoke("JoinGroupCall", existingRoomId);
            await rtcConnection.getLocalStream(
                { video: true, audio: true },
                audioFilters,
                microphoneVolume
            );
            setInCall(true);
        } catch (error) {
            console.error("Failed to join group call:", error);
        }
    }, [rtcConnection, audioFilters, microphoneVolume]);

    const handleEndCall = useCallback(() => {
        if (hubConnectionRef.current && roomId) {
            hubConnectionRef.current.invoke("LeaveGroupCall", roomId).catch(console.error);
        }
        rtcConnection.endCall();
        setInCall(false);
        setRoomId(null);
        setParticipants(new Set());
        setRemoteStreams(new Map());
        // Звук завершения
        new Audio(endCallSound).play().catch(() => { });
    }, [roomId, rtcConnection]);

    const handleVolumeChange = useCallback((volume: number) => {
        setMicrophoneVolume(volume);
        rtcConnection.setMicrophoneVolume(volume);
    }, [rtcConnection]);

    const handleQualityChange = useCallback((quality: VideoQuality) => {
        rtcConnection.setVideoQuality(quality);
    }, [rtcConnection]);

    const handleAudioFiltersChange = useCallback((filters: AudioFilters) => {
        setAudioFilters(filters);
        rtcConnection.applyAudioFilters(filters, microphoneVolume);
    }, [rtcConnection, microphoneVolume]);

    return {
        inCall,
        roomId,
        participants,
        remoteStreams,
        localStream,
        startCall,
        joinCall,
        endCall: handleEndCall,
        microphoneVolume,
        audioFilters,
        handleVolumeChange,
        handleQualityChange,
        handleAudioFiltersChange,
        replaceVideoTrack: rtcConnection.replaceVideoTrack,
        signalRConnection: hubConnectionRef.current,
        currentVideoQuality: rtcConnection.currentVideoQuality,
        isConnected,
    };
};