import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VideoCallProps } from "../../Types/ChatTypes";
import CallSettings from '../../Utils/CallSettings';
import { VideoQuality } from '../../Hooks/UseRtcConnection';
import { UseDraggable } from '../../Hooks/UseDraggable';
import { HubConnection } from '@microsoft/signalr';
import { extractYouTubeVideoId } from '../../Utils/youtubeHelpers';
import micMuteSound from '../../assets/microphone_mute_sound.mp3';
import YouTubeCinema from './YouTubeCinema';

interface AudioFilters {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

interface ExtendedVideoCallProps extends VideoCallProps {
  roomId: string;
  signalRConnection: HubConnection | null;
  currentUserId: string;
}

const VideoCall: React.FC<ExtendedVideoCallProps> = ({
  onEndCall,
  localUserName,
  localAvatarUrl,
  remoteUserName,
  remoteAvatarUrl,
  localStream,
  remoteStream,
  replaceVideoTrack,
  isWaitingForRemote,
  roomId,
  signalRConnection,
  currentUserId,
}) => {
  const [localVideoOn, setLocalVideoOn] = useState(false);
  const [localScreenOn, setLocalScreenOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'pip'>('grid');

  // Состояние кинотеатра (YouTube)
  const [cinemaActive, setCinemaActive] = useState(false);
  const [cinemaVideoUrl, setCinemaVideoUrl] = useState<string | null>(null);
  const [isCinemaInitiator, setIsCinemaInitiator] = useState(false);

  const [microphoneVolume, setMicrophoneVolume] = useState(1);
  const [videoQuality, setVideoQuality] = useState<VideoQuality>('medium');
  const [audioFilters, setAudioFilters] = useState<AudioFilters>({
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteScreenRef = useRef<HTMLVideoElement>(null);
  const currentVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localScreenRef = useRef<HTMLVideoElement>(null);
  const localContainerRef = useRef<HTMLDivElement>(null);

  const audioMicMute = useRef<HTMLAudioElement | null>(null);
  const audioMicOn = useRef<HTMLAudioElement | null>(null);
  const audioCamera = useRef<HTMLAudioElement | null>(null);

  UseDraggable(localContainerRef, layout === 'pip');

  useEffect(() => {
    audioMicMute.current = new Audio(micMuteSound);
    audioMicOn.current = new Audio(micMuteSound);
    audioCamera.current = new Audio(micMuteSound);
    audioMicMute.current.load();
    audioMicOn.current.load();
    audioCamera.current.load();
  }, []);

  const playSound = useCallback((audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.warn("Playback failed:", err));
    }
  }, []);

  useEffect(() => {
    if (layout !== 'pip' && localContainerRef.current) {
      localContainerRef.current.style.position = '';
      localContainerRef.current.style.left = '';
      localContainerRef.current.style.top = '';
      localContainerRef.current.style.right = '';
      localContainerRef.current.style.bottom = '';
      localContainerRef.current.style.zIndex = '';
      localContainerRef.current.style.cursor = '';
      localContainerRef.current.style.userSelect = '';
    }
  }, [layout]);

  const handleVolumeChange = useCallback((volume: number) => {
    setMicrophoneVolume(volume);
    if ((window as any).onMicrophoneVolumeChange) (window as any).onMicrophoneVolumeChange(volume);
  }, []);

  const handleQualityChange = useCallback((quality: VideoQuality) => {
    setVideoQuality(quality);
    if ((window as any).onVideoQualityChange) (window as any).onVideoQualityChange(quality);
  }, []);

  const handleAudioFiltersChange = useCallback((filters: AudioFilters) => {
    setAudioFilters(filters);
    if ((window as any).onAudioFiltersChange) (window as any).onAudioFiltersChange(filters);
  }, []);

  useEffect(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      const isScreen = videoTrack?.label?.toLowerCase().includes('screen') || videoTrack?.label?.toLowerCase().includes('display');
      setLocalVideoOn(!!videoTrack && !isScreen && videoTrack.enabled);
      setLocalScreenOn(!!videoTrack && isScreen);
      const audioTrack = localStream.getAudioTracks()[0];
      setMicOn(!!audioTrack && audioTrack.enabled);
      updateLocalVideoElement();
    }
  }, [localStream]);

