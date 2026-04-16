import React, { useState, useRef, useEffect } from 'react';
import { SettingsComponentProps } from "../../Types/SettingsProps";
import SettingsAddAvatarComponent from './SettingsAddAvatarComponent';
import AIGenerationModal from './AIGenerationModal';
import { logoutUser } from '../../Services/LogoutService';
import ChangePasswordModal from './ChangePasswordModal';

interface EnhancedSettingsComponentProps extends SettingsComponentProps {
    onAvatarUpdate: (file: File) => void;
    currentAvatarFile?: File | null;
    baseUrl: string;
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
    onSubmit,
    onChange,
    onAvatarUpdate,
    baseUrl
}) => {
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [showChangePassModal, setShowChangePassModal] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [caldavConfig, setCaldavConfig] = useState({
        email: '',
        password: ''
    });
    const [isSavingCalDav, setIsSavingCalDav] = useState(false);
    const [isCheckingCalDav, setIsCheckingCalDav] = useState(false);
    const [steamId, setSteamId] = useState('');
    const [isSavingSteam, setIsSavingSteam] = useState(false);
    const [steamSaveSuccess, setSteamSaveSuccess] = useState(false);
    const [steamError, setSteamError] = useState<string | null>(null);

    const handleAvatarClick = () => {
        setShowAvatarModal(true);
    };

    const handleCloseModal = () => {
        setShowAvatarModal(false);
    };

    const handleFileSelect = (file: File) => {
        onAvatarUpdate(file);
        setShowAvatarModal(false);
    };

    const handleAIGenerate = () => {
        setShowAvatarModal(false);
        setShowAIModal(true);
    };

    const handleAIGenerated = (file: File) => {
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
            await logoutUser(baseUrl);

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

    const handleChangePassword = () => {
        setShowChangePassModal(true);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await onSubmit(e);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const handleCaldavInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCaldavConfig(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const saveCaldavSettings = async () => {
        if (!caldavConfig.email || !caldavConfig.password) {
            alert('Заполните email и пароль');
            return;
        }
        setIsSavingCalDav(true);
        try {
            const response = await fetch(`${baseUrl}/api/calendar/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email: caldavConfig.email,
                    password: caldavConfig.password
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Ошибка сохранения');
            }

            alert('✅ Настройки Яндекс Календаря сохранены');
        } catch (error: any) {
            console.error('Save CalDAV settings error:', error);
            alert(`❌ Ошибка сохранения: ${error.message}`);
        } finally {
            setIsSavingCalDav(false);
        }
    };

    useEffect(() => {
        const fetchSteamId = async () => {
            try {
                const response = await fetch(`${baseUrl}/api/steamrecommendations/me`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setSteamId(data.steamId || '');
                } else if (response.status === 404) {
                    setSteamId('');
                } else {
                    console.error('Failed to fetch steam id');
                }
            } catch (error) {
                console.error('Error fetching steam id:', error);
            }
        };
        fetchSteamId();
    }, [baseUrl]);

    const handleSteamIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSteamId(e.target.value);
        setSteamError(null);
    };

    const saveSteamSettings = async () => {
        if (!steamId || steamId.trim() === '') {
            setSteamError('Введите Steam ID');
            return;
        }
        if (!/^\d{17}$/.test(steamId)) {
            setSteamError('Steam ID должен состоять из 17 цифр');
            return;
        }
        setIsSavingSteam(true);
        setSteamError(null);
        try {
            const response = await fetch(`${baseUrl}/api/steamrecommendations/me`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ steamId: steamId.trim() })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка сохранения');
            }
            setSteamSaveSuccess(true);
            setTimeout(() => setSteamSaveSuccess(false), 3000);
        } catch (error: any) {
            console.error('Save Steam settings error:', error);
            setSteamError(error.message);
        } finally {
            setIsSavingSteam(false);
        }
    };

    const checkCaldavConnection = async () => {
        setIsCheckingCalDav(true);
        try {
            const response = await fetch(`${baseUrl}/api/calendar/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include"
            });

            const data = await response.json();
            if (data.success) {
                console.log('Календари:', data.calendars);
                alert(`✅ Подключение успешно! Найдено ${data.calendars?.length ?? 0} календарей.`);
            } else {
                throw new Error(data.error || 'Неизвестная ошибка');
            }
        } catch (error: any) {
            console.error('CalDAV error:', error);
            alert(`❌ Ошибка подключения: ${error.message}`);
        } finally {
            setIsCheckingCalDav(false);
        }
    };

    return (
        <div className="settings-profile">
            {saveSuccess && (
                <div className="settings-success-banner">
                    Изменения сохранены успешно
                </div>
            )}

            <form id="settings-form" onSubmit={handleSubmit} noValidate>
                <section className="settings-section settings-profile-section">
                    <div className="settings-profile-container">
                        <div className="profile-avatar-block">
                            <div className="avatar-container">
                                <img
                                    className="settings-avatar"
                                    src={avatar || "logo.png"}
                                    alt="Аватар профиля"
                                    onClick={handleAvatarClick}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "logo.png";
                                    }}
                                />
                                <div
                                    className="avatar-edit-badge"
                                    onClick={handleAvatarClick}
                                >
                                    <span>✏</span>
                                </div>
                                <div className="avatar-tooltip">Нажмите для изменения аватара</div>
                            </div>
                        </div>

                        <div className="profile-info-block">
                            <div className="profile-header">
                                <h1 className="profile-nickname">{nickname}</h1>
                                <p className="profile-email">{email}</p>
                            </div>

                            <div className="profile-meta">
                                {firstname && lastname && (
                                    <p className="profile-fullname">{firstname} {lastname}</p>
                                )}
                                {country && (
                                    <p className="profile-location">{country}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="settings-section">
                    <div className="section-header">
                        <h2 className="section-title">Личная информация</h2>
                    </div>

                    <div className="settings-grid-2">
                        <div className="settings-field">
                            <label htmlFor="firstname" className="setting-label">Имя</label>
                            <div className="setting-input-box">
                                <input
                                    id="firstname"
                                    name="firstname"
                                    className="setting-input"
                                    placeholder="Ваше имя"
                                    value={firstname}
                                    onChange={onChange}
                                    ref={firstnameField}
                                />
                            </div>
                        </div>

                        <div className="settings-field">
                            <label htmlFor="lastname" className="setting-label">Фамилия</label>
                            <div className="setting-input-box">
                                <input
                                    id="lastname"
                                    name="lastname"
                                    className="setting-input"
                                    placeholder="Ваша фамилия"
                                    value={lastname}
                                    onChange={onChange}
                                    ref={lastnameField}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="settings-grid-2">
                        <div className="settings-field">
                            <label htmlFor="nickname" className="setting-label">Имя пользователя</label>
                            <div className="setting-input-box">
                                <input
                                    id="nickname"
                                    name="nickname"
                                    className="setting-input"
                                    placeholder="Ваше имя в системе"
                                    value={nickname}
                                    onChange={onChange}
                                    ref={nicknameField}
                                    required
                                />
                            </div>
                        </div>

                        <div className="settings-field">
                            <label htmlFor="country" className="setting-label">Страна (код)</label>
                            <div className="setting-input-box">
                                <input
                                    id="country"
                                    name="country"
                                    className="setting-input"
                                    placeholder="Код страны"
                                    value={country}
                                    onChange={onChange}
                                    ref={countryField}
                                    type="number"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="settings-section">
                    <div className="section-header">
                        <h2 className="section-title">Контактная информация</h2>
                    </div>

                    <div className="settings-grid-2">
                        <div className="settings-field">
                            <label htmlFor="email" className="setting-label">Электронная почта</label>
                            <div className="setting-input-box">
                                <input
                                    id="email"
                                    name="email"
                                    className="setting-input"
                                    placeholder="your.email@example.com"
                                    value={email}
                                    onChange={onChange}
                                    ref={emailField}
                                    type="email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="settings-field">
                            <label htmlFor="phonenumber" className="setting-label">Номер телефона</label>
                            <div className="setting-input-box">
                                <input
                                    id="phonenumber"
                                    name="phonenumber"
                                    className="setting-input"
                                    placeholder="+7 (999) 999-99-99"
                                    value={phonenumber}
                                    onChange={onChange}
                                    ref={phoneField}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="settings-section">
                    <div className="settings-field">
                        <label className="setting-label">Пароль</label>
                        <p className="setting-hint">Измените свой пароль для повышения безопасности!</p>
                        <button
                            className="settings-button settings-button-compact settings-button-secondary"
                            type="button"
                            onClick={handleChangePassword}
                        >
                            Изменить пароль
                        </button>
                    </div>
                </section>

                <div className="settings-actions">
                    <button className="settings-button settings-button-primary" type="submit">
                        Сохранить изменения профиля
                    </button>
                </div>

                <section className="settings-section">
                    <div className="section-header">
                        <h2 className="section-title">Интеграция с Яндекс Календарём</h2>
                    </div>

                    <div className="settings-field">
                        <label htmlFor="caldav-email" className="setting-label">Email почты Yandex</label>
                        <div className="setting-input-box">
                            <input
                                id="caldav-email"
                                name="email"
                                className="setting-input"
                                value={caldavConfig.email}
                                onChange={handleCaldavInputChange}
                                placeholder="your@yandex.ru"
                            />
                        </div>
                    </div>

                    <div className="settings-field">
                        <label htmlFor="caldav-password" className="setting-label">Пароль приложения</label>
                        <div className="setting-input-box">
                            <input
                                id="caldav-password"
                                name="password"
                                type="password"
                                className="setting-input"
                                value={caldavConfig.password}
                                onChange={handleCaldavInputChange}
                                placeholder="Пароль приложения Яндекса"
                            />
                        </div>
                        <p className="setting-hint">
                            Создайте пароль приложения в настройках Яндекс ID → Безопасность → Пароли приложений! Вводите пароль, а не имя пароля
                        </p>
                    </div>

                    <div className="settings-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                            className="settings-button settings-button-secondary"
                            type="button"
                            onClick={saveCaldavSettings}
                            disabled={isSavingCalDav}
                        >
                            {isSavingCalDav ? 'Сохранение...' : 'Сохранить настройки Yandex'}
                        </button>
                        <button
                            className="settings-button settings-button-secondary"
                            type="button"
                            onClick={checkCaldavConnection}
                            disabled={isCheckingCalDav}
                        >
                            {isCheckingCalDav ? 'Проверка...' : 'Проверить подключение Yandex'}
                        </button>
                    </div>
                </section>

                <section className="settings-section">
                    <div className="section-header">
                        <h2 className="section-title">Интеграция со Steam</h2>
                    </div>

                    <div className="settings-field">
                        <label htmlFor="steam-id" className="setting-label">Ваш Steam ID</label>
                        <div className="setting-input-box">
                            <input
                                id="steam-id"
                                name="steamId"
                                className="setting-input"
                                value={steamId}
                                onChange={handleSteamIdChange}
                                placeholder="Например: 76561198000000000"
                                maxLength={17}
                                pattern="\d*"
                            />
                        </div>
                        <p className="setting-hint">
                            Steam ID состоит из 17 цифр. Найдите его в клиенте Steam: «Об аккаунте» → «Steam ID».
                        </p>
                        {steamError && (
                            <p className="setting-error">{steamError}</p>
                        )}
                        {steamSaveSuccess && (
                            <p className="setting-success">Steam ID успешно сохранён</p>
                        )}
                    </div>

                    <div className="settings-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                            className="settings-button settings-button-secondary"
                            type="button"
                            onClick={saveSteamSettings}
                            disabled={isSavingSteam}
                        >
                            {isSavingSteam ? 'Сохранение...' : 'Сохранить Steam ID'}
                        </button>
                    </div>
                </section>

                <section className="settings-section settings-danger-zone">
                    <div className="section-header">
                        <h2 className="section-title danger">Выход из аккаунта</h2>
                    </div>

                    <div className="danger-zone-content">
                        <p className="danger-zone-description">
                            При выходе из аккаунта вы будете перенаправлены на страницу входа.
                        </p>
                        <button
                            type="button"
                            className="settings-button settings-button-compact settings-button-danger"
                            onClick={handleLogoutClick}
                        >
                            Выйти из аккаунта
                        </button>
                    </div>
                </section>
            </form>

            {showChangePassModal && (
                <ChangePasswordModal
                    onClose={() => setShowChangePassModal(false)}
                />
            )}

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
                            <p className="logout-modal-text-main">
                                Вы уверены, что хотите выполнить полный выход из аккаунта?
                            </p>
                            <p className="logout-modal-text-secondary">
                                После выхода вы будете перенаправлены на страницу входа. Ваши данные останутся сохранены.
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

            <input
                className="file-input-display-none"
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*"
            />
        </div>
    );
};

export default SettingsComponent;