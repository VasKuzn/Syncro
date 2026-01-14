import { FriendDetailsProps } from "../../Types/FriendType";
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser, getPersonalConference, markMessagesAsRead } from "../../Services/MainFormService";

export const FriendDetails = ({ friend, friends, setFriends, onAccept, onCancel }: FriendDetailsProps) => {
    if (!friend) return null;

    const navigate = useNavigate();

    const goToChat = async () => {
        try {
            const currentUserId = await fetchCurrentUser();
            const personalConferenceId = await getPersonalConference(currentUserId, friend.id);

            // Немедленная навигация
            navigate("/chat", {
                state: {
                    friends: friends,
                    friendId: friend.id,
                    personalConferenceId: personalConferenceId
                }
            });

            // Остальное делаем после перехода
            setTimeout(async () => {
                try {
                    const { messageHub } = await import("../../Hubs/MessageHub");
                    await messageHub.init();
                    await messageHub.subscribeToConference(personalConferenceId);
                    await markMessagesAsRead(personalConferenceId);

                    setFriends(prev =>
                        prev.map(f =>
                            f.id === friend.id ? { ...f, unreadCount: 0 } : f
                        )
                    );
                } catch (error) {
                    console.error("Ошибка инициализации чата:", error);
                }
            }, 0);

        } catch (error) {
            console.error("Ошибка перехода в чат:", error);
        }
    };

    return (
        <div className="friend-details">
            <div className="friend-header">
                <img src={friend?.avatar || "./logo.png"} alt="Avatar" className="friend-avatar big" />
                <div className="friend-main-info">
                    <div className="nickname">
                        {friend?.firstname || "Мой"} {friend?.lastname || "друг"}
                    </div>
                    <div className={`online-status ${friend.isOnline ? "" : "offline"}`}>
                        {friend.isOnline ? "В сети" : "Не в сети"}
                    </div>
                </div>
            </div>

            <div className="friend-info">
                <div className="info-row">
                    <span className="info-label">Email:</span> {friend.email}
                </div>
                <div className="info-row">
                    <span className="info-label">Телефон:</span> {friend.phonenumber}
                </div>
                <div className="info-row">
                    <span className="info-label">Друзья с:</span> {new Date(friend.friendsSince).toLocaleDateString()}
                </div>
                <div className="profile-link">Перейти к полному профилю</div>
            </div>

            <div className="actions">
                <button className="action-btn primary" onClick={goToChat}>
                    💬 Перейти к чату
                </button>
            </div>
        </div>
    );
};