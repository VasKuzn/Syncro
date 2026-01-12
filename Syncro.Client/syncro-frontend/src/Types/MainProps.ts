import { Friend } from "./FriendType";

export interface MainProps {
    friends: Friend[];
    nickname?: string;
    avatar?: string;
    isOnline?: boolean;
    setFriends?: (friends: Friend[]) => void;
}
