import { useState } from "react";
import { GroupConf } from "../../Types/GroupConf";
import { NetworkError } from "../../Types/LoginTypes";

const GroupChatsComponent = () => {

    const [groups, setGroups] = useState<GroupConf[]>([]);

    const getGroupConf = async () => {
        try {                                    
            await new Promise(resolve => setTimeout(resolve, 1000))
            const response = await fetch(`http://localhost:5232/api/groupconference`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка аутентификации');
            }

            let gcs = await response.json();
            console.log(gcs);
            setGroups(gcs);
        } catch (error) {
            throw new Error((error as NetworkError).message || 'Ошибка сети');
        }
    }

    getGroupConf();

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

export default GroupChatsComponent