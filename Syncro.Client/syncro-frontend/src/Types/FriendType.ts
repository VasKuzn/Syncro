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
    unreadCount: number;
    //обновить avatar: string, подумать над isOnline и AccountActivity
}

export interface ShortFriend {
    id: string;
    nickname: string;
    avatar: string;
    friendShipId: string;
}

export interface FriendProps {
    friends: Friend[];
    setFriends: React.Dispatch<React.SetStateAction<Friend[]>>;
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
    friends: Friend[];
    setFriends: React.Dispatch<React.SetStateAction<Friend[]>>;
    onAccept?: (friend: Friend) => void;
    onCancel?: (friend: Friend) => void;
}
export interface AccountActivity {
    UserId: string;
    IsOnline: boolean;
    Timestamp: string
}

export type FriendFilterTypes = 'all' | 'online' | 'myrequests' | 'banned' | 'requestsfromme'