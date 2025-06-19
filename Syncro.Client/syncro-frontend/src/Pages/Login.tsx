import React, { useState, useEffect, FormEvent, useRef } from 'react';
import bcrypt from 'bcryptjs';
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

    const loginUser = async (email: string, password: string) => {
        let credentials = {email, password}
        try {
            const response = await fetch('http://localhost:5232/api/accounts/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка аутентификации');
            }

            return await response.json();
        } catch (error) {
            throw new Error(error.message || 'Ошибка сети');
        }
    };

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        //const phoneRegex = /^\+\d{11}$/;

        if (!emailOrPhone) {
            emailField.current?.setCustomValidity('Пожалуйста, введите email.');
            emailField.current?.reportValidity();
            return;
        } else if (!(emailRegex.test(emailOrPhone))) {
            emailField.current?.setCustomValidity('Введите корректный email.');
            emailField.current?.reportValidity();
            return;
        }

        if (!password) {
            passwordField.current?.setCustomValidity('Введите пароль.');
            passwordField.current?.reportValidity();
            return;
        } else if (password.length < 6) {
            passwordField.current?.setCustomValidity('Пароль должен содержать минимум 6 символов.');
            passwordField.current?.reportValidity();
            return;
        }

        setIsLoading(true)
    
        try {
            const response = await loginUser(
                emailOrPhone,
                password
            );
            
            if (keepSignedIn) {
                localStorage.setItem('authToken', response.token);
            } else {
                sessionStorage.setItem('authToken', response.token);
            }

            window.location.href = '/app/main';

        } catch (error) {
            console.error('Ошибка авторизации:', error);
            
            if (emailField.current) {
                emailField.current.setCustomValidity('Неверные учетные данные');
                emailField.current.reportValidity();
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="main-body centered-container">
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