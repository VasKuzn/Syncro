import { MIN_PASSWORD_LENGTH } from "../Constants/LoginConsts";

export const validatePassword = (password: string): string | null => {
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов`;
    }
    return null;
};