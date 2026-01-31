import { useState, useCallback } from 'react';
import ResetPasswordForm from '../Components/PasswordPage/ResetPasswordForm';
import { ResetPasswordFormData } from '../Types/ResetPasswordTypes';
import '../Styles/ResetPassword.css';
import { resetPassword } from '../Services/ResetPasswordService'
import { validatePassword } from '../Utils/Validations';

const ResetPassword = () => {
    const [formData, setFormData] = useState<ResetPasswordFormData>({
        newPassword: '',
        confirmPassword: ''
    });

    const [passwordVisible, setPasswordVisible] = useState({
        newPassword: false,
        confirmPassword: false
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = useState<string>('');

    const handleInputChange = useCallback((field: keyof ResetPasswordFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [errors]);

    const handleTogglePasswordVisibility = useCallback((field: keyof ResetPasswordFormData) => {
        setPasswordVisible(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};

        const passwordError = validatePassword(formData.newPassword);
        if (passwordError) {
            newErrors.newPassword = passwordError;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Пароли не совпадают, проверьте ввод паролей';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        setIsLoading(true);
        try {
            const result = await resetPassword("_", formData.newPassword)

            if (!result.ok) {
                throw new Error("Ошибка при сбросе пароля")
            }

            setSuccessMessage('Пароль успешно изменен!');

            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
        } catch (error) {
            setErrors({
                confirmPassword: 'Произошла ошибка. Пожалуйста, попробуйте снова.'
            });
            console.log(error)
        } finally {
            setIsLoading(false);
        }
    }, [formData, validatePassword]);

    return (
        <div className="reset-password-page">
            <div className="reset-password-gradient-bg">
                <ResetPasswordForm
                    formData={formData}
                    passwordVisible={passwordVisible}
                    isLoading={isLoading}
                    errors={errors}
                    successMessage={successMessage}
                    onInputChange={handleInputChange}
                    onTogglePasswordVisibility={handleTogglePasswordVisibility}
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    );
};

export default ResetPassword;