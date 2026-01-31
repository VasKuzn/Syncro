import { PersonalMessageData } from "../Types/ChatTypes";
import { encryptionService } from "./EncryptionService";

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

    const messages: PersonalMessageData[] = await response.json();

    return messages;
}

export const initializeEncryptionWithFriend = async (friendId: string, currentUserId: string | null): Promise<boolean> => {
    try {
        if (!currentUserId) return false;

        const friendPublicKey = await encryptionService.getPublicKey(friendId);
        if (!friendPublicKey) {
            console.warn('Friend public key not found');
            return false;
        }

        const hasSession = await encryptionService.hasSession(currentUserId, friendId);
        if (hasSession) {
            return true;
        }

        return await encryptionService.initializeSession(
            currentUserId,
            friendId,
            friendPublicKey
        );
    } catch (error) {
        console.error('Error initializing encryption with friend:', error);
        return false;
    }
};

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
        accountNickname: string | null;
        personalConferenceId: string;
        isEncrypted?: boolean;
    }
) => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('messageId', messageId);
    formData.append('messageContent', data.messageContent);
    formData.append('accountId', data.accountId);
    formData.append('accountNickname', data.accountNickname ?? '');
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
}

export const getPersonalConferenceById = async (id: string) => {
    const response = await fetch(`http://localhost:5232/api/personalconference/${id}`);
    if (!response.ok) {
        throw new Error("Failed to fetch conference");
    }
    return await response.json();
};
export const fetchUserById = async (userId: string) => {
    const res = await fetch(`http://localhost:5232/api/accounts/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
};