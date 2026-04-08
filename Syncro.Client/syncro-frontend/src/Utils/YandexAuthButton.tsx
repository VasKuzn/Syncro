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
            if (isInitialized.current) return;

            const container = document.getElementById(containerId);
            if (!container) {
                setTimeout(initYandexButton, 100);
                return;
            }
            if (!window.YaAuthSuggest) {
                setTimeout(initYandexButton, 100);
                return;
            }

            isInitialized.current = true;

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
                    if (!document.getElementById(containerId)) {
                        throw new Error('Container disappeared');
                    }
                    return result.handler();
                })
                .then((data: any) => {
                    if (data?.access_token) {
                        onSuccess(data.access_token);
                    }
                })
                .catch((err: any) => {
                    if (err?.code !== 'in_progress') {
                        console.error('Yandex error:', err);
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
            script.onload = () => initYandexButton();
            script.onerror = () => onError(new Error('Failed to load Yandex SDK'));
            document.body.appendChild(script);
        } else if (window.YaAuthSuggest && !isInitialized.current) {
            initYandexButton();
        }

        return () => {
            isInitialized.current = false;
        };
    }, [baseUrl, onSuccess, onError]);

    return <div id={containerId} />;
};

export default YandexAuthButton;