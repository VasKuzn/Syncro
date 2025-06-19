import React, { useState, useEffect, FormEvent, useRef } from 'react';
import '../Styles/Register.css';
import RegisterComponent from '../Components/RegisterPage/RegisterComponents';
import FooterComponent from '../Components/RegisterPage/FooterComponent';


const Register = () => {
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const emailField = useRef<HTMLInputElement>(null);
    const nicknameField = useRef<HTMLInputElement>(null);
    const phoneField = useRef<HTMLInputElement>(null);
    const passwordField = useRef<HTMLInputElement>(null);

    let SavedNickname;
    let SavedEmail;
    let SavedPhone;
    let SavedPassword;

    useEffect(() => {
        SavedNickname = localStorage.getItem('nickname');
        SavedEmail = localStorage.getItem('email');
        SavedPhone = localStorage.getItem('phone');
        SavedPassword = localStorage.getItem('password');
        
        if(SavedNickname){
            setNickname(SavedNickname)
        }
        if (SavedEmail) {
            setEmail(SavedEmail);
        }
        if (SavedPhone) {
            setPhone(SavedPhone);
        }
        if (SavedPassword) {
            setPassword(SavedPassword || '');
        }
    }, []);

    const registerUser = async (email: string, password: string, nickname: string, phonenumber, isOnline: boolean) => {
        let credentials = {email, password, nickname, phonenumber, isOnline}
        try {
            const response = await fetch('http://localhost:5232/api/accounts/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });
            console.log(credentials);
            console.log(response);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка регистрации');
            }

            return await response.json();
        } catch (error) {
            throw new Error(error.message || 'Ошибка сети');
        }
    };

    const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNickname(e.target.value);

        if (nicknameField.current) {
            nicknameField.current.setCustomValidity('');
        }
    }

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);

        if (emailField.current) {
            emailField.current.setCustomValidity('');
        }
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhone(e.target.value);

        if (phoneField.current) {
            phoneField.current.setCustomValidity('');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+\d{11}$/; 

        if (!email) {
            emailField.current?.setCustomValidity('Пожалуйста, введите email.');
            emailField.current?.reportValidity();
        } else if (
            !(emailRegex.test(email))
        ) {
            emailField.current?.setCustomValidity('Введите корректный email.');
            emailField.current?.reportValidity();
        }

        if (!nickname) {
            nicknameField.current?.setCustomValidity('Пожалуйста, введите отображаемое имя.');
            nicknameField.current?.reportValidity();
        }

        if (!phone) {
            phoneField.current?.setCustomValidity('Пожалуйста, введите номер телефона.')
            phoneField.current?.reportValidity();
        } else if (
            !(phoneRegex.test(phone))
        ) {
            phoneField.current?.setCustomValidity('Введите корректный номер телефона.');
            phoneField.current?.reportValidity();
        }

        if (!password) {
            passwordField.current?.setCustomValidity('Введите пароль.');
            passwordField.current?.reportValidity();
        } else if (password.length < 6) {
            passwordField.current?.setCustomValidity('Пароль должен содержать минимум 6 символов.');
            passwordField.current?.reportValidity();
        }

        setIsLoading(true)
    
        try {
            const response = await registerUser(
                email,
                password,
                nickname,
                phone,
                false
            );          
        } catch (error) {
            console.error('Ошибка регистрации:', error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="main-body centered-container">
            <RegisterComponent
                nickname={nickname}
                email={email}
                phone={phone}
                password={password}
                passwordVisible={passwordVisible}
                isLoading={isLoading}
                onNicknameChange={handleNicknameChange}
                onEmailChange={handleEmailChange}
                onPhoneChange={handlePhoneChange}
                onPasswordChange={handlePasswordChange}
                onTogglePasswordVisibility={togglePasswordVisibility}
                onSubmit={handleSubmit}
                emailRef={emailField}
                nicknameRef={nicknameField}
                phoneRef={phoneField}
                passwordRef={passwordField}
            />
            <FooterComponent/>
        </div>
    );
}

export default Register;