  const updateLocalVideoElement = useCallback(() => {
    if (!localStream) return;
    const videoElement = localScreenOn ? localScreenRef.current : localVideoRef.current;
    if (!videoElement) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack && videoTrack.enabled) {
      videoElement.srcObject = localStream;
      videoElement.play().catch(err => {
        console.warn("Could not play video:", err);
        setTimeout(() => videoElement.play().catch(e => console.warn("Retry failed:", e)), 100);
      });
    } else {
      videoElement.srcObject = null;
    }
  }, [localStream, localScreenOn]);

  useEffect(() => { updateLocalVideoElement(); }, [localVideoOn, localScreenOn, updateLocalVideoElement]);

  useEffect(() => {
    if (localScreenOn && screenStreamRef.current) {
      const screenElement = localScreenRef.current;
      if (screenElement) {
        screenElement.srcObject = screenStreamRef.current;
        screenElement.play().catch(err => console.warn("Could not play screen:", err));
      }
    }
  }, [localScreenOn]);

  useEffect(() => {
    if (remoteStream) {
      const videoTrack = remoteStream.getVideoTracks()[0];
      const isScreenShare = videoTrack?.label?.toLowerCase().includes('screen') || videoTrack?.label?.toLowerCase().includes('display');
      const remoteElement = isScreenShare ? remoteScreenRef.current : remoteVideoRef.current;
      if (remoteElement) {
        remoteElement.srcObject = remoteStream;
        remoteElement.play().catch(err => {
          console.warn("Could not play remote video:", err);
          setTimeout(() => remoteElement.play().catch(e => console.warn("Retry failed:", e)), 100);
        });
      }
    }
  }, [remoteStream]);

  const handleToggleCamera = useCallback(() => {
    if (localScreenOn) return;
    playSound(audioCamera);
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const newState = !videoTracks[0].enabled;
        videoTracks.forEach(track => track.enabled = newState);
        setLocalVideoOn(newState);
        updateLocalVideoElement();
      } else {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            const newVideoTrack = stream.getVideoTracks()[0];
            localStream.getVideoTracks().forEach(track => { localStream.removeTrack(track); track.stop(); });
            localStream.addTrack(newVideoTrack);
            if (replaceVideoTrack) replaceVideoTrack(newVideoTrack);
            setLocalVideoOn(true);
            updateLocalVideoElement();
          })
          .catch(err => console.error("Error getting camera:", err));
      }
    }
  }, [localStream, localScreenOn, replaceVideoTrack, updateLocalVideoElement, playSound]);

  const handleToggleMic = useCallback(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const newState = !audioTracks[0].enabled;
        audioTracks.forEach(track => track.enabled = newState);
        setMicOn(newState);
        playSound(newState ? audioMicOn : audioMicMute);
      }
    }
  }, [localStream, playSound]);

  const handleToggleScreenShare = useCallback(async () => {
    if (!localScreenOn) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        const screenVideoTrack = screenStream.getVideoTracks()[0];
        if (!screenVideoTrack) return;
        currentVideoTrackRef.current = localStream?.getVideoTracks()[0] || null;
        screenStreamRef.current = screenStream;
        if (localStream && currentVideoTrackRef.current) {
          localStream.removeTrack(currentVideoTrackRef.current);
          localStream.addTrack(screenVideoTrack);
        }
        if (replaceVideoTrack) replaceVideoTrack(screenVideoTrack);
        setLocalScreenOn(true);
        setLocalVideoOn(false);
        screenVideoTrack.onended = () => handleStopScreenShare();
      } catch (err) { console.error("Screen share failed:", err); }
    } else {
      handleStopScreenShare();
    }
  }, [localScreenOn, localStream, replaceVideoTrack]);

  const handleStopScreenShare = useCallback(async () => {
    try {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      if (currentVideoTrackRef.current && localStream) {
        const screenTracks = localStream.getVideoTracks();
        screenTracks.forEach(track => localStream.removeTrack(track));
        localStream.addTrack(currentVideoTrackRef.current);
        currentVideoTrackRef.current.enabled = true;
        if (replaceVideoTrack) replaceVideoTrack(currentVideoTrackRef.current);
      }
      setLocalScreenOn(false);
      setLocalVideoOn(true);
      updateLocalVideoElement();
    } catch (err) { console.error("Error stopping screen share:", err); }
  }, [localStream, replaceVideoTrack, updateLocalVideoElement]);

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

  const toggleLayout = useCallback(() => setLayout(prev => prev === 'grid' ? 'pip' : 'grid'), []);

  // === Логика кинотеатра (YouTube) ===
  useEffect(() => {
    if (!signalRConnection) {
      console.warn('VideoCall: SignalR connection not available for cinema mode');
      return;
    }

    console.log('VideoCall: Setting up cinema event listeners');

    const handleCinemaStarted = (videoUrl: string, initiatorId: string) => {
      console.log('VideoCall: CinemaModeStarted event received:', videoUrl, 'Initiator:', initiatorId);
      setCinemaActive(true);
      setCinemaVideoUrl(videoUrl);
      setIsCinemaInitiator(initiatorId === currentUserId);
    };

    const handleCinemaStopped = (stopperId?: string) => {
      console.log('VideoCall: CinemaModeStopped event received. Stopped by:', stopperId);
      setCinemaActive(false);
      setCinemaVideoUrl(null);
      setIsCinemaInitiator(false);
    };

    const handleVideoChanged = (newVideoUrl: string, changedBy?: string) => {
      console.log('VideoCall: CinemaVideoChanged event received:', newVideoUrl);
      setTimeout(() => {
        setCinemaVideoUrl(newVideoUrl);
      }, 50);
    };

    signalRConnection.on('CinemaModeStarted', handleCinemaStarted);
    signalRConnection.on('CinemaModeStopped', handleCinemaStopped);
    signalRConnection.on('CinemaVideoChanged', handleVideoChanged);

    return () => {
      console.log('VideoCall: Cleaning up cinema event listeners');
      signalRConnection.off('CinemaModeStarted', handleCinemaStarted);
      signalRConnection.off('CinemaModeStopped', handleCinemaStopped);
      signalRConnection.off('CinemaVideoChanged', handleVideoChanged);
    };
  }, [signalRConnection, currentUserId]);

  const toggleCinemaMode = useCallback(() => {
    console.log('VideoCall: toggleCinemaMode called. Current state:', { cinemaActive, signalRConnection });

    if (cinemaActive) {
      if (signalRConnection) {
        console.log('VideoCall: Stopping cinema mode, sending signal');
        signalRConnection.invoke('StopCinemaMode', roomId)
          .catch((err: any) => console.error('VideoCall: Error stopping cinema mode:', err));
      } else {
        console.warn('VideoCall: No connection, stopping locally');
        setCinemaActive(false);
        setCinemaVideoUrl(null);
        setIsCinemaInitiator(false);
      }
    } else {
      const url = prompt('Введите ссылку на YouTube видео (youtu.be или youtube.com):');
      console.log('VideoCall: Prompt result:', url);

      if (url && url.trim()) {
        if (signalRConnection) {
          console.log('VideoCall: Starting cinema mode with URL:', url);
          signalRConnection.invoke('StartCinemaMode', roomId, url)
            .catch((err: any) => console.error('VideoCall: Error starting cinema mode:', err));
        } else {
          console.warn('VideoCall: No connection, enabling cinema locally');
          setCinemaActive(true);
          setCinemaVideoUrl(url);
          setIsCinemaInitiator(true);
        }
      }
    }
  }, [cinemaActive, signalRConnection, roomId]);

  const handleChangeCinemaVideo = useCallback(() => {
    console.log('VideoCall: handleChangeCinemaVideo called. IsInitiator:', isCinemaInitiator);

    if (!isCinemaInitiator) {
      console.warn('VideoCall: Only initiator can change video');
      return;
    }

    const newUrl = prompt('Введите новую ссылку на YouTube видео:');
    console.log('VideoCall: New URL prompt result:', newUrl);

    if (newUrl && newUrl.trim()) {
      // Оптимистичное обновление локального URL (немедленный фидбэк)
      setCinemaVideoUrl(newUrl);

      if (signalRConnection) {
        console.log('VideoCall: Changing cinema video to:', newUrl);
        signalRConnection.invoke('ChangeCinemaVideo', roomId, newUrl)
          .catch((err: any) => {
            console.error('VideoCall: Error changing cinema video:', err);
            // В случае ошибки можно откатить, но оставим как есть
          });
      } else {
        console.warn('VideoCall: No connection, changing video locally');
      }
    }
  }, [isCinemaInitiator, signalRConnection, roomId]);

  return (
    <div ref={containerRef} className={`video-call-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="video-top">
        <div className="video-info">
          <img src="/profile_user_icon.png" alt="users" className="icon" />
          <span className="participants">{localUserName}, {remoteUserName}</span>
        </div>
      </div>

      <div className={`video-body ${layout}`}>
        {/* Удалённое видео */}
        <div className={`video-box remote ${speaking ? "speaking" : ""}`}>
          {remoteStream && remoteStream.getVideoTracks().some(t => t.enabled) ? (
            <video autoPlay playsInline ref={remoteVideoRef} className="video-stream" />
          ) : (
            <div className="remote-avatar-container">
              <img src={remoteAvatarUrl} className="video-avatar" alt="Remote user" />
              {isWaitingForRemote && <div className="waiting-text">Ждем подключения пользователя..</div>}
            </div>
          )}
          <div className="user-name">{remoteUserName}</div>
          {remoteStream && remoteStream.getVideoTracks().some(t => t.label?.toLowerCase().includes('screen')) && (
            <video autoPlay playsInline ref={remoteScreenRef} className="video-stream screen-stream" style={{ display: 'none' }} />
          )}
        </div>

        {/* Локальное видео */}
        <div ref={localContainerRef} className={`video-box local ${speaking ? "speaking" : ""}`}>
          {localScreenOn ? (
            <video autoPlay muted playsInline ref={localScreenRef} className="video-stream" />
          ) : localVideoOn && localStream && localStream.getVideoTracks().some(t => t.enabled) ? (
            <video autoPlay muted playsInline ref={localVideoRef} className="video-stream" />
          ) : (
            <img src={localAvatarUrl} className="video-avatar" alt="Local user" />
          )}
          <div className="user-name">{localUserName}</div>
          {layout === 'pip' && <div className="drag-handle" title="Перетащите для перемещения">⋮⋮</div>}
        </div>

        {/* Блок YouTube (третий экран) */}
        {cinemaActive && cinemaVideoUrl && (
          <div className="video-box cinema">
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {signalRConnection ? (
                <YouTubeCinema
                  key={cinemaVideoUrl}  // ← Гарантирует пересоздание при смене ссылки
                  videoUrl={cinemaVideoUrl}
                  roomId={roomId}
                  connection={signalRConnection}
                  isInitiator={isCinemaInitiator}
                />
              ) : (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${extractYouTubeVideoId(cinemaVideoUrl)}?autoplay=0`}
                  frameBorder="0"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  title="YouTube video"
                  style={{ border: 'none' }}
                />
              )}
              {isCinemaInitiator && signalRConnection && (
                <button
                  onClick={handleChangeCinemaVideo}
                  style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
                  className="control-btn small"
                  title="Сменить видео"
                >
                  🔄
                </button>
              )}
            </div>
            <div className="user-name">YouTube 🎬</div>
          </div>
        )}
      </div>

      <div className="video-controls">
        <button onClick={handleToggleMic} className={`control-btn ${micOn ? "" : "off"}`} title={micOn ? "Выключить микрофон" : "Включить микрофон"}>
          <img src={micOn ? "/microphone_on_icon.png" : "/microphone_off_icon.png"} alt="Mic" className="icon" />
        </button>
        <button onClick={handleToggleCamera} className={`control-btn ${localVideoOn ? "" : "off"}`} title={localVideoOn ? "Выключить камеру" : "Включить камеру"}>
          <img src={localVideoOn ? "/video_icon.png" : "/video_slash_icon.png"} alt="Cam" className="icon" />
        </button>
        <button onClick={handleToggleScreenShare} className={`control-btn ${localScreenOn ? "active" : ""}`} title={localScreenOn ? "Выключить демонстрацию" : "Демонстрация экрана"}>
          <img src={localScreenOn ? "/screen_stop_demonstration_icon.png" : "/screen_demonstration_icon.png"} alt="Screen" className="icon" />
        </button>
        <button onClick={toggleLayout} className="control-btn" title={layout === 'grid' ? 'Режим PIP' : 'Сетка'}>
          <img src={layout === 'grid' ? "/pip_icon.png" : "/grid_icon.png"} alt="Layout" className="icon" />
        </button>
        <button onClick={toggleFullscreen} className="control-btn" title={isFullscreen ? 'Оконный режим' : 'Полный экран'}>
          <img src={isFullscreen ? "/fullscreen_exit_icon.png" : "/fullscreen_icon.png"} alt="Fullscreen" className="icon" />
        </button>
        <button onClick={toggleCinemaMode} className="control-btn" title={cinemaActive ? 'Выключить кинотеатр' : 'Режим кинотеатра'}>
          <img src={cinemaActive ? "/conference.png" : "/cinema.png"} alt="Cinema" className="icon" />
        </button>
        <CallSettings
          onVolumeChange={handleVolumeChange}
          onQualityChange={handleQualityChange}
          onAudioFiltersChange={handleAudioFiltersChange}
          currentQuality={videoQuality}
          currentVolume={microphoneVolume}
          currentFilters={audioFilters}
        />
        <button className="control-btn end-call" onClick={onEndCall} title="Завершить звонок">
          <img src="/call_remove_icon.png" alt="End call" className="icon" />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;