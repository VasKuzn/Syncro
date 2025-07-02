import { NetworkError } from '../Types/LoginTypes';

export const loginUser = async (email: string, password: string) => {
    const credentials = { email, password };

    try {
        const response = await fetch('http://localhost:5232/api/accounts/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
            credentials: 'include',
        });

        if (response.ok) {
            // Успех (200 OK)
            return await response.json();
        } else if (response.status === 400) {
            // Ошибка валидации (400 Bad Request)
            const data = await response.json();
            throw new Error(data.Error || "Invalid request");
        } else if (response.status === 401) {
            // Ошибка аутентификации (401 Unauthorized)
            throw new Error("Данные введены неправильно.");

        } else if (response.status === 404) {
            // Ошибка аутентификации (404 Not Found)
            throw new Error("Аккаунт с email не существует.");
        }
        else {
            // Серверная ошибка (500ые ребята)
            throw new Error("Ошибка со стороны сервера.");
        }

    } catch (error) {
        throw new Error((error as NetworkError).message || 'Ошибка сети');
    }
};