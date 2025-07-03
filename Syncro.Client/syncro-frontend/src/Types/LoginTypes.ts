export interface NetworkError {
    message?: string;
}
export interface RegisterComponentProps {
    nickname: string;
    email: string;
    phone: string;
    password: string;
    passwordVisible: boolean;
    isLoading: boolean;
    emailRef: React.RefObject<HTMLInputElement | null>;
    passwordRef: React.RefObject<HTMLInputElement | null>;
    phoneRef: React.RefObject<HTMLInputElement | null>;
    nicknameRef: React.RefObject<HTMLInputElement | null>;
    onNicknameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTogglePasswordVisibility: () => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
}
export interface LoginComponentProps {
    emailOrPhone: string;
    password: string;
    passwordVisible: boolean;
    keepSignedIn: boolean;
    isLoading: boolean;
    maxLength: number;
    emailRef: React.RefObject<HTMLInputElement | null>;
    passwordRef: React.RefObject<HTMLInputElement | null>;
    onEmailOrPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeepSignedInChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTogglePasswordVisibility: () => void;
    onSubmit: (e: React.FormEvent) => void;
}
export type FormState = {
    emailOrPhone: string;
    password: string;
    passwordVisible: boolean;
    keepSignedIn: boolean;
    isLoading: boolean;
    maxLength: number;
    isEmail: boolean;
};
export interface SuccessNotificationProps {
    onClose: () => void;
}