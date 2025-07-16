import { FriendProps } from "../../Types/FriendType";
import { useNavigate } from 'react-router-dom';
const PersonalChatsComponent = ({ friends }: FriendProps) => {
    const navigate = useNavigate();
    return (
        <div className="personal-chats">
            <div className="search-pm">
                <button className="button-search-pm">
                    Личные сообщения
                </button>
            </div>
            <div className="pc-list">
                {friends.map(friend => (
                    <div key={friend.id} className="pc-item" onClick={e => { navigate("/chat", { state: { friends, friendId: friend.id } }); }}>
                        <div className="friend-info-container">
                            <div className="friend-avatar-container">
                                <img className="friend-avatar" src={"/logo.png"}></img>
                            </div>
                            <div className="friend-text-info">
                                <span className="nickname">{friend.nickname}</span>
                                <span className={`online-status ${friend.isOnline ? '' : 'offline'}`}>{friend.isOnline ? "В сети" : "Не в сети"}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default PersonalChatsComponent;