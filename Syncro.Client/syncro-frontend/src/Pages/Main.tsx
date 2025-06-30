import { useState, useEffect } from "react";
import MainComponent from "../Components/MainPage/MainComponents";
import "../Styles/MainPage.css";
import { Friend } from "../Types/FriendType";
import { FriendList } from "../Types/FriendListType";

const Main = () => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string>("");

    // 1. Получаем ID текущего пользователя
    const fetchCurrentUser = async () => {
        const response = await fetch("http://localhost:5232/api/accounts/current", {
            credentials: 'include'
        });
        const data = await response.json();
        setCurrentUserId(data.userId);
        return data.userId;
    };

    // 2. Получаем список друзей
    const getFriends = async (userId: string) => {
        const response = await fetch(`http://localhost:5232/api/Friends/${userId}/getfriends`, {
            credentials: 'include'
        });
        return await response.json();
    };

    // 3. Загружаем информацию о каждом друге
    const loadFriendInfo = async (friendsList: FriendList[]) => {
        const loadedFriends: Friend[] = [];

        for (const friend of friendsList) {
            // Определяем ID друга (кто НЕ текущий пользователь)
            const friendId = friend.userWhoSent === currentUserId
                ? friend.userWhoRecieved
                : friend.userWhoSent;

            const response = await fetch(`http://localhost:5232/api/accounts/${friendId}`, {
                credentials: 'include'
            });
            loadedFriends.push(await response.json());
        }

        setFriends(loadedFriends);
    };

    // Основной поток загрузки
    useEffect(() => {
        const loadData = async () => {
            try {
                const userId = await fetchCurrentUser();
                const friendsList = await getFriends(userId);
                await loadFriendInfo(friendsList);
            } catch (error) {
                console.error("Ошибка загрузки:", error);
            }
        };

        loadData();
    }, []);

    return (
        <div className="main-page">
            <MainComponent friends={friends} />
        </div>
    );
};

export default Main;