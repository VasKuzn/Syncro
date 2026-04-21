import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import UseRtcConnection, { VideoQuality } from './UseRtcConnection';
import { UseCallManagementProps } from '../Types/ChatTypes';
import endCallSound from '../assets/minimizing_call.mp3';

interface AudioFilters {
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
}

export const useCallManagement = ({ currentFriend }: UseCallManagementProps, baseUrl: string) => {
    const [showCallModal, setShowCallModal] = useState(false);
    const [inCall, setInCall] = useState(false);
    const [incomingCall, setIncomingCall] = useState(false);
    const [callInitiator, setCallInitiator] = useState<string | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

    const [microphoneVolume, setMicrophoneVolume] = useState(1);
    const [audioFilters, setAudioFilters] = useState<AudioFilters>({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    });

    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const waitingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearWaitingTimeout = useCallback(() => {
        if (waitingTimeoutRef.current) {
            clearTimeout(waitingTimeoutRef.current);
            waitingTimeoutRef.current = null;
        }
    }, []);

    const cleanupMediaTracks = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (remoteStreamRef.current) {
            remoteStreamRef.current.getTracks().forEach(track => track.stop());
            remoteStreamRef.current = null;
        }
        setLocalStream(null);
        setRemoteStream(null);
    }, []);

    const cleanupCallState = useCallback(() => {
        clearWaitingTimeout();
        setInCall(false);
        setShowCallModal(false);
        setIncomingCall(false);
        setCallInitiator(null);
        setCurrentRoomId(null);
        cleanupMediaTracks();
    }, [clearWaitingTimeout, cleanupMediaTracks]);

    const rtcParams = useMemo(() => ({
        onRemoteStream: (stream: MediaStream) => {
            remoteStreamRef.current = stream;
            setRemoteStream(stream);
            stream.getTracks().forEach(track => track.enabled = true);
            clearWaitingTimeout();
        },
        onLocalStream: (stream: MediaStream) => {
            localStreamRef.current = stream;
            setLocalStream(stream);
        },
        onCallEnded: (senderId: string) => {
            try {
                const audio = new Audio(endCallSound);
                audio.play().catch(err => console.warn("Failed to play end call sound:", err));
            } catch (err) {
                console.warn("Audio playback error:", err);
            }
            cleanupCallState();
        },
        onIncomingCall: (senderId: string, roomId: string) => {
            setCallInitiator(senderId);
            setCurrentRoomId(roomId);
            setIncomingCall(true);
            setShowCallModal(true);
        }
    }), [cleanupCallState, clearWaitingTimeout]);

    const rtcConnection = UseRtcConnection(rtcParams, baseUrl);

    const handleLocalEndCall = useCallback(() => {
        clearWaitingTimeout();
        if (currentFriend?.id) {
            rtcConnection.endCall();
        }
        cleanupCallState();
    }, [currentFriend?.id, rtcConnection, cleanupCallState, clearWaitingTimeout]);

    const startWaitingTimeout = useCallback(() => {
        clearWaitingTimeout();
        waitingTimeoutRef.current = setTimeout(() => {
            handleLocalEndCall();
        }, 5 * 60 * 1000);
    }, [clearWaitingTimeout, handleLocalEndCall]);

    useEffect(() => {
        if (inCall && !remoteStream) {
            startWaitingTimeout();
        } else {
            clearWaitingTimeout();
        }
        return () => clearWaitingTimeout();
    }, [inCall, remoteStream, startWaitingTimeout, clearWaitingTimeout]);

    const handleVolumeChange = useCallback((volume: number) => {
        setMicrophoneVolume(volume);
        rtcConnection.setMicrophoneVolume(volume);
    }, [rtcConnection]);

    const handleAudioFiltersChange = useCallback((filters: AudioFilters) => {
        setAudioFilters(filters);
        rtcConnection.applyAudioFilters(filters, microphoneVolume);
    }, [rtcConnection, microphoneVolume]);

    const handleQualityChange = useCallback((quality: VideoQuality) => {
        rtcConnection.setVideoQuality(quality);
    }, [rtcConnection]);

    const handleStartCall = useCallback(async () => {
        if (!currentFriend?.id || !rtcConnection.isConnected) return;

        setInCall(true);
        setShowCallModal(false);
        setIncomingCall(false);

        try {
            await rtcConnection.getLocalStream(
                { video: true, audio: true },
                audioFilters,
                microphoneVolume
            );
            const roomId = await rtcConnection.createOffer(currentFriend.id);
            if (roomId) {
                setCurrentRoomId(roomId);
            }
        } catch (error) {
            console.error("Failed to start call:", error);
            handleLocalEndCall();
        }
    }, [currentFriend?.id, rtcConnection, handleLocalEndCall, audioFilters, microphoneVolume]);

    const handleAcceptCall = useCallback(async () => {
        try {
            await rtcConnection.getLocalStream(
                { video: true, audio: true },
                audioFilters,
                microphoneVolume
            );
            await rtcConnection.acceptCall();
            setShowCallModal(false);
            setInCall(true);
            setIncomingCall(false);
        } catch (error) {
            console.error("Failed to accept call:", error);
            handleLocalEndCall();
        }
    }, [rtcConnection, handleLocalEndCall, audioFilters, microphoneVolume]);

    const handleRejectCall = useCallback(() => {
        clearWaitingTimeout();
        if (callInitiator) {
            rtcConnection.rejectCall();
        }
        cleanupCallState();
    }, [callInitiator, rtcConnection, cleanupCallState, clearWaitingTimeout]);

    const isWaitingForRemote = inCall && !remoteStream;

    return {
        showCallModal,
        inCall,
        incomingCall,
        callInitiator,
        remoteStream,
        localStream,
        rtcConnection,
        currentRoomId,
        handleStartCall,
        handleAcceptCall,
        handleRejectCall,
        handleEndCall: handleLocalEndCall,
        microphoneVolume,
        audioFilters,
        handleVolumeChange,
        handleAudioFiltersChange,
        handleQualityChange,
        currentVideoQuality: rtcConnection.currentVideoQuality,
        isWaitingForRemote,
        // NEW: пробрасываем состояние ICE‑соединения
        iceConnectionState: rtcConnection.iceConnectionState,
    };
};