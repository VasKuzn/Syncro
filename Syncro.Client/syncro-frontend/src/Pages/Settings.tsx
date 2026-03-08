// Settings.tsx
import '../Styles/Settings.css';
import SidebarComponent from '../Components/SettingsPage/SidebarComponent';
import SettingsComponent from '../Components/SettingsPage/SettingsComponent';
import { useSettingsForm } from '../Hooks/UseSettingsForm';
import { updateUserInfo } from '../Services/SettingsService';
import { fetchCurrentUser, getUserInfo } from '../Services/MainFormService';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCsrf } from '../Contexts/CsrfProvider';

const Settings = () => {
    const navigate = useNavigate();
    const { baseUrl, csrfToken } = useCsrf();
    const [isChecking, setIsChecking] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const {
        formState,
        setFormState,
        avatarFile,
        updateAvatar,
        nicknameField,
        firstnameField,
        lastnameField,
        emailField,
        phoneField,
        countryField,
        validateForm
    } = useSettingsForm();

    useEffect(() => {
        const loadCurrentUser = async () => {
            const user = await getUserInfo(await fetchCurrentUser(baseUrl), baseUrl);
            if (user != null) {
                setFormState(prev => ({
                    ...prev,
                    ...user,
                }))
            }
            setCurrentUserId(await fetchCurrentUser(baseUrl));
            setIsChecking(false);
        };
        loadCurrentUser();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const userData = new FormData()

            userData.append("nickname", formState.nickname)
            userData.append("firstname", formState.firstname)
            userData.append("lastname", formState.lastname)
            userData.append("email", formState.email)
            userData.append("phonenumber", formState.phonenumber)

            if (avatarFile) {
                userData.append("AvatarFile", avatarFile, avatarFile.name);
            }

            await updateUserInfo(currentUserId, userData, baseUrl, csrfToken);

            setTimeout(() => {
                setIsSubmitting(false);
                navigate(-1);
            }, 500);

        } catch (error) {
            console.log(error);
            setIsSubmitting(false);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState((prev) => ({
            ...prev,
            [name]: value
        }))
    };

    const handleAvatarUpdate = (file: File) => {
        const previewUrl = URL.createObjectURL(file);
        updateAvatar(file, previewUrl);
    };

    useEffect(() => {
        return () => {
            if (formState.avatar && formState.avatar.startsWith('blob:')) {
                URL.revokeObjectURL(formState.avatar);
            }
        };
    }, [formState.avatar]);

    if (isChecking) {
        return (
            <div className="messages-decrypting-overlay">
                <div className="messages-decrypting-spinner"></div>
                <div className="messages-decrypting-text">Загрузка данных...</div>
            </div>
        );
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                className="settings-page"
                key="page"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "easeInOut" }}
            >
                <SidebarComponent/>
                <SettingsComponent
                    nickname={formState.nickname}
                    email={formState.email}
                    firstname={formState.firstname}
                    lastname={formState.lastname}
                    phonenumber={formState.phonenumber}
                    avatar={formState.avatar}
                    country={formState.country}
                    nicknameField={nicknameField}
                    firstnameField={firstnameField}
                    lastnameField={lastnameField}
                    emailField={emailField}
                    phoneField={phoneField}
                    countryField={countryField}
                    onSubmit={e => handleSubmit(e)}
                    onChange={e => handleChange(e)}
                    onAvatarUpdate={handleAvatarUpdate}
                    currentAvatarFile={avatarFile}
                    baseUrl={baseUrl}
                />
                <AnimatePresence>
                    {isSubmitting && (
                        <motion.div
                            className="messages-decrypting-overlay-settings"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 0.2,
                                ease: "easeInOut"
                            }}
                        >
                            <div className="messages-decrypting-spinner"></div>
                            <div className="messages-decrypting-text">Изменение данных...</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
}

export default Settings;