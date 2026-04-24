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

    const [incomingCall, setIncomingCall] = useState(false);
    const [incomingRoomId, setIncomingRoomId] = useState<string | null>(null);
    const [incomingInitiatorId, setIncomingInitiatorId] = useState<string | null>(null);

    const hubConnectionRef = useRef<HubConnection | null>(null);
    const aloneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMountedRef = useRef(false);
    const currentRoomIdRef = useRef<string | null>(null);

    const currentUserIdRef = useRef<string>(currentUserId);
    useEffect(() => {
        currentUserIdRef.current = currentUserId;
    }, [currentUserId]);

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
        signalRConnection: hubConnectionRef.current,
        onRemoteStream: handleRemoteStream,
        onRemoteStreamRemoved: handleRemoteStreamRemoved,
        onLocalStream: setLocalStream,
        currentUserId,
    });

    // ref для актуальных методов rtcConnection, чтобы использовать в подписках без переподключения
    const rtcRef = useRef(rtcConnection);
    useEffect(() => {
        rtcRef.current = rtcConnection;
    });

    useEffect(() => {
        currentRoomIdRef.current = roomId;
    }, [roomId]);

    const waitForConnection = useCallback(async (): Promise<HubConnection> => {
        if (hubConnectionRef.current?.state === 'Connected') {
            return hubConnectionRef.current;
        }
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                if (hubConnectionRef.current?.state === 'Connected') {
                    clearInterval(checkInterval);
                    resolve(hubConnectionRef.current);
                }
            }, 100);
            setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error('Timeout waiting for SignalR connection'));
            }, 15000);
        });
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        const connection = new HubConnectionBuilder()
            .withUrl(`${baseUrl}/videochathub`, {
                transport: 1,
                withCredentials: true
            })
            .configureLogging(LogLevel.Warning)
            .withAutomaticReconnect()
            .build();

        // === Обработчики, не зависящие от WebRTC ===
        connection.on("UserJoinedGroupCall", (userId: string) => {
            console.log(`👤 [GROUP CALL] User ${userId} joined`);
            setParticipants(prev => new Set(prev).add(userId));
            const currentRoom = currentRoomIdRef.current;
            const myId = currentUserIdRef.current;
            if (userId !== myId && myId && currentRoom) {
                console.log(`📞 [SIGNAL] Calling new participant: ${userId}`);
                rtcRef.current.callUser(userId, currentRoom);
            } else if (!myId) {
                console.warn('⚠️ currentUserId is empty, cannot call user');
            } else if (!currentRoom) {
                console.warn(`⚠️ UserJoinedGroupCall but roomId is null, skipping call to ${userId}`);
            }
        });

        connection.on("UserLeftGroupCall", (userId: string) => {
            console.log(`🚪 [GROUP CALL] User ${userId} left`);
            setParticipants(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
            handleRemoteStreamRemoved(userId);
            rtcRef.current.closePeerConnection(userId);
        });

        connection.on("GroupCallStarted", (incomingGroupId: string, callRoomId: string, initiatorId: string) => {
            console.log(`📞 [GROUP CALL] Incoming call for room: ${callRoomId}, from: ${initiatorId}`);
            if (incomingGroupId === groupId) {
                setIncomingCall(true);
                setIncomingRoomId(callRoomId);
                setIncomingInitiatorId(initiatorId);
            }
        });

        connection.on("UserConnected", () => { });

        connection.start()
            .then(() => {
                if (isMountedRef.current) {
                    hubConnectionRef.current = connection;
                    // ========== ГЛАВНОЕ ИЗМЕНЕНИЕ ==========
                    // Немедленная подписка на сигнальные события WebRTC
                    connection.on("ReceiveGroupOffer", (fromUserId: string, roomId: string, offer: string) => {
                        rtcRef.current.handleOffer(fromUserId, roomId, offer);
                    });
                    connection.on("ReceiveGroupAnswer", (fromUserId: string, roomId: string, answer: string) => {
                        rtcRef.current.handleAnswer(fromUserId, roomId, answer);
                    });
                    connection.on("ReceiveGroupIceCandidate", (fromUserId: string, roomId: string, candidate: string) => {
                        rtcRef.current.handleIce(fromUserId, roomId, candidate);
                    });
                    console.log('✅ [GROUP CALL] SignalR connected + WebRTC handlers registered');
                }
            })
            .catch(err => console.error('❌ [GROUP CALL] SignalR start error', err));

        return () => {
            isMountedRef.current = false;
            // отписываемся от сигнальных событий
            connection.off("ReceiveGroupOffer");
            connection.off("ReceiveGroupAnswer");
            connection.off("ReceiveGroupIceCandidate");
            if (hubConnectionRef.current) {
                hubConnectionRef.current.stop().catch(console.error);
                hubConnectionRef.current = null;
            }
        };
    }, [baseUrl, groupId]);

    // Таймер одиночества
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
        try {
            const connection = await waitForConnection();
            setRoomId(callRoomId);
            setInCall(true);
            currentRoomIdRef.current = callRoomId;

            const currentParticipants: string[] = await connection.invoke<string[]>("JoinGroupCall", callRoomId);
            console.log(`🔗 Joined room ${callRoomId}, current participants:`, currentParticipants);

            setParticipants(new Set(currentParticipants));

            await rtcConnection.getLocalStream(
                { video: true, audio: true },
                audioFilters,
                microphoneVolume
            ).catch(mediaErr => console.warn('⚠️ Local media failed:', mediaErr));

            setIncomingCall(false);
            setIncomingRoomId(null);
            setIncomingInitiatorId(null);
        } catch (err) {
            console.error('❌ Failed to join call', err);
            setRoomId(null);
            setInCall(false);
            currentRoomIdRef.current = null;
        }
    }, [waitForConnection, rtcConnection, audioFilters, microphoneVolume]);

    const startCall = useCallback(async (participantIds: string[]) => {
        if (!groupId) return;
        try {
            const connection = await waitForConnection();

            const existingRoomId = await connection.invoke<string>("GetActiveGroupCall", groupId);
            if (existingRoomId) {
                console.log(`🚀 Joining existing active call: ${existingRoomId}`);
                await joinCall(existingRoomId);
                return;
            }

            const newRoomId = await connection.invoke<string>("CreateGroupCall", groupId, participantIds);
            if (!newRoomId) throw new Error("No roomId returned");

            setRoomId(newRoomId);
            setInCall(true);
            currentRoomIdRef.current = newRoomId;

            const currentParticipants: string[] = await connection.invoke<string[]>("JoinGroupCall", newRoomId);
            setParticipants(new Set(currentParticipants));

            await rtcConnection.getLocalStream(
                { video: true, audio: true },
                audioFilters,
                microphoneVolume
            ).catch(mediaErr => console.warn('⚠️ Local media failed:', mediaErr));

        } catch (err) {
            console.error('❌ Failed to start group call', err);
            setRoomId(null);
            setInCall(false);
            currentRoomIdRef.current = null;
        }
    }, [groupId, waitForConnection, rtcConnection, audioFilters, microphoneVolume, joinCall]);

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
        if (hubConnectionRef.current && currentRoomIdRef.current) {
            await hubConnectionRef.current.invoke("LeaveGroupCall", currentRoomIdRef.current).catch(console.error);
        }
        rtcConnection.endCall();
        setInCall(false);
        setRoomId(null);
        currentRoomIdRef.current = null;
        setParticipants(new Set([currentUserIdRef.current]));
        setRemoteStreams(new Map());
        try {
            new Audio(endCallSound).play().catch(() => { });
        } catch { }
    }, [rtcConnection]);

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
        incomingCall,
        incomingRoomId,
        incomingInitiatorId,
        acceptIncomingCall,
        rejectIncomingCall,
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