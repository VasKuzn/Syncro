import { FriendDetailsProps } from "../../Types/FriendType";

export const FriendDetails = ({ friend, onAccept, onCancel }: FriendDetailsProps) => {
    if (!friend) return null;

    return (
        <div className="friend-details">
            <div className="friend-header">
                <img src={friend.avatar} alt="Avatar" className="friend-avatar" />
                <div>
                    <div className="nickname">
                        {friend.firstname} {friend.lastname}
                    </div>
                    <div className={`online-status ${friend.isOnline ? "" : "offline"}`}>
                        {friend.isOnline ? "Online" : "Offline"}
                    </div>
                </div>
            </div>

            <div className="friend-info">
                <div><strong>Email:</strong> {friend.email}</div>
                <div><strong>Phone:</strong> {friend.phonenumber}</div>
                <div><strong>Friends Since:</strong> {new Date(friend.friendsSince).toLocaleDateString()}</div>
            </div>

            {friend.status === 2 && (
                <button
                    onClick={() => onAccept?.(friend)}
                    className="accept-button"
                >
                    Принять
                </button>
            )}

            {friend.status === 0 && friend.userWhoSent === friend.id && (
                <button
                    onClick={() => onCancel?.(friend)}
                    className="decline-button"
                >
                    Отменить заявку
                </button>
            )}
        </div>
    );
};