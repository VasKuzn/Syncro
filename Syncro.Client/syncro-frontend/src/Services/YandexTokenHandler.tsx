// YandexTokenHandler.tsx
import { useEffect } from 'react';

declare global {
    interface Window {
        YaSendSuggestToken?: (origin: string, options?: { flag: boolean }) => void;
    }
}

const YandexTokenHandler = () => {
    useEffect(() => {
        const scriptId = 'yandex-suggest-token-script';
        let scriptElement = document.getElementById(scriptId) as HTMLScriptElement | null;

        const initTokenHandler = () => {
            if (window.YaSendSuggestToken) {
                console.log('Calling YaSendSuggestToken with origin:', window.location.origin);
                window.YaSendSuggestToken(window.location.origin, { flag: true });
            } else {
                console.warn('YaSendSuggestToken not available yet, retrying...');
                setTimeout(initTokenHandler, 100);
            }
        };

        if (scriptElement) {
            initTokenHandler();
            return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-token-latest.js';
        script.async = true;

        script.onload = () => {
            console.log('Yandex suggest-token script loaded');
            initTokenHandler();
        };

        script.onerror = (error) => {
            console.error('Failed to load Yandex suggest-token script:', error);
        };

        document.head.appendChild(script);

        return () => {
            // Не удаляем скрипт при размонтировании, чтобы избежать повторной загрузки при навигации
            // (обычно этот компонент рендерится только один раз в popup окне)
        };
    }, []);

    return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
            <h2>Обработка авторизации через Яндекс...</h2>
            <p>Это окно автоматически закроется после успешной авторизации.</p>
            <p style={{ fontSize: '12px', color: '#666' }}>Если окно не закрывается, проверьте консоль браузера.</p>
        </div>
    );
};

export default YandexTokenHandler;