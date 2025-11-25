import { NetworkError } from "../Types/LoginTypes";
import { UserInfo } from "../Types/UserInfo";

export const updateUserInfo = async (userId: string | null, userData: UserInfo) => {
    try {
        console.log(userId, userData)
        const response = await fetch(`http://localhost:5232/api/accounts/full_account_info/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        console.log(JSON.stringify(userData))
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Ошибка при сохранении данных")
        }
    } catch (error) {
        throw new Error((error as NetworkError).message || "Ошибка сети")
    }
}