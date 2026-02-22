import { useState, useEffect, useCallback } from "react";
import { GroupConf } from "../../Types/GroupConf";
import { NetworkError } from "../../Types/LoginTypes";
import { fetchCurrentUser, getUserInfo, getGroups, getFriends } from '../../Services/MainFormService';
import * as signalR from "@microsoft/signalr";
import { useNavigate } from "react-router-dom";
import { UserInfo } from "../../Types/UserInfo";
import { Friend } from '../../Types/FriendType';
import CreateGroupModal, {  } from '../GroupChat/CreateGroupModal';

const GroupChatsComponent = () => {
    const [groups, setGroups] = useState<GroupConf[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const navigate = useNavigate();

    const initSignalR = useCallback(async (userId: string) => {
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5232/groupshub", {
                withCredentials: true,
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();

        newConnection.on("GroupsUpdated", () => {
            console.log("Received groups update notification");
            getGroups(userId).then(gcs => setGroups(gcs));
        });

        try {
            await newConnection.start();
            await newConnection.invoke("SubscribeToGroupsUpdates", userId);
            setConnection(newConnection);
        } catch (err) {
            console.error("SignalR Connection Error: ", err);
        }

        return newConnection;
    }, [getGroups]);

    const refreshGroupsData = useCallback(async (userId: string) => {
        setLoading(true);
        try {
            const gcs = await getGroups(userId);
            setGroups(gcs);
        } catch (error) {
            setError((error as NetworkError).message || 'Network error');
            console.error("Ошибка обновления групп:", error);
        } finally {
            setLoading(false);
        }
    }, [getGroups]);

        useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                // Сначала получаем ID
                const userId = await fetchCurrentUser();
                if (isMounted && userId) {
                    setCurrentUserId(userId);  // сохраняем ID отдельно
                    
                    // Потом получаем полную информацию
                    const userData = await getUserInfo(userId);
                    setCurrentUser(userData);

                    // Загружаем друзей
                    try {
                        const friendsData = await getFriends(userId);
                        setFriends(friendsData);
                    } catch (error) {
                        console.error("Ошибка загрузки друзей:", error);
                    }

                    await refreshGroupsData(userId);
                    await initSignalR(userId);
                }
            } catch (error) {
                console.error("Ошибка загрузки:", error);
            }
        };

        loadData();

        return () => {
            isMounted = false;
            connection?.stop();
        };
    }, [refreshGroupsData, initSignalR]);
    const avatarUrl = currentUser?.avatar || "/logo.png";
    if (loading) return <div></div>;
    if (error) return <div></div>;

return (
    <div className="group-chats-container">
        <div className="group-chats">
            <div className="main-logo">
                <img src="/logo-icon-transparent.png" alt="Syncro logo" width="35" height="35" onClick={e => navigate("/main")} />
            </div>
            <div className="chat-separator"></div>
            <div className="group-chat-list">
                {groups.map(group => (
                    <div key={group.id} className="group-chat-item">
                        {group.conferenceName}
                    </div>
                ))}
            </div>
            <div 
                className="group-chat-item add"
                onClick={() => {
                    console.log('Клик по +');
                    setShowCreateModal(true);
                }}
            >
                <span className="add-icon">+</span>
            </div>
        </div>
        
        {/* МОДАЛКА ДОЛЖНА БЫТЬ ЗДЕСЬ - ВНУТРИ RETURN */}
        {showCreateModal && (
            <CreateGroupModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                friends={friends}
                onGroupCreated={(groupId) => navigate(`/group-chat/${groupId}`)}
                currentUserId={currentUserId}
            />
        )}
    </div>
);
};

export default GroupChatsComponent;
