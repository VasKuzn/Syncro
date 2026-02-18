import React, { useEffect } from 'react';
import { ErrorNotificationProps } from '../../Types/LoginTypes';
import '../../Styles/Errors.css'

const ErrorNotification: React.FC<ErrorNotificationProps> = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div
            className="error-alert-message"
            role="alert"
            aria-live="assertive"
        >
            <span>{message}</span>
            <button
                onClick={onClose}
                className="error-button"
                aria-label="Закрыть уведомление"
            >
                ×
            </button>
        </div>
    );
};

export default ErrorNotification;