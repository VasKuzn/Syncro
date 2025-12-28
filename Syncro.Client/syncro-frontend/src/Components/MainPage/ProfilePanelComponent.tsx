import { useNavigate } from "react-router-dom";
import { ShortUserInfo } from "../../Types/UserInfo";

const ProfilePanelComponent = ({nickname, avatar, isOnline}: ShortUserInfo) => {
    const navigate = useNavigate();
    return (
    <div className="profile-panel">
        <div className="profile-info-container">
            <div className="profile-avatar-container">
                <img className="profile-avatar" src={avatar || "logo.png"}></img>
            </div>
            <div className="profile-text-info">
                <span className="nickname">{nickname}</span>
                <span className={`online-status ${isOnline ? '' : 'offline'}`}>{isOnline ? "В сети" : "Не в сети"}</span>
            </div>
        </div>
        <button className="profile-button"
                onClick={e => navigate("/settings")}>
            <img className="settings-image" src="settings.png"/>
        </button>
    </div>
)}

export default ProfilePanelComponent