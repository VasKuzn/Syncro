import { NetworkError } from '../Types/LoginTypes';

export const registerUser = async (email: string, password: string, nickname: string, phonenumber: string, avatar: string | null) => {
    const credentials = { email, password, nickname, phonenumber, avatar };

    try {
        const response = await fetch('http://localhost:5232/api/accounts/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
            credentials: 'include',
        });

        if (!response.ok) {
            let errorMessage = 'Ошибка регистрации';

            try {
                const errorData = await response.json();
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (typeof errorData === 'string') {
                    errorMessage = errorData;
                }
            } catch {
                errorMessage = await response.text() || 'Ошибка регистрации';
            }

            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error((error as NetworkError).message || 'Ошибка сети');
    }
};