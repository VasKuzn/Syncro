import { useEffect, useRef } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';
import { PersonalMessageData } from '../Types/ChatTypes';

const useGroupMessagesHub = (
    groupId: string | null,
    onMessageReceived: (message: PersonalMessageData) => void,
    baseUrl: string
) => {
    const connectionRef = useRef<HubConnection | null>(null);
    const onMessageReceivedRef = useRef(onMessageReceived);

    useEffect(() => {
        onMessageReceivedRef.current = onMessageReceived;
    }, [onMessageReceived]);

    useEffect(() => {
        const startConnection = async () => {
            if (!groupId) return;

            // Останавливаем предыдущее соединение если есть
            if (connectionRef.current) {
                await connectionRef.current.stop();
                connectionRef.current = null;
            }

            const connection = new HubConnectionBuilder()
                .withUrl(`${baseUrl}/groupMessagesHub`, {
                    withCredentials: true,
                    //skipNegotiation: true,
                    transport: HttpTransportType.WebSockets
                })
                .withAutomaticReconnect()
                .build();

            connection.on("ReceiveGroupMessage", (message: PersonalMessageData) => {
                console.log('Received group message:', message);
                if (message.groupConferenceId === groupId) {
                    onMessageReceivedRef.current(message);
                }
            });

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
    }, [groupId]);

    return null;
};

export default useGroupMessagesHub;