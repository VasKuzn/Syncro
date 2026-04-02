import React, { useRef } from "react";
import { CallWindowProps } from "../../Types/ChatTypes";
import minimizingCallSound from "../../assets/minimizing_call.mp3";

const CallWindow: React.FC<CallWindowProps> = ({
  isIncoming,
  userName,
  avatarUrl,
  onAccept,
  onReject
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleReject = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.warn("Failed to play reject sound:", err);
      });
    }
    onReject();
  };

  return (
    <div className="call-window">
      <audio ref={audioRef} src={minimizingCallSound} preload="auto" />
      <div className="call-content">
        <img src={avatarUrl} alt={userName} className="call-avatar" />
        <div className="call-info">
          <h3 className="call-username">{userName}</h3>
          <p className="call-status">
            {isIncoming ? "Входящий звонок..." : "Звоним..."}
          </p>
        </div>

        <div className="call-buttons">
          {isIncoming ? (
            <>
              <button className="btn accept" onClick={onAccept}>
                <img src="call_received_icon.png" alt="Принять" />
              </button>
              <button className="btn reject" onClick={handleReject}>
                <img src="call_remove_icon.png" alt="Отклонить" />
              </button>
            </>
          ) : (
            <button className="btn reject" onClick={handleReject}>
              <img src="call_remove_icon.png" alt="Отменить" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallWindow;