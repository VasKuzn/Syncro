import '../Styles/Login.css';

import React from 'react';

import LoginComponent from '../Components/LoginPage/LoginComponents';
import FooterComponent from '../Components/LoginPage/FooterComponent';
import YandexAuthButton from '../Utils/YandexAuthButton';

import { useNavigate } from 'react-router-dom';
import { loginUser, loginWithYandex } from '../Services/AuthService';
import { useAuthForm } from '../Hooks/UseAuthForm';
import { AnimatePresence, motion } from 'framer-motion';
import { useCsrf } from '../Contexts/CsrfProvider';

const Login = () => {
    const navigate = useNavigate();
    const { baseUrl } = useCsrf();
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
            await loginUser(formState.emailOrPhone, formState.password, baseUrl);
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

    const handleYandexSuccess = async (yandexToken: string) => {
        try {
            const result = await loginWithYandex(yandexToken, baseUrl);
            navigate('/main');
        } catch (error) {
            console.error('Error details:', {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
        }
    };

    const handleYandexError = (error: any) => {
        console.error('Ошибка инициализации кнопки Яндекса:', error);
    };

    return (
        <AnimatePresence>
            <motion.div
                className="centered-container"
                key="page"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            >
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

                <div className="alternative-login">
                    Alternative login
                </div>

                <YandexAuthButton
                    baseUrl={baseUrl}
                    onSuccess={handleYandexSuccess}
                    onError={handleYandexError}
                />

                <FooterComponent />
            </motion.div>
        </AnimatePresence>
    );
};

export default Login;