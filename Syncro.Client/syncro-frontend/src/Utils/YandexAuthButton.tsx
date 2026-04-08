import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        YaAuthSuggest: any;
    }
}

interface YandexAuthButtonProps {
    baseUrl: string;
    onSuccess: (token: string) => void;
    onError: (error: any) => void;
}

const YandexAuthButton: React.FC<YandexAuthButtonProps> = ({ baseUrl, onSuccess, onError }) => {
    const containerId = 'yandex-auth-button-container';
    const initialized = useRef(false);
    const popupRef = useRef<Window | null>(null);

    // Регистрируем listener для сообщений от popup ОДИН РАЗ на монтирование
    useEffect(() => {
        console.log('Setting up message listener');

        const handleMessage = (event: MessageEvent) => {
            console.log('=== postMessage received in parent ===');
            console.log('Message data:', event.data);
            console.log('Message origin:', event.origin);

            if (event.data.type === 'yandex-auth-complete') {
                if (event.data.status === 'success' && event.data.access_token) {
                    console.log('✅ Got token from popup!');
                    console.log('Token length:', event.data.access_token.length);
                    console.log('Calling onSuccess callback...');
                    onSuccess(event.data.access_token);
                } else if (event.data.status === 'error') {
                    console.error('❌ Auth error from popup:', event.data.error);
                    onError(new Error(event.data.error || 'Authorization failed'));
                }
                popupRef.current = null;
            }
        };

        window.addEventListener('message', handleMessage);
        console.log('Message listener registered');

        // Cleanup
        return () => {
            console.log('Removing message listener');
            window.removeEventListener('message', handleMessage);
        };
    }, [onSuccess, onError]); // Зависит только от callbacks

    // Инициализируем Yandex SDK в отдельном useEffect
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        console.log('YandexAuthButton SDK initialization started');

        const scriptId = 'yandex-auth-script';
        let scriptElement = document.getElementById(scriptId) as HTMLScriptElement | null;

        // Функция инициализации кнопки
        const initButton = () => {
            console.log('initButton called');
            console.log('window.YaAuthSuggest:', window.YaAuthSuggest);

            if (!window.YaAuthSuggest) {
                console.log('YaAuthSuggest not available yet, retrying...');
                setTimeout(initButton, 200);
                return;
            }

            console.log('Initializing YaAuthSuggest');

            // redirect_uri должна быть полный URL фронтенда
            const frontendUrl = window.location.origin;
            const redirectUri = `${frontendUrl}/yandex-token`;

            console.log('Redirect URI:', redirectUri);

            window.YaAuthSuggest.init(
                {
                    client_id: 'd1c31a817b354a18af1857c5326982a8',
                    response_type: 'token',
                    redirect_uri: redirectUri,
                },
                baseUrl,
                {
                    view: 'button',
                    parentId: containerId,
                    buttonSize: 's',
                    buttonView: 'additional',
                    buttonTheme: 'dark',
                    buttonBorderRadius: 20,
                    buttonIcon: 'ya',
                }
            )
                .then((result: any) => {
                    console.log('YaAuthSuggest.init success');
                    console.log('Setting up button handler');
                    return result.handler();
                })
                .then((data: any) => {
                    console.log('Handler called, opening popup window');
                    // Яндекс откривает popup автоматически, сохраняем ссылку
                    if (window.opener) {
                        popupRef.current = window.opener;
                    }
                })
                .catch((error: any) => {
                    // in_progress - игнорируем
                    if (error?.code === 'in_progress') {
                        console.log('Auth in progress, ignoring');
                        return;
                    }
                    console.error('Yandex error:', error, error?.message);
                    onError(error);
                });
        };

        // Если скрипт уже загружен
        if (scriptElement) {
            console.log('Script already loaded, initializing button');
            initButton();
            return;
        }

        // Загружаем скрипт
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-latest.js';
        script.async = true;

        script.onload = () => {
            console.log('Yandex script loaded successfully');
            initButton();
        };

        script.onerror = (error) => {
            console.error('Failed to load Yandex SDK:', error);
            onError(new Error('Failed to load Yandex SDK'));
        };

        document.head.appendChild(script);
        console.log('Script appended to head');

        // Cleanup для этого useEffect
        return () => {
            // Удаляем скрипт если нужно
        };
    }, [baseUrl, onError]);

    return (
        <div
            id={containerId}
            style={{
                minHeight: '48px',
                position: 'relative',
                display: 'inline-block',
                width: '15%',
            }}
        />
    );
};

export default YandexAuthButton;