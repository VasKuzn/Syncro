export interface UserInfo {
    [key: string]: string | number | undefined;
    nickname: string;
    email: string;
    password: string;
    firstname: string;
    lastname: string;
    phonenumber: string;
    avatar: string;
    country: number;
}

export interface ShortUserInfo {
    [key: string]: string | boolean | undefined;
    avatar?: string;
    nickname?: string;
    isOnline?: boolean
}