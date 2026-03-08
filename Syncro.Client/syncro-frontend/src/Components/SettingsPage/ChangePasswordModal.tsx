import React, { useState } from 'react';
import { MIN_PASSWORD_LENGTH } from '../../Constants/LoginConsts';
import { changePass } from '../../Services/SettingsService';

interface ChangePasswordModalProps {
    onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
    onClose
}) => {
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validate = (): boolean => {
        if (!oldPass || !newPass || !confirmPass) {
            setError("Заполните все поля");
            return false;
        }
        if (newPass.length < MIN_PASSWORD_LENGTH) {
            setError(`Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов.`)
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
            changePass(oldPass, newPass);

            setOldPass('');
            setNewPass('');
            setConfirmPass('');
            onClose();
        } catch (err) {
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
                                required/>
                        </div>

                        <div className='setting-label'>Новый пароль</div>
                        <div className='setting-input-box'>                            
                            <input 
                                className='setting-input'
                                value={newPass}
                                onChange={(e) => setNewPass(e.target.value)}
                                type='password'
                                required/>
                        </div>

                        <div className='setting-label'>Подтвердите новый пароль</div>
                        <div className='setting-input-box'>                            
                            <input 
                                className='setting-input'
                                value={confirmPass}
                                onChange={(e) => setConfirmPass(e.target.value)}
                                type='password'
                                required/>
                        </div>

                    </div>

                    {error && (
                        <div className="error-message">{error}</div>
                    )}

                    <button
                        className="setting-button"
                        disabled={isLoading}
                        onClick={handleConfirm}
                    >
                        Изменить
                    </button>

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