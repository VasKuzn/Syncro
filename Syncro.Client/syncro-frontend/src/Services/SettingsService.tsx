import { NetworkError } from "../Types/LoginTypes";

export const updateUserInfo = async (userId: string | null, userData: FormData) => {
    try {
        const response = await fetch(`http://localhost:5232/api/accounts/full_account_info/${userId}`, {
            method: 'PUT',
            headers: {
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

export const changePass = async (oldPass: string, newPass: string) => {
    try {
        const response = await fetch('', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPass, newPass }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Ошибка при смене пароля');
        }
    } catch (error) {
        throw new Error((error as NetworkError).message || "Ошибка сети")
    }
}