import { useState } from "react";
import "../../Styles/VideoCall.css";


const VideoCall = ({ onEndCall }: { onEndCall: () => void }) => {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  return (
    <div className="video-call-container">
      <div className="video-top">
        <div className="video-avatar">
          <img src="https://i.pravatar.cc/80" alt="User avatar" className="avatar" />
          {!videoOn && <div className="video-placeholder">🎧</div>}
        </div>
      </div>

      <div className="video-controls">
        <button onClick={() => setMicOn(!micOn)} className={`control-btn ${micOn ? "" : "off"}`}>
          <img src={micOn ? "search.png" : "search3.png"} alt="Mic" className="icon" />
        </button>

        <button onClick={() => setVideoOn(!videoOn)} className={`control-btn ${videoOn ? "" : "off"}`}>
          <img src={videoOn ? "search.png" : "search3.png"} alt="Cam" className="icon" />
        </button>

        <button className="control-btn">
          <img src="search.png" alt="Share screen" className="icon" />
        </button>

        <button className="control-btn end-call" onClick={onEndCall}>
          <img src="search.png" alt="End call" className="icon" />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;