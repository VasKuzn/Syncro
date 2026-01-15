import { useState, useEffect, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import MainComponent from "../Components/MainPage/MainComponents";
import "../Styles/MainPage.css";
import { Friend, AccountActivity } from "../Types/FriendType";
import { fetchCurrentUser, getFriends, loadFriendInfo, getUserInfo } from "../Services/MainFormService"
import { AnimatePresence, motion } from "framer-motion";
import { MainProps } from "../Types/MainProps";
import { ShortUserInfo } from "../Types/UserInfo";

const Main = () => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [accountConnection, setAccountConnection] = useState<signalR.HubConnection | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [userInfo, setCurrentUserInfo] = useState<ShortUserInfo>();
    const [messageConnection, setMessageConnection] = useState<signalR.HubConnection | null>(null);

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
        newConnection.on("AccountActivity", (activity: AccountActivity) => {
            console.log('AccountActivity received on friends hub', activity);
            setFriends(prev => prev.map(f => f.id === activity.UserId ? { ...f, isOnline: activity.IsOnline } : f));
        });

        newConnection.on("OnlineFriends", (onlineIds: string[]) => {
            console.log('OnlineFriends snapshot received on friends hub', onlineIds);
            setFriends(prev => prev.map(f => ({ ...f, isOnline: onlineIds.includes(f.id) })));
        });

        try {
            await newConnection.start();
            await newConnection.invoke("SubscribeToFriendsUpdates", userId);
            setConnection(newConnection);
        } catch (err) {
            console.error("SignalR Connection Error: ", err);
        }

        try {
            const accConnection = new signalR.HubConnectionBuilder()
                .withUrl("http://localhost:5232/accountshub", { withCredentials: true, skipNegotiation: true, transport: signalR.HttpTransportType.WebSockets })
                .configureLogging(signalR.LogLevel.Information)
                .build();

            accConnection.on("AccountActivity", (activity: AccountActivity) => {
                console.log('AccountActivity received', activity);
                setFriends(prev => prev.map(f => f.id === activity.UserId ? { ...f, isOnline: activity.IsOnline } : f));
            });

            accConnection.on("OnlineFriends", (onlineIds: string[]) => {
                setFriends(prev => prev.map(f => ({ ...f, isOnline: onlineIds.includes(f.id) })));
            });

            await accConnection.start();
            if (userId) {
                await accConnection.invoke("Register", userId);
            }
            setAccountConnection(accConnection);
        } catch (err) {
            console.error('AccountHub connection error', err);
        }

        try {
            const msgConnection = new signalR.HubConnectionBuilder()
                .withUrl("http://localhost:5232/personalmessageshub",
                    {
                        withCredentials: true,
                        skipNegotiation: true,
                        transport: signalR.HttpTransportType.WebSockets
                    })
                .configureLogging(signalR.LogLevel.Information)
                .build();

            msgConnection.on("NewMessage", (message) => {
                console.log("NewMessage", message);
                const fromUserId = message.fromUserId;
                setFriends(prev => prev.map(f => f.id === fromUserId ? { ...f, unreadCount: (f.unreadCount ?? 0) + 1 } : f));
            });

            await msgConnection.start();

            setMessageConnection(msgConnection);
        } catch (err) {
            console.error('MessageHub connection error', err);
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
                setCurrentUserId(userId);
                if (isMounted) {
                    await refreshFriendsData(userId);
                    await initSignalR(userId);
                }
                const info = await getUserInfo(userId)
                if (info) {
                    setCurrentUserInfo({ avatar: info.avatar, nickname: info.nickname, isOnline: true })
                }
            } catch (error) {
                console.error("Ошибка загрузки:", error);
            }
        };

        loadData();

        return () => {
            isMounted = false;
            connection?.stop();
            accountConnection?.stop();
        };
    }, [fetchCurrentUser, refreshFriendsData, initSignalR]);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                className="main-page"
                key="page"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "easeInOut" }}
            >
                <MainComponent
                    friends={friends}
                    nickname={userInfo?.nickname}
                    avatar={userInfo?.avatar}
                    isOnline={userInfo?.isOnline}
                    setFriends={setFriends}
                />
            </motion.div>
        </AnimatePresence>
    );
};

export default Main;