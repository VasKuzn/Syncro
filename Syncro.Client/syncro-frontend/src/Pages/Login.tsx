import React, { useState, useEffect, FormEvent, useRef } from 'react';
import '../Styles/Login.css'
import LoginComponent from '../Components/LoginPage/LoginComponents';
import FooterComponent from '../Components/LoginPage/FooterComponent';

const Login = () => {
    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [keepSignedIn, setKeepSignedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [maxLength, setMaxLength] = useState(100);

    const emailField = useRef<HTMLInputElement>(null);
    const passwordField = useRef<HTMLInputElement>(null);

    let SavedEmailOrPhone;
    let SavedPassword;

    useEffect(() => {
        SavedEmailOrPhone = localStorage.getItem('emailOrPhone');
        SavedPassword = localStorage.getItem('password');

        if (SavedEmailOrPhone) {
            setEmailOrPhone(SavedEmailOrPhone);
        }
        if (SavedPassword) {
            setPassword(SavedPassword || '');
        }
    }, []);

    const handleEmailOrPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {

        const value = e.target.value;

        setEmailOrPhone(value);

        if (emailField.current) {
            emailField.current.setCustomValidity('');
        }

        if (value.startsWith('+')) {
            setMaxLength(12);
        }
        else {
            setMaxLength(100);
        }
    }
    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    }

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        
        if (passwordField.current) {
            passwordField.current.setCustomValidity('');
        }
    };

    const handleKeepSignedInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setKeepSignedIn(e.target.checked);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        //const phoneRegex = /^\+\d{11}$/;

        if (!emailOrPhone) {
            emailField.current?.setCustomValidity('Пожалуйста, введите email.');
            emailField.current?.reportValidity();
        } else if (!(emailRegex.test(emailOrPhone))) {
            emailField.current?.setCustomValidity('Введите корректный email.');
            emailField.current?.reportValidity();
        }

        if (!password) {
            passwordField.current?.setCustomValidity('Введите пароль.');
            passwordField.current?.reportValidity();
        } else if (password.length < 6) {
            passwordField.current?.setCustomValidity('Пароль должен содержать минимум 6 символов.');
            passwordField.current?.reportValidity();
        } else {
            passwordField.current?.setCustomValidity('');
            passwordField.current?.reportValidity();
        }
    }

    return (
        <div className="centered-container">
            <LoginComponent
                emailOrPhone={emailOrPhone}
                password={password}
                passwordVisible={passwordVisible}
                keepSignedIn={keepSignedIn}
                isLoading={isLoading}
                maxLength={maxLength}
                onEmailOrPhoneChange={handleEmailOrPhoneChange}
                onPasswordChange={handlePasswordChange}
                onKeepSignedInChange={handleKeepSignedInChange}
                onTogglePasswordVisibility={togglePasswordVisibility}
                onSubmit={handleSubmit}
                emailRef={emailField}
                passwordRef={passwordField}
            />
            <FooterComponent />
        </div>
    );
}

export default Login;