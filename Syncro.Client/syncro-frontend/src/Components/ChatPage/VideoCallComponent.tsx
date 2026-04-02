import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VideoCallProps } from "../../Types/ChatTypes";
import CallSettings from '../../Utils/CallSettings';
import { VideoQuality } from '../../Hooks/UseRtcConnection';
import { UseDraggable } from '../../Hooks/UseDraggable';

interface AudioFilters {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

const VideoCall: React.FC<VideoCallProps> = ({
  onEndCall,
  localUserName,
  localAvatarUrl,
  remoteUserName,
  remoteAvatarUrl,
  localStream,
  remoteStream,
  replaceVideoTrack,
  isWaitingForRemote,
}) => {
  const [localVideoOn, setLocalVideoOn] = useState(false);
  const [localScreenOn, setLocalScreenOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'pip'>('grid');

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

  UseDraggable(localContainerRef, layout === 'pip');

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
    if ((window as any).onMicrophoneVolumeChange) {
      (window as any).onMicrophoneVolumeChange(volume);
    }
  }, []);

  const handleQualityChange = useCallback((quality: VideoQuality) => {
    setVideoQuality(quality);
    if ((window as any).onVideoQualityChange) {
      (window as any).onVideoQualityChange(quality);
    }
  }, []);

  const handleAudioFiltersChange = useCallback((filters: AudioFilters) => {
    setAudioFilters(filters);
    if ((window as any).onAudioFiltersChange) {
      (window as any).onAudioFiltersChange(filters);
    }
  }, []);

