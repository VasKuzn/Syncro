import '../Styles/Login.css';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import RegisterComponent from '../Components/RegisterPage/RegisterComponents';
import FooterComponent from '../Components/RegisterPage/FooterComponent';
import SuccessNotification from '../Components/RegisterPage/SuccessNotificationComponent';

import { useRegisterForm } from '../Hooks/UseRegisterForm';
import { registerUser } from '../Services/RegistrationService';
import { AnimatePresence, motion } from 'framer-motion';
import ErrorNotification from '../Components/RegisterPage/ErrorNotification';

const Register = () => {
    const navigate = useNavigate();

    const {
        formState,
        setFormState,
        nicknameField,
        emailField,
        phoneField,
        passwordField,
        validateForm,
    } = useRegisterForm();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) return;

        setFormState(prev => ({ ...prev, isLoading: true, showError: false, errorMessage: '' }));

        try {
            await registerUser(
                formState.email,
                formState.password,
                formState.nickname,
                formState.phone,
                null
            );
            setFormState(prev => ({ ...prev, showSuccess: true }));
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            setFormState(prev => ({
                ...prev,
                showError: true,
                errorMessage: 'Произошла ошибка при регистрации'
            }));
        } finally {
            setFormState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleCloseNotification = () => {
        setFormState(prev => ({ ...prev, showSuccess: false }));
        navigate('/login');
    };

    const handleCloseErrorNotification = () => {
        setFormState(prev => ({ ...prev, showError: false, errorMessage: '' }));
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
                {formState.showSuccess && <SuccessNotification onClose={handleCloseNotification} />}

                {formState.showError && formState.errorMessage && (
                    <ErrorNotification
                        message={formState.errorMessage}
                        onClose={handleCloseErrorNotification}
                    />
                )}

                <RegisterComponent
                    nickname={formState.nickname}
                    email={formState.email}
                    phone={formState.phone}
                    password={formState.password}
                    passwordVisible={formState.passwordVisible}
                    isLoading={formState.isLoading}
                    onNicknameChange={e => setFormState(prev => ({ ...prev, nickname: e.target.value }))}
                    onEmailChange={e => setFormState(prev => ({ ...prev, email: e.target.value }))}
                    onPhoneChange={e => setFormState(prev => ({ ...prev, phone: e.target.value }))}
                    onPasswordChange={e => setFormState(prev => ({ ...prev, password: e.target.value }))}
                    onTogglePasswordVisibility={() =>
                        setFormState(prev => ({ ...prev, passwordVisible: !prev.passwordVisible }))
                    }
                    onSubmit={handleSubmit}
                    nicknameRef={nicknameField}
                    emailRef={emailField}
                    phoneRef={phoneField}
                    passwordRef={passwordField}
                />

                <FooterComponent />
            </motion.div>
        </AnimatePresence>
    );
};

export default Register;