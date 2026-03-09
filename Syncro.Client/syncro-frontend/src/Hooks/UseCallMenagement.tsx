import { useState, useRef, useCallback, useMemo } from 'react';
import UseRtcConnection from './UseRtcConnection';
import { UseCallManagementProps } from '../Types/ChatTypes';

export const useCallManagement = ({ currentFriend }: UseCallManagementProps, baseUrl: string) => {
    const [showCallModal, setShowCallModal] = useState(false);
    const [inCall, setInCall] = useState(false);
    const [incomingCall, setIncomingCall] = useState(false);
    const [callInitiator, setCallInitiator] = useState<string | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);

    // Мемоизируем параметры для RTC соединения
    const rtcParams = useMemo(() => ({
        onRemoteStream: (stream: MediaStream) => {
            console.log("Remote stream received");
            remoteStreamRef.current = stream;
            setRemoteStream(stream);
            stream.getTracks().forEach(track => {
                track.enabled = true;
            });
        },
        onLocalStream: (stream: MediaStream) => {
            console.log("Local stream received");
            localStreamRef.current = stream;
            setLocalStream(stream);
        },
        onCallEnded: (senderId: string) => {
            console.log("Call ended by:", senderId);
            handleEndCall();
        },
        onIncomingCall: (senderId: string, roomId: string) => {
            console.log("Incoming call from:", senderId, "room:", roomId);
            setCallInitiator(senderId);
            setCurrentRoomId(roomId);
            setIncomingCall(true);
            setShowCallModal(true);
        }
    }), []); // Пустые зависимости, так как функции не меняются

    const rtcConnection = UseRtcConnection(rtcParams, baseUrl);

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
            await rtcConnection.getLocalStream();
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
    }, [currentFriend?.id, rtcConnection, handleEndCall]);

    const handleAcceptCall = useCallback(async () => {
        try {
            await rtcConnection.getLocalStream();
            await rtcConnection.acceptCall();
            setShowCallModal(false);
            setInCall(true);
            setIncomingCall(false);
        } catch (error) {
            console.error("Failed to accept call:", error);
            handleEndCall();
        }
    }, [rtcConnection, handleEndCall]);

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
        handleEndCall
    };
};