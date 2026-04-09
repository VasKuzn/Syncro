import { NetworkError } from '../Types/LoginTypes';

export const loginUser = async (email: string, password: string, baseUrl: string) => {
    const credentials = { email, password };

    try {
        const response = await fetch(`${baseUrl}/api/accounts/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
            credentials: 'include',
        });

        if (response.ok) {
            // Успех (200 OK)
            const data = await response.json();
            // Если в ответе есть access_token, сохраняем его
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
            }
            return data;
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
export const loginWithYandex = async (yandexToken: string, baseUrl: string) => {
    console.log('loginWithYandex called');

    try {
        const response = await fetch(`${baseUrl}/api/accounts/yandex-auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: yandexToken }),
            credentials: 'include',
        });

        // Логируем статус и заголовки для отладки
        console.log('Yandex auth response status:', response.status);

        if (!response.ok) {
            let errorMessage = `Ошибка ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
                // Игнорируем ошибку парсинга JSON
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('Yandex auth success, access_token received:', !!data.access_token);

        if (!data.access_token) {
            throw new Error('Сервер не вернул токен доступа');
        }

        // Сохраняем токен (cookie уже установлен бэкендом, но localStorage может пригодиться)
        localStorage.setItem('access_token', data.access_token);
        return data;
    } catch (error) {
        console.error('loginWithYandex failed:', error);
        throw error;
    }
};