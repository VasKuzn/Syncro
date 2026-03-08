import React, { useState } from 'react';
import { MIN_PASSWORD_LENGTH } from '../../Constants/LoginConsts';
import { changePass } from '../../Services/SettingsService';
import { useCsrf } from '../../Contexts/CsrfProvider';
import { fetchCurrentUser } from '../../Services/MainFormService';

interface ChangePasswordModalProps {
    onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
    onClose
}) => {
    const { baseUrl, csrfToken } = useCsrf();
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const validate = (): boolean => {
        if (!oldPass || !newPass || !confirmPass) {
            setError("Заполните все поля");
            return false;
        }
        if (newPass.length < MIN_PASSWORD_LENGTH) {
            setError(`Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов.`)
            return false;
        }
        if (newPass !== confirmPass) {
            setError('Новый пароль и подтверждение не совпадают');
            return false;
        }
        return true;
    }

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const userId = await fetchCurrentUser(baseUrl);

            if (!userId) {
                setError('ID пользователя не найден');
                setIsLoading(false);
                return;
            }

            await changePass(userId, oldPass, newPass, baseUrl, csrfToken);

            setOldPass('');
            setNewPass('');
            setConfirmPass('');
            setError(null);
            setSuccessMessage('Пароль успешно изменен!');

            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            setSuccessMessage(null);
            setError(err instanceof Error ? err.message : 'Ошибка при смене пароля')
        } finally {
            setIsLoading(false)
        }
    };

    return (
        <div className="ai-modal-overlay">
            <div className="ai-modal">
                <div className="ai-modal-header">
                    <h2>Изменение пароля</h2>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="ai-modal-content">
                    <div className='column'>
                        <div className='setting-label'>Старый пароль</div>
                        <div className='setting-input-box'>
                            <input
                                className='setting-input'
                                value={oldPass}
                                onChange={(e) => setOldPass(e.target.value)}
                                type='password'
                                required />
                        </div>

                        <div className='setting-label'>Новый пароль</div>
                        <div className='setting-input-box'>
                            <input
                                className='setting-input'
                                value={newPass}
                                onChange={(e) => setNewPass(e.target.value)}
                                type='password'
                                required />
                        </div>

                        <div className='setting-label'>Подтвердите новый пароль</div>
                        <div className='setting-input-box'>
                            <input
                                className='setting-input'
                                value={confirmPass}
                                onChange={(e) => setConfirmPass(e.target.value)}
                                type='password'
                                required />
                        </div>

                    </div>

                    {error && (
                        <div className="error-message">{error}</div>
                    )}

                    {successMessage && (
                        <div className="success-notification">
                            {successMessage}
                        </div>
                    )}

                    <div className="buttons-settings">
                        <button
                            className="settings-button settings-button-secondary"
                            disabled={isLoading}
                            onClick={handleConfirm}
                            type="button"
                        >
                            Изменить пароль
                        </button>

                        <button
                            className="settings-button settings-button-secondary"
                            onClick={onClose}
                            type="button"
                            disabled={isLoading}
                        >
                            Отмена
                        </button>
                    </div>

                    {isLoading && (
                        <div className="loading-indicator">
                            <div className="spinner"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;