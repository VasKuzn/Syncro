import { GroupConference } from "../Types/GroupTypes";
import { PersonalMessageData } from "../Types/ChatTypes";

const API_URL = "http://localhost:5232/api";

// 1. ПОЛУЧИТЬ ВСЕ ГРУППЫ ПОЛЬЗОВАТЕЛЯ
export const getUserGroups = async (userId: string): Promise<GroupConference[]> => {
    const response = await fetch(`${API_URL}/groupconference/${userId}/getbyaccount`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch groups');
    }
    
    return await response.json();
};

// 2. ПОЛУЧИТЬ ИНФОРМАЦИЮ О ГРУППЕ
export const getGroupById = async (groupId: string): Promise<GroupConference> => {
    const response = await fetch(`${API_URL}/groupconference/${groupId}`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch group');
    }
    
    return await response.json();
};

// 3. ПОЛУЧИТЬ УЧАСТНИКОВ ГРУППЫ
export const getGroupParticipants = async (groupId: string): Promise<any[]> => {
    const response = await fetch(`${API_URL}/groupconferencemember/${groupId}/groupConference`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch participants');
    }
    
    return await response.json();
};

// 4. ПОЛУЧИТЬ СООБЩЕНИЯ ГРУППЫ (этот метод добавим позже, когда бэкенд будет готов)
export const getGroupMessages = async (groupId: string): Promise<PersonalMessageData[]> => {
    const response = await fetch(`${API_URL}/messages/bygroupconference?groupConferenceId=${groupId}`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch messages');
    }
    
    return await response.json();
};

// 5. СОЗДАТЬ НОВУЮ ГРУППУ (САМОЕ ВАЖНОЕ!)
export const createGroup = async (data: {
    conferenceName: string,
    groupConferenceType: number  // пока просто 0
}): Promise<GroupConference> => {
    
    const response = await fetch(`${API_URL}/groupconference`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...data,
            groupConferenceType: 0  // CallTypesEnum, пока 0 = обычная группа
        })
    });
    
    if (!response.ok) {
        throw new Error('Failed to create group');
    }
    
    return await response.json();
};

// 6. ДОБАВИТЬ УЧАСТНИКА В ГРУППУ
export const addGroupMember = async (data: {
    accountId: string,
    groupConferenceId: string,
    joiningDate: Date,
    roleId: string
}) => {
    const response = await fetch(`${API_URL}/groupconferencemember`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error('Failed to add member');
    }
    
    return await response.json();
};