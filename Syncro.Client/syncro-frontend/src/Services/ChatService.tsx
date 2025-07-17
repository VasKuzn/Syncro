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