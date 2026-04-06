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
    const initAttempts = useRef(0);

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

        const cleanContainer = () => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '';
            }
            document.querySelectorAll('.yaPersonalButton').forEach((btn) => {
                if (btn.parentElement?.id !== containerId) {
                    btn.remove();
                }
            });
        };

        const initYandexButton = () => {
            if (isInitialized.current) return;

            const container = document.getElementById(containerId);
            if (!container) {
                initAttempts.current++;
                if (initAttempts.current < 10) {
                    setTimeout(initYandexButton, 200);
                }
                return;
            }

            cleanContainer();
            isInitialized.current = true;

            try {
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
                if (window.YaAuthSuggest && !isInitialized.current) {
                    setTimeout(initYandexButton, 100);
                }
            };
            document.body.appendChild(script);
        } else if (window.YaAuthSuggest && !isInitialized.current) {
            setTimeout(initYandexButton, 100);
        }

        return () => {
            isInitialized.current = false;
            cleanContainer();
        };
    }, [baseUrl, onSuccess, onError]);

    return <div id={containerId} className="yandex-button" />;
};

export default YandexAuthButton;