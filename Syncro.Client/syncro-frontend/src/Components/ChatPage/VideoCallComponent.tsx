import { useState, useEffect, useRef, useCallback } from 'react';
import { VideoCallProps } from "../../Types/ChatTypes";
import { useDraggable } from '../../Hooks/useDraggable';

const VideoCall: React.FC<VideoCallProps> = ({
  onEndCall,
  localUserName,
  localAvatarUrl,
  remoteUserName,
  remoteAvatarUrl,
  localStream,
  remoteStream,
  replaceVideoTrack,
}) => {
  const [localVideoOn, setLocalVideoOn] = useState(true);
  const [localScreenOn, setLocalScreenOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'pip'>('grid');

  const containerRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteScreenRef = useRef<HTMLVideoElement>(null);
  const currentVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Используем хук для перетаскивания только в PIP режиме
  const localVideoRef = useDraggable(layout === 'pip');
  const localScreenRef = useDraggable(layout === 'pip');

  // Эффект для локального видео
  useEffect(() => {
    if (localStream) {
      console.log("Local stream updated:", {
        videoTracks: localStream.getVideoTracks().length,
        audioTracks: localStream.getAudioTracks().length
      });

      const videoTrack = localStream.getVideoTracks()[0];
      const isScreen = videoTrack?.label?.toLowerCase().includes('screen') ||
        videoTrack?.label?.toLowerCase().includes('display');

      setLocalVideoOn(!!videoTrack && !isScreen && videoTrack.enabled);
      setLocalScreenOn(!!videoTrack && isScreen);

      const audioTrack = localStream.getAudioTracks()[0];
      setMicOn(!!audioTrack && audioTrack.enabled);

      // Всегда обновляем видео элемент
      updateLocalVideoElement();
    }
  }, [localStream]);

  // Функция для обновления локального видео элемента
  const updateLocalVideoElement = useCallback(() => {
    if (!localStream) return;

    const videoElement = localScreenOn ? localScreenRef.current : localVideoRef.current;
    if (!videoElement) return;

    const videoTrack = localStream.getVideoTracks()[0];

    if (videoTrack && videoTrack.enabled) {
      // Если есть включенный видео трек, показываем его
      videoElement.srcObject = localStream;
      videoElement.play().catch(err => {
        console.warn("Could not play video:", err);
        setTimeout(() => {
          videoElement.play().catch(e => console.warn("Retry failed:", e));
        }, 100);
      });
    } else {
      // Если видео выключено или нет трека, показываем аватар
      videoElement.srcObject = null;
    }
  }, [localStream, localScreenOn, localVideoRef, localScreenRef]);

  // Эффект для обновления при изменении состояния видео
  useEffect(() => {
    updateLocalVideoElement();
  }, [localVideoOn, localScreenOn, updateLocalVideoElement]);

  // Эффект для экрана
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
  }, [localScreenOn, localScreenRef]);

  // Эффект для удаленного видео
  useEffect(() => {
    if (remoteStream) {
      console.log("Remote stream updated:", {
        videoTracks: remoteStream.getVideoTracks().length,
        audioTracks: remoteStream.getAudioTracks().length,
        streamId: remoteStream.id
      });

      const videoTrack = remoteStream.getVideoTracks()[0];
      const isScreenShare = videoTrack?.label?.toLowerCase().includes('screen') ||
        videoTrack?.label?.toLowerCase().includes('display');

      // Выбираем правильный элемент для удаленного видео
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

  // Функция для переключения камеры
  const handleToggleCamera = useCallback(() => {
    if (localScreenOn) {
      console.log("Cannot toggle camera while screen sharing");
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
        console.log("Camera toggled:", newState ? "on" : "off");

        // Обновляем видео элемент
        updateLocalVideoElement();
      } else {
        // Если нет видео трека, пробуем получить его заново
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            const newVideoTrack = stream.getVideoTracks()[0];

            // Удаляем старые видео треки
            localStream.getVideoTracks().forEach(track => {
              localStream.removeTrack(track);
              track.stop();
            });

            // Добавляем новый трек
            localStream.addTrack(newVideoTrack);

            // Заменяем трек в peer connection
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

  // Функция для переключения микрофона
  const handleToggleMic = useCallback(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const newState = !audioTracks[0].enabled;
        audioTracks.forEach((track: MediaStreamTrack) => {
          track.enabled = newState;
        });
        setMicOn(newState);
        console.log("Mic toggled:", newState ? "on" : "off");
      }
    }
  }, [localStream]);

  // Функция для демонстрации экрана
  const handleToggleScreenShare = useCallback(async () => {
    if (!localScreenOn) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });

        const screenVideoTrack = screenStream.getVideoTracks()[0];
        if (!screenVideoTrack) return;

        // Сохраняем текущий видео трек камеры
        currentVideoTrackRef.current = localStream?.getVideoTracks()[0] || null;
        screenStreamRef.current = screenStream;

        if (localStream && currentVideoTrackRef.current) {
          // Удаляем трек камеры
          localStream.removeTrack(currentVideoTrackRef.current);
          // Добавляем трек экрана
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

  // Функция для остановки демонстрации экрана
  const handleStopScreenShare = useCallback(async () => {
    try {
      console.log("Stopping screen share...");

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }

      if (currentVideoTrackRef.current && localStream) {
        // Удаляем трек экрана
        const screenTracks = localStream.getVideoTracks();
        screenTracks.forEach(track => localStream.removeTrack(track));

        // Добавляем обратно трек камеры
        localStream.addTrack(currentVideoTrackRef.current);
        currentVideoTrackRef.current.enabled = true;

        if (replaceVideoTrack) {
          replaceVideoTrack(currentVideoTrackRef.current);
        }
      }

      setLocalScreenOn(false);
      setLocalVideoOn(true);

      // Обновляем видео элемент
      updateLocalVideoElement();
    } catch (err) {
      console.error("Error stopping screen share:", err);
    }
  }, [localStream, replaceVideoTrack, updateLocalVideoElement]);

  // Функция для переключения fullscreen
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

  // Слушаем изменения fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Переключение между layout
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
        {/* Удаленное видео */}
        <div className={`video-box remote ${speaking ? "speaking" : ""}`}>
          {remoteStream && remoteStream.getVideoTracks().some(t => t.enabled) ? (
            <video
              autoPlay
              playsInline
              ref={remoteVideoRef}
              className="video-stream"
            />
          ) : (
            <img src={remoteAvatarUrl} className="video-avatar" alt="Remote user" />
          )}
          <div className="user-name">{remoteUserName}</div>

          {/* Экран удаленного пользователя */}
          {remoteStream && remoteStream.getVideoTracks().some(t =>
            t.label?.toLowerCase().includes('screen')
          ) && (
              <video
                autoPlay
                playsInline
                ref={remoteScreenRef}
                className="video-stream screen-stream"
                style={{ display: 'none' }} // Скрываем, так как используем основной элемент
              />
            )}
        </div>

        {/* Локальное видео */}
        <div className={`video-box local ${speaking ? "speaking" : ""}`}>
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

          {/* Кнопка для перетаскивания (только в pip режиме) */}
          {layout === 'pip' && (
            <div className="drag-handle" title="Перетащите для перемещения">
              ⋮⋮
            </div>
          )}
        </div>
      </div>

      <div className="video-controls">
        <button onClick={handleToggleMic} className={`control-btn ${micOn ? "" : "off"}`}>
          <img
            src={micOn ? "/microphone_on_icon.png" : "/microphone_off_icon.png"}
            alt="Mic"
            className="icon"
          />
        </button>
        <button onClick={handleToggleCamera} className={`control-btn ${localVideoOn ? "" : "off"}`}>
          <img
            src={localVideoOn ? "/video_icon.png" : "/video_slash_icon.png"}
            alt="Cam"
            className='icon'
          />
        </button>
        <button onClick={handleToggleScreenShare} className={`control-btn ${localScreenOn ? "active" : ""}`}>
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
        <button className="control-btn end-call" onClick={onEndCall} title="Завершить звонок">
          <img src="/call_remove_icon.png" alt="End call" className="icon" />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;