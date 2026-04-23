import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import CallSettings from '../../Utils/CallSettings';
import { VideoQuality } from '../../Hooks/UseGroupRtcConnection';
import micMuteSound from '../../assets/microphone_mute_sound.mp3';

interface GroupParticipant {
    id: string;
    nickname: string;
    avatar?: string;
    isLocal?: boolean;
    stream?: MediaStream;
}

interface GroupVideoCallProps {
    roomId: string;
    participants: GroupParticipant[];
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    onEndCall: () => void;
    localUserName: string;
    localAvatarUrl: string;
    replaceVideoTrack: (track: MediaStreamTrack) => void;
    currentUserId: string;
    onVolumeChange: (volume: number) => void;
    onQualityChange: (quality: VideoQuality) => void;
    onAudioFiltersChange: (filters: { echoCancellation: boolean; noiseSuppression: boolean; autoGainControl: boolean }) => void;
    currentVolume: number;
    currentQuality: VideoQuality;
    currentFilters: { echoCancellation: boolean; noiseSuppression: boolean; autoGainControl: boolean };
}

const GroupVideoCall: React.FC<GroupVideoCallProps> = ({
    participants,
    localStream,
    remoteStreams,
    onEndCall,
    localUserName,
    localAvatarUrl,
    replaceVideoTrack,
    currentUserId,
    onVolumeChange,
    onQualityChange,
    onAudioFiltersChange,
    currentVolume,
    currentQuality,
    currentFilters,
}) => {
    const [localVideoOn, setLocalVideoOn] = useState(true);
    const [localScreenOn, setLocalScreenOn] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [speakingUserId, setSpeakingUserId] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
    const screenStreamRef = useRef<MediaStream | null>(null);
    const currentVideoTrackRef = useRef<MediaStreamTrack | null>(null);

    // Звуки
    const audioMicMute = useRef<HTMLAudioElement | null>(null);
    const audioMicOn = useRef<HTMLAudioElement | null>(null);
    const audioCamera = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioMicMute.current = new Audio(micMuteSound);
        audioMicOn.current = new Audio(micMuteSound);
        audioCamera.current = new Audio(micMuteSound);
    }, []);

    const playSound = (audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
        audioRef.current?.play().catch(() => { });
    };

    // Обновление локального видео
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch(console.warn);
        }
        // Обновляем состояние треков
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            setLocalVideoOn(!!videoTrack && videoTrack.enabled);
            const audioTrack = localStream.getAudioTracks()[0];
            setMicOn(!!audioTrack && audioTrack.enabled);
        }
    }, [localStream]);

    // Обновление удалённых видео при изменении remoteStreams
    useEffect(() => {
        remoteStreams.forEach((stream, userId) => {
            const videoElement = remoteVideoRefs.current.get(userId);
            if (videoElement) {
                videoElement.srcObject = stream;
                videoElement.play().catch(console.warn);
            }
        });
    }, [remoteStreams]);

    const handleToggleCamera = useCallback(() => {
        if (localScreenOn) return;
        playSound(audioCamera);
        if (localStream) {
            const videoTracks = localStream.getVideoTracks();
            if (videoTracks.length > 0) {
                const newState = !videoTracks[0].enabled;
                videoTracks.forEach(t => t.enabled = newState);
                setLocalVideoOn(newState);
            } else {
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then(stream => {
                        const newTrack = stream.getVideoTracks()[0];
                        localStream.addTrack(newTrack);
                        replaceVideoTrack(newTrack);
                        setLocalVideoOn(true);
                    })
                    .catch(err => console.error("Error getting camera:", err));
            }
        }
    }, [localStream, localScreenOn, replaceVideoTrack]);

    const handleToggleMic = useCallback(() => {
        if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            if (audioTracks.length > 0) {
                const newState = !audioTracks[0].enabled;
                audioTracks.forEach(t => t.enabled = newState);
                setMicOn(newState);
                playSound(newState ? audioMicOn : audioMicMute);
            }
        }
    }, [localStream]);

    const handleToggleScreenShare = useCallback(async () => {
        if (!localScreenOn) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];
                if (!screenTrack) return;

                currentVideoTrackRef.current = localStream?.getVideoTracks()[0] || null;

                if (localStream) {
                    if (currentVideoTrackRef.current) {
                        localStream.removeTrack(currentVideoTrackRef.current);
                    }
                    localStream.addTrack(screenTrack);
                }

                replaceVideoTrack(screenTrack);
                screenStreamRef.current = screenStream;
                setLocalScreenOn(true);
                setLocalVideoOn(false);

                screenTrack.onended = () => {
                    handleStopScreenShare();
                };
            } catch (err) {
                console.error("Screen share failed", err);
            }
        } else {
            handleStopScreenShare();
        }
    }, [localScreenOn, localStream, replaceVideoTrack]);

    const handleStopScreenShare = useCallback(() => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
        }
        if (currentVideoTrackRef.current && localStream) {
            const screenTracks = localStream.getVideoTracks();
            screenTracks.forEach(t => localStream.removeTrack(t));
            localStream.addTrack(currentVideoTrackRef.current);
            replaceVideoTrack(currentVideoTrackRef.current);
        }
        setLocalScreenOn(false);
        setLocalVideoOn(true);
    }, [localStream, replaceVideoTrack]);

    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Обнаружение говорящего (упрощённо)
    useEffect(() => {
        if (!localStream) return;
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(localStream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkSpeaking = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            if (average > 30) {
                setSpeakingUserId(currentUserId);
            } else if (speakingUserId === currentUserId) {
                setSpeakingUserId(null);
            }
            requestAnimationFrame(checkSpeaking);
        };
        checkSpeaking();

        return () => {
            audioContext.close();
        };
    }, [localStream, currentUserId, speakingUserId]);

    // Формируем список всех участников для отображения
    const allParticipants: GroupParticipant[] = [
        {
            id: currentUserId,
            nickname: localUserName,
            avatar: localAvatarUrl,
            isLocal: true,
            stream: localStream || undefined,
        },
        ...participants
            .filter(p => p.id !== currentUserId)
            .map(p => ({
                ...p,
                isLocal: false,
                stream: remoteStreams.get(p.id),
            }))
    ];

    // Определяем, показывает ли участник экран
    const isScreenShare = (participant: GroupParticipant) => {
        const stream = participant.stream;
        if (!stream) return false;
        const videoTrack = stream.getVideoTracks()[0];
        return videoTrack?.label?.toLowerCase().includes('screen') ||
            videoTrack?.label?.toLowerCase().includes('display');
    };

    return (
        <motion.div
            ref={containerRef}
            className="group-video-call-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="video-call-header">
                <div className="participants-count">
                    Участники: {allParticipants.length}
                </div>
            </div>

            <div className="video-grid">
                {allParticipants.map(participant => {
                    const isSpeaking = speakingUserId === participant.id;
                    const screenSharing = isScreenShare(participant);

                    return (
                        <div
                            key={participant.id}
                            className={`video-tile ${isSpeaking ? 'speaking' : ''} ${screenSharing ? 'screen-share' : ''}`}
                        >
                            {participant.isLocal ? (
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="video-stream"
                                />
                            ) : participant.stream ? (
                                <video
                                    autoPlay
                                    playsInline
                                    ref={el => {
                                        if (el) {
                                            remoteVideoRefs.current.set(participant.id, el);
                                            el.srcObject = participant.stream || null;
                                            el.play().catch(console.warn);
                                        } else {
                                            remoteVideoRefs.current.delete(participant.id);
                                        }
                                    }}
                                    className="video-stream"
                                />
                            ) : (
                                <div className="avatar-placeholder">
                                    <img src={participant.avatar || '/logo.png'} alt={participant.nickname} />
                                    <div className="connecting-spinner"></div>
                                </div>
                            )}
                            <div className="user-label">
                                {participant.nickname} {participant.isLocal && '(Вы)'}
                                {screenSharing && ' 📺'}
                            </div>
                            {isSpeaking && <div className="speaking-indicator"></div>}
                        </div>
                    );
                })}
            </div>

            <div className="video-controls">
                <button
                    onClick={handleToggleMic}
                    className={`control-btn ${micOn ? '' : 'off'}`}
                    title={micOn ? "Выключить микрофон" : "Включить микрофон"}
                >
                    <img src={micOn ? "/microphone_on_icon.png" : "/microphone_off_icon.png"} alt="Mic" />
                </button>
                <button
                    onClick={handleToggleCamera}
                    className={`control-btn ${localVideoOn ? '' : 'off'}`}
                    disabled={localScreenOn}
                    title={localVideoOn ? "Выключить камеру" : "Включить камеру"}
                >
                    <img src={localVideoOn ? "/video_icon.png" : "/video_slash_icon.png"} alt="Cam" />
                </button>
                <button
                    onClick={handleToggleScreenShare}
                    className={`control-btn ${localScreenOn ? 'active' : ''}`}
                    title={localScreenOn ? "Остановить демонстрацию" : "Демонстрация экрана"}
                >
                    <img src={localScreenOn ? "/screen_stop_demonstration_icon.png" : "/screen_demonstration_icon.png"} alt="Screen" />
                </button>
                <button
                    onClick={toggleFullscreen}
                    className="control-btn"
                    title={isFullscreen ? "Выйти из полноэкранного режима" : "Полный экран"}
                >
                    <img src={isFullscreen ? "/fullscreen_exit_icon.png" : "/fullscreen_icon.png"} alt="Fullscreen" />
                </button>
                <CallSettings
                    onVolumeChange={onVolumeChange}
                    onQualityChange={onQualityChange}
                    onAudioFiltersChange={onAudioFiltersChange}
                    currentQuality={currentQuality}
                    currentVolume={currentVolume}
                    currentFilters={currentFilters}
                />
                <button
                    className="control-btn end-call"
                    onClick={onEndCall}
                    title="Завершить звонок"
                >
                    <img src="/call_remove_icon.png" alt="End call" />
                </button>
            </div>
        </motion.div>
    );
};

export default GroupVideoCall;