import { NetworkError } from '../Types/LoginTypes';

export const registerUser = async (email: string, password: string, nickname: string, phonenumber: string, isOnline: boolean) => {

    const credentials = { email, password, nickname, phonenumber, isOnline }

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
            throw new Error((await response.json()).message || 'Ошибка регистрации');
        }

        return await response.json();
    } catch (error) {
        throw new Error((error as NetworkError).message || 'Ошибка сети');
    }
};