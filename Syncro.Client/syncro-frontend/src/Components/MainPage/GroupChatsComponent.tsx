import { useState, useEffect, useCallback, useRef } from "react";
import { GroupConf } from "../../Types/GroupConf";
import { NetworkError } from "../../Types/LoginTypes";
import { fetchCurrentUser, getUserInfo, getGroups, getFriends } from '../../Services/MainFormService';
import * as signalR from "@microsoft/signalr";
import { useNavigate } from "react-router-dom";
import { UserInfo } from "../../Types/UserInfo";
import { Friend, FriendProps } from '../../Types/FriendType';
import CreateGroupModal from '../GroupChat/CreateGroupModal';
import '../../Styles/GroupChat.css';

const GroupChatsComponent = ({ friends, setFriends, baseUrl, csrfToken }: FriendProps) => {
    const [groups, setGroups] = useState<GroupConf[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const navigate = useNavigate();

    const setFriendsRef = useRef(setFriends);
    const baseUrlRef = useRef(baseUrl);

    useEffect(() => {
        setFriendsRef.current = setFriends;
        baseUrlRef.current = baseUrl;
    }, [setFriends, baseUrl]);

    const initSignalR = useCallback(async (userId: string) => {
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${baseUrlRef.current}/groupshub`, {
                withCredentials: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();

        newConnection.on("GroupsUpdated", () => {
            getGroups(userId, baseUrlRef.current).then(gcs => setGroups(gcs));
        });

        try {
            await newConnection.start();
            await newConnection.invoke("SubscribeToGroupsUpdates", userId);
            setConnection(newConnection);
        } catch (err) {
            console.error("SignalR Connection Error: ", err);
        }

        return newConnection;
    }, []);

    const refreshGroupsData = useCallback(async (userId: string) => {
        setLoading(true);
        try {
            const gcs = await getGroups(userId, baseUrlRef.current);
            setGroups(gcs);
        } catch (error) {
            setError((error as NetworkError).message || 'Network error');
            console.error("Ошибка обновления групп:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        let mountedConnection: signalR.HubConnection | null = null;

        const loadData = async () => {
            try {
                const userId = await fetchCurrentUser(baseUrlRef.current);
                if (isMounted && userId) {
                    setCurrentUserId(userId);

                    const userData = await getUserInfo(userId, baseUrlRef.current);
                    setCurrentUser(userData);

                    await refreshGroupsData(userId);

                    mountedConnection = await initSignalR(userId);
                }
            } catch (error) {
                console.error("Ошибка загрузки:", error);
            }
        };

        loadData();

        return () => {
            isMounted = false;
            if (mountedConnection) {
                mountedConnection.stop();
            }
        };
    }, [refreshGroupsData, initSignalR]);

    if (loading) return <div></div>;
    if (error) return <div></div>;

    return (
        <div className="group-chats-container">
            <div className="group-chats">
                <div className="main-logo">
                    <img
                        src="/logo-icon-transparent.png"
                        alt="Syncro logo"
                        width="35"
                        height="35"
                        onClick={() => navigate("/main")}
                    />
                </div>
                <div className="chat-separator"></div>
                <div className="group-chat-list">
                    {groups.map(group => (
                        <div
                            key={group.id}
                            className="group-chat-item"
                            onClick={() => navigate(`/group-chat/${group.id}`)}
                        >
                            <div className="group-icon-wrapper">
                                <img
                                    src="/logo-icon-transparent.png"
                                    alt="group"
                                    className="group-icon"
                                />
                                <span
                                    className="group-name-tooltip"
                                    ref={(el) => {
                                        if (el) {
                                            const rect = el.parentElement?.getBoundingClientRect();
                                            if (rect) {
                                                const tooltipWidth = el.offsetWidth;
                                                let left = rect.right + 10;

                                                const maxLeft = window.innerWidth - tooltipWidth - 10;
                                                if (left > maxLeft) {
                                                    left = rect.left - tooltipWidth - 10;
                                                }

                                                if (left < 10) left = 10;

                                                el.style.left = `${left}px`;
                                            }
                                        }
                                    }}
                                >
                                    {group.conferenceName}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                <div
                    className="group-chat-item add"
                    onClick={() => {
                        setShowCreateModal(true);
                    }}
                >
                    <span className="add-icon">+</span>
                </div>
            </div>

            {showCreateModal && (
                <CreateGroupModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    friends={friends} // Передаем всех друзей без фильтрации
                    onGroupCreated={(groupId) => navigate(`/group-chat/${groupId}`)}
                    currentUserId={currentUserId}
                    baseUrl={baseUrl}
                    csrfToken={csrfToken}
                />
            )}
        </div>
    );
};

export default GroupChatsComponent;