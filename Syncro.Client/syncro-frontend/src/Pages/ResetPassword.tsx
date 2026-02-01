import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ResetPasswordForm from '../Components/PasswordPage/ResetPasswordForm';
import { ResetPasswordFormData } from '../Types/ResetPasswordTypes';
import '../Styles/ResetPassword.css';
import { validateResetToken, resetPassword } from '../Services/ResetPasswordService';
import { validatePassword } from '../Utils/Validations';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState<ResetPasswordFormData>({
        newPassword: '',
        confirmPassword: ''
    });

    const [passwordVisible, setPasswordVisible] = useState({
        newPassword: false,
        confirmPassword: false
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isValidatingToken, setIsValidatingToken] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [tokenError, setTokenError] = useState<string>('');
    const [userEmail, setUserEmail] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');

    // Валидация токена при загрузке
    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setTokenError('Ссылка для сброса пароля недействительна');
                setIsValidatingToken(false);
                return;
            }

            try {
                const response = await validateResetToken(token);

                if (response.ok) {
                    const data = await response.json();
                    setUserEmail(data.email);
                } else if (response.status === 404) {
                    setTokenError('Ссылка для сброса пароля недействительна или истекла');
                } else {
                    setTokenError('Ошибка при проверке ссылки');
                }
            } catch (error) {
                setTokenError('Ошибка при проверке ссылки');
            } finally {
                setIsValidatingToken(false);
            }
        };

        validateToken();
    }, [token]);

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

        if (!token) {
            setTokenError('Ссылка для сброса пароля недействительна');
            return;
        }

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
            const result = await resetPassword(token, formData.newPassword, formData.confirmPassword);

            if (!result.ok) {
                const errorData = await result.json();
                throw new Error(errorData.message || "Ошибка при сбросе пароля");
            }

            setSuccessMessage('Пароль успешно изменен! На вашу почту отправлено подтверждение. Вы будете перенаправлены на страницу входа.');

            setTimeout(() => {
                navigate('/login');
            }, 5000);
        } catch (error: any) {
            setErrors({
                confirmPassword: error.message || 'Произошла ошибка. Пожалуйста, попробуйте снова.'
            });
        } finally {
            setIsLoading(false);
        }
    }, [formData, token, navigate]);

    if (isValidatingToken) {
        return (
            <div className="reset-password-page">
                <div className="reset-password-gradient-bg">
                    <div className="reset-password-container">
                        <div className="reset-password-loading">
                            <div className="reset-password-spinner"></div>
                            <p>Проверка ссылки для сброса пароля...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (tokenError) {
        return (
            <div className="reset-password-page">
                <div className="reset-password-gradient-bg">
                    <div className="reset-password-container">
                        <div className="reset-password-header">
                            <h1 className="reset-password-title">Ошибка сброса пароля</h1>
                        </div>
                        <div className="reset-password-error-message">
                            <p>{tokenError}</p>
                            <button
                                className="reset-password-back-btn"
                                onClick={() => navigate('/forgot-password')}
                            >
                                Запросить новую ссылку
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-password-page">
            <div className="reset-password-gradient-bg">
                <ResetPasswordForm
                    formData={formData}
                    passwordVisible={passwordVisible}
                    isLoading={isLoading}
                    errors={errors}
                    successMessage={successMessage}
                    userEmail={userEmail}
                    onInputChange={handleInputChange}
                    onTogglePasswordVisibility={handleTogglePasswordVisibility}
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    );
};

export default ResetPassword;