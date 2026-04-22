import { GroupConference } from "../Types/GroupTypes";
import { PersonalMessageData } from "../Types/ChatTypes";

// 1. ПОЛУЧИТЬ ВСЕ ГРУППЫ ПОЛЬЗОВАТЕЛЯ
export const getUserGroups = async (userId: string, baseUrl: string): Promise<GroupConference[]> => {
    const response = await fetch(`${baseUrl}/groupconference/${userId}/getbyaccount`, {
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
export const getGroupById = async (groupId: string, baseUrl: string): Promise<GroupConference> => {
    const response = await fetch(`${baseUrl}/api/groupconference/${groupId}`, {
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
export const getGroupParticipants = async (groupId: string, baseUrl: string): Promise<any[]> => {
    const response = await fetch(`${baseUrl}/api/groupconferencemember/${groupId}/groupConference`, {
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
export const getGroupMessages = async (groupId: string, baseUrl: string): Promise<PersonalMessageData[]> => {
    const response = await fetch(`${baseUrl}/api/messages/bygroupconference?groupConferenceId=${groupId}`, {
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
}, baseUrl: string, csrfToken: string | null): Promise<GroupConference> => {
    debugger;
    const response = await fetch(`${baseUrl}/api/groupconference`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken || ''
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

export const addGroupMember = async (data: {
    accountId: string,
    groupConferenceId: string,
    joiningDate: Date,
    roleId: string
}, baseUrl: string, csrfToken: string | null) => {

    // Максимально простой объект
    const requestData = {
        accountId: data.accountId,
        groupConferenceId: data.groupConferenceId,
        joiningDate: data.joiningDate.toISOString(),
        roleId: data.roleId
    };


    try {
        const response = await fetch(`${baseUrl}/api/groupconferencemember`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken || ''
            },
            body: JSON.stringify(requestData)
        });


        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to add member: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error('GroupService.addGroupMember: исключение', error);
        throw error;
    }
};