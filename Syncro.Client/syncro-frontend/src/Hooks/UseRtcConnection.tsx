import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useEffect, useRef, useCallback, useState } from "react";

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
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const [remoteStreamState, setRemoteStreamState] = useState<MediaStream | null>(null);
    const isCallEndingRef = useRef(false);
    const pendingOfferRef = useRef<{ senderId: string; offer: RTCSessionDescriptionInit; } | null>(null);
    const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

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
    };

    const initializePeerConnection = useCallback((receiverId: string) => {
        if (peerConnectionRef.current) {
            return peerConnectionRef.current;
        }

        const peerConnection = new RTCPeerConnection(ICE_SERVERS);

        peerConnection.addTransceiver('video', {
            direction: 'sendrecv',
        });
  
        peerConnection.addTransceiver('audio', {
            direction: 'sendrecv',
        });

        peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (!event.candidate) return;

            if (connectionRef.current?.state !== "Connected") {
                return;
            }
            
            if (event.candidate) {
                connectionRef.current?.invoke("SendIceCandidate", receiverId, JSON.stringify(event.candidate.toJSON())).catch(err => {
                    console.error("Error sending ICE candidate:", err);
                });
            }
        };

        peerConnection.ontrack = (event: RTCTrackEvent) => {
            console.log("ontrack fired. Track:", event.track, "Streams:", event.streams);
    
            if (!remoteStreamRef.current) {
                remoteStreamRef.current = new MediaStream();
            }
            const existingTrack = remoteStreamRef.current
                .getTracks()
                .find(t => t.id === event.track.id);
    
            if (!existingTrack) {
                remoteStreamRef.current.addTrack(event.track);
                console.log(`Added ${event.track.kind} track to remote stream`);
            }
            const updatedStream = new MediaStream(remoteStreamRef.current.getTracks());
    
            setRemoteStreamState(updatedStream);
            onRemoteStream?.(updatedStream);
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

        try {
            const peerConnection = initializePeerConnection(receiverId);
            
            if (!localStreamRef.current) {
                await getLocalStream();
            }

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
        resetCallState();

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

    const handleReceiveAnswer = useCallback(async (answerInit: RTCSessionDescriptionInit) => {
        try {
            if (!peerConnectionRef.current) {
                console.error("PeerConnection not initialized");
                return;
            }

            if (peerConnectionRef.current.signalingState === "stable") {
                return;
            }

            await peerConnectionRef.current.setRemoteDescription(answerInit);

            for (const ice of pendingIceCandidatesRef.current) {
                await peerConnectionRef.current.addIceCandidate(
                    new RTCIceCandidate(ice)
                );
            }
            pendingIceCandidatesRef.current = [];

            console.log("Answer received and set");
        } catch (err) {
            console.error("Error handling answer:", err);
        }
    }, []);

    const handleIceCandidate = useCallback(async (candidateInit: RTCIceCandidateInit) => {
        try {
            if (!peerConnectionRef.current) {
                console.error("PeerConnection not initialized");
                return;
            }
            if (peerConnectionRef.current.signalingState === "closed") return;

            if (!peerConnectionRef.current.remoteDescription) {
                pendingIceCandidatesRef.current.push(candidateInit);
                return;
            }

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
            console.log(
                "VIDEO tracks:",
                stream.getVideoTracks(),
                "AUDIO tracks:",
                stream.getAudioTracks()
            );
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

    const replaceVideoTrack = (track: MediaStreamTrack) => {
        const sender = peerConnectionRef.current
            ?.getSenders()
            .find(s => s.track?.kind === "video");

        sender?.replaceTrack(track);
    };

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
                localStreamRef.current.getTracks().forEach(track => track.stop());
                localStreamRef.current = null;
            }

            if (connectionRef.current?.state === "Connected") {
                await connectionRef.current.invoke("EndCall", receiverId);
            }
        } catch (err) {
            console.error("Error ending call:", err);
        }
    }, []);

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
            if (connectionRef.current) return;

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
                    handleReceiveOffer(senderId, offer);
                });

                connection.on("ReceiveAnswer", (answerJson: string) => {
                    const answerInit = JSON.parse(answerJson);
                    handleReceiveAnswer(answerInit);
                });

                connection.on("ReceiveIceCandidate", (candidateJson: string) => {
                    const candidateInit = JSON.parse(candidateJson) as RTCIceCandidateInit;
                    handleIceCandidate(candidateInit);
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
                connectionRef.current = null;
            }
        };
    }, []);

    return {
        createOffer,
        handleReceiveOffer,
        handleReceiveAnswer,
        handleIceCandidate,
        getLocalStream,
        endCall: endCallInternal,
        replaceVideoTrack,
        isConnected: connectionRef.current?.state === "Connected",
    };
};

export default UseRtcConnection;