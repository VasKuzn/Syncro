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
  const [micOn, setMicOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localScreenRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteScreenRef = useRef<HTMLVideoElement>(null);
  const currentVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

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

      setLocalVideoOn(!!videoTrack && !isScreen);

      const audioTrack = localStream.getAudioTracks()[0];
      setMicOn(!!audioTrack && audioTrack.enabled);

      // Важно: всегда обновляем srcObject при изменении стрима
      if (!localScreenOn && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play().catch(err => {
          console.warn("Could not play local video:", err);
          // Пробуем еще раз через небольшую задержку
          setTimeout(() => {
            localVideoRef.current?.play().catch(e =>
              console.warn("Retry failed:", e)
            );
          }, 100);
        });
      }
    }
  }, [localStream, localScreenOn]);

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

      // Всегда обновляем remoteVideoRef
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(err => {
          console.warn("Could not play remote video:", err);
          setTimeout(() => {
            remoteVideoRef.current?.play().catch(e =>
              console.warn("Remote video retry failed:", e)
            );
          }, 100);
        });
      }

      // Для скриншеринга отдельный элемент
      if (isScreenShare && remoteScreenRef.current) {
        remoteScreenRef.current.srcObject = remoteStream;
        remoteScreenRef.current.play().catch(err =>
          console.warn("Could not play remote screen:", err)
        );
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
      }
    }
  }, [localStream, localScreenOn]);

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

        if (localScreenRef.current) {
          localScreenRef.current.srcObject = screenStream;
          localScreenRef.current.play().catch(err => console.warn("Could not play screen:", err));
        }

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
        const videoTracks = localStream.getVideoTracks();
        videoTracks.forEach(track => localStream.removeTrack(track));

        localStream.addTrack(currentVideoTrackRef.current);
        currentVideoTrackRef.current.enabled = true;

        if (replaceVideoTrack) {
          replaceVideoTrack(currentVideoTrackRef.current);
        }

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
        <div className={`video-box side ${speaking ? "speaking" : ""}`}>
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
          <div className="user-name">{localUserName}</div>
        </div>

        {/* Удаленное видео */}
        <div className={`video-box main ${speaking ? "speaking" : ""}`}>
          {remoteStream ? (
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
        <button className="control-btn end-call" onClick={onEndCall}>
          <img src="/call_remove_icon.png" alt="End call" className="icon" />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;