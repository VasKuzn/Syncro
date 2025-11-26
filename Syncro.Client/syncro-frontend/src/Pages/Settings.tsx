import '../Styles/Settings.css';

import SidebarComponent from '../Components/SettingsPage/SidebarComponent';
import SettingsComponent from '../Components/SettingsPage/SettingsComponent';

import { useSettingsForm } from '../Hooks/UseSettingsForm';
import { updateUserInfo } from '../Services/SettingsService';
import { fetchCurrentUser, getUserInfo } from '../Services/MainFormService';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { UserInfo } from '../Types/UserInfo';
import { AnimatePresence, motion } from 'framer-motion';


const Settings = () => {
    const navigate = useNavigate();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null); 
    const {
        formState,
        setFormState,
        nicknameField,
        firstnameField,
        lastnameField,
        emailField,
        phoneField,
        countryField,
        passwordField,
        validateForm
    } = useSettingsForm();

    useEffect(() => {
        const loadCurrentUser = async () => {
            const user = await getUserInfo(await fetchCurrentUser());
            if (user != null) {
                setFormState(prev => ({
                    ...prev,
                    ...user,
                }))
            }

            setCurrentUserId(await fetchCurrentUser());
        };
        loadCurrentUser();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return;
        }

        try {
            // const userData: UserInfo = {
            //     nickname: formState.nickname,
            //     firstname: formState.firstname,
            //     lastname: formState.lastname,
            //     email: formState.email,
            //     phonenumber: formState.phonenumber,
            //     country: formState.country,
            //     password: formState.password,
            //     avatar: ""
            // };

            const userData = new FormData()
            userData.append("nickname", formState.nickname)
            userData.append("firstname", formState.firstname)
            userData.append("lastname", formState.lastname)
            userData.append("email", formState.email)
            userData.append("phonenumber", formState.phonenumber)
            //userData.append("country", formState.country)
            userData.append("password", formState.password)
            userData.append("avatar", formState.avatar)

            await updateUserInfo(currentUserId, userData)

            navigate(-1)
        } catch (error) {
            console.log(error)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState((prev) => ({
            ...prev,
            [name]: value
        }))
    };

    return (
        <AnimatePresence>
            <motion.div
                className="settings-page"
                key="page"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            >
                <SidebarComponent />
                <SettingsComponent
                    nickname={formState.nickname}
                    email={formState.email}
                    password={formState.password}
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
                    passwordField={passwordField}
                    onSubmit={e => handleSubmit(e)}
                    onChange={e => handleChange(e)}
                />
            </motion.div>
        </AnimatePresence>
    );
}

export default Settings;