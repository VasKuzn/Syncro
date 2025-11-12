import { useState, useEffect } from "react";
import { fetchCurrentUser, getUserInfo } from "../../Services/MainFormService";
import { UserInfo } from "../../Types/UserInfo";
import { EMAIL_REGEX, MIN_PASSWORD_LENGTH, PHONE_REGEX } from "../../Constants/LoginConsts";
import { useNavigate } from "react-router-dom";

const SettingsComponent: React.FC = () => {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo>({
        nickname: "",
        email: "",
        password: "",
        firstname: "",
        lastname: "",
        phonenumber: "",
        avatar: "",
        country: 0,
    });
    const navigate = useNavigate();

    let correct = true;

    useEffect(() => {
        const loadCurrentUser = async () => {
            const user = await getUserInfo(await fetchCurrentUser());
            if (user != null) {
                setCurrentUserInfo(prev => ({
                    ...prev,
                    ...user,
                }))
            }

            setCurrentUserId(await fetchCurrentUser());
        };
        loadCurrentUser();
    }, []);

    const validateFields = (): boolean => {

        if (!currentUserInfo.nickname.trim()) {
            correct = false;
        }

        if (!currentUserInfo.email) {
            correct = false
        } else if (!EMAIL_REGEX.test(currentUserInfo.email)) {
            correct = false
        }

        if (!currentUserInfo.phonenumber) {
            correct = false
        } else if (!PHONE_REGEX.test(currentUserInfo.phonenumber)) {
            correct = false
        }

        if (!currentUserInfo.password.trim()) {
            correct = false;
        } else if (currentUserInfo.password.trim().length < MIN_PASSWORD_LENGTH) {
            correct = false;
        }

        return correct
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentUserInfo((prev) => ({
            ...prev,
            [name]: value
        }))
    };

    const updateUserInfo = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateFields()) {
            return;
        }

        try {
            const userData: UserInfo = {
                nickname: currentUserInfo.nickname?.trim(),
                firstname: currentUserInfo.firstname?.trim(),
                lastname: currentUserInfo.lastname?.trim(),
                email: currentUserInfo.email?.trim(),
                phonenumber: currentUserInfo.phonenumber?.trim(),
                country: currentUserInfo.country,
                password: currentUserInfo.password,
                avatar: ""
            };

            const response = await fetch(`http://localhost:5232/api/accounts/full_account_info/${currentUserId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Ошибка обновления данных")
            }

            navigate(-1)
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="settings-profile">
            <form id="settings-form" onSubmit={updateUserInfo} noValidate>

                <div className="setting">
                    <div className="setting-label">Имя пользователя</div>
                    <div className="setting-input-box">
                        <input
                            name="nickname"
                            className="setting-input"
                            placeholder="Новое имя пользователя"
                            value={currentUserInfo?.nickname}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="setting">
                    <div className="setting-label">Аватар</div>
                    <img src="/logo.png" width="100" height="100" />
                    <button className="setting-button">Сменить аватар</button>
                </div>

                <div className="setting">
                    <div className="setting-label">Имя</div>
                    <div className="setting-input-box">
                        <input
                            name="firstname"
                            className="setting-input"
                            placeholder="Новое имя"
                            value={currentUserInfo?.firstname}
                            onChange={handleChange}
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
                            value={currentUserInfo?.lastname}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="setting">
                    <div className="setting-label">Почта</div>
                    <div className="setting-input-box">
                        <input
                            name="email"
                            className="setting-input"
                            placeholder="Новый почтовый адрес"
                            value={currentUserInfo?.email}
                            onChange={handleChange}
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
                            value={currentUserInfo?.phonenumber}
                            onChange={handleChange}
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
                            onChange={handleChange}
                            value={currentUserInfo?.country}
                        />
                    </div>
                </div>

                <div className="setting">
                    <div className="setting-label">Пароль</div>
                    <div className="setting-input-box">
                        <input
                            name="password"
                            className="setting-input"
                            type="password"
                            placeholder="Введите пароль"
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <button className="setting-button" type="submit">Сохранить</button>

            </form>
        </div>
    );
}

export default SettingsComponent