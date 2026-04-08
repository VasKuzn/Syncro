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
    console.log('loginWithYandex called with token:', yandexToken?.substring(0, 20) + '...');
    console.log('Sending to endpoint:', baseUrl + '/api/accounts/yandex-auth');

    const response = await fetch(`${baseUrl}/api/accounts/yandex-auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: yandexToken }),
        credentials: 'include',
    });

    console.log('Yandex auth response status:', response.status);
    console.log('Response headers:', {
        'content-type': response.headers.get('content-type'),
        'set-cookie': response.headers.get('set-cookie'),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Yandex auth error:', error);
        throw new Error(error.message || error.error || 'Ошибка входа через Яндекс');
    }

    const data = await response.json();
    console.log('Got response from Yandex auth:', data);

    if (!data.access_token) {
        throw new Error('No access token in response');
    }

    console.log('Saving access_token to localStorage');
    localStorage.setItem('access_token', data.access_token);

    // Проверим что сохранилось
    const savedToken = localStorage.getItem('access_token');
    console.log('Saved token in localStorage:', !!savedToken, 'Length:', savedToken?.length);

    // Также проверим cookies
    console.log('Document cookies:', document.cookie);

    return data;
};