  useEffect(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      const isScreen = videoTrack?.label?.toLowerCase().includes('screen') ||
        videoTrack?.label?.toLowerCase().includes('display');

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
        setTimeout(() => {
          videoElement.play().catch(e => console.warn("Retry failed:", e));
        }, 100);
      });
    } else {
      videoElement.srcObject = null;
    }
  }, [localStream, localScreenOn]);

  useEffect(() => {
    updateLocalVideoElement();
  }, [localVideoOn, localScreenOn, updateLocalVideoElement]);

  useEffect(() => {
    if (localScreenOn && screenStreamRef.current) {
      const screenElement = localScreenRef.current;
      if (screenElement) {
        screenElement.srcObject = screenStreamRef.current;
        screenElement.play().catch(err =>
          console.warn("Could not play screen:", err)
        );
      }
    }
  }, [localScreenOn]);

  useEffect(() => {
    if (remoteStream) {
      const videoTrack = remoteStream.getVideoTracks()[0];
      const isScreenShare = videoTrack?.label?.toLowerCase().includes('screen') ||
        videoTrack?.label?.toLowerCase().includes('display');

      const remoteElement = isScreenShare ? remoteScreenRef.current : remoteVideoRef.current;

      if (remoteElement) {
        remoteElement.srcObject = remoteStream;
        remoteElement.play().catch(err => {
          console.warn("Could not play remote video:", err);
          setTimeout(() => {
            remoteElement.play().catch(e => console.warn("Retry failed:", e));
          }, 100);
        });
      }
    }
  }, [remoteStream]);

  const handleToggleCamera = useCallback(() => {
    if (localScreenOn) {
      return;
    }

    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const newState = !videoTracks[0].enabled;
        videoTracks.forEach((track: MediaStreamTrack) => {
          track.enabled = newState;
        });
        setLocalVideoOn(newState);
        updateLocalVideoElement();
      } else {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            const newVideoTrack = stream.getVideoTracks()[0];
            localStream.getVideoTracks().forEach(track => {
              localStream.removeTrack(track);
              track.stop();
            });
            localStream.addTrack(newVideoTrack);
            if (replaceVideoTrack) {
              replaceVideoTrack(newVideoTrack);
            }
            setLocalVideoOn(true);
            updateLocalVideoElement();
          })
          .catch(err => console.error("Error getting camera:", err));
      }
    }
  }, [localStream, localScreenOn, replaceVideoTrack, updateLocalVideoElement]);

  const handleToggleMic = useCallback(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const newState = !audioTracks[0].enabled;
        audioTracks.forEach((track: MediaStreamTrack) => {
          track.enabled = newState;
        });
        setMicOn(newState);
      }
    }
  }, [localStream]);

  const handleToggleScreenShare = useCallback(async () => {
    if (!localScreenOn) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });

        const screenVideoTrack = screenStream.getVideoTracks()[0];
        if (!screenVideoTrack) return;

        currentVideoTrackRef.current = localStream?.getVideoTracks()[0] || null;
        screenStreamRef.current = screenStream;

        if (localStream && currentVideoTrackRef.current) {
          localStream.removeTrack(currentVideoTrackRef.current);
          localStream.addTrack(screenVideoTrack);
        }

        if (replaceVideoTrack) {
          replaceVideoTrack(screenVideoTrack);
        }

        setLocalScreenOn(true);
        setLocalVideoOn(false);

        screenVideoTrack.onended = () => {
          handleStopScreenShare();
        };

      } catch (err) {
        console.error("Screen share failed:", err);
      }
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

        if (replaceVideoTrack) {
          replaceVideoTrack(currentVideoTrackRef.current);
        }
      }

      setLocalScreenOn(false);
      setLocalVideoOn(true);
      updateLocalVideoElement();
    } catch (err) {
      console.error("Error stopping screen share:", err);
    }
  }, [localStream, replaceVideoTrack, updateLocalVideoElement]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error("Error attempting to exit fullscreen:", err);
      });
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleLayout = useCallback(() => {
    setLayout(prev => prev === 'grid' ? 'pip' : 'grid');
  }, []);

  return (
    <div
      ref={containerRef}
      className={`video-call-container ${isFullscreen ? 'fullscreen' : ''}`}
    >
      <div className="video-top">
        <div className="video-info">
          <img src="/profile_user_icon.png" alt='users' className='icon' />
          <span className="participants">
            {localUserName}, {remoteUserName}
          </span>
        </div>
      </div>

      <div className={`video-body ${layout}`}>
        <div className={`video-box remote ${speaking ? "speaking" : ""}`}>
          {remoteStream && remoteStream.getVideoTracks().some(t => t.enabled) ? (
            <video
              autoPlay
              playsInline
              ref={remoteVideoRef}
              className="video-stream"
            />
          ) : (
            <div className="remote-avatar-container">
              <img src={remoteAvatarUrl} className="video-avatar" alt="Remote user" />
              {isWaitingForRemote && (
                <div className="waiting-text">Ждем подключения пользователя..</div>
              )}
            </div>
          )}
          <div className="user-name">{remoteUserName}</div>
          {remoteStream && remoteStream.getVideoTracks().some(t =>
            t.label?.toLowerCase().includes('screen')
          ) && (
              <video
                autoPlay
                playsInline
                ref={remoteScreenRef}
                className="video-stream screen-stream"
                style={{ display: 'none' }}
              />
            )}
        </div>

        <div
          ref={localContainerRef}
          className={`video-box local ${speaking ? "speaking" : ""}`}
        >
          {localScreenOn ? (
            <video
              autoPlay
              muted
              playsInline
              ref={localScreenRef}
              className="video-stream"
            />
          ) : localVideoOn && localStream && localStream.getVideoTracks().some(t => t.enabled) ? (
            <video
              autoPlay
              muted
              playsInline
              ref={localVideoRef}
              className="video-stream"
            />
          ) : (
            <img src={localAvatarUrl} className="video-avatar" alt="Local user" />
          )}
          <div className="user-name">{localUserName}</div>
          {layout === 'pip' && (
            <div className="drag-handle" title="Перетащите для перемещения">
              ⋮⋮
            </div>
          )}
        </div>
      </div>

      <div className="video-controls">
        <button onClick={handleToggleMic} title={`${localVideoOn ? "Выключить микрофон" : "Включить микрофон"}`} className={`control-btn ${micOn ? "" : "off"}`}>
          <img
            src={micOn ? "/microphone_on_icon.png" : "/microphone_off_icon.png"}
            alt="Mic"
            className="icon"
          />
        </button>
        <button onClick={handleToggleCamera} title={`${localVideoOn ? "Выключить камеру" : "Включить камеру"}`} className={`control-btn ${localVideoOn ? "" : "off"}`}>
          <img
            src={localVideoOn ? "/video_icon.png" : "/video_slash_icon.png"}
            alt="Cam"
            className='icon'
          />
        </button>
        <button onClick={handleToggleScreenShare} title={`${localScreenOn ? "Выключить демонстрацию экрана" : "Включить демонстрацию экрана"}`} className={`control-btn ${localScreenOn ? "active" : ""}`}>
          <img
            src={localScreenOn ? "/screen_stop_demonstration_icon.png" : "/screen_demonstration_icon.png"}
            alt="Screen"
            className='icon'
          />
        </button>
        <button onClick={toggleLayout} className="control-btn" title={layout === 'grid' ? 'Режим PIP' : 'Сетка'}>
          <img
            src={layout === 'grid' ? "/pip_icon.png" : "/grid_icon.png"}
            alt="Layout"
            className='icon'
          />
        </button>
        <button onClick={toggleFullscreen} className="control-btn" title={isFullscreen ? 'Оконный режим' : 'Полный экран'}>
          <img
            src={isFullscreen ? "/fullscreen_exit_icon.png" : "/fullscreen_icon.png"}
            alt="Fullscreen"
            className='icon'
          />
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