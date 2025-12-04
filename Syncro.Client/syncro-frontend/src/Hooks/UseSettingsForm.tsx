import { useState, useRef } from "react";
import { EMAIL_REGEX, MIN_PASSWORD_LENGTH, PHONE_REGEX } from "../Constants/LoginConsts";

export const useSettingsForm = () => {
    const [formState, setFormState] = useState({
        nickname: '',
        email: '',
        password: '',
        firstname: '',
        lastname: '',
        phonenumber: '',
        avatar: '',
        country: 0,
    });

    const nicknameField = useRef<HTMLInputElement>(null);
    const firstnameField = useRef<HTMLInputElement>(null);
    const lastnameField = useRef<HTMLInputElement>(null);
    const emailField = useRef<HTMLInputElement>(null);
    const phoneField = useRef<HTMLInputElement>(null);
    const countryField = useRef<HTMLInputElement>(null);
    const passwordField = useRef<HTMLInputElement>(null);

    const validateForm = (): boolean => {
        let isValid = true;

        nicknameField.current?.setCustomValidity('');
        emailField.current?.setCustomValidity('');
        phoneField.current?.setCustomValidity('');
        passwordField.current?.setCustomValidity('');

        const { nickname, email, phonenumber, password } = formState;

        if (!nickname) {
            nicknameField.current?.setCustomValidity('Пожалуйста, введите отображаемое имя.');
            isValid = false;
        }

        if (!email) {
            emailField.current?.setCustomValidity('Пожалуйста, введите email.');
            isValid = false;
        } else if (!EMAIL_REGEX.test(email)) {
            emailField.current?.setCustomValidity('Введите корректный email.');
            isValid = false;
        }

        if (!phonenumber) {
            phoneField.current?.setCustomValidity('Пожалуйста, введите номер телефона.');
            isValid = false;
        } else if (!PHONE_REGEX.test(phonenumber)) {
            phoneField.current?.setCustomValidity('Введите телефон в формате +XXXXXXXXXXX.');
            isValid = false;
        }

        if (!password) {
            passwordField.current?.setCustomValidity('Введите пароль.');
            isValid = false;
        } else if (password.length < MIN_PASSWORD_LENGTH) {
            passwordField.current?.setCustomValidity(
                `Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов.`
            );
            isValid = false;
        }

        nicknameField.current?.reportValidity();
        emailField.current?.reportValidity();
        phoneField.current?.reportValidity();
        passwordField.current?.reportValidity();

        return isValid;
    }

    return {
        formState,
        setFormState,
        nicknameField,
        firstnameField,
        lastnameField,
        emailField,
        phoneField,
        countryField,
        passwordField,
        validateForm
    }
}
