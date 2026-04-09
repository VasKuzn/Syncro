// YandexTokenHandler.tsx
import { useEffect } from 'react';

declare global {
    interface Window {
        YaSendSuggestToken?: (origin: string, options?: { flag: boolean }) => void;
    }
}

const YandexTokenHandler = () => {
    useEffect(() => {
        console.log('=== YandexTokenHandler mounted ===');
        console.log('Current location:', window.location.href);

        const scriptId = 'yandex-suggest-token-script';
        let scriptElement = document.getElementById(scriptId) as HTMLScriptElement | null;

        // Функция для ручного извлечения токена и отправки родителю
        const sendTokenManually = () => {
            console.log('Attempting manual token extraction...');
            const hash = window.location.hash.substring(1);
            const search = window.location.search.substring(1);
            console.log('Hash:', hash);
            console.log('Search:', search);

            const params = new URLSearchParams(hash || search);
            const accessToken = params.get('access_token');
            const error = params.get('error');
            const errorDescription = params.get('error_description');

            console.log('Extracted token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'none');
            console.log('Extracted error:', error);

            if (error) {
                console.error('OAuth error:', error, errorDescription);
                if (window.opener) {
                    window.opener.postMessage({
                        type: 'yandex-auth-complete',
                        status: 'error',
                        error,
                        errorDescription
                    }, '*');
                }
                return;
            }

            if (accessToken) {
                console.log('Token found, sending to parent');
                if (window.opener) {
                    window.opener.postMessage({
                        type: 'yandex-auth-complete',
                        status: 'success',
                        access_token: accessToken
                    }, '*');
                } else {
                    console.error('No opener window!');
                }
            } else {
                console.warn('No token found in URL');
            }
        };

        const initTokenHandler = () => {
            console.log('initTokenHandler called, YaSendSuggestToken exists:', !!window.YaSendSuggestToken);
            if (window.YaSendSuggestToken) {
                console.log('Calling YaSendSuggestToken with origin:', window.location.origin);
                window.YaSendSuggestToken(window.location.origin, { flag: true });
                console.log('YaSendSuggestToken called');
            } else {
                console.warn('YaSendSuggestToken not available, will retry or fallback');
                // Пробуем отправить вручную, если скрипт не загрузился через 2 секунды
                setTimeout(() => {
                    if (!window.YaSendSuggestToken) {
                        console.log('Falling back to manual token extraction');
                        sendTokenManually();
                    }
                }, 2000);
                setTimeout(initTokenHandler, 200);
            }
        };

        if (scriptElement) {
            console.log('Script already loaded');
            initTokenHandler();
            return;
        }

        console.log('Loading Yandex suggest-token script');
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-token-latest.js';
        script.async = true;

        script.onload = () => {
            console.log('Yandex suggest-token script loaded successfully');
            initTokenHandler();
        };

        script.onerror = (error) => {
            console.error('Failed to load Yandex suggest-token script:', error);
            // Fallback to manual extraction if script fails
            sendTokenManually();
        };

        document.head.appendChild(script);

        // Дополнительно пробуем извлечь токен вручную через небольшую задержку на случай, если скрипт не сработает
        const manualTimeout = setTimeout(() => {
            console.log('Manual extraction timeout triggered');
            sendTokenManually();
        }, 3000);

        return () => {
            clearTimeout(manualTimeout);
            // Не удаляем скрипт, чтобы не мешать
        };
    }, []);

    return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
            <h2>Обработка авторизации через Яндекс...</h2>
            <p>Это окно останется открытым для отладки.</p>
            <p style={{ fontSize: '12px', color: '#666' }}>Проверьте консоль (F12) для логов.</p>
            <button onClick={() => window.close()}>Закрыть вручную</button>
        </div>
    );
};

export default YandexTokenHandler;