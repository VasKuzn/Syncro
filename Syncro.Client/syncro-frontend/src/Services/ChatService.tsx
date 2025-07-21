import { PersonalMessageData } from "../Types/ChatTypes";

export const createMessage = async (message: PersonalMessageData) => {
    const response = await fetch('http://localhost:5232/api/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(message)
    });

    if (!response.ok) {
        throw new Error('Failed to create message');
    }

    return await response.json();
}
export const getMessages = async (personalConferenceId: string | null) => {
    if (!personalConferenceId) {
        return [];
    }

    const response = await fetch(
        `http://localhost:5232/api/messages/bypersonalconference?personalConferenceId=${personalConferenceId}`,
        {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch messages');
    }

    return await response.json();
}
export const getNicknameById = async (userId: string | null) => {
    const response = await fetch(`http://localhost:5232/api/accounts/${userId}/nickname`,
        {
            method: "GET",
            credentials: "include",
        });
    return await response.text();
}

export const uploadMediaMessage = async (
    messageId: string,
    data: {
        file: File;
        messageContent: string;
        accountId: string;
        personalConferenceId: string;
    }
) => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('messageId', messageId);
    formData.append('messageContent', data.messageContent);
    formData.append('accountId', data.accountId);
    formData.append('personalConferenceId', data.personalConferenceId);

    const response = await fetch(`http://localhost:5232/api/storage/${data.personalConferenceId}/${data.accountId}/${messageId}/media`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Failed to upload media');
    }

    return await response.json();
};