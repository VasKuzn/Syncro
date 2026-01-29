import { FriendFilterTypes } from "../Types/FriendType";

export const emptyFilterMessages: Record<FriendFilterTypes, string> = {
    all: "У вас пока нет друзей. Добавьте кого-нибудь!",
    online: "Друзья не в сети. Пора пойти трогать траву...",
    myrequests: "Отправленных заявок нет.",
    requestsfromme: "Заявок в друзья нет. Пора заявить о себе!"
}