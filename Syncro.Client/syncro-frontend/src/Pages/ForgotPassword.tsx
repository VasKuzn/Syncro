import { useState, useCallback } from 'react';
import ForgotPasswordForm from '../Components/ForgotPasswordPage/ForgotPasswordForm';
import { ForgotPasswordFormData } from '../Types/ForgotPasswordTypes';
import { EMAIL_REGEX } from '../Constants/LoginConsts';
import '../Styles/ResetPassword.css';
import { sendEmail } from '../Services/ForgotPasswordService';

const ForgotPassword = () => {
    const [formData, setFormData] = useState<ForgotPasswordFormData>({
        email: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = useState<string>('');

    const validateEmail = useCallback((email: string): string | null => {
        if (!email) {
            return 'Пожалуйста, введите email.'
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
        
        const newErrors: Record<string, string> = {};

        const passwordError = validateEmail(formData.email);
        if (passwordError) {
            newErrors.newPassword = passwordError;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        
        setIsLoading(true);
        try {
            const result = await sendEmail(formData.email)
            
            if (!result.ok) {
                throw new Error("Ошибка при отправке письма")
            }

            setSuccessMessage('На указанный адрес отправлено письмо');
            
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
        } catch (error) {
            setErrors({ 
                confirmPassword: 'Произошла ошибка. Пожалуйста, попробуйте снова.' 
            });
        } finally {
            setIsLoading(false);
        }
    }, [formData, validateEmail]);

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