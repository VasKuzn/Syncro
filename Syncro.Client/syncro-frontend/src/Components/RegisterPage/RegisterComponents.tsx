import React from 'react';
import HeaderComponent from './HeaderComponent';

interface RegisterComponentProps {
    nickname: string;
    email: string;
    phone: string;
    password: string;
    passwordVisible: boolean;
    isLoading: boolean;
    emailRef: React.RefObject<HTMLInputElement>;
    passwordRef: React.RefObject<HTMLInputElement>;
    phoneRef: React.RefObject<HTMLInputElement>;
    nicknameRef: React.RefObject<HTMLInputElement>;
    onNicknameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTogglePasswordVisibility: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

const RegisterComponent: React.FC<RegisterComponentProps> = ({
    nickname,
    email,
    phone,
    password,
    passwordVisible,
    isLoading,
    emailRef,
    passwordRef,
    phoneRef,
    nicknameRef,
    onNicknameChange,
    onEmailChange,
    onPhoneChange,
    onPasswordChange,
    onTogglePasswordVisibility,
    onSubmit,
}) => {
    return (
        <div className="main-container">
            <HeaderComponent />
            <form id="login-form" onSubmit={onSubmit} noValidate>
                <div className="input-container">

                    <label htmlFor="email">Email</label>
                    <input
                        className="log-element"
                        type="text"
                        id="email"
                        placeholder="Email"
                        required
                        value={email}
                        onChange={onEmailChange}
                        maxLength={100}
                        ref={emailRef}
                    />

                    <label htmlFor="nickname">Nickname</label>
                    <input
                        className="log-element"
                        type="text"
                        id="nickname"
                        placeholder="Nickname"
                        required
                        value={nickname}
                        onChange={onNicknameChange}
                        maxLength={100}
                        ref={nicknameRef}
                    />

                    <label htmlFor="phone">Phone</label>
                    <input
                        className="log-element"
                        type="text"
                        id="phone"
                        placeholder="Phone"
                        required
                        value={phone}
                        onChange={onPhoneChange}
                        maxLength={12}
                        ref={phoneRef}
                    />

                    <label htmlFor="password">Password</label>
                    <div className="password-wrapper">
                        <input
                            className="log-element"
                            type={passwordVisible ? "text" : "password"}
                            id="password"
                            placeholder="Password"
                            required
                            value={password}
                            onChange={onPasswordChange}
                            ref={passwordRef}
                        />
                        <button
                            type="button"
                            className="show-element"
                            aria-label="Show password"
                            aria-controls="password"
                            onClick={onTogglePasswordVisibility}
                        >
                            {passwordVisible ? "Hide" : "Show"}
                        </button>
                    </div>
                    
                </div>

                <div className="buttons">
                    <button type="submit" className="primary-button">Sign up</button>
                </div>
            </form>
        </div>
    );
};

export default RegisterComponent;