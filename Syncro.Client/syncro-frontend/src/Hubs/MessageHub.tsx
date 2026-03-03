import * as signalR from "@microsoft/signalr";
import { HubConnectionState } from "@microsoft/signalr";
import { config } from '../Config';

type MessageCallback = (message: any) => void;
type TypingCallback = (nickname: string) => void;
type StopTypingCallback = () => void;

class MessageHub {
    private connection: signalR.HubConnection | null = null;
    private messageCallbacks: MessageCallback[] = [];
    private typingCallbacks: TypingCallback[] = [];
    private stopTypingCallbacks: StopTypingCallback[] = [];

    async init() {
        if (this.connection && this.connection.state === HubConnectionState.Connected) {
            return this.connection;
        }

        if (this.connection && this.connection.state === HubConnectionState.Disconnected) {
            try {
                await this.connection.start();
                this.registerHandlers();
                return this.connection;
            } catch (error) {
                console.error("Failed to reconnect:", error);
            }
        }

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${config.apiUrl}/personalmessageshub`, {
                withCredentials: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .withAutomaticReconnect([0, 0, 1000, 3000, 5000])
            .build();

        this.registerHandlers();

        this.connection.onreconnected(() => {
            this.registerHandlers();
        });

        await this.connection.start();
        return this.connection;
    }

    private registerHandlers() {
        if (!this.connection) return;

        this.connection.off("NewMessage");
        this.connection.off("UserTyping");
        this.connection.off("UserStoppedTyping");

        this.connection.on("NewMessage", (message) => {
            this.messageCallbacks.forEach(cb => cb(message));
        });

        this.connection.on("UserTyping", (nickname: string) => {
            this.typingCallbacks.forEach(cb => cb(nickname));
        });

        this.connection.on("UserStoppedTyping", () => {
            this.stopTypingCallbacks.forEach(cb => cb());
        });
    }

    async subscribeToConference(personalConferenceId: string) {
        if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
            return;
        }
        try {
            await this.connection.invoke("SubscribeToPersonalConference", personalConferenceId);
        } catch (error) {
        }
    }

    onMessage(callback: MessageCallback) {
        this.messageCallbacks.push(callback);
    }

    onUserTyping(callback: TypingCallback) {
        this.typingCallbacks.push(callback);
    }

    onUserStoppedTyping(callback: StopTypingCallback) {
        this.stopTypingCallbacks.push(callback);
    }

    async sendTyping(personalConferenceId: string, userNickname: string) {
        if (!this.connection || this.connection.state !== HubConnectionState.Connected) return;
        try {
            await this.connection.invoke("SendTyping", personalConferenceId, userNickname);
        } catch (error) {
        }
    }

    async stopTyping(personalConferenceId: string) {
        if (!this.connection || this.connection.state !== HubConnectionState.Connected) return;
        try {
            await this.connection.invoke("StopTyping", personalConferenceId);
        } catch (error) {
        }
    }
}

export const messageHub = new MessageHub();