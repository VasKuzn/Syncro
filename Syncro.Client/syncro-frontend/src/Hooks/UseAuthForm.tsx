import { useState, useEffect, useRef } from 'react';
import { PHONE_MAX_LENGTH, EMAIL_MAX_LENGTH, PHONE_REGEX, EMAIL_REGEX, MIN_PASSWORD_LENGTH } from '../Constants/LoginConsts';

export const useAuthForm = () => {
    const [formState, setFormState] = useState({
        emailOrPhone: '',
        password: '',
        passwordVisible: false,
        keepSignedIn: false,
        isLoading: false,
        maxLength: EMAIL_MAX_LENGTH,
        isEmail: true,
    });

    const emailField = useRef<HTMLInputElement>(null);
    const passwordField = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const isEmail = !PHONE_REGEX.test(formState.emailOrPhone);
        setFormState(prev => ({
            ...prev,
            isEmail,
            maxLength: isEmail ? EMAIL_MAX_LENGTH : PHONE_MAX_LENGTH,
        }));
    }, [formState.emailOrPhone]);

    useEffect(() => {
        const savedEmailOrPhone = localStorage.getItem('emailOrPhone');
        const savedPassword = localStorage.getItem('password');
        const savedKeepSignedIn = localStorage.getItem('keepSignedIn') === 'true';

        if (savedEmailOrPhone) {
            setFormState(prev => ({ ...prev, emailOrPhone: savedEmailOrPhone }));
        }
        if (savedPassword && savedKeepSignedIn) {
            setFormState(prev => ({ ...prev, password: savedPassword, keepSignedIn: savedKeepSignedIn }));
        }
    }, []);

    const validateForm = () => {
        const { emailOrPhone, password, isEmail } = formState;
        const isValidEmail = isEmail && EMAIL_REGEX.test(emailOrPhone);
        const isValidPhone = !isEmail && PHONE_REGEX.test(emailOrPhone);

        if (!emailOrPhone) {
            emailField.current?.setCustomValidity('Пожалуйста, введите email или телефон.');
            emailField.current?.reportValidity();
            return false;
        } else if (isEmail && !isValidEmail) {
            emailField.current?.setCustomValidity('Введите корректный email.');
            emailField.current?.reportValidity();
            return false;
        } else if (!isEmail && !isValidPhone) {
            emailField.current?.setCustomValidity('Введите телефон в формате +XXXXXXXXXXX.');
            emailField.current?.reportValidity();
            return false;
        }

        if (!password) {
            passwordField.current?.setCustomValidity('Введите пароль.');
            passwordField.current?.reportValidity();
            return false;
        } else if (password.length < MIN_PASSWORD_LENGTH) {
            passwordField.current?.setCustomValidity(`Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов.`);
            passwordField.current?.reportValidity();
            return false;
        }

        return true;
    };
    // Это желательно переделать, небезопасно, на куки переделать!.
    const handlePersistCredentials = () => {
        const { emailOrPhone, password, keepSignedIn } = formState;
        if (keepSignedIn) {
            localStorage.setItem('emailOrPhone', emailOrPhone);
            localStorage.setItem('password', password);
            localStorage.setItem('keepSignedIn', 'true');
        } else {
            localStorage.removeItem('password');
            localStorage.removeItem('keepSignedIn');
        }
    };

    return {
        formState,
        setFormState,
        emailField,
        passwordField,
        validateForm,
        handlePersistCredentials,
    };
};