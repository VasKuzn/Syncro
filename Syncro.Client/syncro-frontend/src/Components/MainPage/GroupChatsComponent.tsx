import { useState, useEffect, useCallback } from "react";
import { GroupConf } from "../../Types/GroupConf";
import { NetworkError } from "../../Types/LoginTypes";
import * as signalR from "@microsoft/signalr";

const GroupChatsComponent = () => {
    const [groups, setGroups] = useState<GroupConf[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

    const fetchCurrentUser = useCallback(async () => {
        try {
            const response = await fetch("http://localhost:5232/api/accounts/current", {
                credentials: 'include'
            });
            const data = await response.json();
            setCurrentUserId(data.userId);
            return data.userId;
        } catch (error) {
            setError("Failed to fetch user data");
            console.error("Fetch user error:", error);
            return null;
        }
    }, []);

    const getGroups = useCallback(async (userId: string) => {
        try {
            const response = await fetch(
                `http://localhost:5232/api/groupconference/${userId}/getbyaccount`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch groups');
            }

            return await response.json();
        } catch (error) {
            throw new Error((error as NetworkError).message || 'Network error');
        }
    }, []);

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
                    await refreshGroupsData(userId);
                    const conn = await initSignalR(userId);
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

    if (loading) return <div>Loading groups...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="group-chats">
            <div className="main-logo">
                <img src="/logo.png" alt="Syncro logo" width="50" height="50" />
                <a href="/app/main"></a>
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
    );
};

export default GroupChatsComponent;