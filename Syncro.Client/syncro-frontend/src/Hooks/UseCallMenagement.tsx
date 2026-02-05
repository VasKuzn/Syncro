import { useState, useRef, useCallback } from 'react';
import UseRtcConnection from './UseRtcConnection';
import { UseCallManagementProps } from '../Types/ChatTypes';

export const useCallManagement = ({ currentFriend, currentUserId }: UseCallManagementProps) => {
    const [showCallModal, setShowCallModal] = useState(false);
    const [inCall, setInCall] = useState(false);
    const [incomingCall, setIncomingCall] = useState(false);
    const [callInitiator, setCallInitiator] = useState<string | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);

    const rtcConnection = UseRtcConnection({
        onRemoteStream: (stream: MediaStream) => {
            console.log("Remote stream received");
            remoteStreamRef.current = new MediaStream(stream.getTracks());
            setRemoteStream(new MediaStream(stream.getTracks()));
        },
        onLocalStream: (stream: MediaStream) => {
            console.log("Local stream received");
            localStreamRef.current = stream;
            setLocalStream(stream);
        },
        onIceCandidateReceived: (candidate: RTCIceCandidate) => {
            console.log("ICE candidate received:", candidate);
        },
        onCallEnded: (senderId: string) => {
            console.log("Call ended by:", senderId);
            handleEndCall();
        },
        onIncomingCall: (senderId: string) => {
            console.log("Incoming call from:", senderId);
            setCallInitiator(senderId);
            setIncomingCall(true);
            setShowCallModal(true);
        }
    });

    const handleEndCall = useCallback(() => {
        if (currentFriend?.id) {
            rtcConnection.endCall(currentFriend.id);
        }

        setInCall(false);
        setShowCallModal(false);
        setIncomingCall(false);
        setCallInitiator(null);

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        remoteStreamRef.current = null;
    }, [currentFriend?.id, rtcConnection]);

    const handleStartCall = useCallback(async () => {
        if (!currentFriend?.id || !rtcConnection.isConnected) return;

        try {
            await rtcConnection.getLocalStream();
            await rtcConnection.createOffer(currentFriend.id);
            setInCall(true);
            setShowCallModal(false);
            setIncomingCall(false);
        } catch (error) {
            console.error("Failed to start call:", error);
        }
    }, [currentFriend?.id, rtcConnection]);

    const handleAcceptCall = useCallback(async () => {
        try {
            await rtcConnection.getLocalStream();
            setShowCallModal(false);
            setInCall(true);
            setIncomingCall(false);
        } catch (error) {
            console.error("Failed to accept call:", error);
        }
    }, [rtcConnection]);

    const handleRejectCall = useCallback(() => {
        if (callInitiator) {
            rtcConnection.endCall(callInitiator);
        }
        setShowCallModal(false);
        setIncomingCall(false);
        setCallInitiator(null);
    }, [callInitiator, rtcConnection]);

    return {
        showCallModal,
        inCall,
        incomingCall,
        callInitiator,
        remoteStream,
        localStream,
        rtcConnection,
        handleStartCall,
        handleAcceptCall,
        handleRejectCall,
        handleEndCall
    };
};