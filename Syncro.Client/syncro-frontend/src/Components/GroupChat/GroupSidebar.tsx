import React from 'react';
import { UserInfo } from '../../Types/UserInfo';
import '../../Styles/GroupChat.css';

interface GroupSidebarProps {
    participants: UserInfo[];
    currentUserId: string | null;
    groupName: string;
    groupAvatar?: string | null;
}

const GroupSidebar: React.FC<GroupSidebarProps> = ({
    participants,
    currentUserId,
    groupName,
    groupAvatar
}) => {
    return (
        <div className="group-chats"> {/* используем тот же класс что у списка групп */}
            <div className="group-sidebar-header">
                <div className="group-info-preview">
                    <img 
                        src={groupAvatar || "./logo.png"} 
                        alt={groupName} 
                        className="group-avatar-large"
                    />
                    <h3 className="group-name-large">{groupName}</h3>
                </div>
            </div>
            
            <div className="chat-separator"></div>
            
            <div className="participants-section">
                <div className="participants-title">
                    <span>Участники</span>
                    <span className="participants-count">{participants.length}</span>
                </div>
                
                <div className="participants-list">
                    {participants.map(user => (
                        <div 
                            key={user.id} 
                            className={`participant-item ${user.id === currentUserId ? 'current-user' : ''}`}
                            title={user.nickname}
                        >
                            <div className="participant-avatar-wrapper">
                                <img 
                                    src={user.avatar || "./logo.png"} 
                                    alt={user.nickname}
                                    className="participant-avatar"
                                />
                                {user.isOnline && <span className="online-indicator" />}
                            </div>
                            <span className="participant-name">{user.nickname}</span>
                            {user.id === currentUserId && <span className="you-badge">Вы</span>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GroupSidebar;