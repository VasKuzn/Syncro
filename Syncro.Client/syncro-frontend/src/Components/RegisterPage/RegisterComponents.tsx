import React from 'react';
import HeaderComponent from './HeaderComponent';
import { RegisterComponentProps } from '../../Types/LoginTypes';


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
                    <button
                        type="submit"
                        className="primary-button"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="spinner-container">
                                <div className="spinner-login" aria-hidden="true"></div>
                            </div>
                        ) : (
                            "Sign up"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RegisterComponent;