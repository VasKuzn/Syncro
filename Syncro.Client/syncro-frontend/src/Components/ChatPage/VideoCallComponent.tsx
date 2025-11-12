import { useState, useEffect, useRef } from 'react';
import { VideoCallProps } from "../../Types/ChatTypes";


const VideoCall: React.FC<VideoCallProps> = ({
  onEndCall,
  localUserName,
  localAvatarUrl,
  remoteUserName,
  remoteAvatarUrl,
}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);

  const [localVideoOn, setLocalVideoOn] = useState(false);
  const [localScreenOn, setLocalScreenOn] = useState(false);
  const [remoteVideoOn, setRemoteVideoOn] = useState(true);
  const [remoteScreenOn, setRemoteScreenOn] = useState(false);

  const [micOn, setMicOn] = useState(true);
  const [expandedWindow, setExpandedWindow] = useState<
  "localVideo" | "localScreen" | "remoteVideo" | "remoteScreen" | null
>(
  localScreenOn ? "localScreen" :
  localVideoOn ? "localVideo" :
  remoteScreenOn ? "remoteScreen" :
  remoteVideoOn ? "remoteVideo" :
  null
);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localScreenRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteScreenRef = useRef<HTMLVideoElement>(null);

  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        setLocalVideoOn(true);
      } catch (err) {
        console.error(err);
      }
    };

    init();
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const testVideo = document.createElement("video");
    testVideo.src = "test_video.mp4";
    testVideo.loop = true;
    testVideo.autoplay = true;
    testVideo.muted = true;

    testVideo.onloadeddata = () => {
      const stream = (testVideo as any).captureStream();
      setRemoteStream(stream);
  };
    testVideo.play();
  }, []);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
    if (localScreenRef.current && localScreenStream) localScreenRef.current.srcObject = localScreenStream;
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
    if (remoteScreenRef.current && remoteScreenStream) remoteScreenRef.current.srcObject = remoteScreenStream;
  }, [localStream, localScreenStream, remoteStream, remoteScreenStream]);

  const handleToggleScreenShare = async () => {
    if (!localScreenOn) {
      try {
        const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
        setLocalScreenStream(stream);
        setLocalScreenOn(true);
      } catch (err) {
        console.error("Screen share failed", err);
      }
    } else {
      localScreenStream?.getTracks().forEach(track => track.stop());
      setLocalScreenStream(null);
      setLocalScreenOn(false);
    }
  };

  const handleToggleMic = async () => {
    if (micOn) {
      micStream?.getAudioTracks().forEach(track => track.enabled = false);
      setMicOn(false);
    } else {
      if (!micStream) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setMicStream(stream);
        } catch (err) {
          console.error("Failed to get mic", err);
        }
      } else {
        micStream.getAudioTracks().forEach(track => track.enabled = true);
      }
      setMicOn(true);
    }
  };

  const handleToggleCamera = async () => {
    if (localVideoOn) {
      localStream?.getVideoTracks().forEach(track => track.stop());
      setLocalStream(null);
      setLocalVideoOn(false);
      if (expandedWindow === "localVideo") setExpandedWindow(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        setLocalVideoOn(true);
        setExpandedWindow("localVideo");
      } catch (err) {
        console.error("Failed to get camera", err);
      }
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
  {localVideoOn ? (
    <div
      className={`video-box ${expandedWindow === "localVideo" ? "main" : "side"}  ${speaking ? "speaking" : ""}`}
      onClick={() => setExpandedWindow("localVideo")}>
      <video autoPlay muted playsInline ref={localVideoRef} className="video-stream" />
    </div>
  ) : localScreenOn? (
    null
  ) : <img src={localAvatarUrl} className={'video-avatar ${speaking ? "speaking" : ""}'} />
  }
  {localScreenOn ? (
    <div
      className={`video-box ${expandedWindow === "localScreen" ? "main" : "side"} ${speaking ? "speaking" : ""}`}
      onClick={() => setExpandedWindow("localScreen")}>
      <video autoPlay muted playsInline ref={localScreenRef} className="video-stream" />
    </div>
  ) : (
    null
  )}
  {remoteVideoOn ? (
    <div
      className={`video-box ${expandedWindow === "remoteVideo" ? "main" : "side"} ${speaking ? "speaking" : ""}`}
      onClick={() => setExpandedWindow("remoteVideo")}>
      <video autoPlay muted playsInline ref={remoteVideoRef} className="video-stream" />
    </div>
  ) : remoteScreenOn ? (
    null
  ) : <img src={remoteAvatarUrl} className={'video-avatar ${speaking ? "speaking" : ""}'} />
  }
  {remoteScreenOn ? (
    <div
      className={`video-box ${expandedWindow === "remoteScreen" ? "main" : "side"} ${speaking ? "speaking" : ""}`}
      onClick={() => setExpandedWindow("remoteScreen")}>
      <video autoPlay muted playsInline ref={remoteScreenRef} className="video-stream" />
    </div>
  ) : (
    null
  )}

</div>
  <div className="video-controls">
    <button onClick={handleToggleMic} className={`control-btn ${micOn ? "" : "off"}`}>
      <img src={micOn ? "microphone_on_icon.png" : "microphone_off_icon.png"} alt="Mic" className="icon"/>
    </button>
    <button onClick={handleToggleCamera} className={`control-btn ${localVideoOn ? "" : "off"}`}>
      <img src={localVideoOn ? "video_icon.png" : "video_slash_icon.png"} alt="Cam" className='icon'/>
    </button>
    <button onClick={handleToggleScreenShare} className={`control-btn ${localScreenOn ? "" : "off"}`}>
      <img src={localScreenOn ? "screen_stop_demonstration_icon.png" : "screen_demonstration_icon.png"} alt="Screen" className='icon'/>
    </button>
    <button className="control-btn end-call" onClick={onEndCall}>
      <img src="call_remove_icon.png" alt="End call" className="icon" />
    </button>
  </div>
</div>
  );
};

export default VideoCall;