import React, { useEffect } from 'react';
import { SuccessNotificationProps } from '../../Types/LoginTypes'
import "../../Styles/Errors.css"

const SuccessNotification: React.FC<SuccessNotificationProps> = ({ onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div
            className="success-notification"
            role="alert"
            aria-live="assertive"
        >
            Регистрация прошла успешно! Перенаправляем на логин..
        </div>
    );
};

export default SuccessNotification;