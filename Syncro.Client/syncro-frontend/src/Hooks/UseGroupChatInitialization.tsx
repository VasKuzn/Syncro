import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { UserInfo } from '../Types/UserInfo';
import { GroupConference } from '../Types/GroupTypes';
import { fetchCurrentUser } from '../Services/MainFormService';
import { fetchUserById } from '../Services/ChatService';
import { getGroupById, getGroupParticipants } from '../Services/GroupService';

export const useGroupChatInitialization = () => {
    const { groupId } = useParams<{ groupId: string }>();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
    const [group, setGroup] = useState<GroupConference | null>(null);
    const [participants, setParticipants] = useState<UserInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Загружаем текущего пользователя
    const initializeUser = useCallback(async () => {
        try {
            const userId = await fetchCurrentUser();
            setCurrentUserId(userId);
            if (userId) {
                const userData = await fetchUserById(userId);
                setCurrentUser(userData);
            }
        } catch (err) {
            console.error('Failed to load current user', err);
            setError('Не удалось загрузить пользователя');
        }
    }, []);

    // Загружаем информацию о группе
    const loadGroupData = useCallback(async () => {
        if (!groupId || !currentUserId) return;

        setLoading(true);
        try {
            // Загружаем информацию о группе
            const groupData = await getGroupById(groupId);
            setGroup(groupData);

            // Загружаем участников группы
            const participantsData = await getGroupParticipants(groupId);
            
            // Преобразуем участников в UserInfo (загружаем полную информацию)
            const participantsWithInfo: UserInfo[] = [];
            for (const p of participantsData) {
                try {
                    const userInfo = await fetchUserById(p.accountId);
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
    }, [groupId, currentUserId]);

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
        if (!accountId) return { nickname: 'Unknown', avatar: './logo.png' };
        
        const participant = participants.find(p => p.id === accountId);
        return {
            nickname: participant?.nickname || 'Unknown',
            avatar: participant?.avatar || './logo.png'
        };
    }, [participants]);

    return {
        groupId,
        currentUserId,
        currentUser,
        group,
        participants,
        loading,
        error,
        getSenderInfo
    };
};