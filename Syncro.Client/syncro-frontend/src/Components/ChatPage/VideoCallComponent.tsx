import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [speaking, setSpeaking] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localScreenRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteScreenRef = useRef<HTMLVideoElement>(null);
  const currentVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      [localVideoRef, localScreenRef, remoteVideoRef, remoteScreenRef].forEach(ref => {
        if (ref.current) {
          ref.current.srcObject = null;
        }
      });
    };
  }, []);

  // Эффект для локального видео
  useEffect(() => {
    if (localStream) {
      console.log("Local stream updated:", {
        videoTracks: localStream.getVideoTracks().length,
        audioTracks: localStream.getAudioTracks().length
      });

      const videoTrack = localStream.getVideoTracks()[0];
      // Проверяем, не является ли это экраном
      const isScreen = videoTrack?.label.toLowerCase().includes('screen') ||
        videoTrack?.label.toLowerCase().includes('display');

      if (!localScreenOn) {
        setLocalVideoOn(!!videoTrack && videoTrack.enabled && !isScreen);
      }

      const audioTrack = localStream.getAudioTracks()[0];
      setMicOn(!!audioTrack && audioTrack.enabled);

      if (localVideoRef.current && !localScreenOn) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play().catch(err => console.warn("Could not play local video:", err));
      }
    }
  }, [localStream, localScreenOn]);

  // Эффект для удаленного видео
  useEffect(() => {
    if (remoteStream) {
      console.log("Remote stream updated:", {
        videoTracks: remoteStream.getVideoTracks().length,
        audioTracks: remoteStream.getAudioTracks().length
      });

      const videoTrack = remoteStream.getVideoTracks()[0];
      const isScreenShare = videoTrack?.label.toLowerCase().includes('screen') ||
        videoTrack?.label.toLowerCase().includes('display');

      setRemoteScreenOn(isScreenShare);
      setRemoteVideoOn(!!videoTrack && !isScreenShare);

      if (remoteVideoRef.current && !isScreenShare) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(err => console.warn("Could not play remote video:", err));
      }

      if (remoteScreenRef.current && isScreenShare) {
        remoteScreenRef.current.srcObject = remoteStream;
        remoteScreenRef.current.play().catch(err => console.warn("Could not play remote screen:", err));
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
      } else {
        // Если нет видео трека, пробуем получить его заново
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            const newVideoTrack = stream.getVideoTracks()[0];
            const oldVideoTrack = localStream.getVideoTracks()[0];

            if (oldVideoTrack) {
              localStream.removeTrack(oldVideoTrack);
              oldVideoTrack.stop();
            }

            localStream.addTrack(newVideoTrack);

            if (replaceVideoTrack) {
              replaceVideoTrack(newVideoTrack);
            }

            setLocalVideoOn(true);

            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStream;
            }
          })
          .catch(err => console.error("Error getting camera:", err));
      }
    }
  }, [localStream, localScreenOn, replaceVideoTrack]);

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
        // Запрашиваем доступ к экрану
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });

        const screenVideoTrack = screenStream.getVideoTracks()[0];
        if (!screenVideoTrack) return;

        // Сохраняем текущий видео трек камеры
        const currentVideoTrack = localStream?.getVideoTracks()[0];
        currentVideoTrackRef.current = currentVideoTrack || null;

        // Сохраняем поток экрана
        screenStreamRef.current = screenStream;

        // Заменяем трек в локальном потоке
        if (localStream && currentVideoTrack) {
          localStream.removeTrack(currentVideoTrack);
          localStream.addTrack(screenVideoTrack);
          console.log("Added screen track to local stream");
        }

        // Заменяем трек в RTC соединении
        if (replaceVideoTrack) {
          replaceVideoTrack(screenVideoTrack);
        }

        setLocalScreenOn(true);
        setLocalVideoOn(false);

        // Обновляем видео элемент для экрана
        if (localScreenRef.current) {
          localScreenRef.current.srcObject = screenStream;
          localScreenRef.current.play().catch(err => console.warn("Could not play screen:", err));
        }

        // Обработчик окончания демонстрации
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

      // Останавливаем поток экрана
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }

      // Восстанавливаем камеру
      if (currentVideoTrackRef.current && localStream) {
        const cameraTrack = currentVideoTrackRef.current;

        // Убираем все видео треки
        const videoTracks = localStream.getVideoTracks();
        videoTracks.forEach(track => localStream.removeTrack(track));

        // Добавляем трек камеры обратно
        localStream.addTrack(cameraTrack);
        cameraTrack.enabled = true;

        // Заменяем трек в RTC соединении
        if (replaceVideoTrack) {
          replaceVideoTrack(cameraTrack);
        }

        // Обновляем видео элемент
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
          localVideoRef.current.play().catch(err => console.warn("Could not play video:", err));
        }
      }

      setLocalScreenOn(false);
      setLocalVideoOn(true);

      if (localScreenRef.current) {
        localScreenRef.current.srcObject = null;
      }
    } catch (err) {
      console.error("Error stopping screen share:", err);
    }
  }, [localStream, replaceVideoTrack]);

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
            />
          ) : localVideoOn && localStream ? (
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
        </div>

        {/* Удаленное видео */}
        <div className={`video-box ${expandedWindow === "remoteVideo" ? "main" : "side"} ${speaking ? "speaking" : ""}`}
          onClick={() => setExpandedWindow("remoteVideo")}>
          {remoteScreenOn ? (
            <video
              autoPlay
              playsInline
              ref={remoteScreenRef}
              className="video-stream"
            />
          ) : remoteVideoOn && remoteStream ? (
            <video
              autoPlay
              muted={false}
              playsInline
              ref={remoteVideoRef}
              className="video-stream"
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
        <button onClick={handleToggleScreenShare} className={`control-btn ${localScreenOn ? "active" : ""}`}>
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