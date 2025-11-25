import '../Styles/Settings.css';

import SidebarComponent from '../Components/SettingsPage/SidebarComponent';
import SettingsComponent from '../Components/SettingsPage/SettingsComponent';

import { useSettingsForm } from '../Hooks/UseSettingsForm';
import { updateUserInfo } from '../Services/SettingsService';
import { fetchCurrentUser, getUserInfo } from '../Services/MainFormService';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { UserInfo } from '../Types/UserInfo';

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
            const userData: UserInfo = {
                nickname: formState.nickname,
                firstname: formState.firstname,
                lastname: formState.lastname,
                email: formState.email,
                phonenumber: formState.phonenumber,
                country: formState.country,
                password: formState.password,
                avatar: ""
            };

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
        <div className='settings-page'>
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
        </div>
    );
}

export default Settings;