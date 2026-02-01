import React from 'react';
import { ResetPasswordComponentProps } from '../../Types/ResetPasswordTypes';

const ResetPasswordForm: React.FC<ResetPasswordComponentProps> = ({
    formData,
    passwordVisible,
    isLoading,
    errors,
    successMessage,
    userEmail,
    onInputChange,
    onTogglePasswordVisibility,
    onSubmit
}) => {
    if (successMessage) {
        return (
            <div className="reset-password-page-background">
                <div className="reset-password-container">
                    <div className="reset-password-header">
                        <h1 className="reset-password-title">Успешно!</h1>
                    </div>
                    <div className="reset-password-success">
                        <div className="success-icon">✓</div>
                        <p className="success-message">{successMessage}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-password-page-background">
            <div className="reset-password-container">
                <div className="reset-password-header">
                    <h1 className="reset-password-title">Сброс пароля</h1>
                    <p className="reset-password-subtitle">
                        Создайте новый пароль для вашего аккаунта
                        {userEmail && (
                            <span className="reset-password-email">
                                <br />Email: {userEmail}
                            </span>
                        )}
                    </p>
                </div>

                <form id="reset-password-form" onSubmit={onSubmit} noValidate>
                    <div className="reset-password-inputs">
                        <label htmlFor="newPassword" className="reset-password-label">
                            Новый пароль
                            <span className="password-requirements">
                                (минимум 8 символов, заглавная, строчная, цифра и спецсимвол)
                            </span>
                        </label>
                        <div className="reset-password-field-wrapper">
                            <input
                                className="reset-password-input"
                                type={passwordVisible.newPassword ? "text" : "password"}
                                id="newPassword"
                                placeholder="Введите новый пароль"
                                required
                                value={formData.newPassword}
                                onChange={(e) => onInputChange('newPassword', e.target.value)}
                                aria-describedby="newPassword-error"
                            />
                            <button
                                type="button"
                                className="reset-password-toggle"
                                aria-label="Показать пароль"
                                aria-controls="newPassword"
                                onClick={() => onTogglePasswordVisibility('newPassword')}
                            >
                                {passwordVisible.newPassword ? "Скрыть" : "Показать"}
                            </button>
                        </div>
                        {errors.newPassword && (
                            <div id="newPassword-error" className="reset-password-error">
                                {errors.newPassword}
                            </div>
                        )}

                        <label htmlFor="confirmPassword" className="reset-password-label">
                            Подтверждение пароля
                        </label>
                        <div className="reset-password-field-wrapper">
                            <input
                                className="reset-password-input"
                                type={passwordVisible.confirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                placeholder="Подтвердите новый пароль"
                                required
                                value={formData.confirmPassword}
                                onChange={(e) => onInputChange('confirmPassword', e.target.value)}
                                aria-describedby="confirmPassword-error"
                            />
                            <button
                                type="button"
                                className="reset-password-toggle"
                                aria-label="Показать пароль"
                                aria-controls="confirmPassword"
                                onClick={() => onTogglePasswordVisibility('confirmPassword')}
                            >
                                {passwordVisible.confirmPassword ? "Скрыть" : "Показать"}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <div id="confirmPassword-error" className="reset-password-error">
                                {errors.confirmPassword}
                            </div>
                        )}
                    </div>

                    <div className="reset-password-buttons">
                        <button
                            type="submit"
                            className="reset-password-submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="reset-password-spinner" aria-hidden="true"></div>
                            ) : (
                                "Сбросить пароль"
                            )}
                        </button>
                    </div>

                    <div className="reset-password-security-notice">
                        <p>⚠️ <strong>Ссылка действительна 15 минут</strong></p>
                        <p>После смены пароля вы получите подтверждение на email</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordForm;