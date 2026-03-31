import { useState, useRef, useCallback, useMemo } from 'react';
import UseRtcConnection, { VideoQuality } from './UseRtcConnection';
import { UseCallManagementProps } from '../Types/ChatTypes';

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

    // Состояния для настроек
    const [microphoneVolume, setMicrophoneVolume] = useState(1);
    const [audioFilters, setAudioFilters] = useState<AudioFilters>({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    });

    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);

    const rtcParams = useMemo(() => ({
        onRemoteStream: (stream: MediaStream) => {
            remoteStreamRef.current = stream;
            setRemoteStream(stream);
            stream.getTracks().forEach(track => {
                track.enabled = true;
            });
        },
        onLocalStream: (stream: MediaStream) => {
            localStreamRef.current = stream;
            setLocalStream(stream);
        },
        onCallEnded: (senderId: string) => {
            handleEndCall();
        },
        onIncomingCall: (senderId: string, roomId: string) => {
            setCallInitiator(senderId);
            setCurrentRoomId(roomId);
            setIncomingCall(true);
            setShowCallModal(true);
        }
    }), []);

    const rtcConnection = UseRtcConnection(rtcParams, baseUrl);

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

    const handleEndCall = useCallback(() => {
        if (currentFriend?.id) {
            rtcConnection.endCall(currentFriend.id);
        }

        setInCall(false);
        setShowCallModal(false);
        setIncomingCall(false);
        setCallInitiator(null);
        setCurrentRoomId(null);

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        remoteStreamRef.current = null;
        setLocalStream(null);
        setRemoteStream(null);
    }, [currentFriend?.id, rtcConnection]);

    const handleStartCall = useCallback(async () => {
        if (!currentFriend?.id || !rtcConnection.isConnected) return;

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
            setInCall(true);
            setShowCallModal(false);
            setIncomingCall(false);
        } catch (error) {
            console.error("Failed to start call:", error);
            handleEndCall();
        }
    }, [currentFriend?.id, rtcConnection, handleEndCall, audioFilters, microphoneVolume]);

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
            handleEndCall();
        }
    }, [rtcConnection, handleEndCall, audioFilters, microphoneVolume]);

    const handleRejectCall = useCallback(() => {
        if (callInitiator) {
            rtcConnection.rejectCall();
            rtcConnection.endCall(callInitiator);
        }
        setShowCallModal(false);
        setIncomingCall(false);
        setCallInitiator(null);
        setCurrentRoomId(null);
    }, [callInitiator, rtcConnection]);

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
        handleEndCall,
        // Настройки
        microphoneVolume,
        audioFilters,
        handleVolumeChange,
        handleAudioFiltersChange,
        handleQualityChange,
        currentVideoQuality: rtcConnection.currentVideoQuality
    };
};