import React, { useState } from 'react';
import { SettingsComponentProps } from "../../Types/SettingsProps";
import SettingsAddAvatarComponent from './SettingsAddAvatarComponent';

const SettingsComponent: React.FC<SettingsComponentProps> = ({
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
    onChange
}) => {
    const [showAvatarModal, setShowAvatarModal] = useState(false);

    const handleAvatarClick = () => {
        setShowAvatarModal(true);
    };

    const handleCloseModal = () => {
        setShowAvatarModal(false);
    };

    const handleFileSelect = (file: File) => {
        // Пока просто закроем модалку
        // В следующих этапах добавим логику обработки файла
        console.log('Выбран файл:', file.name);
        setShowAvatarModal(false);

        // Здесь можно добавить превью выбранного файла
        // или сразу отправить на сервер
    };

    const handleAIGenerate = () => {
        console.log('Запуск AI генерации аватара');
        setShowAvatarModal(false);
        // Здесь будет логика AI генерации
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
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* Модальное окно для смены аватара */}
            {showAvatarModal && (
                <SettingsAddAvatarComponent
                    onFileSelect={handleFileSelect}
                    onAIGenerate={handleAIGenerate}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
}

export default SettingsComponent;