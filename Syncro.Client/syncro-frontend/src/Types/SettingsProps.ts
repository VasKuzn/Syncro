export interface SettingsComponentProps {
    nickname: string;
    email: string;
    password: string;
    firstname: string;
    lastname: string;
    phonenumber: string;
    avatar: string;
    country: number;
    nicknameField: React.RefObject<HTMLInputElement | null>;
    firstnameField: React.RefObject<HTMLInputElement | null>;
    lastnameField: React.RefObject<HTMLInputElement | null>;
    emailField: React.RefObject<HTMLInputElement | null>;
    phoneField: React.RefObject<HTMLInputElement | null>;
    countryField: React.RefObject<HTMLInputElement | null>;
    passwordField: React.RefObject<HTMLInputElement | null>;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}