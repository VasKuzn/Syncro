import { Friend } from "./FriendType";

export interface MessageData {
    id: number;
    name: string | null;
    time: string;
    message: string;
}
export interface PersonalChatProps {
    chatContent?: React.ReactNode;
    friends?: Friend[];
}
export interface MessageInputProps {
    onSend: (message: string) => void;
}