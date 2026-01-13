export const getRegisterErrorMessage = (error: any): string => {
    let errorMessage = 'Произошла ошибка при регистрации';

    if (!error || !error.message) {
        return errorMessage;
    }

    const serverMessage = error.message;

    const errorMappings: { [key: string]: string } = {
        'Nickname already exists.': 'Этот никнейм уже используется в Syncro',
        'Email already exists.': 'Этот email уже используется в Syncro',
        'Phone already exists.': 'Этот номер телефона уже используется в Syncro',
        'Nickname.*is already taken': 'Этот никнейм уже занят',
        'Email.*is already registered': 'Этот email уже зарегистрирован',
        'Phone number.*is already in use': 'Этот номер телефона уже используется',
        'Nickname is required': 'Введите никнейм',
        'Email is required': 'Введите email',
        'Phone number is required': 'Введите номер телефона',
        'Account cannot be null': 'Данные аккаунта не могут быть пустыми',
        'Validation failed': 'Ошибка валидации данных',
        'Conflict': 'Конфликт данных',
    };

    for (const [pattern, message] of Object.entries(errorMappings)) {
        if (serverMessage.includes(pattern) ||
            serverMessage === pattern ||
            new RegExp(pattern.replace('.*', '.*')).test(serverMessage)) {
            return message;
        }
    }

    return serverMessage;
};