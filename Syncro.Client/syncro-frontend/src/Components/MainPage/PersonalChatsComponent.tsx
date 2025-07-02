import { FriendProps } from "../../Types/FriendType";

const PersonalChatsComponent = ({ friends }: FriendProps) => {

    return (
        <div className="personal-chats">
            <div className="search-pm">
                <button className="button-search-pm">
                    Личные сообщения
                </button>
            </div>
            <div className="pc-list">
                {friends.map(friend => (
                    <div key={friend.id} className="pc-item">
                        <div className="friend-info-container">
                            <div className="friend-avatar-container">
                                <img className="friend-avatar" src={friend.avatar}></img>
                            </div>
                            <div className="friend-text-info">
                                <label className="nickname">{friend.nickname}</label>
                                <label className="online-status">{friend.isOnline ? "В сети" : "Не в сети"}</label>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default PersonalChatsComponent;