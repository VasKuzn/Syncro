import { useEffect } from 'react';

declare global {
    interface Window {
        YaSendSuggestToken?: (origin: string, options?: { flag: boolean }) => void;
    }
}

const YandexTokenHandler = () => {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-token-latest.js';
        script.async = true;
        script.onload = () => {
            if (window.YaSendSuggestToken) {
                window.YaSendSuggestToken(window.location.origin, { flag: true });
            }
        };
        document.head.appendChild(script);
    }, []);

    return null;
};

export default YandexTokenHandler;