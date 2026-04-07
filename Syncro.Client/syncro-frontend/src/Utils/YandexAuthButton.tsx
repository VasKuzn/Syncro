import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        YaAuthSuggest: any;
        __yaAuthSuggestLoaded?: boolean;
    }
}

interface YandexAuthButtonProps {
    baseUrl: string;
    onSuccess: (token: string) => void;
    onError: (error: any) => void;
}

const YandexAuthButton: React.FC<YandexAuthButtonProps> = ({ baseUrl, onSuccess, onError }) => {
    const containerId = 'yandex-auth-button-container';
    const isInitialized = useRef(false);
    const scriptLoaded = useRef(false);

    useEffect(() => {
        const initYandexButton = () => {
            if (isInitialized.current) {
                console.log('Yandex: already initialized');
                return;
            }
            const container = document.getElementById(containerId);
            if (!container) {
                console.log('Yandex: container not found, retrying');
                setTimeout(initYandexButton, 100);
                return;
            }
            if (!window.YaAuthSuggest) {
                console.log('Yandex: SDK not ready, retrying');
                setTimeout(initYandexButton, 100);
                return;
            }

            console.log('Yandex: initializing button');
            isInitialized.current = true;

            container.innerHTML = '';

            window.YaAuthSuggest.init(
                {
                    client_id: 'd1c31a817b354a18af1857c5326982a8',
                    response_type: 'token',
                    redirect_uri: `${baseUrl}/main`,
                },
                baseUrl,
                {
                    view: 'button',
                    parentId: containerId,
                    buttonSize: 's',
                    buttonView: 'additional',
                    buttonTheme: 'dark',
                    buttonBorderRadius: '20',
                    buttonIcon: 'ya',
                }
            )
                .then((result: any) => {
                    console.log('Yandex: init result', result);
                    if (result && typeof result.handler === 'function') {
                        return result.handler();
                    }
                    throw new Error('Invalid result from YaAuthSuggest.init');
                })
                .then((data: any) => {
                    console.log('Yandex: handler result', data);
                    if (data && data.access_token) {
                        onSuccess(data.access_token);
                    } else {
                        console.log('Yandex: no token yet, button should be visible');
                    }
                })
                .catch((err: any) => {
                    console.error('Yandex: error', err);
                    if (err?.code !== 'in_progress' && err?.message !== 'Already initialized') {
                        onError(err);
                    }
                    if (err?.code === 'in_progress') {
                        isInitialized.current = false;
                    }
                });
        };

        if (!window.__yaAuthSuggestLoaded && !scriptLoaded.current) {
            scriptLoaded.current = true;
            window.__yaAuthSuggestLoaded = true;

            const script = document.createElement('script');
            script.src = 'https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-with-polyfills-latest.js';
            script.async = true;
            script.onerror = () => {
                console.error('Failed to load Yandex SDK script');
                onError(new Error('Failed to load Yandex SDK'));
            };
            script.onload = () => {
                console.log('Yandex SDK loaded');
                initYandexButton();
            };
            document.body.appendChild(script);
        } else if (window.YaAuthSuggest && !isInitialized.current) {
            initYandexButton();
        }

        return () => {
            isInitialized.current = false;
        };
    }, [baseUrl, onSuccess, onError]);

    return <div id={containerId} style={{ display: 'flex', justifyContent: 'center', minHeight: '40px' }} />;
};

export default YandexAuthButton;