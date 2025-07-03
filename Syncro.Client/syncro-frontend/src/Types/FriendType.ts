export interface Friend {
    id: string;
    nickname: string;
    avatar: string;
    isOnline: boolean;
    status: number;
    email: string;
    phonenumber: string;
    firstname: string;
    lastname: string;
    friendsSince: Date;
    userWhoSent: string;
    userWhoReceived: string;
    friendShipId: string;
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

export interface FriendDetailsProps {
    friend: Friend | null;
    onAccept?: (friend: Friend) => void;
    onCancel?: (friend: Friend) => void;
}