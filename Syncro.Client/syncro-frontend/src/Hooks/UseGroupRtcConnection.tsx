import { HubConnection } from "@microsoft/signalr";
import { useRef, useCallback, useState, useEffect } from "react";
import TurnServerRanker from "../Utils/TurnServerRanker";

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

interface PeerConnectionState {
    pc: RTCPeerConnection;
    remoteStream: MediaStream;
    makingOffer: boolean;
    ignoreOffer: boolean;
    iceCandidateBuffer: RTCIceCandidateInit[];
    isConnected: boolean;
    roomId: string;
}

interface UseGroupRtcConnectionParams {
    signalRConnection: HubConnection | null;
    onRemoteStream: (userId: string, stream: MediaStream) => void;
    onRemoteStreamRemoved: (userId: string) => void;
    onLocalStream: (stream: MediaStream) => void;
    currentUserId: string;
}

interface AudioFilters {
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
}

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

export const useGroupRtcConnection = ({
    signalRConnection,
    onRemoteStream,
    onRemoteStreamRemoved,
    onLocalStream,
    currentUserId,
}: UseGroupRtcConnectionParams) => {
    const peerConnectionsRef = useRef<Map<string, PeerConnectionState>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processedStreamRef = useRef<MediaStream | null>(null);
    const [currentVolume, setCurrentVolume] = useState<number>(1);
    const [currentVideoQuality, setCurrentVideoQuality] = useState<VideoQuality>('medium');
    const turnServerRankerRef = useRef<TurnServerRanker | null>(null);
    const getLocalStreamLockRef = useRef<boolean>(false);

    useEffect(() => {
        if (!turnServerRankerRef.current) {
            turnServerRankerRef.current = new TurnServerRanker();
            turnServerRankerRef.current.initializeServers(ICE_SERVERS.iceServers || []);
        }
    }, []);

    // Сброс буферизованных ICE-кандидатов при восстановлении SignalR
    const flushAllIceCandidates = useCallback(() => {
        if (!signalRConnection || signalRConnection.state !== 'Connected') return;
        peerConnectionsRef.current.forEach((state, userId) => {
            while (state.iceCandidateBuffer.length) {
                const candidate = state.iceCandidateBuffer.shift()!;
                signalRConnection.invoke("SendIceCandidateToUser", state.roomId, userId, JSON.stringify(candidate))
                    .catch(err => console.error("Error sending buffered ICE candidate:", err));
                console.log(`[ICE] Flushed buffered candidate for user ${userId}`);
            }
        });
    }, [signalRConnection]);

    const closePeerConnection = useCallback((userId: string) => {
        const state = peerConnectionsRef.current.get(userId);
        if (state) {
            console.log(`[RTC] Closing PeerConnection for user ${userId}`);
            state.pc.close();
            peerConnectionsRef.current.delete(userId);
        }
    }, []);

    const getLocalStream = useCallback(async (
        constraints: MediaStreamConstraints = { video: true, audio: true },
        audioFilters?: AudioFilters,
        volume: number = 1
    ): Promise<MediaStream | null> => {
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

            let stream: MediaStream | null = null;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { ...(typeof constraints.video === 'object' ? constraints.video : {}), width: videoConstraints.width, height: videoConstraints.height },
                    audio: audioConstraints
                });
            } catch (fullErr) {
                console.warn("Could not get full stream (video+audio), trying audio only:", fullErr);
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: audioConstraints });
                } catch (audioErr) {
                    console.warn("Could not get audio stream, trying video only:", audioErr);
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({ video: { width: videoConstraints.width, height: videoConstraints.height }, audio: false });
                    } catch (videoErr) {
                        console.warn("Could not get any media stream, proceeding without local media:", videoErr);
                        stream = null;
                    }
                }
            }

            if (stream) {
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
                onLocalStream(processedStream);

                // Добавляем треки во все уже созданные PeerConnection
                for (const [userId, state] of peerConnectionsRef.current.entries()) {
                    for (const track of processedStream.getTracks()) {
                        if (!state.pc.getSenders().find(s => s.track?.id === track.id)) {
                            state.pc.addTrack(track, processedStream);
                            console.log(`[RTC] Late-added ${track.kind} track to existing peer ${userId}`);
                        }
                    }
                }

                const videoTrack = processedStream.getVideoTracks()[0];
                if (videoTrack) {
                    peerConnectionsRef.current.forEach(async state => {
                        const sender = state.pc.getSenders().find(s => s.track?.kind === "video");
                        if (sender) {
                            const parameters = sender.getParameters();
                            if (!parameters.encodings) parameters.encodings = [{}];
                            parameters.encodings[0].maxBitrate = VIDEO_QUALITY_SETTINGS[currentVideoQuality].bitrate;
                            await sender.setParameters(parameters);
                        }
                    });
                }
                return processedStream;
            } else {
                localStreamRef.current = null;
                onLocalStream(null as any);
                return null;
            }
        } catch (err) {
            console.error("Unexpected error in getLocalStream:", err);
            localStreamRef.current = null;
            onLocalStream(null as any);
            return null;
        } finally {
            getLocalStreamLockRef.current = false;
        }
    }, [onLocalStream, currentVideoQuality]);

    const createPeerConnection = useCallback((targetUserId: string, roomId: string): RTCPeerConnection => {
        if (targetUserId === currentUserId) {
            console.warn(`[RTC] Attempted to create PeerConnection for self, ignoring`);
            return null!;
        }
        const existing = peerConnectionsRef.current.get(targetUserId);
        if (existing) return existing.pc;

        const rankedServers = turnServerRankerRef.current?.rankServers(ICE_SERVERS.iceServers || []) || ICE_SERVERS.iceServers;
        const pc = new RTCPeerConnection({ ...ICE_SERVERS, iceServers: rankedServers });

        console.log(`[RTC] PeerConnection created for user ${targetUserId} in room ${roomId}`);

        const state: PeerConnectionState = {
            pc,
            remoteStream: new MediaStream(),
            makingOffer: false,
            ignoreOffer: false,
            iceCandidateBuffer: [],
            isConnected: false,
            roomId,
        };
        peerConnectionsRef.current.set(targetUserId, state);

        pc.onnegotiationneeded = async () => {
            try {
                state.makingOffer = true;
                await pc.setLocalDescription();
                console.log(`[SIGNAL] Invoking SendOfferToUser to ${targetUserId} room ${roomId}`);
                await signalRConnection?.invoke("SendOfferToUser", roomId, targetUserId, JSON.stringify(pc.localDescription));
                console.log(`[SIGNAL] Offer sent successfully to ${targetUserId}`);
            } catch (err) {
                console.error("[SIGNAL] Failed to send offer:", err);
            } finally {
                state.makingOffer = false;
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                if (signalRConnection?.state === 'Connected') {
                    signalRConnection.invoke("SendIceCandidateToUser", roomId, targetUserId, JSON.stringify(event.candidate.toJSON()))
                        .catch(err => console.error("Error sending ICE candidate:", err));
                } else {
                    console.warn(`[ICE] Candidate buffered (SignalR not connected) for user ${targetUserId}`);
                    state.iceCandidateBuffer.push(event.candidate.toJSON());
                }
            }
        };

        pc.ontrack = (event) => {
            console.log(`[TRACK] Received ${event.track.kind} from ${targetUserId}`);
            const stream = state.remoteStream;
            if (!stream.getTracks().some(t => t.id === event.track.id)) {
                stream.addTrack(event.track);
            }
            onRemoteStream(targetUserId, stream);
        };

        pc.onconnectionstatechange = () => {
            console.log(`[ICE] ${targetUserId} state: ${pc.iceConnectionState}`);
            if (pc.connectionState === 'connected') {
                state.isConnected = true;
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                closePeerConnection(targetUserId);
                onRemoteStreamRemoved(targetUserId);
            }
        };

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        } else {
            pc.createDataChannel('keepalive', { negotiated: false });
            console.log(`[RTC] No local stream yet, created keepalive data channel for ${targetUserId}`);
        }

        return pc;
    }, [signalRConnection, onRemoteStream, onRemoteStreamRemoved, currentUserId, closePeerConnection]);

    const handleReceiveOffer = useCallback(async (fromUserId: string, roomId: string, offerString: string) => {
        console.log(`[SIGNAL] Received offer from ${fromUserId} for room ${roomId}`);

        if (fromUserId === currentUserId) {
            console.warn('[SIGNAL] Ignoring offer from self');
            return;
        }

        let state = peerConnectionsRef.current.get(fromUserId);
        if (!state) {
            createPeerConnection(fromUserId, roomId);
            state = peerConnectionsRef.current.get(fromUserId)!;
        }
        const pc = state.pc;
        const offer = JSON.parse(offerString);

        const offerCollision = state.makingOffer || pc.signalingState !== "stable";
        if (offerCollision) {
            console.warn(`[SIGNAL] Offer collision, ignoring from ${fromUserId}`);
            return;
        }

        try {
            await pc.setRemoteDescription(offer);
            while (state.iceCandidateBuffer.length) {
                const candidate = state.iceCandidateBuffer.shift()!;
                await pc.addIceCandidate(candidate);
            }
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            signalRConnection?.invoke("SendAnswerToUser", roomId, fromUserId, JSON.stringify(answer));
            console.log(`[SIGNAL] Sent answer to ${fromUserId} for room ${roomId}`);
        } catch (err) {
            console.error("handleReceiveOffer error", err);
        }
    }, [signalRConnection, createPeerConnection, currentUserId]);

    const handleReceiveAnswer = useCallback(async (fromUserId: string, roomId: string, answerString: string) => {
        console.log(`[SIGNAL] Received answer from ${fromUserId} for room ${roomId}`);
        const state = peerConnectionsRef.current.get(fromUserId);
        if (!state) return;
        try {
            const answer = JSON.parse(answerString);
            await state.pc.setRemoteDescription(answer);
            while (state.iceCandidateBuffer.length) {
                const candidate = state.iceCandidateBuffer.shift()!;
                await state.pc.addIceCandidate(candidate);
            }
        } catch (err) {
            console.error("handleReceiveAnswer error", err);
        }
    }, []);

    const handleIceCandidate = useCallback(async (fromUserId: string, roomId: string, candidateString: string) => {
        console.log(`[ICE] Received candidate from ${fromUserId} for room ${roomId}`);
        let state = peerConnectionsRef.current.get(fromUserId);
        if (!state) {
            createPeerConnection(fromUserId, roomId);
            state = peerConnectionsRef.current.get(fromUserId)!;
        }
        const candidate = JSON.parse(candidateString);
        if (!state.pc.remoteDescription) {
            state.iceCandidateBuffer.push(candidate);
            console.log(`[ICE] Candidate buffered (no remote description) for ${fromUserId}`);
        } else {
            try {
                await state.pc.addIceCandidate(candidate);
            } catch (err) {
                console.error("Error adding ICE candidate", err);
            }
        }
    }, [createPeerConnection]);

    const callUser = useCallback((targetUserId: string, roomId: string) => {
        if (targetUserId === currentUserId) {
            console.warn(`[RTC] Skipping call to self (${targetUserId})`);
            return;
        }
        if (peerConnectionsRef.current.has(targetUserId)) return;
        console.log(`[RTC] Calling user ${targetUserId} in room ${roomId}`);
        createPeerConnection(targetUserId, roomId);
    }, [createPeerConnection, currentUserId]);

    const endCall = useCallback(() => {
        console.log(`[RTC] Ending group call, cleaning up ${peerConnectionsRef.current.size} peer connections`);
        peerConnectionsRef.current.forEach((state) => {
            state.pc.close();
        });
        peerConnectionsRef.current.clear();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        if (processedStreamRef.current) {
            processedStreamRef.current.getTracks().forEach(t => t.stop());
            processedStreamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => { });
            audioContextRef.current = null;
            gainNodeRef.current = null;
            sourceNodeRef.current = null;
        }
    }, []);

    const replaceVideoTrack = useCallback((track: MediaStreamTrack) => {
        console.log(`[RTC] Replacing video track in ${peerConnectionsRef.current.size} peers`);
        peerConnectionsRef.current.forEach(state => {
            const sender = state.pc.getSenders().find(s => s.track?.kind === "video");
            if (sender) sender.replaceTrack(track).catch(console.error);
        });
    }, []);

    const setMicrophoneVolume = useCallback((volume: number) => {
        if (gainNodeRef.current) gainNodeRef.current.gain.value = volume;
        setCurrentVolume(volume);
    }, []);

    const applyAudioFilters = useCallback(async (filters: AudioFilters, volume: number) => {
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
                    echoCancellation: filters.echoCancellation,
                    noiseSuppression: filters.noiseSuppression,
                    autoGainControl: filters.autoGainControl,
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
            peerConnectionsRef.current.forEach(state => {
                const audioSender = state.pc.getSenders().find(s => s.track?.kind === "audio");
                if (audioSender) audioSender.replaceTrack(processedAudioTrack).catch(console.error);
            });
            localStreamRef.current = processedStream;
            onLocalStream(processedStream);
            originalAudioTrack.stop();
        } catch (err) {
            console.error("Error applying audio filters:", err);
        }
    }, [onLocalStream]);

    const setVideoQuality = useCallback(async (quality: VideoQuality) => {
        if (!localStreamRef.current) return;
        const settings = VIDEO_QUALITY_SETTINGS[quality];
        setCurrentVideoQuality(quality);
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (!videoTrack) return;
        try {
            await videoTrack.applyConstraints({ width: settings.width, height: settings.height });
            peerConnectionsRef.current.forEach(async state => {
                const sender = state.pc.getSenders().find(s => s.track?.kind === "video");
                if (sender) {
                    const parameters = sender.getParameters();
                    if (!parameters.encodings) parameters.encodings = [{}];
                    parameters.encodings[0].maxBitrate = settings.bitrate;
                    await sender.setParameters(parameters);
                }
            });
        } catch (err) {
            console.error("Failed to set video quality:", err);
        }
    }, []);

    // Отправляем буферизованные ICE при подключении SignalR
    useEffect(() => {
        if (signalRConnection?.state === 'Connected') {
            flushAllIceCandidates();
        }
    }, [signalRConnection?.state, flushAllIceCandidates]);

    useEffect(() => {
        if (!signalRConnection) return;
        signalRConnection.on("ReceiveGroupOffer", handleReceiveOffer);
        signalRConnection.on("ReceiveGroupAnswer", handleReceiveAnswer);
        signalRConnection.on("ReceiveGroupIceCandidate", handleIceCandidate);
        return () => {
            signalRConnection.off("ReceiveGroupOffer", handleReceiveOffer);
            signalRConnection.off("ReceiveGroupAnswer", handleReceiveAnswer);
            signalRConnection.off("ReceiveGroupIceCandidate", handleIceCandidate);
        };
    }, [signalRConnection, handleReceiveOffer, handleReceiveAnswer, handleIceCandidate]);

    return {
        getLocalStream,
        callUser,
        endCall,
        closePeerConnection,
        replaceVideoTrack,
        setMicrophoneVolume,
        setVideoQuality,
        applyAudioFilters,
        currentVideoQuality,
        currentVolume,
    };
};