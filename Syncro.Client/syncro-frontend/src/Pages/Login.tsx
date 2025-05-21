import React, { useState, useEffect } from 'react';
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
    };

    const handleKeepSignedInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setKeepSignedIn(e.target.checked);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+\d{11}$/;

        if (!emailOrPhone) {
            alert('Пожалуйста, введите email или номер телефона.');
        } else if (
            !(emailRegex.test(emailOrPhone) || phoneRegex.test(emailOrPhone))
        ) {
            alert('Введите корректный email или номер телефона.');
        }

        if (!password) {
            alert('Введите пароль.');
        } else if (password.length < 6) {
            alert('Пароль должен содержать минимум 6 символов.');
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
            />
            <FooterComponent />
        </div>
    );
}

export default Login;