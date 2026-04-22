// useGroupMessagesHub.ts
import { useEffect, useRef, useCallback } from 'react';
import { HubConnection, HubConnectionBuilder, HttpTransportType } from '@microsoft/signalr';
import { PersonalMessageData } from '../Types/ChatTypes';

type TypingCallback = (nickname: string) => void;
type StopTypingCallback = () => void;

const useGroupMessagesHub = (
    groupId: string | null,
    onMessageReceived: (message: PersonalMessageData) => void,
    baseUrl: string
) => {
    const connectionRef = useRef<HubConnection | null>(null);
    const onMessageReceivedRef = useRef(onMessageReceived);
    const typingCallbacksRef = useRef<TypingCallback[]>([]);
    const stopTypingCallbacksRef = useRef<StopTypingCallback[]>([]);

    useEffect(() => {
        onMessageReceivedRef.current = onMessageReceived;
    }, [onMessageReceived]);

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
            typingCallbacksRef.current.forEach(cb => cb(nickname));
        });

        connection.on("UserStoppedTyping", () => {
            stopTypingCallbacksRef.current.forEach(cb => cb());
        });
    }, [groupId]);

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

    const onUserTyping = useCallback((callback: TypingCallback) => {
        typingCallbacksRef.current.push(callback);
    }, []);

    const onUserStoppedTyping = useCallback((callback: StopTypingCallback) => {
        stopTypingCallbacksRef.current.push(callback);
    }, []);

    return {
        sendTyping,
        stopTyping,
        onUserTyping,
        onUserStoppedTyping
    };
};

export default useGroupMessagesHub;