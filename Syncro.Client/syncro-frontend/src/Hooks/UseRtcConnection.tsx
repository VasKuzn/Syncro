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
    const pendingIceCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map()); // Изменено: Map по roomId
    const currentRoomIdRef = useRef<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const initializationRef = useRef(false);

    const ICE_SERVERS: RTCConfiguration = {
        iceServers: [
            // Xirsys STUN
            {
                urls: ["stun:fr-turn8.xirsys.com"]
            },
            // Xirsys TURN
            {
                username: "ZtBjMiIuQtl7QfBuI4H1IP8WWVSVTDC6RvowOWx498dHPODh04APzilXJoc2nsXDAAAAAGmwY_VNdVJSUlppaw==",
                credential: "a0460dc0-1caf-11f1-8f22-be96737d4d7e",
                urls: [
                    "turn:fr-turn8.xirsys.com:80?transport=udp",
                    "turn:fr-turn8.xirsys.com:3478?transport=udp",
                    "turn:fr-turn8.xirsys.com:80?transport=tcp",
                    "turn:fr-turn8.xirsys.com:3478?transport=tcp",
                    "turns:fr-turn8.xirsys.com:443?transport=tcp",
                    "turns:fr-turn8.xirsys.com:5349?transport=tcp"
                ]
            },
            // Google STUN серверы
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun.l.google.com:5349",
                    "stun:stun1.l.google.com:3478",
                    "stun:stun1.l.google.com:5349",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun2.l.google.com:5349",
                    "stun:stun3.l.google.com:3478",
                    "stun:stun3.l.google.com:5349",
                    "stun:stun4.l.google.com:19302",
                    "stun:stun4.l.google.com:5349"
                ]
            },
            // Публичные STUN серверы
            {
                urls: [
                    "stun:stun.ekiga.net:3478",
                    "stun:stun.ideasip.com:3478",
                    "stun:stun.schlund.de:3478",
                    "stun:stun.stunprotocol.org:3478",
                    "stun:stun.voiparound.com:3478",
                    "stun:stun.voipbuster.com:3478",
                    "stun:stun.voipstunt.com:3478",
                    "stun:stun.voxgratia.org:3478"
                ]
            },
            // Metered STUN
            {
                urls: ["stun:stun.relay.metered.ca:80"]
            },
            // Metered TURN
            {
                urls: [
                    "turn:global.relay.metered.ca:80",
                    "turn:global.relay.metered.ca:80?transport=tcp",
                    "turn:global.relay.metered.ca:443",
                    "turns:global.relay.metered.ca:443?transport=tcp"
                ],
                username: "28b984ae9e217db6689a7957",
                credential: "KxZSXNWu8JPGsB42"
            },
            {
                urls: [
                    "turn:openrelay.metered.ca:80",
                    "turn:openrelay.metered.ca:443",
                    "turn:openrelay.metered.ca:443?transport=tcp"
                ],
                username: "openrelayproject",
                credential: "openrelayproject"
            }
        ],
        iceCandidatePoolSize: 20,
        bundlePolicy: "max-bundle",
        rtcpMuxPolicy: "require",
        iceTransportPolicy: "all"
    };

    const resetCallState = (roomId?: string) => {
        isCallEndingRef.current = false;
        if (roomId) {
            pendingIceCandidatesRef.current.delete(roomId);
        } else {
            pendingIceCandidatesRef.current.clear();
        }
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

        // Важно: устанавливаем обработчики ДО создания соединения
        peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (!event.candidate) return;

            if (connectionRef.current?.state !== "Connected") {
                console.warn("Cannot send ICE candidate - SignalR not connected");
                return;
            }

            if (currentRoomIdRef.current) {
                console.log("Sending ICE candidate for room:", currentRoomIdRef.current);
                connectionRef.current?.invoke("SendIceCandidate",
                    currentRoomIdRef.current,
                    JSON.stringify(event.candidate.toJSON()))
                    .catch(err => console.error("Error sending ICE candidate:", err));
            }
        };

        peerConnection.ontrack = (event: RTCTrackEvent) => {
            console.log(`ontrack fired: ${event.track.kind}`);

            if (!remoteStreamRef.current) {
                remoteStreamRef.current = new MediaStream();
            }

            // Проверяем, нет ли уже такого трека
            const existingTrack = remoteStreamRef.current
                .getTracks()
                .find(t => t.id === event.track.id);

            if (!existingTrack) {
                remoteStreamRef.current.addTrack(event.track);
                console.log(`Added ${event.track.kind} track to remote stream`);

                // Важно: уведомляем о новом стриме только когда есть оба трека или по таймауту
                if (remoteStreamRef.current.getTracks().length >= 2) {
                    onRemoteStream?.(remoteStreamRef.current);
                } else {
                    // Если пришел только один трек, ждем второй немного
                    setTimeout(() => {
                        if (remoteStreamRef.current && remoteStreamRef.current.getTracks().length > 0) {
                            onRemoteStream?.(remoteStreamRef.current);
                        }
                    }, 1000);
                }
            }
        };

        peerConnection.onconnectionstatechange = () => {
            console.log("PeerConnection state:", peerConnection.connectionState);

            switch (peerConnection.connectionState) {
                case "connected":
                    console.log("✅ PeerConnection connected successfully!");
                    break;
                case "failed":
                    console.error("❌ PeerConnection failed - attempting restart");
                    if (peerConnectionRef.current && currentRoomIdRef.current) {
                        peerConnectionRef.current.restartIce();

                        setTimeout(() => {
                            if (peerConnectionRef.current?.connectionState === "failed") {
                                console.log("Attempting to recreate peer connection...");
                            }
                        }, 3000);
                    }
                    break;
                case "disconnected":
                    console.warn("⚠️ PeerConnection disconnected - may recover");
                    break;
                case "closed":
                    console.log("PeerConnection closed");
                    break;
            }
        };

        peerConnection.onsignalingstatechange = () => {
            console.log("Signaling state:", peerConnection.signalingState);
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", peerConnection.iceConnectionState);
        };

        peerConnectionRef.current = peerConnection;
        return peerConnection;
    }, [onRemoteStream]);

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

            // Присоединяемся к комнате ПОСЛЕ создания offer
            await connectionRef.current?.invoke("JoinCall", roomId);

            await connectionRef.current?.invoke("SendOffer", roomId, JSON.stringify(offer));

            console.log("Offer sent to:", receiverId);
            return roomId;
        } catch (err) {
            console.error("Error creating offer:", err);
            throw err;
        }
    }, [initializePeerConnection, isConnected, getLocalStream]);

    const acceptCall = useCallback(async () => {
        if (!pendingOfferRef.current) {
            console.error("No pending offer to accept");
            return;
        }

        const { senderId, offer, roomId } = pendingOfferRef.current;
        resetCallState(roomId);

        try {
            console.log("Accepting call in room:", roomId);
            currentRoomIdRef.current = roomId;

            // Сначала присоединяемся к комнате
            await connectionRef.current?.invoke("JoinCall", roomId);
            console.log("Joined room:", roomId);

            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }

            const peerConnection = initializePeerConnection(roomId);

            // Получаем локальный поток
            if (!localStreamRef.current) {
                try {
                    await getLocalStream();
                } catch (err) {
                    console.error("Error getting local stream, continuing without video:", err);
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

            // Устанавливаем remote description из offer
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            console.log("Remote description set from offer");

            // Теперь добавляем все буферизованные ICE кандидаты для этой комнаты
            const candidates = pendingIceCandidatesRef.current.get(roomId) || [];
            console.log(`Adding ${candidates.length} buffered ICE candidates`);
            for (const ice of candidates) {
                try {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(ice));
                    console.log("Added buffered ICE candidate");
                } catch (err) {
                    console.warn("Failed to add buffered ICE candidate:", err);
                }
            }
            pendingIceCandidatesRef.current.delete(roomId);

            // Создаем и отправляем answer
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
    }, [initializePeerConnection, getLocalStream]);

    const rejectCall = useCallback(() => {
        if (pendingOfferRef.current) {
            const roomId = pendingOfferRef.current.roomId; // Сохраняем до очистки
            const senderId = pendingOfferRef.current.senderId; // Сохраняем до очистки

            console.log("Rejecting call from:", senderId);

            if (connectionRef.current && roomId) {
                connectionRef.current.invoke("EndCall", roomId)
                    .catch(err => console.error("Error ending call:", err));
            }

            pendingOfferRef.current = null;
            if (roomId) {
                pendingIceCandidatesRef.current.delete(roomId);
            }
        }
    }, []);

    const handleReceiveOffer = useCallback(async (senderId: string, roomId: string, offerString: string) => {
        resetCallState(roomId);

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

            if (peerConnectionRef.current.signalingState !== "have-local-offer") {
                console.warn("Cannot set remote description - signalingState is", peerConnectionRef.current.signalingState);
                return;
            }

            const answer = JSON.parse(answerString) as RTCSessionDescriptionInit;
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            console.log("Answer received and set");

            // Добавляем буферизованные кандидаты после установки remote description
            const candidates = pendingIceCandidatesRef.current.get(roomId) || [];
            console.log(`Adding ${candidates.length} buffered ICE candidates after answer`);
            for (const ice of candidates) {
                try {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(ice));
                    console.log("Added pending ICE candidate after answer");
                } catch (err) {
                    console.warn("Failed to add pending ICE candidate:", err);
                }
            }
            pendingIceCandidatesRef.current.delete(roomId);
        } catch (err) {
            console.error("Error handling answer:", err);
        }
    }, []);

    const handleIceCandidate = useCallback(async (senderId: string, roomId: string, candidateString: string) => {
        try {
            const candidateInit = JSON.parse(candidateString) as RTCIceCandidateInit;

            // Если это наша комната и peer connection готов
            if (currentRoomIdRef.current === roomId && peerConnectionRef.current?.remoteDescription) {
                const candidate = new RTCIceCandidate(candidateInit);
                await peerConnectionRef.current.addIceCandidate(candidate);
                console.log("ICE candidate added successfully for room:", roomId);
                return;
            }

            // Иначе буферизуем
            console.log(`Buffering ICE candidate for room: ${roomId}`);
            if (!pendingIceCandidatesRef.current.has(roomId)) {
                pendingIceCandidatesRef.current.set(roomId, []);
            }
            pendingIceCandidatesRef.current.get(roomId)!.push(candidateInit);
        } catch (err) {
            console.error("Error handling ICE candidate:", err);
        }
    }, []);

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

            if (remoteStreamRef.current) {
                remoteStreamRef.current.getTracks().forEach(track => track.stop());
                remoteStreamRef.current = null;
            }

            if (connectionRef.current?.state === "Connected" && currentRoomIdRef.current) {
                await connectionRef.current.invoke("EndCall", currentRoomIdRef.current);
            }

            pendingOfferRef.current = null;
            pendingIceCandidatesRef.current.clear();
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
                    console.log("🧊 RECEIVED ICE CANDIDATE! Sender:", senderId, "Room:", roomId);
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
                    pendingIceCandidatesRef.current.clear();
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
    }, [handleReceiveOffer, handleReceiveAnswer, handleIceCandidate, onCallEnded, baseUrl]);

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