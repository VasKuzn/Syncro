import React from "react";
import "../../Styles/CallWindow.css";

interface CallWindowProps {
  isIncoming: boolean;           
  userName: string;              
  avatarUrl: string;             
  onAccept?: () => void;        
  onReject: () => void;      
}

const CallWindow: React.FC<CallWindowProps> = ({
  isIncoming,
  userName,
  avatarUrl,
  onAccept,
  onReject
}) => {
  return (
    <div className="call-window">
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
                <img src="search.png" alt="Принять" />
              </button>
              <button className="btn reject" onClick={onReject}>
                <img src="search.png" alt="Отклонить" />
              </button>
            </>
          ) : (
            <button className="btn reject" onClick={onReject}>
              <img src="search.png" alt="Отменить" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallWindow;
