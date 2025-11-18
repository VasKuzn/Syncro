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

  // Обновляем состояние когда приходят потоки
  useEffect(() => {
    if (localStream) {
      setLocalVideoOn(true);
      console.log("Local stream available, tracks:", localStream.getTracks().length);
    }
    if (remoteStream) {
      setRemoteVideoOn(true);
      console.log("Remote stream available, tracks:", remoteStream.getTracks().length);
    }
  }, [localStream, remoteStream]);

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

  const handleToggleScreenShare = async () => {
    if (!localScreenOn) {
      try {
        const stream = await (navigator.mediaDevices as any).getDisplayMedia({
          video: true,
          audio: true
        });

        if (localScreenRef.current) {
          localScreenRef.current.srcObject = stream;
        }
        setLocalScreenOn(true);

        // Обработчик остановки демонстрации экрана
        stream.getTracks().forEach((track: MediaStreamTrack) => { // Добавлен тип
          track.onended = () => {
            setLocalScreenOn(false);
            if (localScreenRef.current) {
              localScreenRef.current.srcObject = null;
            }
          };
        });
      } catch (err) {
        console.error("Screen share failed", err);
      }
    } else {
      if (localScreenRef.current?.srcObject) {
        const stream = localScreenRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop()); // Добавлен тип
        localScreenRef.current.srcObject = null;
      }
      setLocalScreenOn(false);
    }
  };

  const handleToggleMic = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((track: MediaStreamTrack) => { // Добавлен тип
        track.enabled = !track.enabled;
      });
      setMicOn(!micOn);
    }
  };

  const handleToggleCamera = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((track: MediaStreamTrack) => { // Добавлен тип
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
          {localVideoOn && localStream ? (
            <video
              autoPlay
              muted
              playsInline
              ref={localVideoRef}
              className="video-stream"
              onLoadedMetadata={() => console.log("Local video metadata loaded")}
              onCanPlay={() => console.log("Local video can play")}
            />
          ) : localScreenOn ? (
            <video autoPlay muted playsInline ref={localScreenRef} className="video-stream" />
          ) : (
            <img src={localAvatarUrl} className="video-avatar" alt="Local user" />
          )}
        </div>

        {/* Удаленное видео */}
        <div className={`video-box ${expandedWindow === "remoteVideo" ? "main" : "side"} ${speaking ? "speaking" : ""}`}
          onClick={() => setExpandedWindow("remoteVideo")}>
          {remoteVideoOn && remoteStream ? (
            <video
              autoPlay
              playsInline
              ref={remoteVideoRef}
              className="video-stream"
              onLoadedMetadata={() => console.log("Remote video metadata loaded")}
              onCanPlay={() => console.log("Remote video can play")}
            />
          ) : remoteScreenOn ? (
            <video autoPlay playsInline ref={remoteScreenRef} className="video-stream" />
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