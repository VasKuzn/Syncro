import { NetworkError } from "../Types/LoginTypes";
import { getCsrfToken } from '../lib/csrfToken';

export const updateUserInfo = async (userId: string | null, userData: FormData) => {
    const csrfToken = getCsrfToken();
    try {
        const response = await fetch(`http://localhost:5232/api/accounts/full_account_info/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken || ''
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