import { NetworkError } from "../Types/LoginTypes";

export const updateUserInfo = async (userId: string | null, userData: FormData) => {
    try {
        console.log(userData)
        const response = await fetch(`http://localhost:5232/api/accounts/full_account_info/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            body: userData
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Ошибка при сохранении данных")
        }
    } catch (error) {
        throw new Error((error as NetworkError).message || "Ошибка сети")
    }
}