import { PersonalMessageData } from "../Types/ChatTypes";
import { encryptionService } from "./EncryptionService";

export const createMessage = async (message: PersonalMessageData, baseUrl: string, csrfToken: string | null) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken || ''
        },
        credentials: 'include',
        body: JSON.stringify(message)
    });

    if (!response.ok) {
        throw new Error('Failed to create message');
    }

    return await response.json();
}
export const getMessages = async (baseUrl: string, personalConferenceId: string | null, limit?: number, offset?: number) => {
    if (!personalConferenceId) {
        return [];
    }

    let url = `${baseUrl}/api/messages/bypersonalconference?personalConferenceId=${personalConferenceId}`;

    if (limit !== undefined && offset !== undefined) {
        url += `&limit=${limit}&offset=${offset}`;
    }

    const response = await fetch(
        url,
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

export const initializeEncryptionWithFriend = async (baseUrl: string, friendId: string, currentUserId: string | null, csrfToken: string | null): Promise<boolean> => {
    try {
        if (!currentUserId) return false;

        const friendPublicKey = await encryptionService.getPublicKey(baseUrl, friendId);
        if (!friendPublicKey) {
            console.warn('Friend public key not found');
            return false;
        }

        const hasSession = await encryptionService.hasSession(baseUrl, currentUserId, friendId);
        if (hasSession) {
            return true;
        }

        return await encryptionService.initializeSession(
            baseUrl,
            currentUserId,
            friendId,
            friendPublicKey,
            csrfToken
        );
    } catch (error) {
        console.error('Error initializing encryption with friend:', error);
        return false;
    }
};

export const uploadMediaMessage = async (
    messageId: string,
    data: {
        file: File;
        messageContent: string;
        accountId: string;
        accountNickname: string | null;
        personalConferenceId?: string;
        groupConferenceId?: string;
        isEncrypted?: boolean;
    },
    baseUrl: string, csrfToken: string | null
) => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('messageId', messageId);
    formData.append('messageContent', data.messageContent);
    formData.append('accountId', data.accountId);
    formData.append('accountNickname', data.accountNickname ?? '');

    const conferenceId = data.personalConferenceId || data.groupConferenceId;
    if (!conferenceId) {
        throw new Error('Either personalConferenceId or groupConferenceId must be provided');
    }
    if (data.personalConferenceId) {
        formData.append('personalConferenceId', data.personalConferenceId);
    }
    if (data.groupConferenceId) {
        formData.append('groupConferenceId', data.groupConferenceId);
    }

    const response = await fetch(`${baseUrl}/api/storage/${conferenceId}/${data.accountId}/${messageId}/media`, {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': csrfToken || ''
        },
        credentials: 'include',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Failed to upload media');
    }

    return await response.json();
}

export const getPersonalConferenceById = async (baseUrl: string, id: string) => {
    const response = await fetch(`${baseUrl}/api/personalconference/${id}`);
    if (!response.ok) {
        throw new Error("Failed to fetch conference");
    }
    return await response.json();
};
export const fetchUserById = async (baseUrl: string, userId: string) => {
    const res = await fetch(`${baseUrl}/api/accounts/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
};