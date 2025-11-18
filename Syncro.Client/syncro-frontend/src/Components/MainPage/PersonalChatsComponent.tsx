import { fetchCurrentUser, getPersonalConference } from "../../Services/MainFormService";
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
                    <div
                        key={friend.id}
                        className="pc-item"
                        onClick={async (e) => {
                            try {
                                const currentUserId = await fetchCurrentUser();
                                const personalConferenceId = await getPersonalConference(currentUserId, friend.id);

                                navigate("/chat", {
                                    state: {
                                        friends,
                                        friendId: friend.id,
                                        personalConferenceId
                                    }
                                });
                            } catch (error) {
                                console.error("Ошибка при получении конференции:", error);
                            }
                        }}
                    >
                        <div className="friend-info-container">
                            <div className="friend-avatar-container">
                                <img className="friend-avatar" src={friend.avatar || "logo.png"}></img>
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