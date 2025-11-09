import { useState, useEffect, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import MainComponent from "../Components/MainPage/MainComponents";
import "../Styles/MainPage.css";
import { Friend } from "../Types/FriendType";
import { fetchCurrentUser, getFriends, loadFriendInfo } from "../Services/MainFormService"

const Main = () => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

    const initSignalR = useCallback(async (userId: string | null) => {
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

    const refreshFriendsData = useCallback(async (userId: string | null) => {
        try {
            const friendsList = await getFriends(userId);
            const friends = await loadFriendInfo(friendsList, userId);
            setFriends(friends);
        } catch (error) {
            console.error("Ошибка обновления друзей:", error);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                const userId = await fetchCurrentUser();
                if (isMounted) {
                    await refreshFriendsData(userId);
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
    }, [fetchCurrentUser, refreshFriendsData, initSignalR]);

    return (
        <div className="main-page">
            <MainComponent friends={friends} />
        </div>
    );
};

export default Main;