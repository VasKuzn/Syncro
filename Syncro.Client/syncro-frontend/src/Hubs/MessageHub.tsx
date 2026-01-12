import * as signalR from "@microsoft/signalr";
import { HubConnectionState } from "@microsoft/signalr";

type MessageCallback = (message: any) => void;

class MessageHub {
    private connection: signalR.HubConnection | null = null;
    private callbacks: MessageCallback[] = [];

    async init() {
        if (this.connection) return this.connection;

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5232/personalmessageshub", {
                withCredentials: true,
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this.connection.on("NewMessage", (message) => {
            this.callbacks.forEach(cb => cb(message));
        });

        await this.connection.start();
        return this.connection;
    }

    async subscribeToConference(personalConferenceId: string) {
        if (!this.connection) return;

        if (this.connection.state !== HubConnectionState.Connected) {
            console.warn("SignalR not connected yet, waiting...");
            await this.connection.start();
        }
        await this.connection.invoke("SubscribeToPersonalConference", personalConferenceId);
    }

    onMessage(callback: MessageCallback) {
        this.callbacks.push(callback);
    }
}

export const messageHub = new MessageHub();