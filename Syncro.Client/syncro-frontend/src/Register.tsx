import React, { useState, useEffect } from 'react';
import './Register.css';
import RegisterComponent from './Components/RegisterPage/RegisterComponents';


const Register = () => {
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    let SavedFirstname;
    let SavedLastname;
    let SavedNickname;
    let SavedEmail;
    let SavedPhone;
    let SavedPassword;

    useEffect(() => {
        SavedFirstname = localStorage.getItem('firstname');
        SavedLastname = localStorage.getItem('lastname');
        SavedNickname = localStorage.getItem('nickname');
        SavedEmail = localStorage.getItem('email');
        SavedPhone = localStorage.getItem('phone');
        SavedPassword = localStorage.getItem('password');
        
        if(SavedFirstname){
            setFirstname(SavedFirstname)
        }
        if(SavedLastname){
            setLastname(SavedLastname)
        }
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

    const handleFirstnameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFirstname(e.target.value);
    }

    const handleLastnameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLastname(e.target.value);
    }

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

        if (!firstname) {
            alert('Пожалуйста, введите имя.');
        }

        if (!lastname) {
            alert('Пожалуйста, введите фамилию.');
        }        

        if (!nickname) {
            alert('Пожалуйста, введите отображаемое имя.');
        }

        if (!email) {
            alert('Пожалуйста, введите email.');
        } else if (
            !(emailRegex.test(email))
        ) {
            alert('Введите корректный email или номер телефона.');
        }
        
        if (!phone) {
            alert('Пожалуйста, введите номер телефона.');
        } else if (
            !(phoneRegex.test(phone))
        ) {
            alert('Введите корректный номер телефона.');
        }

        if (!password) {
            alert('Введите пароль.');
        } else if (password.length < 6) {
            alert('Пароль должен содержать минимум 6 символов.');
        }
    }


    return (
        <div className="centered-container">
            <RegisterComponent
                firstname={firstname}
                lastname={lastname}
                nickname={nickname}
                email={email}
                phone={phone}
                password={password}
                passwordVisible={passwordVisible}
                isLoading={isLoading}
                onFirstnameChange={handleFirstnameChange}
                onLastnameChange={handleLastnameChange}
                onNicknameChange={handleNicknameChange}
                onEmailChange={handleEmailChange}
                onPhoneChange={handlePhoneChange}
                onPasswordChange={handlePasswordChange}
                onTogglePasswordVisibility={togglePasswordVisibility}
                onSubmit={handleSubmit}
            />
        </div>
    );
}

export default Register;