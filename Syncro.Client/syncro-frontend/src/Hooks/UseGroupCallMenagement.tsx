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

        connection.on("UserJoinedGroupCall", (userId: string) => {
            console.log(`👤 [GROUP CALL] User ${userId} joined`);
            setParticipants(prev => new Set(prev).add(userId));
            const currentRoom = currentRoomIdRef.current;
            if (userId !== currentUserId && currentRoom) {
                console.log(`📞 [SIGNAL] Calling new participant: ${userId}`);
                rtcConnection.callUser(userId, currentRoom);
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
            rtcConnection.closePeerConnection(userId);
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
                    console.log('✅ [GROUP CALL] SignalR connected');
                }
            })
            .catch(err => console.error('❌ [GROUP CALL] SignalR start error', err));

        return () => {
            isMountedRef.current = false;
            if (hubConnectionRef.current) {
                hubConnectionRef.current.stop().catch(console.error);
                hubConnectionRef.current = null;
            }
        };
    }, [baseUrl, groupId]);

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

            // НЕ звоним существующим участникам – они сами позвонят нам через UserJoinedGroupCall
            setIncomingCall(false);
            setIncomingRoomId(null);
            setIncomingInitiatorId(null);
        } catch (err) {
            console.error('❌ Failed to join call', err);
            setRoomId(null);
            setInCall(false);
            currentRoomIdRef.current = null;
        }
    }, [waitForConnection, rtcConnection, audioFilters, microphoneVolume, currentUserId]);

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

            // НЕ звоним существующим участникам – они позвонят нам через UserJoinedGroupCall
        } catch (err) {
            console.error('❌ Failed to start group call', err);
            setRoomId(null);
            setInCall(false);
            currentRoomIdRef.current = null;
        }
    }, [groupId, waitForConnection, rtcConnection, audioFilters, microphoneVolume, joinCall, currentUserId]);

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
        setParticipants(new Set([currentUserId]));
        setRemoteStreams(new Map());
        try {
            new Audio(endCallSound).play().catch(() => { });
        } catch { }
    }, [rtcConnection, currentUserId]);

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