import React, { useEffect } from 'react';

interface SuccessNotificationProps {
    onClose: () => void;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({ onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

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
                backgroundColor: '#4caf50',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '5px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                zIndex: 1000,
            }}
        >
            Регистрация прошла успешно!
        </div>
    );
};

export default SuccessNotification;