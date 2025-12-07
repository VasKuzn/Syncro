import { useState, useEffect, useCallback } from "react";
import { GroupConf } from "../../Types/GroupConf";
import { NetworkError } from "../../Types/LoginTypes";
import { fetchCurrentUser, getUserInfo, getGroups } from '../../Services/MainFormService';
import * as signalR from "@microsoft/signalr";
import { useNavigate } from "react-router-dom";
import { UserInfo } from "../../Types/UserInfo";

const GroupChatsComponent = () => {
    const [groups, setGroups] = useState<GroupConf[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
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
                const userId = await fetchCurrentUser();
                if (isMounted && userId) {
                    const userData = await getUserInfo(userId);
                    setCurrentUser(userData);

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
    }, [fetchCurrentUser, refreshGroupsData, initSignalR]);

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
                <div className="group-chat-item add">+</div>
            </div>
            <div className="profile-button">
                <img
                    src={avatarUrl}
                    alt="User avatar"
                    onClick={e => navigate("/settings")}
                    onError={(e) => {
                        e.currentTarget.src = "/logo.png";
                    }}
                />
            </div>
        </div>
    );
};

export default GroupChatsComponent;
