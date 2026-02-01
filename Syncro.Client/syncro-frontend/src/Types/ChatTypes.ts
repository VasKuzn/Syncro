import { Friend, ShortFriend } from "./FriendType";

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
    isEncrypted?: boolean;
    encryptionMetadata?: string | object;
    encryptionVersion?: number;
    encryptedContent?: string;
}

export interface ShortPersonalMessageData {
    id: string;
    accountNickname?: string | null,
    messageDateSent: Date,
}

export interface PersonalMessageProps {
    mediaUrl?: string | null,
    mediaType?: string | number | null,
    fileName?: string | null
    isEncrypted?: boolean;
    encryptionMetadata?: string | object;
    encryptionVersion?: number;
    encryptedContent?: string;

}

export interface PersonalChatProps {
    chatContent?: React.ReactNode;
    friends?: Friend[];
    nickname?: string;
    avatar?: string;
    isOnline?: boolean;
}
export interface MessageInputProps {
    onSend: (text: string, media?: {
        file: File;
        mediaUrl: string;
        mediaType: string;
        fileName: string;
    }) => void;
    isUploading: boolean;
    disabled?: boolean;
    value?: string;
    onValueChange?: (value: string) => void;
    onToggleEmojiPicker?: () => void;
    showEmojiPicker?: boolean;
}

export interface PersonalConference {
    id: string,
    user1: string,
    user2: string,
    isFriend: boolean,
    startingDate: Date,
    lastActivity: Date,
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
    replaceVideoTrack: (track: MediaStreamTrack) => void;
}

export interface MessageProps extends PersonalMessageData {
    isOwnMessage: boolean;
    avatarUrl: string;
    previousMessageAuthor?: string | null;
    previousMessageDate?: Date | null;
    searchQuery?: string;
}

export interface UseCallManagementProps {
    currentFriend: ShortFriend | null;
    currentUserId: string | null;
}