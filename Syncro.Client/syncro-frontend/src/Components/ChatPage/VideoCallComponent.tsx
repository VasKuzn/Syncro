import { useState, useEffect, useRef } from 'react';
import { VideoCallProps } from "../../Types/ChatTypes";

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
  const [remoteVideoOn, setRemoteVideoOn] = useState(false);
  const [remoteScreenOn, setRemoteScreenOn] = useState(false);

  const [micOn, setMicOn] = useState(true);
  const [expandedWindow, setExpandedWindow] = useState<
    "localVideo" | "localScreen" | "remoteVideo" | "remoteScreen" | null
  >(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localScreenRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteScreenRef = useRef<HTMLVideoElement>(null);

  const [speaking, setSpeaking] = useState(false);
  const currentVideoTrackRef = useRef<MediaStreamTrack | undefined>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Очистка srcObject при размонтировании
  useEffect(() => {
    return () => {
      [localVideoRef, localScreenRef, remoteVideoRef, remoteScreenRef].forEach(ref => {
        if (ref.current) {
          ref.current.srcObject = null;
        }
      });
    };
  }, []);

  // Эффект для перезапуска локального видео при включении камеры
  useEffect(() => {
    if (localVideoOn && localStream && localVideoRef.current) {
      // Небольшая задержка, чтобы дать время треку включиться
      const timer = setTimeout(() => {
        const videoEl = localVideoRef.current;
        if (!videoEl) return;

        // Если srcObject не совпадает, устанавливаем заново
        if (videoEl.srcObject !== localStream) {
          videoEl.srcObject = localStream;
        } else {
          // Если совпадает, делаем сброс: null -> поток
          videoEl.srcObject = null;
          videoEl.srcObject = localStream;
        }

        // Пытаемся воспроизвести видео
        videoEl.play().catch(err => {
          console.error("Failed to play local video after toggle:", err);
        });
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [localVideoOn, localStream]);

  useEffect(() => {
    console.log("Remote stream changed in VideoCall:", remoteStream);

    if (remoteStream) {
      console.log("Remote stream tracks:", remoteStream.getTracks().length);
      console.log("Video tracks:", remoteStream.getVideoTracks().length);
      console.log("Audio tracks:", remoteStream.getAudioTracks().length);

      remoteStream.getVideoTracks().forEach((track, i) => {
        console.log(`Video track ${i}:`, {
          id: track.id,
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState,
          label: track.label
        });
      });

      const videoTrack = remoteStream.getVideoTracks()[0];
      setRemoteVideoOn(!!videoTrack && videoTrack.readyState === 'live');
    }
  }, [remoteStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("Setting remote video srcObject");

      const currentSrcObject = remoteVideoRef.current.srcObject;
      if (currentSrcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;

        remoteVideoRef.current.play()
          .then(() => console.log("Remote video playing"))
          .catch(err => console.error("Failed to play remote video:", err));
      }
    }
  }, [remoteStream]);

  const handleRemoteVideoLoaded = () => {
    console.log("Remote video loadedmetadata");
    if (remoteVideoRef.current) {
      remoteVideoRef.current.play()
        .then(() => console.log("Remote video started playing"))
        .catch(err => console.error("Failed to play:", err));
    }
  };

  useEffect(() => {
    console.log("Local stream changed:", localStream);

    if (localStream) {
      console.log("Local stream id:", localStream.id);
      console.log("Local stream tracks:", localStream.getTracks().length);

      localStream.getTracks().forEach((track, i) => {
        console.log(`Track ${i} (${track.kind}):`, {
          id: track.id,
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState,
          label: track.label,
          muted: track.muted
        });
      });

      const videoTrack = localStream.getVideoTracks()[0];
      setLocalVideoOn(!!videoTrack && videoTrack.readyState === 'live' && videoTrack.enabled);

      const audioTrack = localStream.getAudioTracks()[0];
      setMicOn(!!audioTrack && audioTrack.enabled);
    }
  }, [localStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log("Setting local video srcObject, stream id:", localStream.id);

      localVideoRef.current.srcObject = localStream;

      localVideoRef.current.play()
        .then(() => console.log("Local video playing"))
        .catch(err => {
          console.error("Failed to play local video:", err);

          setTimeout(() => {
            if (localVideoRef.current) {
              localVideoRef.current.play()
                .then(() => console.log("Local video playing after retry"))
                .catch(e => console.error("Still failed:", e));
            }
          }, 1000);
        });
    } else if (localVideoRef.current && !localStream) {
      localVideoRef.current.srcObject = null;
    }
  }, [localStream]);

  const handleLocalVideoLoaded = () => {
    console.log("Local video loadedmetadata");
    if (localVideoRef.current) {
      localVideoRef.current.play()
        .then(() => console.log("Local video started playing"))
        .catch(err => {
          console.error("Failed to play local video:", err);
        });
    }
  };

  // Обновляем состояние когда приходят потоки
  useEffect(() => {
    if (localStream) {
      // Проверяем наличие видео трека и не включен ли экран
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack && !localScreenOn) {
        setLocalVideoOn(videoTrack.enabled && videoTrack.readyState === 'live');
      }
      console.log("Local stream available, tracks:", localStream.getTracks().length);
    }
    if (remoteStream) {
      // Проверяем наличие видео трека и не включена ли демонстрация экрана удаленного пользователя
      const videoTrack = remoteStream.getVideoTracks()[0];
      const isScreenShare = videoTrack?.label.toLowerCase().includes('screen') ||
        videoTrack?.label.toLowerCase().includes('display');
      if (!isScreenShare && videoTrack) {
        setRemoteVideoOn(videoTrack.enabled && videoTrack.readyState === 'live');
      }
      console.log("Remote stream available, tracks:", remoteStream.getTracks().length);
    }
  }, [localStream, remoteStream, localScreenOn]);

  // Устанавливаем srcObject для видео элементов
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log("Setting local video source");
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      console.log("Setting remote video source");
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  // Отдельный эффект для управления экраном
  useEffect(() => {
    if (localScreenOn && screenStreamRef.current && localScreenRef.current) {
      localScreenRef.current.srcObject = screenStreamRef.current;

      // Пытаемся воспроизвести с задержкой
      const playTimer = setTimeout(() => {
        if (localScreenRef.current) {
          localScreenRef.current.play()
            .then(() => console.log("Screen video playing successfully"))
            .catch(err => {
              console.error("Failed to play screen:", err);
              // Пробуем ещё раз
              setTimeout(() => {
                localScreenRef.current?.play().catch(e => console.error("Retry failed:", e));
              }, 500);
            });
        }
      }, 100);

      return () => clearTimeout(playTimer);
    } else if (!localScreenOn && localScreenRef.current) {
      localScreenRef.current.srcObject = null;
    }
  }, [localScreenOn]);

  // Обработчик для отслеживания состояния видео треков
  useEffect(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const handleTrackEnd = () => {
          setLocalVideoOn(false);
        };

        videoTrack.addEventListener('ended', handleTrackEnd);
        return () => {
          videoTrack.removeEventListener('ended', handleTrackEnd);
        };
      }
    }
  }, [localStream]);

  // Отслеживание демонстрации экрана удаленного пользователя по label видео трека
  useEffect(() => {
    if (remoteStream) {
      const videoTracks = remoteStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const videoTrack = videoTracks[0];
        // Проверяем label трека - браузер добавляет "screen" при getDisplayMedia()
        const isScreenShare = videoTrack.label.toLowerCase().includes('screen') ||
          videoTrack.label.toLowerCase().includes('display');
        setRemoteScreenOn(isScreenShare);
        setRemoteVideoOn(!isScreenShare);
      }
    }
  }, [remoteStream]);

  const handleToggleScreenShare = async () => {
    if (!localScreenOn) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });

        const screenVideoTrack = screenStream.getVideoTracks()[0];
        if (!screenVideoTrack) {
          return;
        }

        const currentVideoTrack = localStream?.getVideoTracks()[0];
        currentVideoTrackRef.current = currentVideoTrack;


        // Сохраняем поток в ref
        screenStreamRef.current = screenStream;

        // Заменяем трек в RTC соединении
        replaceVideoTrack(screenVideoTrack);

        // Добавляем трек экрана к localStream
        if (localStream && currentVideoTrack) {
          localStream.removeTrack(currentVideoTrack);
          localStream.addTrack(screenVideoTrack);
          console.log("Added screen track to local stream");
        }

        setLocalScreenOn(true);
        setLocalVideoOn(false);

        // Обработчик конца демонстрации
        screenVideoTrack.onended = () => {
          console.log("Screen sharing ended by user");
          handleStopScreenShare();
        };

        console.log("Screen share started successfully");
      } catch (err: any) {
        console.error("Screen share failed:", {
          message: err.message,
          name: err.name,
          code: err.code
        });
      }
    } else {
      handleStopScreenShare();
    }
  };

  const handleStopScreenShare = async () => {
    try {
      console.log("Stopping screen share...");

      // Останавливаем поток экрана
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => {
          console.log("Stopping track:", track.kind, track.label);
          track.stop();
        });
        screenStreamRef.current = null;
      }

      // Восстанавливаем камеру
      if (currentVideoTrackRef.current && localStream) {
        const cameraTrack = currentVideoTrackRef.current;

        console.log("Restoring camera track:", cameraTrack.label);

        // Убираем все видео треки из потока
        const videoTracks = localStream.getVideoTracks();
        videoTracks.forEach(track => {
          console.log("Removing track:", track.kind, track.label);
          localStream.removeTrack(track);
        });

        // Добавляем трек камеры обратно
        localStream.addTrack(cameraTrack);
        console.log("Added camera track back to local stream");

        // Заменяем трек в RTC соединении
        replaceVideoTrack(cameraTrack);

        // Включаем трек камеры
        cameraTrack.enabled = true;

        // Обновляем видео элемент камеры
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
          localVideoRef.current.srcObject = localStream;
          localVideoRef.current.play().catch(err => {
            console.warn("Could not autoplay video:", err);
          });
          console.log("Camera video element updated");
        }
      }

      setLocalScreenOn(false);
      setLocalVideoOn(false);
      console.log("Screen share stopped successfully");
    } catch (err) {
      console.error("Error stopping screen share:", err);
    }
  };

  const handleToggleMic = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((track: MediaStreamTrack) => {
        track.enabled = !track.enabled;
      });
      setMicOn(!micOn);
    }
  };

  const handleToggleCamera = () => {
    // Если экран включен, не позволяем переключать "камеру" (это экран)
    if (localScreenOn) {
      console.log("Cannot toggle camera while screen sharing is active");
      return;
    }

    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((track: MediaStreamTrack) => {
        track.enabled = !track.enabled;
      });
      setLocalVideoOn(!localVideoOn);
    }
  };

  return (
    <div className="video-call-container">
      <div className="video-top">
        <div className="video-info">
          <img src={'profile_user_icon.png'} alt='users' className='icon' />
          <span className="participants">
            {localUserName}, {remoteUserName}
          </span>
        </div>
      </div>

      <div className="video-body">
        {/* Локальное видео */}
        <div className={`video-box ${expandedWindow === "localVideo" ? "main" : "side"} ${speaking ? "speaking" : ""}`}
          onClick={() => setExpandedWindow("localVideo")}>
          {localScreenOn ? (
            <video
              autoPlay
              muted
              playsInline
              ref={localScreenRef}
              className="video-stream"
              onLoadedMetadata={() => {
                console.log("Screen loadedmetadata");
                if (localScreenRef.current) {
                  localScreenRef.current.play().catch(err => {
                    console.error("Failed to play on loadedmetadata:", err);
                  });
                }
              }}
              onCanPlay={() => {
                console.log("Screen can play");
              }}
              onPlay={() => console.log("Screen started playing")}
              onError={(e) => {
                console.error("Screen video error:", e);
                const target = e.target as HTMLVideoElement;
                console.error("Screen error details:", target.error);
              }}
            />
          ) : localVideoOn && localStream ? (
            <video
              autoPlay
              muted
              playsInline
              ref={localVideoRef}
              className="video-stream"
              onLoadedMetadata={handleLocalVideoLoaded}
              onCanPlay={() => {
                console.log("Local video can play");
                setLocalVideoOn(true);
              }}
              onPlay={() => console.log("Local video started playing")}
              onError={(e) => {
                console.error("Local video error:", e);
                const target = e.target as HTMLVideoElement;
                console.error("Error details:", target.error);
              }}
            />
          ) : (
            <img src={localAvatarUrl} className="video-avatar" alt="Local user" />
          )}
        </div>

        {/* Удаленное видео */}
        <div className={`video-box ${expandedWindow === "remoteVideo" ? "main" : "side"} ${speaking ? "speaking" : ""}`}
          onClick={() => setExpandedWindow("remoteVideo")}>
          {remoteScreenOn ? (
            <video autoPlay playsInline ref={remoteScreenRef} className="video-stream" />
          ) : remoteVideoOn && remoteStream ? (
            <video
              autoPlay
              muted={false}
              playsInline
              ref={remoteVideoRef}
              className="video-stream"
              onLoadedMetadata={handleRemoteVideoLoaded}
              onCanPlay={() => {
                console.log("Remote video can play");
                setRemoteVideoOn(true);
              }}
              onPlay={() => console.log("Remote video started playing")}
              onError={(e) => {
                console.error("Remote video error:", e);
                const target = e.target as HTMLVideoElement;
                console.error("Error details:", target.error);
              }}
            />
          ) : (
            <img src={remoteAvatarUrl} className="video-avatar" alt="Remote user" />
          )}
        </div>
      </div>

      <div className="video-controls">
        <button onClick={handleToggleMic} className={`control-btn ${micOn ? "" : "off"}`}>
          <img src={micOn ? "microphone_on_icon.png" : "microphone_off_icon.png"} alt="Mic" className="icon" />
        </button>
        <button onClick={handleToggleCamera} className={`control-btn ${localVideoOn ? "" : "off"}`}>
          <img src={localVideoOn ? "video_icon.png" : "video_slash_icon.png"} alt="Cam" className='icon' />
        </button>
        <button onClick={handleToggleScreenShare} className={`control-btn ${localScreenOn ? "" : "off"}`}>
          <img src={localScreenOn ? "screen_stop_demonstration_icon.png" : "screen_demonstration_icon.png"} alt="Screen" className='icon' />
        </button>
        <button className="control-btn end-call" onClick={onEndCall}>
          <img src="call_remove_icon.png" alt="End call" className="icon" />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;