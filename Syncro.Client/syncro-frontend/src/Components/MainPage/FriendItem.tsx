import { motion } from 'framer-motion';
import { Friend, ShortFriend } from "../../Types/FriendType";

interface FriendItemProps {
    friend: Friend;
    onClick: (friend: Friend | ShortFriend) => void;
}

export const FriendItem: React.FC<FriendItemProps> = ({ 
    friend, 
    onClick, 
}) => {
    return (
        <motion.div
            key={friend.id}
            className="friend-item"
            onClick={() => onClick(friend)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.2 }}>
            <div className="friend-avatar-container">
                <img
                    className="friend-avatar"
                    src={friend.avatar || '/logo.png'}
                    alt={`Аватар ${friend.nickname}`}
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.png';
                    }}
                />
            </div>
            <div className="friend-info-container">
                <div className="friend-text-info">
                    <span className="nickname">{friend.nickname}</span>
                    <span className={`online-status ${friend.isOnline ? '' : 'offline'}`}>
                        {friend.isOnline ? "В сети" : "Не в сети"}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

export default FriendItem;