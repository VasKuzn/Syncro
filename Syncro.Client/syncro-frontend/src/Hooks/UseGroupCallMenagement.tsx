import { useState, useCallback, useEffect, useRef } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useGroupRtcConnection, VideoQuality } from './UseGroupRtcConnection';
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
    const [participants, setParticipants] = useState<Set<string>>(new Set([currentUserId]));
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [microphoneVolume, setMicrophoneVolume] = useState(1);
    const [audioFilters, setAudioFilters] = useState<AudioFilters>({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    });

    // Состояния для входящего звонка
    const [incomingCall, setIncomingCall] = useState(false);
    const [incomingRoomId, setIncomingRoomId] = useState<string | null>(null);
    const [incomingInitiatorId, setIncomingInitiatorId] = useState<string | null>(null);

    const hubConnectionRef = useRef<HubConnection | null>(null);
    const aloneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const connectionPromiseRef = useRef<Promise<HubConnection> | null>(null);

    // Коллбэки для RTC
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

    // Инициализация RTC-хука (будет вызван, когда roomId определён)
    const rtcConnection = useGroupRtcConnection({
        roomId: roomId || '',
        signalRConnection: hubConnectionRef.current,
        onRemoteStream: handleRemoteStream,
        onRemoteStreamRemoved: handleRemoteStreamRemoved,
        onLocalStream: setLocalStream,
        currentUserId,
    });

    // Подключение к SignalR (единожды)
    const getHubConnection = useCallback(async (): Promise<HubConnection> => {
        if (hubConnectionRef.current?.state === 'Connected') {
            return hubConnectionRef.current;
        }
        if (!connectionPromiseRef.current) {
            connectionPromiseRef.current = (async () => {
                const connection = new HubConnectionBuilder()
                    .withUrl(`${baseUrl}/videochathub`, {
                        transport: 1,
                        withCredentials: true
                    })
                    .configureLogging(LogLevel.Warning)
                    .withAutomaticReconnect()
                    .build();

                connection.on("UserJoinedGroupCall", (userId: string) => {
                    setParticipants(prev => new Set(prev).add(userId));
                    if (userId !== currentUserId) {
                        rtcConnection.callUser(userId);
                    }
                });

                connection.on("UserLeftGroupCall", (userId: string) => {
                    setParticipants(prev => {
                        const next = new Set(prev);
                        next.delete(userId);
                        return next;
                    });
                    handleRemoteStreamRemoved(userId);
                });

                connection.on("GroupCallStarted", (groupId: string, callRoomId: string, initiatorId: string) => {
                    if (groupId === groupId) {
                        setIncomingCall(true);
                        setIncomingRoomId(callRoomId);
                        setIncomingInitiatorId(initiatorId);
                    }
                });

                connection.on("UserConnected", () => {
                    // Можно оставить пустым, чтобы избежать предупреждений
                });

                await connection.start();
                console.log('Group call SignalR connected');
                return connection;
            })();
        }
        return connectionPromiseRef.current;
    }, [baseUrl, currentUserId, groupId, rtcConnection, handleRemoteStreamRemoved]);

    useEffect(() => {
        getHubConnection().then(conn => {
            hubConnectionRef.current = conn;
        }).catch(console.error);

        return () => {
            if (hubConnectionRef.current) {
                hubConnectionRef.current.stop().catch(console.error);
                hubConnectionRef.current = null;
                connectionPromiseRef.current = null;
            }
        };
    }, [getHubConnection]);

    // Таймер для одного участника
    useEffect(() => {
        if (participants.size === 1 && inCall) {
            aloneTimerRef.current = setTimeout(() => {
                handleEndCall();
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

    const joinCall = useCallback(async (callRoomId: string) => {
        const connection = await getHubConnection();
        setRoomId(callRoomId);
        await connection.invoke("JoinGroupCall", callRoomId);
        await rtcConnection.getLocalStream(
            { video: true, audio: true },
            audioFilters,
            microphoneVolume
        );
        setInCall(true);
        setIncomingCall(false);
        setIncomingRoomId(null);
        setIncomingInitiatorId(null);
    }, [getHubConnection, rtcConnection, audioFilters, microphoneVolume]);

    const startCall = useCallback(async () => {
        if (!groupId) return;
        const connection = await getHubConnection();

        // Проверяем, нет ли уже активного звонка в группе
        const existingRoomId = await connection.invoke<string>("GetActiveGroupCall", groupId);
        if (existingRoomId) {
            await joinCall(existingRoomId);
            return;
        }

        // Создаём новый звонок; передаём всех участников группы, чтобы сервер оповестил их
        const participantIds = Array.from(participants);
        const newRoomId = await connection.invoke<string>("CreateGroupCall", groupId, participantIds);
        setRoomId(newRoomId);
        await connection.invoke("JoinGroupCall", newRoomId);
        await rtcConnection.getLocalStream(
            { video: true, audio: true },
            audioFilters,
            microphoneVolume
        );
        setInCall(true);
    }, [groupId, getHubConnection, rtcConnection, audioFilters, microphoneVolume, participants, joinCall]);

    const acceptIncomingCall = useCallback(async () => {
        if (!incomingRoomId) return;
        await joinCall(incomingRoomId);
    }, [incomingRoomId, joinCall]);

    const rejectIncomingCall = useCallback(() => {
        setIncomingCall(false);
        setIncomingRoomId(null);
        setIncomingInitiatorId(null);
    }, []);

    const handleEndCall = useCallback(async () => {
        if (hubConnectionRef.current && roomId) {
            await hubConnectionRef.current.invoke("LeaveGroupCall", roomId).catch(console.error);
        }
        rtcConnection.endCall();
        setInCall(false);
        setRoomId(null);
        setParticipants(new Set([currentUserId]));
        setRemoteStreams(new Map());
        try {
            new Audio(endCallSound).play().catch(() => { });
        } catch { }
    }, [roomId, rtcConnection, currentUserId]);

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
        // Входящий звонок
        incomingCall,
        incomingRoomId,
        incomingInitiatorId,
        acceptIncomingCall,
        rejectIncomingCall,
        // Управление медиа
        microphoneVolume,
        audioFilters,
        handleVolumeChange,
        handleQualityChange,
        handleAudioFiltersChange,
        replaceVideoTrack: rtcConnection.replaceVideoTrack,
        signalRConnection: hubConnectionRef.current,
        currentVideoQuality: rtcConnection.currentVideoQuality,
    };
};