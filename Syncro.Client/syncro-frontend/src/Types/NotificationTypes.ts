export interface NotificationData {
    chatName: string; 
    senderAvatar?: string; 
    senderName: string; 
    message: string;
    timestamp?: Date;
    mediaUrl?: string | null,
    mediaType?: string | number | null,
    fileName?: string | null
}