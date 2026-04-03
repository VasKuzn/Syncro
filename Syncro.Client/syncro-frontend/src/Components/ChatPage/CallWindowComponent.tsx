import React, { useRef, useEffect } from "react";
import { CallWindowProps } from "../../Types/ChatTypes";
import minimizingCallSound from "../../assets/minimizing_call.mp3";
import callSound from "../../assets/call_sound.mp3"; // импорт рингтона

const CallWindow: React.FC<CallWindowProps> = ({
  isIncoming,
  userName,
  avatarUrl,
  onAccept,
  onReject
}) => {
  const rejectSoundRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  // Запускаем рингтон при монтировании окна
  useEffect(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch(err => {
        console.warn("Failed to play ringtone:", err);
      });
    }

    // Останавливаем рингтон при размонтировании (если окно закрыто без действий)
    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    };
  }, []);

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  const handleAccept = () => {
    stopRingtone();
    onAccept?.();
  };

  const handleReject = () => {
    stopRingtone();

    if (rejectSoundRef.current) {
      rejectSoundRef.current.currentTime = 0;
      rejectSoundRef.current.play().catch(err => {
        console.warn("Failed to play reject sound:", err);
      });
    }
    onReject();
  };

  return (
    <div className="call-window">
      {/* Звук при отклонении */}
      <audio ref={rejectSoundRef} src={minimizingCallSound} preload="auto" />
      {/* Рингтон, играющий до завершения звонка */}
      <audio ref={ringtoneRef} src={callSound} preload="auto" />

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
              <button className="btn accept" onClick={handleAccept}>
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