import React, { useState, useEffect, FormEvent } from 'react';
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
    const emailField = (document.getElementById("email") as HTMLInputElement);
    const nicknameField = (document.getElementById("nickname") as HTMLInputElement);
    const phoneField = (document.getElementById("phone") as HTMLInputElement);
    const passwordField = (document.getElementById("password") as HTMLInputElement);
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

    const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNickname(e.target.value);
    }

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhone(e.target.value);
    }

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    }

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+\d{11}$/; 

        if (!email) {
            emailField.setCustomValidity('Пожалуйста, введите email.');

        } else if (
            !(emailRegex.test(email))
        ) {
            emailField.setCustomValidity('Введите корректный email.');
        }

        if (!nickname) {
            nicknameField.setCustomValidity('Пожалуйста, введите отображаемое имя.');
        }

        if (!phone) {
            phoneField.setCustomValidity('Пожалуйста, введите номер телефона.')
        } else if (
            !(phoneRegex.test(phone))
        ) {
            phoneField.setCustomValidity('Введите корректный номер телефона.');
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
        nicknameField.setCustomValidity("");
        phoneField.setCustomValidity("");
        passwordField.setCustomValidity("");
    }


    return (
        <div className="centered-container">
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
                onInput={clearValidity}
            />
            <FooterComponent/>
        </div>
    );
}

export default Register;