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
        if (!document.getElementById('yandex-sdk-styles')) {
            const style = document.createElement('style');
            style.id = 'yandex-sdk-styles';
            style.textContent = `
                .yaPersonalSuggestion, .yaPersonalSuggestions, .yaSuggestions,
                .ya-suggestions, [class*="yaPersonalSuggestion"], [class*="yaSuggestions"] {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
        }

        const cleanContainer = () => {
            const container = document.getElementById(containerId);
            if (container) {
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
            }
            document.querySelectorAll('.yaPersonalButton').forEach((btn) => {
                if (btn.parentElement?.id !== containerId) {
                    btn.remove();
                }
            });
        };

        const initYandexButton = () => {
            if (isInitialized.current) return;

            cleanContainer();

            const container = document.getElementById(containerId);
            if (!container) return;

            isInitialized.current = true;

            window.YaAuthSuggest.init(
                {
                    client_id: 'd1c31a817b354a18af1857c5326982a8',
                    response_type: 'token',
                    redirect_uri: `${baseUrl}/main`,
                },
                `${baseUrl}/login`,
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
                .then((result: any) => result.handler())
                .then((data: any) => {
                    onSuccess(data.access_token);
                })
                .catch((err: any) => {
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
            script.onload = () => {
                if (window.YaAuthSuggest && !isInitialized.current) {
                    initYandexButton();
                }
            };
            document.body.appendChild(script);
        } else if (window.YaAuthSuggest && !isInitialized.current) {
            initYandexButton();
        }

        return () => {
            isInitialized.current = false;
            cleanContainer();
        };
    }, [baseUrl, onSuccess, onError]);

    return <div id={containerId} className="yandex-button" />;
};

export default YandexAuthButton;