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
  }, [remoteStream, remoteVideoRef.current]);
  
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
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
      
        const screenVideoTrack = screenStream.getVideoTracks()[0];
        const currentVideoTrack = localStream?.getVideoTracks()[0]; // Сохраняем камеру
        currentVideoTrackRef.current = currentVideoTrack;
      
        if (screenVideoTrack) {
          replaceVideoTrack(screenVideoTrack);
        
          if (localStream && currentVideoTrack) {
            localStream.removeTrack(currentVideoTrack);
            localStream.addTrack(screenVideoTrack);
          
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStream;
            }
          }
        
          setLocalScreenOn(true);
          setLocalVideoOn(true);
        
          screenVideoTrack.onended = () => {
            handleStopScreenShare();
          };
        }
      } catch (err) {
        console.error("Screen share failed:", err);
      }
    } else {
      handleStopScreenShare();
    }
  };

  const handleStopScreenShare = async () => {
    if (localScreenRef.current?.srcObject) {
      const stream = localScreenRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  
    if (currentVideoTrackRef.current) {
      replaceVideoTrack(currentVideoTrackRef.current);  // Восстанавливаем камеру
    
      if (localStream) {
        const screenTrack = localStream.getVideoTracks().find(track => track.kind === 'video');
        if (screenTrack) {
          localStream.removeTrack(screenTrack);
        }
        localStream.addTrack(currentVideoTrackRef.current);
      
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      }
    }
  
    setLocalScreenOn(false);
    setLocalVideoOn(true);
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
              muted={false}
              playsInline
              ref={remoteVideoRef}
              className="video-stream"
              onLoadedMetadata={handleRemoteVideoLoaded} //e.currentTarget.play()} //{() => console.log("Remote video metadata loaded")}
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