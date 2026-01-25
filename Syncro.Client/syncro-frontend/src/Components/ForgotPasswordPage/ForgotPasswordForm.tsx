import React from 'react';
import { ForgotPasswordComponentProps } from '../../Types/ForgotPasswordTypes';

const ForgotPasswordForm: React.FC<ForgotPasswordComponentProps> = ({
    formData,
    isLoading,
    errors,
    successMessage,
    onInputChange,
    onSubmit
}) => {
    return (
        <div className="reset-password-page-background">
            <div className="reset-password-container">
                <div className="reset-password-header">
                    <h1 className="reset-password-title">Забыл пароль</h1>
                    <p className="reset-password-subtitle">Введите адрес электронной почты, связанный с аккаунтом</p>
                </div>

                {successMessage ? (
                    <div className="reset-password-success">
                        {successMessage}
                    </div>
                ) : (
                    <form id="reset-password-form" onSubmit={onSubmit} noValidate>
                        <div className="reset-password-inputs">
                            <label htmlFor="newPassword" className="reset-password-label">Email</label>
                            <div className="reset-password-field-wrapper">
                                <input
                                    className="reset-password-input"
                                    type="text"
                                    id="newPassword"
                                    placeholder="Введите адрес электронной почты"
                                    required
                                    value={formData.email}
                                    onChange={(e) => onInputChange('email', e.target.value)}
                                    aria-describedby="newPassword-error"
                                />
                            </div>
                            {errors.email && (
                                <div id="newPassword-error" className="reset-password-error">
                                    {errors.email}
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
                                    "Отправить ссылку для сброса пароля"
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordForm;