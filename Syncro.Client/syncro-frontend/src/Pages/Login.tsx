import React from 'react';
import '../Styles/Login.css';
import LoginComponent from '../Components/LoginPage/LoginComponents';
import FooterComponent from '../Components/LoginPage/FooterComponent';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../Services/AuthService';
import { useAuthForm } from '../Hooks/UseAuthForm';

const Login = () => {
    const navigate = useNavigate();
    const {
        formState,
        setFormState,
        emailField,
        passwordField,
        validateForm,
        handlePersistCredentials,
    } = useAuthForm();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        handlePersistCredentials();
        setFormState(prev => ({ ...prev, isLoading: true }));

        try {
            await loginUser(formState.emailOrPhone, formState.password);
            navigate('/main');
        } catch (error) {
            console.error('Ошибка авторизации:', error);
            if (emailField.current) {
                emailField.current.setCustomValidity(
                    error instanceof Error ? error.message : 'Неверные учетные данные',
                );
                emailField.current.reportValidity();
            }
        } finally {
            setFormState(prev => ({ ...prev, isLoading: false }));
        }
    };

    return (
        <div className="centered-container">
            <LoginComponent
                emailOrPhone={formState.emailOrPhone}
                password={formState.password}
                passwordVisible={formState.passwordVisible}
                keepSignedIn={formState.keepSignedIn}
                isLoading={formState.isLoading}
                maxLength={formState.maxLength}
                onEmailOrPhoneChange={(e) =>
                    setFormState(prev => ({ ...prev, emailOrPhone: e.target.value }))
                }
                onPasswordChange={(e) =>
                    setFormState(prev => ({ ...prev, password: e.target.value }))
                }
                onKeepSignedInChange={(e) =>
                    setFormState(prev => ({ ...prev, keepSignedIn: e.target.checked }))
                }
                onTogglePasswordVisibility={() =>
                    setFormState(prev => ({ ...prev, passwordVisible: !prev.passwordVisible }))
                }
                onSubmit={handleSubmit}
                emailRef={emailField}
                passwordRef={passwordField}
            />
            <FooterComponent />
        </div>
    );
};

export default Login;