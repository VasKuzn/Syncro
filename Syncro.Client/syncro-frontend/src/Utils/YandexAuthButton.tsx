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
                #${containerId} {
                    display: flex;
                    justify-content: center;
                    min-height: 40px;
                }
            `;
            document.head.appendChild(style);
        }

        const initYandexButton = () => {
            if (isInitialized.current) return;
            const container = document.getElementById(containerId);
            if (!container) {
                setTimeout(initYandexButton, 50);
                return;
            }
            if (!window.YaAuthSuggest) {
                setTimeout(initYandexButton, 50);
                return;
            }

            isInitialized.current = true;

            document.querySelectorAll('.yaPersonalButton').forEach((btn) => {
                if (btn.parentElement?.id !== containerId) {
                    btn.remove();
                }
            });

            try {
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
                        if (result && typeof result.handler === 'function') {
                            return result.handler();
                        }
                        throw new Error('Invalid result from YaAuthSuggest.init');
                    })
                    .then((data: any) => {
                        if (data && data.access_token) {
                            onSuccess(data.access_token);
                        } else {
                            throw new Error('No access token received');
                        }
                    })
                    .catch((err: any) => {
                        if (err?.code !== 'in_progress' && err?.message !== 'Already initialized') {
                            console.error('Yandex button error:', err);
                            onError(err);
                        }
                        if (err?.code === 'in_progress') {
                            isInitialized.current = false;
                        }
                    });
            } catch (err) {
                console.error('Yandex button initialization error:', err);
                onError(err);
            }
        };

        // Загрузка SDK
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

    return <div id={containerId} className="yandex-button" />;
};

export default YandexAuthButton;