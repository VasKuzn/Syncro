import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useEffect, useRef, useCallback, useState } from "react";

interface UseRtcConnectionParams {
    onRemoteStream?: (stream: MediaStream) => void;
    onLocalStream?: (stream: MediaStream) => void;
    onCallEnded?: (senderId: string) => void;
    onIncomingCall?: (senderId: string, roomId: string) => void;
}

const UseRtcConnection = ({
    onRemoteStream,
    onLocalStream,
    onCallEnded,
    onIncomingCall,
}: UseRtcConnectionParams,
    baseUrl: string) => {

    const connectionRef = useRef<HubConnection | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const isCallEndingRef = useRef(false);
    const pendingOfferRef = useRef<{ senderId: string; offer: RTCSessionDescriptionInit; roomId: string; } | null>(null);
    const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
    const currentRoomIdRef = useRef<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const initializationRef = useRef(false);

    const ICE_SERVERS: RTCConfiguration = {
        iceServers: [
            {
                urls: "stun:stun.relay.metered.ca:80",
            },
            {
                urls: "turn:global.relay.metered.ca:80",
                username: "28b984ae9e217db6689a7957",
                credential: "KxZSXNWu8JPGsB42",
            },
            {
                urls: "turn:global.relay.metered.ca:80?transport=tcp",
                username: "28b984ae9e217db6689a7957",
                credential: "KxZSXNWu8JPGsB42",
            },
            {
                urls: "turn:global.relay.metered.ca:443",
                username: "28b984ae9e217db6689a7957",
                credential: "KxZSXNWu8JPGsB42",
            },
            {
                urls: "turns:global.relay.metered.ca:443?transport=tcp",
                username: "28b984ae9e217db6689a7957",
                credential: "KxZSXNWu8JPGsB42",
            },
        ],
    };

    const resetCallState = () => {
        isCallEndingRef.current = false;
        pendingIceCandidatesRef.current = [];
    };

    const replaceVideoTrack = useCallback((track: MediaStreamTrack) => {
        const sender = peerConnectionRef.current
            ?.getSenders()
            .find(s => s.track?.kind === "video");

        if (sender) {
            sender.replaceTrack(track).catch(err => {
                console.error("Error replacing video track:", err);
            });
        } else {
            console.warn("No video sender found, adding track instead");
            if (peerConnectionRef.current && localStreamRef.current) {
                peerConnectionRef.current.addTrack(track, localStreamRef.current);
            }
        }
    }, []);

    const initializePeerConnection = useCallback((roomId: string) => {
        if (peerConnectionRef.current && peerConnectionRef.current.connectionState !== "closed") {
            console.log("Closing existing peer connection");
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        const peerConnection = new RTCPeerConnection(ICE_SERVERS);

        peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (!event.candidate) return;

            if (connectionRef.current?.state !== "Connected") {
                console.warn("Cannot send ICE candidate - SignalR not connected");
                return;
            }

            if (currentRoomIdRef.current) {
                connectionRef.current?.invoke("SendIceCandidate", currentRoomIdRef.current, JSON.stringify(event.candidate.toJSON()))
                    .catch(err => console.error("Error sending ICE candidate:", err));
            }
        };

        peerConnection.ontrack = (event: RTCTrackEvent) => {
            console.log(`ontrack fired: ${event.track.kind}`);

            if (!remoteStreamRef.current) {
                remoteStreamRef.current = new MediaStream();
            }

            const existingTrack = remoteStreamRef.current
                .getTracks()
                .find(t => t.id === event.track.id);

            if (!existingTrack) {
                remoteStreamRef.current.addTrack(event.track);
                console.log(`Added ${event.track.kind} track to remote stream`);
                onRemoteStream?.(remoteStreamRef.current);
            }
        };

        peerConnection.onconnectionstatechange = () => {
            console.log("PeerConnection state:", peerConnection.connectionState);
            if (peerConnection.connectionState === "failed" || peerConnection.connectionState === "disconnected") {
                console.error("PeerConnection failed or disconnected");
            }
        };

        peerConnectionRef.current = peerConnection;
        return peerConnection;
    }, [onRemoteStream]);

    const createOffer = useCallback(async (receiverId: string) => {
        resetCallState();

        if (!isConnected) {
            console.error("Cannot create offer - SignalR not connected");
            return;
        }

        try {
            const roomId = await connectionRef.current?.invoke<string>("CreateCall", receiverId);
            if (!roomId) {
                throw new Error("Failed to create call room");
            }

            console.log("Call room created:", roomId);
            currentRoomIdRef.current = roomId;

            const peerConnection = initializePeerConnection(roomId);

            if (!localStreamRef.current) {
                await getLocalStream();
            }

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    if (!peerConnection.getSenders().find(s => s.track?.id === track.id)) {
                        peerConnection.addTrack(track, localStreamRef.current!);
                        console.log(`Added ${track.kind} track to peer connection`);
                    }
                });
            }

            const offer = await peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
            });

            await peerConnection.setLocalDescription(offer);

            await connectionRef.current?.invoke("JoinCall", roomId);

            await connectionRef.current?.invoke("SendOffer", roomId, JSON.stringify(offer));

            console.log("Offer sent to:", receiverId);
            return roomId;
        } catch (err) {
            console.error("Error creating offer:", err);
            throw err;
        }
    }, [initializePeerConnection, isConnected]);

    const acceptCall = useCallback(async () => {
        if (!pendingOfferRef.current) {
            console.error("No pending offer to accept");
            return;
        }

        const { senderId, offer, roomId } = pendingOfferRef.current;
        resetCallState();

        try {
            currentRoomIdRef.current = roomId;

            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }

            const peerConnection = initializePeerConnection(roomId);

            // Получаем локальный поток ТОЛЬКО если его нет
            if (!localStreamRef.current) {
                try {
                    await getLocalStream();
                } catch (err) {
                    console.error("Error getting local stream, continuing without video:", err);
                    // Продолжаем без видео, но с аудио
                }
            }

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    const existingSender = peerConnection.getSenders().find(s => s.track?.id === track.id);
                    if (!existingSender) {
                        peerConnection.addTrack(track, localStreamRef.current!);
                        console.log(`Added ${track.kind} track to peer connection (answer)`);
                    }
                });
            }

            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            console.log("Remote description set from offer");

            await connectionRef.current?.invoke("JoinCall", roomId);

            for (const ice of pendingIceCandidatesRef.current) {
                try {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(ice));
                    console.log("Added pending ICE candidate");
                } catch (err) {
                    console.warn("Failed to add ICE candidate:", err);
                }
            }
            pendingIceCandidatesRef.current = [];

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            await connectionRef.current?.invoke("SendAnswer", roomId, JSON.stringify(answer));

            console.log("Answer sent to:", senderId);
            pendingOfferRef.current = null;
        } catch (err) {
            console.error("Error accepting call:", err);
            pendingOfferRef.current = null;
            throw err;
        }
    }, [initializePeerConnection]);

    const rejectCall = useCallback(() => {
        if (pendingOfferRef.current) {
            console.log("Rejecting call from:", pendingOfferRef.current.senderId);
            if (connectionRef.current && pendingOfferRef.current.roomId) {
                connectionRef.current.invoke("EndCall", pendingOfferRef.current.roomId)
                    .catch(err => console.error("Error ending call:", err));
            }
            pendingOfferRef.current = null;
        }
        pendingIceCandidatesRef.current = [];
    }, []);

    const handleReceiveOffer = useCallback(async (senderId: string, roomId: string, offerString: string) => {
        resetCallState();

        try {
            console.log("Received offer from:", senderId, "room:", roomId);
            const offer = JSON.parse(offerString) as RTCSessionDescriptionInit;
            pendingOfferRef.current = { senderId, offer, roomId };

            if (onIncomingCall) {
                console.log("Triggering incoming call for sender:", senderId);
                onIncomingCall(senderId, roomId);
            }
        } catch (err) {
            console.error("Error handling offer:", err);
        }
    }, [onIncomingCall]);

    const handleReceiveAnswer = useCallback(async (senderId: string, roomId: string, answerString: string) => {
        try {
            console.log("Received answer from:", senderId, "room:", roomId);

            if (!peerConnectionRef.current) {
                console.error("PeerConnection not initialized");
                return;
            }

            if (!["have-local-offer", "stable"].includes(peerConnectionRef.current.signalingState)) {
                console.warn("Cannot set remote description - signalingState is", peerConnectionRef.current.signalingState);
                return;
            }

            const answer = JSON.parse(answerString) as RTCSessionDescriptionInit;
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            console.log("Answer received and set");

            for (const ice of pendingIceCandidatesRef.current) {
                try {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(ice));
                    console.log("Added pending ICE candidate after answer");
                } catch (err) {
                    console.warn("Failed to add pending ICE candidate:", err);
                }
            }
            pendingIceCandidatesRef.current = [];
        } catch (err) {
            console.error("Error handling answer:", err);
        }
    }, []);

    const handleIceCandidate = useCallback(async (senderId: string, roomId: string, candidateString: string) => {
        try {
            const candidateInit = JSON.parse(candidateString) as RTCIceCandidateInit;

            if (!peerConnectionRef.current || !peerConnectionRef.current.remoteDescription) {
                console.log("Remote description not set yet, buffering ICE candidate");
                pendingIceCandidatesRef.current.push(candidateInit);
                return;
            }

            const candidate = new RTCIceCandidate(candidateInit);
            await peerConnectionRef.current.addIceCandidate(candidate);
            console.log("ICE candidate added successfully");
        } catch (err) {
            console.error("Error adding ICE candidate:", err);
        }
    }, []);

    const getLocalStream = useCallback(async (constraints: MediaStreamConstraints = { video: true, audio: true }) => {
        try {
            // Сначала пробуем с video и audio
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log("Got local stream with video and audio");
            localStreamRef.current = stream;
            if (onLocalStream) {
                onLocalStream(stream);
            }
            return stream;
        } catch (err) {
            console.warn("Error getting full stream, trying audio only:", err);
            try {
                // Если не получилось, пробуем только аудио
                const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                console.log("Got local stream with audio only");
                localStreamRef.current = audioStream;
                if (onLocalStream) {
                    onLocalStream(audioStream);
                }
                return audioStream;
            } catch (audioErr) {
                console.error("Error getting audio stream:", audioErr);
                throw audioErr;
            }
        }
    }, [onLocalStream]);

    const endCallInternal = useCallback(async (receiverId: string) => {
        if (isCallEndingRef.current) {
            return;
        }

        isCallEndingRef.current = true;
        try {
            console.log("Ending call...");

            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    track.stop();
                    console.log(`Stopped ${track.kind} track`);
                });
                localStreamRef.current = null;
            }

            if (connectionRef.current?.state === "Connected" && currentRoomIdRef.current) {
                await connectionRef.current.invoke("EndCall", currentRoomIdRef.current);
            }

            pendingOfferRef.current = null;
            pendingIceCandidatesRef.current = [];
            currentRoomIdRef.current = null;

            onCallEnded?.(receiverId);
        } catch (err) {
            console.error("Error ending call:", err);
        } finally {
            isCallEndingRef.current = false;
        }
    }, [onCallEnded]);

    useEffect(() => {
        if (initializationRef.current || connectionRef.current) {
            return;
        }

        initializationRef.current = true;

        const startConnection = async () => {
            try {
                console.log("Starting SignalR connection to:", `${baseUrl}/videochathub`);

                const connection = new HubConnectionBuilder()
                    .withUrl(`${baseUrl}/videochathub`, {
                        transport: 1,
                        withCredentials: true,
                    })
                    .configureLogging(LogLevel.Warning)
                    .withAutomaticReconnect()
                    .build();

                connection.on("ReceiveOffer", (senderId: string, roomId: string, offer: string) => {
                    console.log("🔥 RECEIVED OFFER! Sender:", senderId, "Room:", roomId);
                    handleReceiveOffer(senderId, roomId, offer);
                });

                connection.on("ReceiveAnswer", (senderId: string, roomId: string, answerJson: string) => {
                    console.log("📞 RECEIVED ANSWER! Sender:", senderId, "Room:", roomId);
                    handleReceiveAnswer(senderId, roomId, answerJson);
                });

                connection.on("ReceiveIceCandidate", (senderId: string, roomId: string, candidateJson: string) => {
                    console.log("🧊 RECEIVED ICE CANDIDATE! Sender:", senderId);
                    handleIceCandidate(senderId, roomId, candidateJson);
                });

                connection.on("CallEnded", (senderId: string) => {
                    console.log("🚫 CALL ENDED by:", senderId);
                    if (peerConnectionRef.current) {
                        peerConnectionRef.current.close();
                        peerConnectionRef.current = null;
                    }
                    onCallEnded?.(senderId);
                    pendingOfferRef.current = null;
                    pendingIceCandidatesRef.current = [];
                    currentRoomIdRef.current = null;
                });

                connection.on("UserJoinedCall", (userId: string) => {
                    console.log("👤 User joined call:", userId);
                });

                connection.onclose((error) => {
                    console.warn("SignalR connection closed:", error);
                    setIsConnected(false);
                });

                connection.onreconnecting((error) => {
                    console.warn("SignalR reconnecting:", error);
                    setIsConnected(false);
                });

                connection.onreconnected((connectionId) => {
                    console.log("SignalR reconnected:", connectionId);
                    setIsConnected(true);
                });

                await connection.start();
                connectionRef.current = connection;
                setIsConnected(true);

                console.log("✅ SignalR connected successfully! ConnectionId:", connection.connectionId);

            } catch (err: any) {
                console.error("❌ Error while establishing SignalR connection:", err);
                setIsConnected(false);
                initializationRef.current = false;
            }
        };

        startConnection();

        return () => {
            console.log("Cleaning up SignalR connection...");
            if (connectionRef.current) {
                connectionRef.current
                    .stop()
                    .then(() => {
                        console.log("SignalR connection stopped");
                        connectionRef.current = null;
                        setIsConnected(false);
                        initializationRef.current = false;
                    })
                    .catch((err) => console.error("Error stopping connection:", err));
            }
        };
    }, []);

    return {
        createOffer,
        acceptCall,
        rejectCall,
        getLocalStream,
        endCall: endCallInternal,
        isConnected,
        replaceVideoTrack,
    };
};

export default UseRtcConnection;