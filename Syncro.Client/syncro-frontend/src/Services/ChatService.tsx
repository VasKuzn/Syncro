import { PersonalMessageData } from "../Types/ChatTypes";

export const createMessage = async (message: PersonalMessageData) => {
    fetch('http://localhost:5232/api/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(message)
    });
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