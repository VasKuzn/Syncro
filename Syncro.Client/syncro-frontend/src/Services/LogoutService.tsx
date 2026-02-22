import { NetworkError } from "../Types/LoginTypes";

export const logoutUser = async (baseUrl: string): Promise<boolean> => {
    try {
        const response = await fetch(`${baseUrl}/api/accounts/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Ошибка при выходе из аккаунта");
        }

        return true;
    } catch (error) {
        console.error('Logout error:', error);
        throw new Error((error as NetworkError).message || "Ошибка сети");
    }
}