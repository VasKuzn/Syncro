import { useState, useEffect, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import MainComponent from "../Components/MainPage/MainComponents";
import "../Styles/MainPage.css";
import { Friend } from "../Types/FriendType";
import { FriendList } from "../Types/FriendListType";

const Main = () => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

    // Функции для загрузки данных остаются без изменений
    const fetchCurrentUser = useCallback(async () => {
        const response = await fetch("http://localhost:5232/api/accounts/current", {
            credentials: 'include'
        });
        const data = await response.json();
        setCurrentUserId(data.userId);
        return data.userId;
    }, []);

    const getFriends = useCallback(async (userId: string) => {
        const response = await fetch(`http://localhost:5232/api/Friends/${userId}/getfriends`, {
            credentials: 'include'
        });
        return await response.json();
    }, []);

    const loadFriendInfo = useCallback(async (friendsList: FriendList[], userId: string) => {
        const loadedFriends: Friend[] = [];

        for (const friend of friendsList) {
            const friendId = friend.userWhoSent === userId
                ? friend.userWhoRecieved
                : friend.userWhoSent;

            const response = await fetch(`http://localhost:5232/api/accounts/${friendId}`, {
                credentials: 'include'
            });
            loadedFriends.push(await response.json());
        }

        setFriends(loadedFriends);
    }, []);

    // Инициализация SignalR соединения
    const initSignalR = useCallback(async (userId: string) => {
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5232/friendshub",
                {
                    withCredentials: true,
                    skipNegotiation: true,
                    transport: signalR.HttpTransportType.WebSockets
                })
            .configureLogging(signalR.LogLevel.Information)
            .build();

        newConnection.on("FriendsUpdated", () => {
            console.log("Received friends update notification");
            refreshFriendsData(userId);
        });

        try {
            await newConnection.start();
            await newConnection.invoke("SubscribeToFriendsUpdates", userId);
            setConnection(newConnection);
        } catch (err) {
            console.error("SignalR Connection Error: ", err);
        }

        return newConnection;
    }, []);

    const refreshFriendsData = useCallback(async (userId: string) => {
        try {
            const friendsList = await getFriends(userId);
            await loadFriendInfo(friendsList, userId);
        } catch (error) {
            console.error("Ошибка обновления друзей:", error);
        }
    }, [getFriends, loadFriendInfo]);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                const userId = await fetchCurrentUser();
                if (isMounted) {
                    await refreshFriendsData(userId);
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
    }, [fetchCurrentUser, refreshFriendsData, initSignalR]);

    return (
        <div className="main-page">
            <MainComponent friends={friends} />
        </div>
    );
};

export default Main;