import React, { useState, useRef } from 'react';
import { SettingsComponentProps } from "../../Types/SettingsProps";
import SettingsAddAvatarComponent from './SettingsAddAvatarComponent';
import AIGenerationModal from './AIGenerationModal';
import { logoutUser } from '../../Services/LogoutService';
import { useNavigate } from 'react-router-dom';

interface EnhancedSettingsComponentProps extends SettingsComponentProps {
    onAvatarUpdate: (file: File) => void;
    currentAvatarFile?: File | null;
}

const SettingsComponent: React.FC<EnhancedSettingsComponentProps> = ({
    nickname,
    email,
    firstname,
    lastname,
    phonenumber,
    avatar,
    country,
    nicknameField,
    firstnameField,
    lastnameField,
    emailField,
    phoneField,
    countryField,
    passwordField,
    onSubmit,
    onChange,
    onAvatarUpdate,
}) => {
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const handleAvatarClick = () => {
        setShowAvatarModal(true);
    };

    const handleCloseModal = () => {
        setShowAvatarModal(false);
    };

    const handleFileSelect = (file: File) => {
        const previewUrl = URL.createObjectURL(file);
        onAvatarUpdate(file);
        setShowAvatarModal(false);
    };

    const handleAIGenerate = () => {

        setShowAvatarModal(false);

        setShowAIModal(true);
    };

    const handleAIGenerated = (file: File) => {
        const previewUrl = URL.createObjectURL(file);
        onAvatarUpdate(file);
        setShowAIModal(false);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const handleConfirmLogout = async () => {
        try {
            setIsLoggingOut(true);
            
            await logoutUser();
            
            localStorage.clear();
            sessionStorage.clear();
            
            document.cookie.split(";").forEach(cookie => {
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            });
            
            window.location.href = '/login';
            
        } catch (error) {
            console.error('Logout failed:', error);
            localStorage.clear();
            sessionStorage.clear();
            document.cookie.split(";").forEach(cookie => {
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            });
            window.location.href = '/login';
        }
    };

    const handleCancelLogout = () => {
        setShowLogoutModal(false);
    };

    return (
        <div className="settings-profile">
            <div className="settings-profile-header">Настройки учётной записи</div>

            <form id="settings-form" onSubmit={onSubmit} noValidate>
                <div className="settings-form-container">
                    <div className="column">
                        <div className="setting">
                            <div className="setting-label">Имя пользователя</div>
                            <div className="setting-input-box">
                                <input
                                    name="nickname"
                                    className="setting-input"
                                    placeholder="Новое имя пользователя"
                                    value={nickname}
                                    onChange={onChange}
                                    ref={nicknameField}
                                    required
                                />
                            </div>
                        </div>

                        <div className="setting">
                            <div className="setting-label">Аватар</div>
                            <div className="avatar-container">
                                <img
                                    className="settings-avatar"
                                    src={avatar || "logo.png"}
                                    width="250"
                                    height="250"
                                    alt="Аватар"
                                    onClick={handleAvatarClick}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "logo.png";
                                    }}
                                />
                                <div className="avatar-tooltip">Изменить аватар</div>
                            </div>
                        </div>

                        <button className="setting-button" type="submit">Сохранить изменения</button>
                    </div>

                    <div className="column">
                        <div className="setting">
                            <div className="setting-label">Имя</div>
                            <div className="setting-input-box">
                                <input
                                    name="firstname"
                                    className="setting-input"
                                    placeholder="Новое имя"
                                    value={firstname}
                                    onChange={onChange}
                                    ref={firstnameField}
                                />
                            </div>
                        </div>

                        <div className="setting">
                            <div className="setting-label">Фамилия</div>
                            <div className="setting-input-box">
                                <input
                                    name="lastname"
                                    className="setting-input"
                                    placeholder="Новая фамилия"
                                    value={lastname}
                                    onChange={onChange}
                                    ref={lastnameField}
                                />
                            </div>
                        </div>

                        <div className="setting">
                            <div className="setting-label">Страна</div>
                            <div className="setting-input-box">
                                <input
                                    name="country"
                                    className="setting-input"
                                    placeholder="Выберите страну"
                                    value={country}
                                    onChange={onChange}
                                    ref={countryField}
                                    type="number"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="column">
                        <div className="setting">
                            <div className="setting-label">Почта</div>
                            <div className="setting-input-box">
                                <input
                                    name="email"
                                    className="setting-input"
                                    placeholder="Новый почтовый адрес"
                                    value={email}
                                    onChange={onChange}
                                    ref={emailField}
                                    type="email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="setting">
                            <div className="setting-label">Номер телефона</div>
                            <div className="setting-input-box">
                                <input
                                    name="phonenumber"
                                    className="setting-input"
                                    placeholder="Новый номер телефона"
                                    value={phonenumber}
                                    onChange={onChange}
                                    ref={phoneField}
                                    required
                                />
                            </div>
                        </div>

                        <div className="setting">
                            <div className="setting-label">Новый пароль</div>
                            <div className="setting-input-box">
                                <input
                                    name="password"
                                    className="setting-input"
                                    type="password"
                                    placeholder="Введите пароль"
                                    onChange={onChange}
                                    ref={passwordField}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #2D3748' }}>
                    <div className="setting">
                        <button 
                            type="button"
                            className="setting-button"
                            onClick={handleLogoutClick}
                            style={{
                                backgroundColor: '#ef4444',
                                animation: 'none'
                            }}
                        >
                            Выйти из аккаунта
                        </button>
                    </div>
                </div>
            </form>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*"
                style={{ display: 'none' }}
            />

            {showAvatarModal && (
                <SettingsAddAvatarComponent
                    onFileSelect={handleFileSelect}
                    onAIGenerate={handleAIGenerate}
                    onClose={handleCloseModal}
                    fileInputRef={fileInputRef}
                />
            )}
            {showAIModal && (
                <AIGenerationModal
                    onGenerate={handleAIGenerated}
                    onClose={() => setShowAIModal(false)}
                />
            )}
            {showLogoutModal && (
                <div className="logout-modal-overlay">
                    <div className="logout-modal">
                        <div className="logout-modal-header">
                            <h2>Подтверждение выхода</h2>
                        </div>
                        <div className="logout-modal-content">
                            <p>Вы уверены, что хотите выполнить полный выход из аккаунта?</p>
                            <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '10px' }}>
                                После выхода вы будете перенаправлены на страницу входа.
                            </p>
                        </div>
                        <div className="logout-modal-actions">
                            <button 
                                type="button"
                                className="logout-modal-btn logout-modal-btn-cancel"
                                onClick={handleCancelLogout}
                                disabled={isLoggingOut}
                            >
                                Отмена
                            </button>
                            <button 
                                type="button"
                                className="logout-modal-btn logout-modal-btn-confirm"
                                onClick={handleConfirmLogout}
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut ? 'Выход...' : 'Выйти'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsComponent;