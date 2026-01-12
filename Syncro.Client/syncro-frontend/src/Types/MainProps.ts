import { Friend } from "./FriendType";

export interface MainProps {
    [key: string]: string | boolean | Friend[] | undefined;
    friends: Friend[]
    avatar?: string;
    nickname?: string;
    isOnline?: boolean
}