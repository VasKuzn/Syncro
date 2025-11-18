import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useEffect, useRef, useCallback } from "react";

interface UseRtcConnectionParams {
    onRemoteStream?: (stream: MediaStream) => void;
    onLocalStream?: (stream: MediaStream) => void;
    onIceCandidateReceived?: (candidate: RTCIceCandidate) => void;
    onCallEnded?: (senderId: string) => void;
    onIncomingCall?: (senderId: string) => void;
}

const UseRtcConnection = ({
    onRemoteStream,
    onLocalStream,
    onIceCandidateReceived,
    onCallEnded,
    onIncomingCall,
}: UseRtcConnectionParams) => {
    const connectionRef = useRef<HubConnection | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    const ICE_SERVERS: RTCConfiguration = {
        iceServers: [
            { urls: "stun:stun.relay.metered.ca:80" },
            { urls: "stun:stun.metered.ca:80" },
            { urls: "stun:stun.nextcloud.com:443" },
            { urls: "stun:stun.voip.blackberry.com:3478" },
            { urls: "stun:stun.voipgate.com:3478" },
            { urls: "stun:stun.12connect.com:3478" },
            { urls: "stun:stun.12voip.com:3478" },
            { urls: "stun:stun.1und1.de:3478" },
            { urls: "stun:stun.3cx.com:3478" },
            { urls: "stun:stun.acrobits.cz:3478" },

            { urls: "stun:stun.sipgate.net:3478" },
            { urls: "stun:stun.telnyx.com:3478" },
            { urls: "stun:stun.voip.ms:3478" },
        ],
    };

    const initializePeerConnection = useCallback((receiverId: string) => {
        if (peerConnectionRef.current) {
            return peerConnectionRef.current;
        }

        const peerConnection = new RTCPeerConnection(ICE_SERVERS);

        peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                connectionRef.current?.invoke("SendIceCandidate", receiverId, JSON.stringify(event.candidate)).catch(err => {
                    console.error("Error sending ICE candidate:", err);
                });
            }
        };

        peerConnection.ontrack = (event: RTCTrackEvent) => {
            if (onRemoteStream && event.streams[0]) {
                onRemoteStream(event.streams[0]);
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
        try {
            const peerConnection = initializePeerConnection(receiverId);

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    peerConnection.addTrack(track, localStreamRef.current!);
                });
            }

            const offer = await peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
            });

            await peerConnection.setLocalDescription(offer);
            await connectionRef.current?.invoke("SendOffer", receiverId, JSON.stringify(offer));

            console.log("Offer sent");
        } catch (err) {
            console.error("Error creating offer:", err);
        }
    }, [initializePeerConnection]);

    const handleReceiveOffer = useCallback(async (senderId: string, offerString: string) => {
        try {
            console.log("Received offer from:", senderId);

            onIncomingCall?.(senderId);

            const peerConnection = initializePeerConnection(senderId);

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    peerConnection.addTrack(track, localStreamRef.current!);
                });
            }

            const offer = JSON.parse(offerString) as RTCSessionDescriptionInit;
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            await connectionRef.current?.invoke("SendAnswer", senderId, JSON.stringify(answer));

            console.log("Answer sent to:", senderId);
        } catch (err) {
            console.error("Error handling offer:", err);
        }
    }, [initializePeerConnection, onIncomingCall]);

    const handleReceiveAnswer = useCallback(async (answerString: string) => {
        try {
            if (!peerConnectionRef.current) {
                console.error("PeerConnection not initialized");
                return;
            }

            const answer = JSON.parse(answerString) as RTCSessionDescriptionInit;

            if (peerConnectionRef.current.signalingState === "stable") {
                return;
            }

            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            console.log("Answer received and set");
        } catch (err) {
            console.error("Error handling answer:", err);
        }
    }, []);

    const handleIceCandidate = useCallback(async (candidateString: string) => {
        try {
            if (!peerConnectionRef.current) {
                console.error("PeerConnection not initialized");
                return;
            }

            const candidateInit = JSON.parse(candidateString) as RTCIceCandidateInit;
            if (candidateInit) {
                const candidate = new RTCIceCandidate(candidateInit);
                await peerConnectionRef.current.addIceCandidate(candidate);
                onIceCandidateReceived?.(candidate);
            }
        } catch (err) {
            console.error("Error adding ICE candidate:", err);
        }
    }, [onIceCandidateReceived]);

    const getLocalStream = useCallback(async (constraints: MediaStreamConstraints = { video: true, audio: true }) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;
            if (onLocalStream) {
                onLocalStream(stream);
            }
            return stream;
        } catch (err) {
            console.error("Error getting local stream:", err);
            throw err;
        }
    }, [onLocalStream]);

    const endCallInternal = useCallback(async (receiverId: string) => {
        try {
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
                localStreamRef.current = null;
            }

            await connectionRef.current?.invoke("EndCall", receiverId);
            onCallEnded?.(receiverId);
        } catch (err) {
            console.error("Error ending call:", err);
        }
    }, [onCallEnded]);

    const getTokenFromCookies = useCallback((): string => {
        const name = "access-token";
        const nameEQ = name + "=";
        const cookies = document.cookie.split(';');

        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.indexOf(nameEQ) === 0) {
                return cookie.substring(nameEQ.length);
            }
        }
        return "";
    }, []);

    useEffect(() => {
        const startConnection = async () => {
            try {
                const connection = new HubConnectionBuilder()
                    .withUrl("http://localhost:5232/videochathub", {
                        accessTokenFactory: () => getTokenFromCookies(),
                        transport: 1,
                        withCredentials: true,
                    })
                    .configureLogging(LogLevel.Warning)
                    .withAutomaticReconnect([0, 0, 0, 1000, 3000, 5000])
                    .build();

                connection.on("ReceiveOffer", (senderId: string, offer: string) => {
                    onIncomingCall?.(senderId);
                    handleReceiveOffer(senderId, offer);
                });

                connection.on("ReceiveAnswer", (answer: string) => {
                    handleReceiveAnswer(answer);
                });

                connection.on("ReceiveIceCandidate", (candidate: string) => {
                    handleIceCandidate(candidate);
                });

                connection.on("CallEnded", () => {
                    if (peerConnectionRef.current) {
                        peerConnectionRef.current.close();
                        peerConnectionRef.current = null;
                    }
                    onCallEnded?.("");
                });

                await connection.start();
                connectionRef.current = connection;
                console.log("SignalR connection established");
            } catch (err) {
                console.error("Error while establishing connection:", err);
            }
        };

        startConnection();

        return () => {
            if (connectionRef.current) {
                connectionRef.current
                    .stop()
                    .catch((err) => console.error("Error stopping connection:", err));
            }
        };
    }, [handleReceiveOffer, handleReceiveAnswer, handleIceCandidate, onCallEnded, onIncomingCall]);

    return {
        createOffer,
        handleReceiveOffer,
        handleReceiveAnswer,
        handleIceCandidate,
        getLocalStream,
        endCall: endCallInternal,
        isConnected: connectionRef.current?.state === "Connected",
    };
};

export default UseRtcConnection;