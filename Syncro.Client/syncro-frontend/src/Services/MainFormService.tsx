import { NetworkError } from "../Types/LoginTypes";
import { FriendRequest, Friend } from "../Types/FriendType";
import { FriendList } from "../Types/FriendListType";
import { PersonalConference } from "../Types/ChatTypes";

//Friend Components Methods
export const getUserByNickname = async (nickname: string) => {
    try {
        const response = await fetch(`http://localhost:5232/api/accounts/${nickname}/getnick`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка аутентификации');
        }

        return response.json();
    } catch (error) {
        throw new Error((error as NetworkError).message || 'Ошибка сети');
    }
};

export async function sendFriendRequest(request: FriendRequest): Promise<void> {
    const response = await fetch("http://localhost:5232/api/Friends", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        credentials: "include",
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка при отправке запроса дружбы");
    }
}

export async function updateFriendStatus(id: string, status: number): Promise<void> {
    const response = await fetch(`http://localhost:5232/api/Friends/${id}/status`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
        credentials: "include",
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Ошибка при обновлении статуса друга");
    }
}

export async function deleteFriendship(friendshipId: string): Promise<void> {
    const response = await fetch(`http://localhost:5232/api/Friends/${friendshipId}`, {
        method: "DELETE",
        credentials: "include"
    });

    if (!response.ok) {
        throw new Error("Ошибка при удалении заявки");
    }
}
//

// GroupChatsComponent Methods

export const getGroups = async (userId: string) => {
    try {
        const response = await fetch(
            `http://localhost:5232/api/groupconference/${userId}/getbyaccount`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch groups');
        }

        return await response.json();
    } catch (error) {
        throw new Error((error as Error).message || 'Network error');
    }
};


//

// MainForm Methods
export async function fetchCurrentUser(): Promise<string | null> {
    try {
        const response = await fetch("http://localhost:5232/api/accounts/current", {
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error("Failed to fetch current user");
        }

        const data = await response.json();
        return data.userId || null;
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
}

export const getFriends = async (userId: string | null) => {
    const response = await fetch(`http://localhost:5232/api/Friends/${userId}/getfriends`, {
        credentials: 'include'
    });
    return await response.json();
};

export const getPersonalConference = async (userId: string | null, friendId: string | null): Promise<string> => {
    try {
        const response = await fetch(`http://localhost:5232/api/personalconference/${userId}/getbyaccount`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch conferences');
        }

        const conferences: PersonalConference[] = await response.json();

        const existingConference = conferences.find(conf =>
            (conf.user1 === userId && conf.user2 === friendId) ||
            (conf.user1 === friendId && conf.user2 === userId)
        );

        if (existingConference) {
            return existingConference.id;
        }

        const newConference = {
            id: crypto.randomUUID(),
            user1: userId,
            user2: friendId,
            isFriend: true,
            startingDate: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            callType: 0
        };

        const createResponse = await fetch('http://localhost:5232/api/personalconference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(newConference)
        });

        if (!createResponse.ok) {
            throw new Error('Failed to create conference');
        }

        return newConference.id;

    } catch (error) {
        console.error('Error in getPersonalConference:', error);
        throw error;
    }
};

export const loadFriendInfo = async (
    friendsList: FriendList[],
    userId: string | null
): Promise<Friend[]> => {
    const loadedFriends: Friend[] = [];

    for (const friend of friendsList) {
        const friendId =
            friend.userWhoSent === userId
                ? friend.userWhoRecieved
                : friend.userWhoSent;

        const response = await fetch(`http://localhost:5232/api/accounts/${friendId}`, {
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error(`Не удалось загрузить пользователя ${friendId}`);
        }

        const friendData = await response.json();

        const cleanedFriend: Friend = {
            id: friendId,
            nickname: friendData.nickname,
            avatar: friendData.avatar ?? '',
            isOnline: friendData.isOnline,
            status: friend.status,
            email: friendData.email,
            phonenumber: friendData.phonenumber,
            firstname: friendData.firstname,
            lastname: friendData.lastname,
            friendsSince: new Date(friend.friendsSince),
            userWhoReceived: friend.userWhoRecieved,
            userWhoSent: friend.userWhoSent,
            friendShipId: friend.id
        };

        loadedFriends.push(cleanedFriend);
    }

    return loadedFriends;
}
//