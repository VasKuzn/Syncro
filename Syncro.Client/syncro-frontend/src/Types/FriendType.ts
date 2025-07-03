export interface Friend {
    id: number;
    nickname: string;
    avatar: string;
    isOnline: boolean;
    status: number;
}

export interface FriendProps {
    friends: Friend[];
    onFriendAdded?: () => void;
}

export interface FriendRequest {
    userWhoSent: string;
    userWhoRecieved: string;
    status: number;
    friendsSince: string;
}