import React, { useEffect } from 'react';
import { ErrorNotificationProps } from '../../Types/LoginTypes';

const ErrorNotification: React.FC<ErrorNotificationProps> = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div
            role="alert"
            aria-live="assertive"
            style={{
                position: 'fixed',
                top: 20,
                right: 20,
                backgroundColor: '#f44336',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '5px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minWidth: '300px',
                maxWidth: '400px',
            }}
        >
            <span>{message}</span>
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    marginLeft: '10px',
                    padding: '0 5px',
                }}
                aria-label="Закрыть уведомление"
            >
                ×
            </button>
        </div>
    );
};

export default ErrorNotification;