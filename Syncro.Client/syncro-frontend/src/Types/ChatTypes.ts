import { Friend } from "./FriendType";

export interface PersonalMessageData {
    id: string,
    messageContent: string,
    messageDateSent: Date,
    accountId: string | null,
    accountNickname?: string | null,
    personalConferenceId: string | null,
    groupConferenceId: string | null,
    sectorId: string | null,
    idEdited: boolean,
    previousMessageContent: string | null,
    isPinned: boolean,
    isRead: boolean,
    referenceMessageId: string | null,
    mediaUrl?: string | null,
    mediaType?: string | number | null,
    fileName?: string | null

}
export interface PersonalChatProps {
    chatContent?: React.ReactNode;
    friends?: Friend[];
}
export interface MessageInputProps {
    onSend: (text: string, media?: {
        mediaUrl: string;
        mediaType: string;
        fileName: string;
    }) => void;
    onMediaUpload: (file: File) => void;
    isUploading: boolean;
}
export interface PersonalConference {
    id: string,
    user1: string,
    user2: string,
    isFriend: boolean,
    startingDate: Date,
    lastActivity: Date,
    callType: number
}
export interface CallWindowProps {
    isIncoming: boolean;
    userName: string;
    avatarUrl: string;
    onAccept?: () => void;
    onReject: () => void;
}
export interface VideoCallProps {
    onEndCall: () => void;
    localUserName: string;
    localAvatarUrl: string;
    remoteUserName: string;
    remoteAvatarUrl: string;
    localStream?: MediaStream | null;
    remoteStream?: MediaStream | null;
}

export interface MessageProps extends PersonalMessageData {
    isOwnMessage: boolean;
    avatarUrl: string;
    previousMessageAuthor?: string | null;
    previousMessageDate?: Date | null;
}