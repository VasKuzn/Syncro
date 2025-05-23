import React, { useState, useEffect, FormEvent } from 'react';
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
    const emailField = (document.getElementById("email") as HTMLInputElement);
    const passwordField = (document.getElementById("password") as HTMLInputElement);
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
            emailField.setCustomValidity('Пожалуйста, введите email.');
        } else if (
            !(emailRegex.test(emailOrPhone) || phoneRegex.test(emailOrPhone))
        ) {
            emailField.setCustomValidity('Введите корректный email.');
        }

        if (!password) {
            passwordField.setCustomValidity('Введите пароль.');
        } else if (password.length < 6) {
            passwordField.setCustomValidity('Пароль должен содержать минимум 6 символов.');
        }
    }

    const clearValidity = (e: FormEvent) => {
        e.preventDefault();
        
        emailField.setCustomValidity("");
        passwordField.setCustomValidity("");
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
                onInput={clearValidity}
            />
            <FooterComponent />
        </div>
    );
}

export default Login;