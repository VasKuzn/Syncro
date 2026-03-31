import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { UserInfo } from '../Types/UserInfo';
import { GroupConference } from '../Types/GroupTypes';
import { Friend } from '../Types/FriendType';
import { fetchCurrentUser } from '../Services/MainFormService';
import { fetchUserById } from '../Services/ChatService';
import { getGroupById, getGroupParticipants } from '../Services/GroupService';
import { getFriends } from '../Services/MainFormService';

export const useGroupChatInitialization = (baseUrl: string) => {
    const { groupId } = useParams<{ groupId: string }>();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
    const [group, setGroup] = useState<GroupConference | null>(null);
    const [participants, setParticipants] = useState<UserInfo[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Функция для загрузки полной информации о друзьях (БЕЗ ФИЛЬТРАЦИИ)
    const loadFriendDetails = useCallback(async (friendshipList: any[], userId: string) => {
        const friendsList: Friend[] = [];

        for (const f of friendshipList) {
            // УБИРАЕМ фильтрацию по status === 1 - загружаем всех друзей
            // Определяем ID друга (не текущий пользователь)
            const friendId = f.userWhoSent === userId ? f.userWhoRecieved : f.userWhoSent;

            try {
                // Загружаем полную информацию о друге
                const response = await fetch(`${baseUrl}/api/accounts/${friendId}`, {
                    credentials: 'include'
                });

                if (response.ok) {
                    const friendData = await response.json();

                    friendsList.push({
                        id: friendId,
                        nickname: friendData.nickname || 'Без имени',
                        avatar: friendData.avatar || "../logo.png",
                        email: friendData.email,
                        phonenumber: friendData.phonenumber,
                        firstname: friendData.firstname,
                        lastname: friendData.lastname,
                        isOnline: friendData.isOnline || false,
                        status: f.status, // Сохраняем оригинальный статус
                        userWhoReceived: f.userWhoRecieved,
                        userWhoSent: f.userWhoSent,
                        friendShipId: f.id,
                        friendsSince: new Date(f.friendsSince),
                        unreadCount: 0
                    });
                }
            } catch (error) {
                console.error(`Ошибка загрузки друга ${friendId}:`, error);
            }
        }

        return friendsList;
    }, [baseUrl]); // Добавляем baseUrl в зависимости

    // Загружаем текущего пользователя
    const initializeUser = useCallback(async () => {
        try {
            const userId = await fetchCurrentUser(baseUrl);
            setCurrentUserId(userId);
            if (userId) {
                const userData = await fetchUserById(baseUrl, userId);
                setCurrentUser(userData);

                // Загружаем связи дружбы
                try {
                    const friendsData = await getFriends(userId, baseUrl);

                    // Преобразуем в список друзей с полной информацией (БЕЗ ФИЛЬТРАЦИИ)
                    const friendsList = await loadFriendDetails(friendsData, userId);
                    setFriends(friendsList);

                } catch (err) {
                    console.error('Failed to load friends', err);
                }
            }
        } catch (err) {
            console.error('Failed to load current user', err);
            setError('Не удалось загрузить пользователя');
        }
    }, [baseUrl, loadFriendDetails]);

    // Загружаем информацию о группе
    const loadGroupData = useCallback(async () => {
        if (!groupId || !currentUserId) return;

        setLoading(true);
        try {
            // Загружаем информацию о группе
            const groupData = await getGroupById(groupId, baseUrl);
            setGroup(groupData);

            // Загружаем участников группы
            const participantsData = await getGroupParticipants(groupId, baseUrl);

            // Преобразуем участников в UserInfo (загружаем полную информацию)
            const participantsWithInfo: UserInfo[] = [];
            for (const p of participantsData) {
                try {
                    const userInfo = await fetchUserById(baseUrl, p.accountId);
                    participantsWithInfo.push(userInfo);
                } catch (err) {
                    console.error(`Failed to load participant ${p.accountId}:`, err);
                }
            }

            setParticipants(participantsWithInfo);
        } catch (err) {
            console.error('Failed to load group data:', err);
            setError('Не удалось загрузить информацию о группе');
        } finally {
            setLoading(false);
        }
    }, [groupId, currentUserId, baseUrl]);

    useEffect(() => {
        initializeUser();
    }, [initializeUser]);

    useEffect(() => {
        if (currentUserId) {
            loadGroupData();
        }
    }, [currentUserId, loadGroupData]);

    // Функция для получения информации об отправителе по ID
    const getSenderInfo = useCallback((accountId: string | null) => {
        if (!accountId) return { nickname: 'Unknown', avatar: '../logo.png' };

        const participant = participants.find(p => p.id === accountId);
        return {
            nickname: participant?.nickname || 'Unknown',
            avatar: participant?.avatar || '../logo.png'
        };
    }, [participants]);

    return {
        groupId,
        currentUserId,
        currentUser,
        group,
        participants,
        friends, // Теперь здесь ВСЕ друзья, без фильтрации
        loading,
        error,
        getSenderInfo
    };
};