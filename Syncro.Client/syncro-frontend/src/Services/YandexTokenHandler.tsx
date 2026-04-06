import { useEffect } from 'react';

const YandexTokenHandler = () => {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-token-latest.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return <div>Обработка авторизации через Яндекс...</div>;
};

export default YandexTokenHandler;