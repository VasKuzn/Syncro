import { NetworkError } from "../Types/LoginTypes";

export const updateUserInfo = async (userId: string | null, userData: FormData, baseUrl: string, csrfToken: string | null) => {
    try {
        const response = await fetch(`${baseUrl}/api/accounts/full_account_info/${userId}`, {
            method: 'PUT',
            headers: {
                'X-CSRF-TOKEN': csrfToken || ''
            },
            body: userData,
            credentials: 'include'
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Ошибка при сохранении данных")
        }
    } catch (error) {
        throw new Error((error as NetworkError).message || "Ошибка сети")
    }
}