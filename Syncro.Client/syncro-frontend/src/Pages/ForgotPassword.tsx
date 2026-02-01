import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordForm from '../Components/ForgotPasswordPage/ForgotPasswordForm';
import { ForgotPasswordFormData } from '../Types/ForgotPasswordTypes';
import { EMAIL_REGEX } from '../Constants/LoginConsts';
import '../Styles/ResetPassword.css';
import { sendResetEmail } from '../Services/ForgotPasswordService';

const ForgotPassword = () => {
    const [formData, setFormData] = useState<ForgotPasswordFormData>({
        email: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = useState<string>('');
    const navigate = useNavigate();

    const validateEmail = useCallback((email: string): string | null => {
        if (!email) {
            return 'Пожалуйста, введите email.';
        } else if (!EMAIL_REGEX.test(email)) {
            return 'Введите корректный email.';
        }
        return null;
    }, []);

    const handleInputChange = useCallback((field: keyof ForgotPasswordFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [errors]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        const emailError = validateEmail(formData.email);
        if (emailError) {
            setErrors({ email: emailError });
            return;
        }

        setErrors({});
        setIsLoading(true);

        try {
            const result = await sendResetEmail(formData.email);

            if (!result.ok) {
                const errorData = await result.json();
                throw new Error(errorData.message || "Ошибка при отправке письма");
            }

            setSuccessMessage('Инструкции по сбросу пароля отправлены на указанный email. Проверьте свою почту.');

            setTimeout(() => {
                navigate('/login');
            }, 5000);
        } catch (error: any) {
            setErrors({
                email: error.message || 'Произошла ошибка. Пожалуйста, попробуйте снова.'
            });
        } finally {
            setIsLoading(false);
        }
    }, [formData, validateEmail, navigate]);

    return (
        <div className="reset-password-page">
            <div className="reset-password-gradient-bg">
                <ForgotPasswordForm
                    formData={formData}
                    isLoading={isLoading}
                    errors={errors}
                    successMessage={successMessage}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    );
};

export default ForgotPassword;