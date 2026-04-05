import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useEffect, useRef, useCallback, useState } from "react";
import TurnServerRanker from "../Utils/TurnServerRanker";

interface UseRtcConnectionParams {
    onRemoteStream?: (stream: MediaStream) => void;
    onLocalStream?: (stream: MediaStream) => void;
    onCallEnded?: (senderId: string) => void;
    onIncomingCall?: (senderId: string, roomId: string) => void;
}

export type VideoQuality = 'low' | 'medium' | 'high';

export const VIDEO_QUALITY_SETTINGS = {
    'low': {
        width: { exact: 854, ideal: 854 },
        height: { exact: 480, ideal: 480 },
        bitrate: 500000
    },
    'medium': {
        width: { exact: 1280, ideal: 1280 },
        height: { exact: 720, ideal: 720 },
        bitrate: 1500000
    },
    'high': {
        width: { exact: 1920, ideal: 1920 },
        height: { exact: 1080, ideal: 1080 },
        bitrate: 2500000
    }
};

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
    const pendingIceCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
    const currentRoomIdRef = useRef<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [currentVolume, setCurrentVolume] = useState<number>(1);
    const initializationRef = useRef(false);
    const [currentVideoQuality, setCurrentVideoQuality] = useState<VideoQuality>('medium');

    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processedStreamRef = useRef<MediaStream | null>(null);

    const answerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const turnServerRankerRef = useRef<TurnServerRanker | null>(null);
    const iceConnectionStartTimeRef = useRef<number | null>(null);

    const failedServersRef = useRef<Set<string>>(new Set());
    const connectionAttemptsRef = useRef<number>(0);
    const maxConnectionAttemptsRef = useRef<number>(3);
    const currentAttemptedServerRef = useRef<string | null>(null);
    const iceCandidateBufferRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

    const getLocalStreamLockRef = useRef<boolean>(false);
    const clearAnswerTimeout = useCallback(() => {
        if (answerTimeoutRef.current) {
            clearTimeout(answerTimeoutRef.current);
            answerTimeoutRef.current = null;
        }
    }, []);

    const ICE_SERVERS: RTCConfiguration = {
        iceServers: [
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

    const resetCallState = useCallback((roomId?: string) => {
        isCallEndingRef.current = false;
        if (roomId) {
            pendingIceCandidatesRef.current.delete(roomId);
            iceCandidateBufferRef.current.delete(roomId);
        } else {
            pendingIceCandidatesRef.current.clear();
            iceCandidateBufferRef.current.clear();
        }
        clearAnswerTimeout();
    }, [clearAnswerTimeout]);

    // ====================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ======================
    const replaceVideoTrack = useCallback((track: MediaStreamTrack) => {
        const sender = peerConnectionRef.current
            ?.getSenders()
            .find(s => s.track?.kind === "video");
        if (sender) {
            sender.replaceTrack(track).catch(err => console.error("Error replacing video track:", err));
        } else {
            if (peerConnectionRef.current && localStreamRef.current) {
                peerConnectionRef.current.addTrack(track, localStreamRef.current);
            }
        }
    }, []);

    const applyAudioFilters = useCallback(async (audioConstraints: {
        echoCancellation: boolean;
        noiseSuppression: boolean;
        autoGainControl: boolean;
    }, volume: number) => {
        if (!localStreamRef.current) return;
        try {
            if (audioContextRef.current) {
                await audioContextRef.current.close();
                audioContextRef.current = null;
                gainNodeRef.current = null;
                sourceNodeRef.current = null;
            }
            const originalAudioTrack = localStreamRef.current.getAudioTracks()[0];
            if (!originalAudioTrack) return;
            const newStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: audioConstraints.echoCancellation,
                    noiseSuppression: audioConstraints.noiseSuppression,
                    autoGainControl: audioConstraints.autoGainControl,
                    deviceId: originalAudioTrack.getSettings().deviceId
                }
            });
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(newStream);
            const gainNode = audioContext.createGain();
            const destination = audioContext.createMediaStreamDestination();
            gainNode.gain.value = volume;
            source.connect(gainNode);
            gainNode.connect(destination);
            audioContextRef.current = audioContext;
            gainNodeRef.current = gainNode;
            sourceNodeRef.current = source;
            const processedAudioTrack = destination.stream.getAudioTracks()[0];
            const processedStream = new MediaStream([processedAudioTrack]);
            localStreamRef.current.getVideoTracks().forEach(track => processedStream.addTrack(track));
            processedStreamRef.current = processedStream;
            const audioSender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === "audio");
            if (audioSender) await audioSender.replaceTrack(processedAudioTrack);
            localStreamRef.current = processedStream;
            onLocalStream?.(processedStream);
            originalAudioTrack.stop();
        } catch (err) {
            console.error("Error applying audio filters:", err);
        }
    }, [onLocalStream]);

    const setMicrophoneVolume = useCallback((volume: number) => {
        if (gainNodeRef.current) gainNodeRef.current.gain.value = volume;
        setCurrentVolume(volume);
    }, []);

    const setVideoQuality = useCallback(async (quality: VideoQuality) => {
        if (!peerConnectionRef.current || !localStreamRef.current) return;
        const settings = VIDEO_QUALITY_SETTINGS[quality];
        setCurrentVideoQuality(quality);
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (!videoTrack) return;
        try {
            await videoTrack.applyConstraints({ width: settings.width, height: settings.height });
            const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === "video");
            if (sender) {
                const parameters = sender.getParameters();
                if (!parameters.encodings) parameters.encodings = [{}];
                parameters.encodings[0].maxBitrate = settings.bitrate;
                await sender.setParameters(parameters);
            }
        } catch (err) {
            console.error("Failed to set video quality:", err);
        }
    }, []);

    const initializePeerConnection = useCallback((_roomId: string) => {
        if (peerConnectionRef.current && peerConnectionRef.current.connectionState !== "closed") {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        const iceServers = ICE_SERVERS.iceServers || [];
        if (!turnServerRankerRef.current) {
            turnServerRankerRef.current = new TurnServerRanker();
            turnServerRankerRef.current.initializeServers(iceServers);
        }

        let rankedIceServers = turnServerRankerRef.current.rankServers(iceServers);

        rankedIceServers = turnServerRankerRef.current.prioritizeByProvider(rankedIceServers);

        const availableServers = rankedIceServers.filter(server => {
            const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
            return !urls.some(url => failedServersRef.current.has(url));
        });

        if (availableServers.length === 0) {
            console.warn('All TURN servers have been tried, resetting...');
            failedServersRef.current.clear();
            connectionAttemptsRef.current = 0;
        }

        const serversToUse = availableServers.length > 0 ? availableServers : rankedIceServers;

        const rankedConfig: RTCConfiguration = {
            ...ICE_SERVERS,
            iceServers: serversToUse,
        };

        console.log('TURN servers ranked:', serversToUse.map(s => {
            const urls = Array.isArray(s.urls) ? s.urls[0] : s.urls;
            const stats = turnServerRankerRef.current?.getStats().find(st => st.url === urls);
            const isBlacklisted = turnServerRankerRef.current?.isServerBlacklisted(urls);
            return {
                url: urls,
                rating: stats?.rating ?? 'N/A',
                consecutiveFailures: stats?.consecutiveFailures ?? 0,
                status: isBlacklisted ? 'BLACKLISTED' :
                    failedServersRef.current.has(urls) ? 'TRIED' : 'ACTIVE',
            };
        }));

        iceConnectionStartTimeRef.current = Date.now();
        const peerConnection = new RTCPeerConnection(rankedConfig);

        let firstIceCandidateReceived = false;

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                if (!firstIceCandidateReceived) {
                    firstIceCandidateReceived = true;
                    const candidateAddress = event.candidate.address || event.candidate.candidate;
                    console.log(`ICE candidate from server: ${candidateAddress}`);
                }
            }

            if (!event.candidate) return;

            if (connectionRef.current?.state === "Connected" && currentRoomIdRef.current) {
                connectionRef.current?.invoke("SendIceCandidate", currentRoomIdRef.current, JSON.stringify(event.candidate.toJSON()))
                    .catch(err => console.error("Error sending ICE candidate:", err));
            } else {
                if (!iceCandidateBufferRef.current.has(currentRoomIdRef.current || '')) {
                    iceCandidateBufferRef.current.set(currentRoomIdRef.current || '', []);
                }
                iceCandidateBufferRef.current.get(currentRoomIdRef.current || '')?.push(event.candidate.toJSON());
                console.log(`ICE candidate buffered (SignalR not ready)`);
            }
        };

        peerConnection.ontrack = (event) => {
            if (!remoteStreamRef.current) remoteStreamRef.current = new MediaStream();
            const existingTrack = remoteStreamRef.current.getTracks().find(t => t.id === event.track.id);
            if (!existingTrack) {
                remoteStreamRef.current.addTrack(event.track);
                if (remoteStreamRef.current.getTracks().length >= 2) {
                    if (iceConnectionStartTimeRef.current && turnServerRankerRef.current) {
                        const latency = Date.now() - iceConnectionStartTimeRef.current;
                        const usedServer = serversToUse[0];
                        const serverUrl = Array.isArray(usedServer?.urls)
                            ? usedServer.urls[0]
                            : usedServer?.urls;
                        if (serverUrl) {
                            turnServerRankerRef.current.recordSuccess(serverUrl, latency);
                            turnServerRankerRef.current.logBeaconData(serverUrl, true, latency);
                            console.log(`TURN server success: ${serverUrl}, latency: ${latency}ms`);

                            failedServersRef.current.clear();
                            connectionAttemptsRef.current = 0;
                        }
                    }
                    onRemoteStream?.(remoteStreamRef.current);
                } else {
                    setTimeout(() => {
                        if (remoteStreamRef.current && remoteStreamRef.current.getTracks().length > 0)
                            onRemoteStream?.(remoteStreamRef.current);
                    }, 1000);
                }
            }
        };

        peerConnection.onconnectionstatechange = () => {
            switch (peerConnection.connectionState) {
                case "failed":
                    console.error("PeerConnection failed");

                    if (turnServerRankerRef.current) {
                        const usedServer = serversToUse[0];
                        const serverUrl = Array.isArray(usedServer?.urls)
                            ? usedServer.urls[0]
                            : usedServer?.urls;

                        if (serverUrl) {
                            turnServerRankerRef.current.recordFailure(serverUrl);
                            turnServerRankerRef.current.logBeaconData(serverUrl, false, 0);
                            console.log(`TURN server failure: ${serverUrl}`);

                            failedServersRef.current.add(serverUrl);
                            currentAttemptedServerRef.current = serverUrl;
                        }
                    }

                    connectionAttemptsRef.current++;
                    if (connectionAttemptsRef.current < maxConnectionAttemptsRef.current) {
                        console.warn(
                            `Retrying with different server (attempt ${connectionAttemptsRef.current + 1}/${maxConnectionAttemptsRef.current})`
                        );

                        if (remoteStreamRef.current) {
                            remoteStreamRef.current.getTracks().forEach(track => track.stop());
                            remoteStreamRef.current = null;
                        }

                        if (peerConnectionRef.current) {
                            peerConnectionRef.current.onicecandidate = null;
                            peerConnectionRef.current.ontrack = null;
                            peerConnectionRef.current.onconnectionstatechange = null;
                            peerConnectionRef.current.close();
                            peerConnectionRef.current = null;
                        }

                        iceCandidateBufferRef.current.delete(_roomId);

                        setTimeout(() => {
                            const newPeerConnection = initializePeerConnection(_roomId);
                            if (localStreamRef.current) {
                                localStreamRef.current.getTracks().forEach(track => {
                                    if (!newPeerConnection.getSenders().find(s => s.track?.id === track.id)) {
                                        newPeerConnection.addTrack(track, localStreamRef.current!);
                                    }
                                });
                            }
                        }, 500);
                    } else {
                        console.error(
                            `Failed all connection attempts (${maxConnectionAttemptsRef.current}). No more retries.`
                        );
                        onCallEnded?.("connection_failed");
                    }
                    break;

                case "disconnected":
                    console.warn("PeerConnection disconnected");
                    break;
            }
        };

        peerConnectionRef.current = peerConnection;
        return peerConnection;
    }, [onRemoteStream, onCallEnded]);

    const getLocalStream = useCallback(async (
        constraints: MediaStreamConstraints = { video: true, audio: true },
        audioFilters?: { echoCancellation: boolean; noiseSuppression: boolean; autoGainControl: boolean },
        volume: number = 1
    ) => {
        const startTime = Date.now();
        while (getLocalStreamLockRef.current && Date.now() - startTime < 10000) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        if (localStreamRef.current) {
            const allTracksActive = localStreamRef.current.getTracks().every(track => track.readyState === 'live');
            if (allTracksActive) {
                return localStreamRef.current;
            } else {
                localStreamRef.current.getTracks().forEach(track => track.stop());
                localStreamRef.current = null;
            }
        }

        getLocalStreamLockRef.current = true;

        try {
            const audioConstraints = audioFilters || { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
            const videoConstraints = VIDEO_QUALITY_SETTINGS[currentVideoQuality];
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { ...(typeof constraints.video === 'object' ? constraints.video : {}), width: videoConstraints.width, height: videoConstraints.height },
                audio: audioConstraints
            });
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const gainNode = audioContext.createGain();
            const destination = audioContext.createMediaStreamDestination();
            gainNode.gain.value = volume;
            source.connect(gainNode);
            gainNode.connect(destination);
            audioContextRef.current = audioContext;
            gainNodeRef.current = gainNode;
            sourceNodeRef.current = source;
            const processedAudioTrack = destination.stream.getAudioTracks()[0];
            const processedStream = new MediaStream([processedAudioTrack]);
            stream.getVideoTracks().forEach(track => processedStream.addTrack(track));
            processedStreamRef.current = processedStream;
            localStreamRef.current = processedStream;
            if (onLocalStream) onLocalStream(processedStream);
            const videoTrack = processedStream.getVideoTracks()[0];
            if (videoTrack && peerConnectionRef.current) {
                const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === "video");
                if (sender) {
                    const parameters = sender.getParameters();
                    if (!parameters.encodings) parameters.encodings = [{}];
                    parameters.encodings[0].maxBitrate = VIDEO_QUALITY_SETTINGS[currentVideoQuality].bitrate;
                    await sender.setParameters(parameters);
                }
            }
            return processedStream;
        } catch (err) {
            console.warn("Error getting full stream, trying audio only:", err);
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
                localStreamRef.current = audioStream;
                if (onLocalStream) onLocalStream(audioStream);
                return audioStream;
            } catch (audioErr) {
                console.error("Error getting audio stream:", audioErr);
                if (onCallEnded) onCallEnded("local_error");
                throw audioErr;
            }
        } finally {
            getLocalStreamLockRef.current = false;
        }
    }, [onLocalStream, currentVideoQuality, onCallEnded]);

    // ====================== ОСНОВНЫЕ ФУНКЦИИ ЗВОНКА ======================
    // Функция завершения звонка (должна быть объявлена до createOffer)
    const endCallInternal = useCallback(async () => {
        if (isCallEndingRef.current) return;
        isCallEndingRef.current = true;
        try {
            clearAnswerTimeout();
            if (peerConnectionRef.current) {
                peerConnectionRef.current.onicecandidate = null;
                peerConnectionRef.current.ontrack = null;
                peerConnectionRef.current.onconnectionstatechange = null;
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
            if (audioContextRef.current) {
                await audioContextRef.current.close();
                audioContextRef.current = null;
                gainNodeRef.current = null;
                sourceNodeRef.current = null;
            }
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
                localStreamRef.current = null;
            }
            if (processedStreamRef.current) {
                processedStreamRef.current.getTracks().forEach(track => track.stop());
                processedStreamRef.current = null;
            }
            if (remoteStreamRef.current) {
                remoteStreamRef.current.getTracks().forEach(track => track.stop());
                remoteStreamRef.current = null;
            }
            pendingOfferRef.current = null;
            pendingIceCandidatesRef.current.clear();
            iceCandidateBufferRef.current.clear();
            failedServersRef.current.clear();
            connectionAttemptsRef.current = 0;

            if (connectionRef.current?.state === "Connected" && currentRoomIdRef.current) {
                try {
                    await connectionRef.current.invoke("EndCall", currentRoomIdRef.current);
                } catch (err) { console.error("Error ending call on server:", err); }
            }
            const roomIdToNotify = currentRoomIdRef.current;
            currentRoomIdRef.current = null;
            if (roomIdToNotify) onCallEnded?.(roomIdToNotify);
        } catch (err) {
            console.error("Error ending call:", err);
        } finally {
            isCallEndingRef.current = false;
        }
    }, [onCallEnded, clearAnswerTimeout]);

    const createOffer = useCallback(async (receiverId: string) => {
        resetCallState();
        if (!isConnected) {
            console.error("Cannot create offer - SignalR not connected");
            return;
        }
        try {
            failedServersRef.current.clear();
            connectionAttemptsRef.current = 0;
            const roomId = await connectionRef.current?.invoke<string>("CreateCall", receiverId);
            if (!roomId) throw new Error("Failed to create call room");
            currentRoomIdRef.current = roomId;
            const peerConnection = initializePeerConnection(roomId);
            if (!localStreamRef.current) await getLocalStream();
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    if (!peerConnection.getSenders().find(s => s.track?.id === track.id)) {
                        peerConnection.addTrack(track, localStreamRef.current!);
                    }
                });
            }
            const offer = await peerConnection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
            await peerConnection.setLocalDescription(offer);
            await connectionRef.current?.invoke("JoinCall", roomId);

            setTimeout(() => flushBufferedIceCandidates(), 100);

            await connectionRef.current?.invoke("SendOffer", roomId, JSON.stringify(offer));
            clearAnswerTimeout();
            answerTimeoutRef.current = setTimeout(() => {
                console.warn("No answer received within 30 seconds, ending call");
                endCallInternal();
            }, 30000);
            return roomId;
        } catch (err) {
            console.error("Error creating offer:", err);
            throw err;
        }
    }, [resetCallState, isConnected, initializePeerConnection, getLocalStream, endCallInternal, clearAnswerTimeout]);

    const acceptCall = useCallback(async () => {
        if (!pendingOfferRef.current) {
            console.error("No pending offer to accept");
            return;
        }
        const { offer, roomId } = pendingOfferRef.current;
        resetCallState(roomId);
        failedServersRef.current.clear();
        connectionAttemptsRef.current = 0;
        try {
            currentRoomIdRef.current = roomId;
            await connectionRef.current?.invoke("JoinCall", roomId);

            setTimeout(() => flushBufferedIceCandidates(), 100);

            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
            const peerConnection = initializePeerConnection(roomId);
            if (!localStreamRef.current) {
                try { await getLocalStream(); } catch (err) { console.error("Error getting local stream", err); }
            }
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    if (!peerConnection.getSenders().find(s => s.track?.id === track.id)) {
                        peerConnection.addTrack(track, localStreamRef.current!);
                    }
                });
            }
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const candidates = pendingIceCandidatesRef.current.get(roomId) || [];
            for (const ice of candidates) {
                try { await peerConnection.addIceCandidate(new RTCIceCandidate(ice)); } catch (err) { console.warn(err); }
            }
            pendingIceCandidatesRef.current.delete(roomId);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            await connectionRef.current?.invoke("SendAnswer", roomId, JSON.stringify(answer));
            pendingOfferRef.current = null;
        } catch (err) {
            console.error("Error accepting call:", err);
            pendingOfferRef.current = null;
            throw err;
        }
    }, [resetCallState, initializePeerConnection, getLocalStream]);

    const rejectCall = useCallback(() => {
        if (pendingOfferRef.current) {
            const roomId = pendingOfferRef.current.roomId;
            const senderId = pendingOfferRef.current.senderId;
            if (connectionRef.current && roomId) {
                connectionRef.current.invoke("EndCall", roomId).catch(err => console.error(err));
            }
            pendingOfferRef.current = null;
            if (roomId) {
                pendingIceCandidatesRef.current.delete(roomId);
                iceCandidateBufferRef.current.delete(roomId);
            }
            if (onCallEnded) onCallEnded(senderId);
        }
    }, [onCallEnded]);

    const handleReceiveOffer = useCallback(async (senderId: string, roomId: string, offerString: string) => {
        resetCallState(roomId);
        try {
            const offer = JSON.parse(offerString) as RTCSessionDescriptionInit;
            pendingOfferRef.current = { senderId, offer, roomId };
            currentRoomIdRef.current = roomId;
            if (onIncomingCall) onIncomingCall(senderId, roomId);
        } catch (err) {
            console.error("Error handling offer:", err);
        }
    }, [onIncomingCall, resetCallState]);

    const handleReceiveAnswer = useCallback(async (_senderId: string, roomId: string, answerString: string) => {
        try {
            clearAnswerTimeout();
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
            const candidates = pendingIceCandidatesRef.current.get(roomId) || [];
            for (const ice of candidates) {
                try { await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(ice)); } catch (err) { console.warn(err); }
            }
            pendingIceCandidatesRef.current.delete(roomId);
        } catch (err) {
            console.error("Error handling answer:", err);
        }
    }, [clearAnswerTimeout]);

    const handleIceCandidate = useCallback(async (_senderId: string, roomId: string, candidateString: string) => {
        try {
            const candidateInit = JSON.parse(candidateString) as RTCIceCandidateInit;
            if (currentRoomIdRef.current === roomId && peerConnectionRef.current?.remoteDescription) {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidateInit));
                return;
            }
            if (!pendingIceCandidatesRef.current.has(roomId)) pendingIceCandidatesRef.current.set(roomId, []);
            pendingIceCandidatesRef.current.get(roomId)!.push(candidateInit);
        } catch (err) {
            console.error("Error handling ICE candidate:", err);
        }
    }, []);

    const flushBufferedIceCandidates = useCallback(() => {
        if (!connectionRef.current?.state || connectionRef.current.state !== "Connected") {
            return;
        }
        if (!currentRoomIdRef.current) {
            return;
        }

        const candidates = iceCandidateBufferRef.current.get(currentRoomIdRef.current) || [];
        if (candidates.length > 0) {
            console.log(`Flushing ${candidates.length} buffered ICE candidates for room ${currentRoomIdRef.current}`);
            for (const candidate of candidates) {
                connectionRef.current?.invoke("SendIceCandidate", currentRoomIdRef.current, JSON.stringify(candidate))
                    .catch(err => console.warn("Failed to send buffered ICE candidate:", err));
            }
            iceCandidateBufferRef.current.delete(currentRoomIdRef.current);
        }
    }, []);

    // ====================== SIGNALR СОЕДИНЕНИЕ ======================
    useEffect(() => {
        if (initializationRef.current || connectionRef.current) return;
        initializationRef.current = true;
        const startConnection = async () => {
            try {
                const connection = new HubConnectionBuilder()
                    .withUrl(`${baseUrl}/videochathub`, { transport: 1, withCredentials: true })
                    .configureLogging(LogLevel.Warning)
                    .withAutomaticReconnect()
                    .build();
                connection.on("ReceiveOffer", handleReceiveOffer);
                connection.on("ReceiveAnswer", handleReceiveAnswer);
                connection.on("ReceiveIceCandidate", handleIceCandidate);
                connection.on("CallEnded", (senderId: string) => {
                    console.log("CallEnded received, senderId:", senderId);
                    clearAnswerTimeout();
                    if (peerConnectionRef.current) {
                        peerConnectionRef.current.onicecandidate = null;
                        peerConnectionRef.current.ontrack = null;
                        peerConnectionRef.current.onconnectionstatechange = null;
                        peerConnectionRef.current.close();
                        peerConnectionRef.current = null;
                    }
                    if (audioContextRef.current) {
                        audioContextRef.current.close().catch(() => { });
                        audioContextRef.current = null;
                        gainNodeRef.current = null;
                        sourceNodeRef.current = null;
                    }
                    if (localStreamRef.current) {
                        localStreamRef.current.getTracks().forEach(track => track.stop());
                        localStreamRef.current = null;
                    }
                    if (processedStreamRef.current) {
                        processedStreamRef.current.getTracks().forEach(track => track.stop());
                        processedStreamRef.current = null;
                    }
                    if (remoteStreamRef.current) {
                        remoteStreamRef.current.getTracks().forEach(track => track.stop());
                        remoteStreamRef.current = null;
                    }
                    failedServersRef.current.clear();
                    connectionAttemptsRef.current = 0;
                    pendingOfferRef.current = null;
                    pendingIceCandidatesRef.current.clear();
                    iceCandidateBufferRef.current.clear();
                    currentRoomIdRef.current = null;

                    onCallEnded?.(senderId);
                });
                connection.onclose((error) => { console.warn("SignalR connection closed:", error); setIsConnected(false); });
                connection.onreconnecting((error) => { console.warn("SignalR reconnecting:", error); setIsConnected(false); });
                connection.onreconnected(() => {
                    console.log("SignalR reconnected");
                    setIsConnected(true);
                    setTimeout(() => flushBufferedIceCandidates(), 100);
                });
                await connection.start();
                connectionRef.current = connection;
                setIsConnected(true);
            } catch (err: any) {
                console.error("Error establishing SignalR connection:", err);
                setIsConnected(false);
                initializationRef.current = false;
            }
        };
        startConnection();
        return () => {
            clearAnswerTimeout();
            if (connectionRef.current) {
                connectionRef.current.stop().then(() => {
                    connectionRef.current = null;
                    setIsConnected(false);
                    initializationRef.current = false;
                }).catch(err => console.error("Error stopping connection:", err));
            }
        };
    }, [handleReceiveOffer, handleReceiveAnswer, handleIceCandidate, onCallEnded, baseUrl, clearAnswerTimeout, flushBufferedIceCandidates]);

    return {
        createOffer,
        acceptCall,
        rejectCall,
        getLocalStream,
        endCall: endCallInternal,
        isConnected,
        replaceVideoTrack,
        setMicrophoneVolume,
        setVideoQuality,
        applyAudioFilters,
        currentVideoQuality,
        currentVolume,
    };
};

export default UseRtcConnection;