import { useState, useEffect } from "react";
import { GroupConf } from "../../Types/GroupConf";
import { NetworkError } from "../../Types/LoginTypes";

const GroupChatsComponent = () => {
    const [groups, setGroups] = useState<GroupConf[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchCurrentUser = async () => {
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
        };

        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (!currentUserId) return;

        const getGroupConf = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `http://localhost:5232/api/groupconference/${currentUserId}/getbyaccount`,
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

                const gcs = await response.json();
                setGroups(gcs);
            } catch (error) {
                setError((error as NetworkError).message || 'Network error');
                console.error("Fetch groups error:", error);
            } finally {
                setLoading(false);
            }
        };

        getGroupConf();
    }, [currentUserId]);

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
}

export default GroupChatsComponent;