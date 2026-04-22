import { useEffect, useRef, useCallback, useState } from 'react';
import { HubConnection, HubConnectionBuilder, HttpTransportType } from '@microsoft/signalr';
import { PersonalMessageData } from '../Types/ChatTypes';

type TypingUsersChangedCallback = (users: Set<string>) => void;

const useGroupMessagesHub = (
    groupId: string | null,
    onMessageReceived: (message: PersonalMessageData) => void,
    baseUrl: string
) => {
    const connectionRef = useRef<HubConnection | null>(null);
    const onMessageReceivedRef = useRef(onMessageReceived);
    const typingUsersRef = useRef<Set<string>>(new Set());
    const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const typingCallbacksRef = useRef<TypingUsersChangedCallback[]>([]);

    useEffect(() => {
        onMessageReceivedRef.current = onMessageReceived;
    }, [onMessageReceived]);

    const notifyTypingUsersChanged = useCallback((users: Set<string>) => {
        setTypingUsers(new Set(users));
        typingCallbacksRef.current.forEach(cb => cb(users));
    }, []);

    const addTypingUser = useCallback((nickname: string) => {
        if (typingTimeoutsRef.current.has(nickname)) {
            clearTimeout(typingTimeoutsRef.current.get(nickname)!);
        }

        const newSet = new Set(typingUsersRef.current);
        newSet.add(nickname);
        typingUsersRef.current = newSet;
        notifyTypingUsersChanged(newSet);

        const timeout = setTimeout(() => {
            removeTypingUser(nickname);
        }, 5000);
        typingTimeoutsRef.current.set(nickname, timeout);
    }, [notifyTypingUsersChanged]);

    const removeTypingUser = useCallback((nickname: string) => {
        const timeout = typingTimeoutsRef.current.get(nickname);
        if (timeout) {
            clearTimeout(timeout);
            typingTimeoutsRef.current.delete(nickname);
        }

        const newSet = new Set(typingUsersRef.current);
        newSet.delete(nickname);
        typingUsersRef.current = newSet;
        notifyTypingUsersChanged(newSet);
    }, [notifyTypingUsersChanged]);

    const registerEventHandlers = useCallback((connection: HubConnection) => {
        connection.off("ReceiveGroupMessage");
        connection.off("UserTyping");
        connection.off("UserStoppedTyping");

        connection.on("ReceiveGroupMessage", (message: PersonalMessageData) => {
            if (message.groupConferenceId === groupId) {
                onMessageReceivedRef.current(message);
            }
        });

        connection.on("UserTyping", (nickname: string) => {
            addTypingUser(nickname);
        });

        connection.on("UserStoppedTyping", (nickname?: string) => {
            if (nickname) {
                removeTypingUser(nickname);
            } else {
                typingUsersRef.current.forEach(user => removeTypingUser(user));
            }
        });
    }, [groupId, addTypingUser, removeTypingUser]);

    useEffect(() => {
        const startConnection = async () => {
            if (!groupId) return;

            if (connectionRef.current) {
                await connectionRef.current.stop();
                connectionRef.current = null;
            }

            const connection = new HubConnectionBuilder()
                .withUrl(`${baseUrl}/groupMessagesHub`, {
                    withCredentials: true,
                    transport: HttpTransportType.WebSockets
                })
                .withAutomaticReconnect()
                .build();

            registerEventHandlers(connection);

            try {
                await connection.start();
                await connection.invoke("SubscribeToGroupConference", groupId);
                connectionRef.current = connection;
            } catch (err) {
                console.error("Error while establishing group hub connection:", err);
            }
        };

        startConnection();

        return () => {
            typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
            typingTimeoutsRef.current.clear();

            if (connectionRef.current) {
                connectionRef.current.invoke("UnsubscribeFromGroupConference", groupId)
                    .then(() => connectionRef.current?.stop())
                    .catch(console.error);
            }
        };
    }, [groupId, baseUrl, registerEventHandlers]);

    const sendTyping = useCallback(async (nickname: string) => {
        if (!connectionRef.current || connectionRef.current.state !== 'Connected' || !groupId) return;
        try {
            await connectionRef.current.invoke("SendTyping", groupId, nickname);
        } catch (error) {
            console.error("Failed to send typing notification:", error);
        }
    }, [groupId]);

    const stopTyping = useCallback(async () => {
        if (!connectionRef.current || connectionRef.current.state !== 'Connected' || !groupId) return;
        try {
            await connectionRef.current.invoke("StopTyping", groupId);
        } catch (error) {
            console.error("Failed to send stop typing notification:", error);
        }
    }, [groupId]);

    const onTypingUsersChanged = useCallback((callback: TypingUsersChangedCallback) => {
        typingCallbacksRef.current.push(callback);
        callback(typingUsersRef.current);
    }, []);

    return {
        sendTyping,
        stopTyping,
        onTypingUsersChanged,
        typingUsers,
    };
};

export default useGroupMessagesHub;