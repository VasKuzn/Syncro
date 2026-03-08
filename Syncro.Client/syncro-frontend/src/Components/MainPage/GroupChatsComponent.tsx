import { useState, useEffect, useCallback } from "react";
import { GroupConf } from "../../Types/GroupConf";
import { NetworkError } from "../../Types/LoginTypes";
import { fetchCurrentUser, getUserInfo, getGroups, getFriends } from '../../Services/MainFormService';
import * as signalR from "@microsoft/signalr";
import { useNavigate } from "react-router-dom";
import { UserInfo } from "../../Types/UserInfo";
import { Friend } from '../../Types/FriendType';
import CreateGroupModal from '../GroupChat/CreateGroupModal';
import '../../Styles/GroupChat.css';
import logo from '../../assets/logo.png';
import { useCsrf } from "../../Contexts/CsrfProvider";

const GroupChatsComponent = () => {
    const [groups, setGroups] = useState<GroupConf[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [friends, setFriends] = useState<Friend[]>([]);
    const { baseUrl, csrfToken } = useCsrf();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const navigate = useNavigate();

    const initSignalR = useCallback(async (userId: string) => {
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${baseUrl}/groupshub`, {
                withCredentials: true,
                //skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();

        newConnection.on("GroupsUpdated", () => {
            console.log("Received groups update notification");
            getGroups(userId, baseUrl).then(gcs => setGroups(gcs));
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
            const gcs = await getGroups(userId, baseUrl);
            setGroups(gcs);
        } catch (error) {
            setError((error as NetworkError).message || 'Network error');
            console.error("Ошибка обновления групп:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Функция для загрузки детальной информации о друзьях
    const loadFriendDetails = useCallback(async (friendshipList: any[], userId: string) => {
        const friendsList: Friend[] = [];

        for (const f of friendshipList) {
            // Берем только подтвержденных друзей (status = 1)
            if (f.status === 1) {
                // Определяем ID друга (не текущий пользователь)
                const friendId = f.userWhoSent === userId ? f.userWhoRecieved : f.userWhoSent;

                try {
                    // Загружаем полную информацию о друге
                    const response = await fetch(`${baseUrl}/api/accounts/${friendId}`, {
                        credentials: 'include'
                    });

                    if (response.ok) {
                        const friendData = await response.json();

                        friendsList.push({
                            id: friendId,
                            nickname: friendData.nickname || 'Без имени',
                            avatar: friendData.avatar || logo,
                            email: friendData.email,
                            phonenumber: friendData.phonenumber,
                            firstname: friendData.firstname,
                            lastname: friendData.lastname,
                            isOnline: friendData.isOnline || false,
                            status: f.status,
                            userWhoReceived: f.userWhoRecieved,
                            userWhoSent: f.userWhoSent,
                            friendShipId: f.id,
                            friendsSince: new Date(f.friendsSince),
                            unreadCount: 0
                        });
                    }
                } catch (error) {
                    console.error(`Ошибка загрузки друга ${friendId}:`, error);
                }
            }
        }

        return friendsList;
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                // Сначала получаем ID
                const userId = await fetchCurrentUser(baseUrl);
                if (isMounted && userId) {
                    setCurrentUserId(userId);  // сохраняем ID отдельно

                    // Потом получаем полную информацию о текущем пользователе
                    const userData = await getUserInfo(userId, baseUrl);
                    setCurrentUser(userData);

                    // Загружаем связи дружбы
                    try {
                        const friendsData = await getFriends(userId, baseUrl);

                        // Преобразуем в список друзей с полной информацией
                        const friendsList = await loadFriendDetails(friendsData, userId);
                        setFriends(friendsList);

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
    }, [refreshGroupsData, initSignalR, loadFriendDetails]);

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
                                            // Позиционируем тултип справа от иконки
                                            const rect = el.parentElement?.getBoundingClientRect();
                                            if (rect) {
                                                const tooltipWidth = el.offsetWidth;
                                                let left = rect.right + 10; // 10px отступ справа от иконки

                                                const maxLeft = window.innerWidth - tooltipWidth - 10;
                                                if (left > maxLeft) {
                                                    // Если не помещается справа, показываем слева
                                                    left = rect.left - tooltipWidth - 10;
                                                }

                                                // Проверяем, не выходит ли за левый край
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
                    friends={friends}
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