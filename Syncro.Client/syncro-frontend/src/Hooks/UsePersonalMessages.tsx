import { useEffect, useRef } from 'react';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { PersonalMessageData } from '../Types/ChatTypes';

const usePersonalMessagesHub = (
    personalConferenceId: string | null,
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
            if (!personalConferenceId) return;

            if (connectionRef.current) {
                await connectionRef.current.stop();
                connectionRef.current = null;
            }

            const connection = new HubConnectionBuilder()
                .withUrl(`${baseUrl}/personalMessagesHub`)
                .withAutomaticReconnect()
                .build();

            connection.on("ReceivePersonalMessage", (message: PersonalMessageData) => {
                if (message.personalConferenceId === personalConferenceId) {
                    onMessageReceivedRef.current(message);
                }
            });

            try {
                await connection.start();
                await connection.invoke("SubscribeToPersonalConference", personalConferenceId);
                connectionRef.current = connection;
            } catch (err) {
                console.error("Error while establishing connection:", err);
            }
        };

        startConnection();

        return () => {
            if (connectionRef.current) {
                connectionRef.current.invoke("UnsubscribeFromPersonalConference", personalConferenceId)
                    .then(() => connectionRef.current?.stop())
                    .catch(console.error);
            }
        };
    }, [personalConferenceId, baseUrl]);

    return null;
};

export default usePersonalMessagesHub;