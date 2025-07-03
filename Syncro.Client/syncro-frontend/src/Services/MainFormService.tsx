import { NetworkError } from "../Types/LoginTypes";
import { FriendRequest, Friend } from "../Types/FriendType";
import { FriendList } from "../Types/FriendListType";

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


export async function loadFriendInfo(
    friendsList: FriendList[],
    userId: string | null
): Promise<Friend[]> {
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
        loadedFriends.push(friendData);
    }

    return loadedFriends;
}
//