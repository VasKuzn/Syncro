import React from 'react';
import HeaderComponent from './HeaderComponent';
import { LoginComponentProps } from '../../Types/LoginTypes';

const LoginComponent: React.FC<LoginComponentProps> = ({
    emailOrPhone,
    password,
    passwordVisible,
    keepSignedIn,
    isLoading,
    maxLength,
    emailRef,
    passwordRef,
    onEmailOrPhoneChange,
    onPasswordChange,
    onKeepSignedInChange,
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
                        value={emailOrPhone}
                        onChange={onEmailOrPhoneChange}
                        maxLength={maxLength}
                        ref={emailRef}
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

                <div className="checkbox-container">
                    <div className="checkbox-wrapper-10">
                        <input
                            className="tgl tgl-flip checkbox-element"
                            id="keep-signed-in"
                            type="checkbox"
                            checked={keepSignedIn}
                            onChange={onKeepSignedInChange}
                        />
                        <label
                            className="tgl-btn"
                            data-tg-off="No"
                            data-tg-on="Yes"
                            htmlFor="keep-signed-in"
                        ></label>
                    </div>
                    <label htmlFor="keep-signed-in">Keep me signed in</label>
                </div>

                <a href="forgot-password" className="forgot-element">Forgot password?</a>

                <div className="buttons">
                    <button type="submit" className="primary-button">Sign in {isLoading && <div className="spinner" aria-hidden="true"></div>} </button>
                </div>
            </form>
        </div>
    );
};

export default LoginComponent;